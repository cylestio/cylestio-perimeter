"""Anthropic provider for session detection."""
import hashlib
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Request

from .base import BaseProvider, SessionInfo
from .session_utils import create_session_utility
from ..proxy.tools.parser import ToolParser
from src.events.types import (
    SessionStartEvent, LLMCallStartEvent, ToolResultEvent, 
    LLMCallFinishEvent, ToolExecutionEvent, LLMCallErrorEvent
)
from src.events.base import generate_span_id
from src.utils.logger import get_logger

logger = get_logger(__name__)


class AnthropicProvider(BaseProvider):
    """Anthropic API provider implementation."""
    
    def __init__(self, settings=None):
        """Initialize Anthropic provider."""
        super().__init__(settings)
        
        # Initialize session utility for message-based detection
        self._session_utility = create_session_utility()
        
        # Initialize tool parser for processing tool results
        self.tool_parser = ToolParser()
    
    @property
    def name(self) -> str:
        return "anthropic"
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from Anthropic request."""
        messages = body.get("messages", [])
        message_count = len(messages)
        
        # Extract system prompt for session detection
        system_prompt = self._extract_system_prompt(body)
        
        # Use shared session utility to detect/continue session
        conversation_id, is_session_start, is_fragmented, last_processed_index = self._session_utility.detect_session(
            messages=messages,
            system_prompt=system_prompt,
            metadata={
                "provider": self.name,
                "model": body.get("model"),
                "endpoint": "messages"
            }
        )
        
        # Session end: determined by response success/failure, not request
        is_session_end = False
        
        return SessionInfo(
            is_session_start=is_session_start,
            is_session_end=is_session_end,
            conversation_id=conversation_id,
            message_count=message_count,
            model=self.extract_model_from_body(body),
            is_streaming=self.extract_streaming_from_body(body),
            metadata=self.extract_conversation_metadata(body),
            last_processed_index=last_processed_index
        )
    
    def extract_model_from_body(self, body: Dict[str, Any]) -> Optional[str]:
        """Extract model from Anthropic request."""
        return body.get("model")
    
    def extract_streaming_from_body(self, body: Dict[str, Any]) -> bool:
        """Check if Anthropic request is for streaming."""
        return body.get("stream", False) is True
    
    def parse_streaming_response(self, body_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Parse Anthropic SSE streaming response into structured data.

        Extracts the message from message_start event, aggregates text from content_block_delta,
        tool_use blocks from content_block_start, and merges usage from message_delta event.

        Also detects error responses in streaming (can be 200 OK with error body).

        Args:
            body_bytes: Raw SSE response bytes

        Returns:
            Parsed response dict matching Anthropic's non-streaming format, or None if parsing fails
        """
        try:
            import json
            text = body_bytes.decode('utf-8')
            lines = text.split('\n')

            # Check for error in early data events (streaming can return 200 with error)
            for line in lines:
                line = line.strip()
                if line.startswith('data:'):
                    data_str = line[5:].strip()
                    try:
                        parsed = json.loads(data_str)
                        # Return error structure immediately if found
                        if parsed.get("type") == "error":
                            return parsed
                    except json.JSONDecodeError:
                        pass
                    # Only check first few data lines for early error
                    break

            # Parse all SSE events
            message_data = None
            usage_data = None
            content_blocks = {}  # Track content blocks by index

            current_event = None
            current_data = []

            def process_event(event_type: str, event_data: str):
                """Process a single SSE event."""
                nonlocal message_data, usage_data
                
                try:
                    parsed = json.loads(event_data)
                    
                    # Extract message from message_start
                    if event_type == 'message_start' and 'message' in parsed:
                        message_data = parsed['message']
                    
                    # Track content blocks as they start
                    elif event_type == 'content_block_start':
                        index = parsed.get('index')
                        content_block = parsed.get('content_block', {})
                        block_type = content_block.get('type')
                        
                        if block_type == 'text':
                            content_blocks[index] = {'type': 'text', 'text': ''}
                        elif block_type == 'tool_use':
                            content_blocks[index] = {
                                'type': 'tool_use',
                                'id': content_block.get('id'),
                                'name': content_block.get('name'),
                                'input': ''
                            }
                    
                    # Accumulate deltas for each content block
                    elif event_type == 'content_block_delta':
                        index = parsed.get('index')
                        delta = parsed.get('delta', {})
                        
                        if index in content_blocks:
                            if delta.get('type') == 'text_delta':
                                content_blocks[index]['text'] += delta.get('text', '')
                            elif delta.get('type') == 'input_json_delta':
                                content_blocks[index]['input'] += delta.get('partial_json', '')
                    
                    # Extract usage from message_delta
                    elif event_type == 'message_delta' and 'usage' in parsed:
                        usage_data = parsed['usage']
                        
                except json.JSONDecodeError:
                    pass
            
            # Parse SSE format
            for line in lines:
                line = line.strip()
                
                if line.startswith('event:'):
                    # Process previous event if complete
                    if current_event and current_data:
                        process_event(current_event, ''.join(current_data))
                    
                    current_event = line[6:].strip()
                    current_data = []
                
                elif line.startswith('data:'):
                    current_data.append(line[5:].strip())
                
                elif line == '' and current_event and current_data:
                    # End of event - process it
                    process_event(current_event, ''.join(current_data))
                    current_event = None
                    current_data = []
            
            # Build final content array from all blocks
            if message_data and content_blocks:
                content_array = []
                for index in sorted(content_blocks.keys()):
                    block = content_blocks[index]
                    if block['type'] == 'text':
                        content_array.append({'type': 'text', 'text': block['text']})
                    elif block['type'] == 'tool_use':
                        # Parse the accumulated JSON input
                        try:
                            input_data = json.loads(block['input']) if block['input'] else {}
                        except json.JSONDecodeError:
                            input_data = {}
                        
                        content_array.append({
                            'type': 'tool_use',
                            'id': block['id'],
                            'name': block['name'],
                            'input': input_data
                        })
                
                message_data['content'] = content_array
                
                if usage_data:
                    message_data['usage'] = usage_data
                    
                return message_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing Anthropic SSE response: {e}", exc_info=True)
            return None
    
    def extract_conversation_metadata(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract Anthropic-specific metadata."""
        metadata = {}
        
        # Token limits
        if "max_tokens" in body:
            metadata["max_tokens"] = body["max_tokens"]
        
        # Temperature and other params
        for param in ["temperature", "top_p", "top_k"]:
            if param in body:
                metadata[param] = body[param]
        
        # System message
        if "system" in body:
            metadata["has_system_message"] = True
            metadata["system_length"] = len(str(body["system"]))
        
        # Tools information
        if "tools" in body:
            metadata["tools_count"] = len(body["tools"])
            metadata["tool_names"] = [tool.get("name") for tool in body["tools"]]
        
        # NEW: High-priority required fields
        # User-provided metadata
        if "metadata" in body and isinstance(body["metadata"], dict):
            metadata["user_metadata"] = body["metadata"]
        
        # Tool governance
        if "tool_choice" in body and body["tool_choice"] is not None:
            metadata["tool_choice"] = body["tool_choice"]
        
        # Completion control
        if "stop_sequences" in body and isinstance(body["stop_sequences"], list):
            metadata["stop_sequences"] = body["stop_sequences"]
        
        return metadata
    

    
    def _extract_system_prompt(self, body: Dict[str, Any]) -> str:
        """Extract system prompt from Anthropic request body."""
        # Look for system message in body
        system = body.get("system")
        if system:
            return system if isinstance(system, str) else str(system)
        
        # Default if no system message found
        return "default-system"
    
    def _extract_tools_for_session(self, body: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Extract tools from request body for session event."""
        tools = body.get("tools", [])
        if tools and isinstance(tools, list):
            return tools
        return None
    
    
    def _extract_usage_tokens(self, response_body: Optional[Dict[str, Any]]) -> tuple[Optional[int], Optional[int], Optional[int]]:
        """Extract token usage from response body.
        
        Returns:
            Tuple of (input_tokens, output_tokens, total_tokens)
        """
        if not response_body:
            return None, None, None
        
        usage = response_body.get("usage", {})
        if not usage:
            return None, None, None
        
        return (
            usage.get("input_tokens"),
            usage.get("output_tokens"),
            usage.get("input_tokens", 0) + usage.get("output_tokens", 0) if usage.get("input_tokens") and usage.get("output_tokens") else None
        )
    
    def _extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Extract response content from response body."""
        if not response_body:
            return None
        
        content = response_body.get("content", [])
        if not content:
            return None
        
        return content if isinstance(content, list) else [content]
    
    def extract_request_events(self, body: Dict[str, Any], session_info: SessionInfo, 
                             session_id: str, is_new_session: bool, 
                             last_processed_index: int = 0,
                             computed_agent_id: Optional[str] = None) -> Tuple[List[Any], int]:
        """Extract and create events from request data, processing only new messages.
        
        Args:
            body: Request body
            session_info: Session information
            session_id: Session identifier
            is_new_session: bool
            last_processed_index: Index of last processed message
            
        Returns:
            Tuple of (events, new_last_processed_index)
        """
        events = []
        
        if not session_id:
            return events, last_processed_index
        
        # Get all messages from request
        messages = body.get("messages", [])
        
        # Only process new messages since last processed index
        new_messages = messages[last_processed_index:]
        new_last_processed_index = len(messages)
        
        # If no new messages, no events to create
        if not new_messages:
            return events, last_processed_index
        
        # Get trace_id (consistent per session)
        trace_id = self.get_trace_id(session_id)
        
        agent_id = computed_agent_id or self._get_agent_id(body)
        
        # Handle session start event (only for new sessions)
        if is_new_session or session_info.is_session_start:
            # Generate NEW span_id for session start and store it
            span_id = self.generate_new_span_id()
            self.update_session_span_id(session_id, span_id)
            
            # Extract tools and prompt for session event
            tools = self._extract_tools_for_session(body)
            prompt = self._extract_system_prompt(body)
            
            session_start_event = SessionStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                session_id=session_id,
                client_type="gateway",
                vendor=self.name,
                model=session_info.model,
                tools=tools,
                prompt=prompt
            )
            events.append(session_start_event)
        
        # Parse tool results only from NEW messages
        new_body_for_tools = {"messages": new_messages}
        tool_results = self.tool_parser.parse_tool_results(new_body_for_tools, self.name)
        
        # Handle tool result events (all are new since we're only processing new messages)
        for tool_result in tool_results:
            # Use EXISTING span_id from last tool execution (if available)
            span_id = self.get_session_span_id(session_id)
            if not span_id:
                # Fallback: generate new span_id if none exists
                span_id = self.generate_new_span_id()
                self.update_session_span_id(session_id, span_id)
                
            tool_result_event = ToolResultEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                tool_name=tool_result.get("name", "unknown"),
                status="success",  # Assume success since result is present
                execution_time_ms=0.0,  # Not available in request
                result=tool_result.get("result"),
                session_id=session_id
            )
            events.append(tool_result_event)
        
        # Send LLM call start event for every LLM API call
        # For explicit external sessions, always generate events regardless of message novelty
        should_generate_llm_events = session_info.model and (
            new_messages or  # Standard case: there are new messages
            (session_info.metadata and session_info.metadata.get("external"))  # External session: always track
        )
        
        if should_generate_llm_events:
            # For external sessions with no new messages, use the full conversation
            # to represent this as a complete LLM API call
            messages_to_include = new_messages if new_messages else messages
            
            # Create a modified body with appropriate messages
            new_request_data = {
                **body,
                "messages": messages_to_include,
                "_cylestio_metadata": {
                    "total_messages": len(messages),
                    "new_messages": len(new_messages),
                    "from_index": last_processed_index,
                    "external_session": session_info.metadata and session_info.metadata.get("external", False)
                }
            }
            
            # Generate NEW span_id for LLM call start and store it
            span_id = self.generate_new_span_id()
            self.update_session_span_id(session_id, span_id)
            
            llm_start_event = LLMCallStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                vendor=self.name,
                model=session_info.model,
                request_data=new_request_data,
                session_id=session_id
            )
            events.append(llm_start_event)
        
        return events, new_last_processed_index
    
    def is_error_response(self, status_code: int, response_body: Optional[Dict[str, Any]]) -> bool:
        """Check if response indicates an error.

        Anthropic errors are indicated by:
        - HTTP 4xx/5xx status codes (including 529 for overloaded)
        - Response body with type="error" (can occur with 200 OK in streaming)

        Args:
            status_code: HTTP status code
            response_body: Parsed response body (may be None)

        Returns:
            True if response is an error
        """
        if status_code >= 400:
            return True
        # Special case: streaming 200 OK with error in body
        if response_body and response_body.get("type") == "error":
            return True
        return False

    def extract_error_info(self, status_code: int, response_body: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract error details from Anthropic error response.

        Anthropic error format:
        {
            "type": "error",
            "error": {
                "type": "overloaded_error",
                "message": "Overloaded"
            }
        }

        Handles unexpected formats gracefully with fallback.

        Args:
            status_code: HTTP status code
            response_body: Parsed response body (may be None)

        Returns:
            Dict with error_type, error_message, status_code
        """
        error_type = None
        error_message = f"HTTP {status_code} error"

        if response_body:
            # Check for standard Anthropic error format
            if response_body.get("type") == "error":
                error_obj = response_body.get("error", {})
                if isinstance(error_obj, dict):
                    error_type = error_obj.get("type")
                    error_message = error_obj.get("message", error_message)
                elif isinstance(error_obj, str):
                    # Handle unexpected string error format
                    error_message = error_obj
            # Check for alternative error formats
            elif "error" in response_body:
                error_obj = response_body.get("error", {})
                if isinstance(error_obj, dict):
                    error_type = error_obj.get("type")
                    error_message = error_obj.get("message", error_message)
                elif isinstance(error_obj, str):
                    error_message = error_obj

        # Fallback for completely unexpected formats
        if not error_type:
            error_type = self._infer_error_type_from_status(status_code)

        return {
            "status_code": status_code,
            "error_type": error_type,
            "error_message": error_message,
        }

    def _infer_error_type_from_status(self, status_code: int) -> str:
        """Infer error type from HTTP status code when not provided in body.

        Args:
            status_code: HTTP status code

        Returns:
            Error type string
        """
        status_map = {
            400: "invalid_request_error",
            401: "authentication_error",
            403: "permission_denied",
            404: "not_found",
            429: "rate_limit_error",
            500: "api_error",
            529: "overloaded_error",
        }
        return status_map.get(status_code, f"http_{status_code}")

    def extract_response_events(self, response_body: Optional[Dict[str, Any]],
                              session_id: str, duration_ms: float,
                              tool_uses: List[Dict[str, Any]],
                              request_metadata: Dict[str, Any],
                              status_code: int = 200) -> List[Any]:
        """Extract and create events from response data.

        Creates LLMCallErrorEvent for error responses, LLMCallFinishEvent for success.

        Args:
            response_body: Response body
            session_id: Session identifier
            duration_ms: Response duration
            tool_uses: Any tool uses from response
            request_metadata: Metadata from request processing
            status_code: HTTP status code (for error detection)

        Returns:
            List of event objects to be sent
        """
        events = []

        if not session_id:
            return events

        # Get trace ID from request metadata
        trace_id = request_metadata.get("cylestio_trace_id")

        if not trace_id:
            return events

        # Get agent_id, model, and agent_workflow_id from metadata
        agent_id = request_metadata.get("agent_id", "unknown")
        model = request_metadata.get("model", "unknown")
        agent_workflow_id = request_metadata.get("agent_workflow_id")

        # Check for error response first
        if self.is_error_response(status_code, response_body):
            error_info = self.extract_error_info(status_code, response_body)

            span_id = self.get_session_span_id(session_id)
            if not span_id:
                span_id = self.generate_new_span_id()

            error_event = LLMCallErrorEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                vendor=self.name,
                model=model,
                error_message=error_info["error_message"],
                error_type=error_info["error_type"],
                session_id=session_id
            )

            # Add additional context
            error_event.attributes["http.status_code"] = status_code
            error_event.attributes["llm.response.duration_ms"] = duration_ms
            if agent_workflow_id:
                error_event.attributes["agent_workflow.id"] = agent_workflow_id

            events.append(error_event)
            return events  # Don't create finish event for errors

        # Extract token usage and response content for successful responses
        input_tokens, output_tokens, total_tokens = self._extract_usage_tokens(response_body)
        response_content = self._extract_response_content(response_body)
        
        # NEW: Extract additional response fields for risk assessment
        additional_response_data = {}
        
        if response_body:
            try:
                # Stop reason - why generation stopped
                if "stop_reason" in response_body:
                    additional_response_data["stop_reason"] = response_body["stop_reason"]
                
                # Stop sequence - which sequence triggered the stop
                if "stop_sequence" in response_body and response_body["stop_sequence"]:
                    additional_response_data["stop_sequence"] = response_body["stop_sequence"]
                    
            except Exception as e:
                # Log but never fail the request
                # Using debug level as this is enhanced telemetry, not critical
                pass
        
        # Send LLM call finish event
        if model:
            # Use EXISTING span_id from LLM call start (if available)
            span_id = self.get_session_span_id(session_id)
            if not span_id:
                # Fallback: generate new span_id if none exists
                span_id = self.generate_new_span_id()
                
            llm_finish_event = LLMCallFinishEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                vendor=self.name,
                model=model,
                duration_ms=duration_ms,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                response_content=response_content,
                session_id=session_id
            )
            
            # Add new fields to event attributes
            if additional_response_data:
                llm_finish_event.attributes.update(additional_response_data)

            # Add agent_workflow_id if present
            if agent_workflow_id:
                llm_finish_event.attributes["agent_workflow.id"] = agent_workflow_id

            events.append(llm_finish_event)
        
        # Handle tool execution events if present (when LLM response contains tool use requests)
        if tool_uses:
            for tool_request in tool_uses:
                # Generate NEW span_id for each tool execution and store it
                span_id = self.generate_new_span_id()
                self.update_session_span_id(session_id, span_id)
                
                tool_execution_event = ToolExecutionEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=agent_id,
                    tool_name=tool_request.get("name", "unknown"),
                    tool_params=tool_request.get("input", {}),
                    session_id=session_id
                )
                # Add agent_workflow_id if present
                if agent_workflow_id:
                    tool_execution_event.attributes["agent_workflow.id"] = agent_workflow_id
                events.append(tool_execution_event)

        return events





    def get_auth_headers(self) -> Dict[str, str]:
        """Return Anthropic-specific auth headers.
        
        Uses x-api-key: <api_key> when an API key is configured.
        """
        api_key = self.get_api_key()
        if not api_key:
            return {}
        return {"x-api-key": api_key}