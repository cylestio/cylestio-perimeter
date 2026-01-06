"""OpenAI provider for session detection."""
import hashlib
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Request
from src.utils.logger import get_logger

from .base import BaseProvider, SessionInfo
from .session_utils import create_session_utility
from ..proxy.tools.parser import ToolParser
from src.events.types import (
    SessionStartEvent, LLMCallStartEvent, ToolResultEvent, 
    LLMCallFinishEvent, ToolExecutionEvent, LLMCallErrorEvent
)
from src.events.base import generate_span_id


class OpenAIProvider(BaseProvider):
    """OpenAI API provider implementation."""
    
    def __init__(self, settings=None):
        """Initialize OpenAI provider."""
        super().__init__(settings)
        self.response_sessions: Dict[str, str] = {}  # response_id → session_id

        # Initialize session utility for message-based detection
        self._session_utility = create_session_utility()
        
        # Initialize tool parser for processing tool results
        self.tool_parser = ToolParser()
        
        # Initialize module logger
        global logger
        logger = get_logger(__name__)
    
    @property
    def name(self) -> str:
        return "openai"
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from OpenAI request."""
        path = request.url.path
        logger.info(f"OpenAI detect_session_info called for path: {path}")

        # Handle the new /v1/responses endpoint differently
        if "/responses" in path:
            # Check for previous_response_id to maintain session continuity
            previous_response_id = body.get("previous_response_id")
            logger.info(f"Responses API - previous_response_id: {previous_response_id}, response_sessions keys: {list(self.response_sessions.keys())[-5:] if self.response_sessions else 'empty'}")
            if previous_response_id and previous_response_id in self.response_sessions:
                # Continue existing session based on response ID chain
                conversation_id = self.response_sessions[previous_response_id]
                is_session_start = False
                logger.info(f"Continuing existing session: {conversation_id}")
                # Get last processed index from existing session record if available
                session_record = self._session_utility.get_session_info(conversation_id)
                last_processed_index = session_record.last_processed_index if session_record else 0
            else:
                # New session - extract conversation history from input field
                input_data = body.get("input", [])
                
                if isinstance(input_data, list) and input_data:
                    # The input field contains the conversation history
                    messages = input_data
                else:
                    # Fallback: use existing system prompt extraction logic
                    system_prompt = self._extract_system_prompt(body)
                    messages = [{"role": "system", "content": system_prompt}] if system_prompt else []
                
                # Extract system prompt for session detection using existing method
                system_prompt = self._extract_system_prompt(body)
                
                # Use shared session utility for consistent session detection
                conversation_id, is_session_start, is_fragmented, last_processed_index = self._session_utility.detect_session(
                    messages=messages,
                    system_prompt=system_prompt,
                    metadata={
                        "provider": self.name,
                        "model": body.get("model"),
                        "endpoint": "responses"
                    }
                )


            is_session_end = False
            message_count = 1  # Responses API is stateful, count individual requests
        
        # Chat completions and completions endpoints
        else:
            # Use shared session detection utility for message-based sessions
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
                    "endpoint": "chat_completions"
                }
            )
            
            

            # Session end: determined by response success/failure, not request
            is_session_end = False
        
        session_info = SessionInfo(
            is_session_start=is_session_start,
            is_session_end=is_session_end,
            conversation_id=conversation_id,
            message_count=message_count,
            model=self.extract_model_from_body(body),
            is_streaming=self.extract_streaming_from_body(body),
            metadata=self.extract_conversation_metadata(body),
            last_processed_index=last_processed_index
        )
        return session_info
    
    def extract_model_from_body(self, body: Dict[str, Any]) -> Optional[str]:
        """Extract model from OpenAI request."""
        return body.get("model")
    
    def extract_streaming_from_body(self, body: Dict[str, Any]) -> bool:
        """Check if OpenAI request is for streaming."""
        return body.get("stream", False) is True
    
    def parse_streaming_response(self, body_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Parse OpenAI SSE streaming response into structured data.
        
        OpenAI's format: data: {json}\n\n ... data: [DONE]
        We aggregate chunks to reconstruct the full response including tool_calls.
        
        Args:
            body_bytes: Raw SSE response bytes
            
        Returns:
            Aggregated response dict matching OpenAI's non-streaming format, or None if parsing fails
        """
        try:
            import json
            text = body_bytes.decode('utf-8')
            lines = text.split('\n')
            
            # OpenAI streaming sends multiple data: {chunk} events
            # We need to aggregate them into a complete response
            chunks = []
            
            for line in lines:
                line = line.strip()
                
                if line.startswith('data: '):
                    data_str = line[6:].strip()
                    
                    # Skip the [DONE] marker
                    if data_str == '[DONE]':
                        continue
                    
                    try:
                        chunk = json.loads(data_str)
                        chunks.append(chunk)
                    except json.JSONDecodeError:
                        pass
            
            if not chunks:
                return None
            
            # Reconstruct the full response from chunks
            # Take the first chunk as base (has id, model, etc.)
            if chunks:
                first_chunk = chunks[0]
                
                # Build aggregated response similar to non-streaming format
                aggregated = {
                    'id': first_chunk.get('id'),
                    'object': 'chat.completion',  # Non-streaming object type
                    'created': first_chunk.get('created'),
                    'model': first_chunk.get('model'),
                    'choices': []
                }
                
                # Aggregate content and tool_calls from all chunks
                content_parts = []
                tool_calls = {}  # Track tool calls by index
                finish_reason = None
                
                for chunk in chunks:
                    choices = chunk.get('choices', [])
                    for choice in choices:
                        delta = choice.get('delta', {})
                        
                        # Accumulate text content
                        if 'content' in delta and delta['content']:
                            content_parts.append(delta['content'])
                        
                        # Accumulate tool calls
                        if 'tool_calls' in delta:
                            for tool_call_delta in delta['tool_calls']:
                                index = tool_call_delta.get('index', 0)
                                
                                # Initialize tool call if not seen before
                                if index not in tool_calls:
                                    tool_calls[index] = {
                                        'id': tool_call_delta.get('id', ''),
                                        'type': tool_call_delta.get('type', 'function'),
                                        'function': {
                                            'name': '',
                                            'arguments': ''
                                        }
                                    }
                                
                                # Update tool call fields
                                if 'id' in tool_call_delta:
                                    tool_calls[index]['id'] = tool_call_delta['id']
                                if 'type' in tool_call_delta:
                                    tool_calls[index]['type'] = tool_call_delta['type']
                                
                                # Accumulate function details
                                if 'function' in tool_call_delta:
                                    func_delta = tool_call_delta['function']
                                    if 'name' in func_delta:
                                        tool_calls[index]['function']['name'] = func_delta['name']
                                    if 'arguments' in func_delta:
                                        tool_calls[index]['function']['arguments'] += func_delta['arguments']
                        
                        # Capture finish reason
                        if choice.get('finish_reason'):
                            finish_reason = choice['finish_reason']
                
                # Build the final message
                message = {'role': 'assistant'}
                
                if content_parts:
                    message['content'] = ''.join(content_parts)
                
                if tool_calls:
                    # Convert tool_calls dict to sorted list
                    message['tool_calls'] = [tool_calls[i] for i in sorted(tool_calls.keys())]
                
                # Create final choice
                aggregated['choices'] = [{
                    'index': 0,
                    'message': message,
                    'finish_reason': finish_reason
                }]
                
                # Add usage if present in last chunk
                if chunks[-1].get('usage'):
                    aggregated['usage'] = chunks[-1]['usage']
                
                return aggregated
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing OpenAI SSE response: {e}", exc_info=True)
            return None
    
    def extract_conversation_metadata(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract OpenAI-specific metadata."""
        metadata = {}
        
        # Token limits
        if "max_tokens" in body:
            metadata["max_tokens"] = body["max_tokens"]
        
        # Temperature and other params
        for param in ["temperature", "top_p", "frequency_penalty", "presence_penalty"]:
            if param in body:
                metadata[param] = body[param]
        
        # NEW: High-priority required fields for risk assessment
        # Determinism and reproducibility
        if "seed" in body:
            metadata["seed"] = body["seed"]
        
        # Structured output control
        if "response_format" in body:
            metadata["response_format"] = body["response_format"]
        
        # Tool governance
        if "tool_choice" in body:
            metadata["tool_choice"] = body["tool_choice"]
        
        # Token manipulation detection
        if "logit_bias" in body:
            metadata["logit_bias"] = body["logit_bias"]
        
        # Resource usage tracking
        if "n" in body:
            metadata["n"] = body["n"]
        
        # Completion control
        if "stop" in body:
            metadata["stop"] = body["stop"]
        
        # User identification
        if "user" in body:
            metadata["user"] = body["user"]
        
        # System message extraction (parity with Anthropic provider)
        messages = body.get("messages", [])
        system_messages = [msg for msg in messages if msg.get("role") == "system"]
        
        if system_messages:
            metadata["has_system_message"] = True
            # Combine content from all system messages
            system_content = ""
            for msg in system_messages:
                content = msg.get("content", "")
                # Handle both string and structured content
                if isinstance(content, str):
                    system_content += content
                else:
                    system_content += str(content)
            metadata["system_length"] = len(system_content)
        
        # Tools information
        if "tools" in body:
            metadata["tools_count"] = len(body["tools"])
            metadata["tool_names"] = [tool.get("function", {}).get("name") for tool in body["tools"]]
        
        # Responses API specific fields
        if "instructions" in body:
            metadata["has_instructions"] = True
            metadata["instructions_length"] = len(body["instructions"])
        
        # Check for new Responses API capabilities
        if "web_search" in body:
            metadata["web_search_enabled"] = body["web_search"]
        if "computer_use" in body:
            metadata["computer_use_enabled"] = body["computer_use"]
        if "file_search" in body:
            metadata["file_search_enabled"] = body["file_search"]
        
        return metadata
    
    async def notify_response(self, session_id: str, request: Request,
                            response_body: Optional[Dict[str, Any]]) -> None:
        """Track response IDs for session continuity.
        
        Args:
            session_id: The session ID associated with this request
            request: The original request object
            response_body: The parsed response body
        """

        if not response_body:
            return
        
        # Only process responses from the /v1/responses endpoint  
        if not request.url.path.endswith("/responses"):
            return
        
        # Extract response_id from the response
        response_id = response_body.get("id") or response_body.get("response_id")

        if not response_id:
            return
        
        # Store the mapping using the full session ID
        # This ensures session continuity when previous_response_id is used
        self.response_sessions[response_id] = session_id
        
        # Optional: Clean up old entries to prevent memory growth
        # In production, you might want to use a TTL cache or similar
        if len(self.response_sessions) > 10000:
            # Remove oldest entries (simple FIFO for now)
            oldest_entries = list(self.response_sessions.items())[:1000]
            for old_id, _ in oldest_entries:
                del self.response_sessions[old_id]
    
    def _extract_system_prompt(self, body: Dict[str, Any]) -> str:
        """Extract system prompt from OpenAI request body."""
        # Look for system message in messages array (Chat Completions API)
        messages = body.get("messages", [])
        for message in messages:
            if message.get("role") == "system":
                content = message.get("content", "")
                return content if isinstance(content, str) else str(content)
        
        # Look for system message in input array (Responses API)
        input_data = body.get("input", [])
        if isinstance(input_data, list):
            for message in input_data:
                if message.get("role") == "system":
                    content = message.get("content", "")
                    return content if isinstance(content, str) else str(content)
        
        # For /v1/responses endpoint, use instructions as system prompt
        if "instructions" in body:
            return body["instructions"]
        
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
            usage.get("prompt_tokens"),
            usage.get("completion_tokens"),
            usage.get("total_tokens")
        )
    
    def _extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Extract response content from response body."""
        if not response_body:
            return None
        
        try:
            choices = response_body.get("choices", [])
            if not choices or not isinstance(choices, list):
                return None
            
            content = []
            for choice in choices:
                if isinstance(choice, dict):
                    message = choice.get("message", {})
                    if message:
                        content.append(message)
            
            return content if content else None
        except Exception:
            # Gracefully handle any malformed response data
            return None
    
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
        
        # Determine API type explicitly
        is_responses_api = ("input" in body) and ("messages" not in body)
        
        # Collect request messages according to API type
        messages = body.get("messages", [])
        input_data = body.get("input", [])
        all_messages = input_data if is_responses_api else messages
        
        # Compute new messages and processed index strategy
        if is_responses_api:
            # For Responses API, only process new messages since last processed index
            new_messages = all_messages[last_processed_index:]
            new_last_processed_index = len(all_messages)
        else:
            # For Chat Completions, slice by previously processed index
            new_messages = all_messages[last_processed_index:]
            new_last_processed_index = len(all_messages)
        
        # For external sessions, always continue even if no new messages
        if not new_messages and not (session_info.metadata and session_info.metadata.get("external")):
            return events, last_processed_index
        
        # Get trace_id (consistent per session)
        trace_id = self.get_trace_id(session_id)
        
        # Use computed agent_id from middleware instead of re-computing
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
        
        # Parse tool results according to API type using only the new segment
        if is_responses_api:
            new_body_for_tools = {"input": new_messages}
        else:
            new_body_for_tools = {"messages": new_messages}
        
        tool_results = self.tool_parser.parse_tool_results(new_body_for_tools, self.name)
        
        # Handle tool result events (all are new since we're only processing new segment)
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
                tool_name=(tool_result.get("name") or "unknown"),
                status="success",  # Assume success since result is present
                execution_time_ms=0.0,  # Not available in request
                result=tool_result.get("result"),
                session_id=session_id
            )
            events.append(tool_result_event)
        
        # Send LLM call start event for every LLM API call
        # For explicit external sessions, always generate events regardless of message novelty
        should_generate_llm_events = session_info.model and (
            (len(new_messages) > 0) or  # Standard case: there are new messages
            is_responses_api or  # Responses API: each request is a stateful turn
            (session_info.metadata and session_info.metadata.get("external"))  # External session: always track
        )
        
        if should_generate_llm_events:
            # For external sessions with no new messages, use the full conversation
            # to represent this as a complete LLM API call
            messages_to_include = new_messages if new_messages else all_messages
            
            # Create a modified body with appropriate messages and enhanced metadata
            new_request_data = {
                **body,
                "_cylestio_metadata": {
                    "total_messages": len(all_messages),
                    "new_messages": len(new_messages),
                    "from_index": last_processed_index,
                    "external_session": session_info.metadata and session_info.metadata.get("external", False)
                }
            }
            
             # Include enhanced conversation metadata from session_info in the request data
            if session_info.metadata:
                # Add session metadata to request data (preserving the required fields we collect)
                enhanced_metadata = {k: v for k, v in session_info.metadata.items() 
                                   if k not in new_request_data}  # Don't override existing body fields
                new_request_data.update(enhanced_metadata)
            
            # Replace messages/input with appropriate messages based on API type
            if is_responses_api:
                new_request_data["input"] = messages_to_include
            else:
                new_request_data["messages"] = messages_to_include
            
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

        OpenAI errors are indicated by:
        - HTTP 4xx/5xx status codes
        - Response body containing "error" key

        Args:
            status_code: HTTP status code
            response_body: Parsed response body (may be None)

        Returns:
            True if response is an error
        """
        if status_code >= 400:
            return True
        # Check for error in body (rare but possible with some proxies)
        if response_body and "error" in response_body:
            return True
        return False

    def extract_error_info(self, status_code: int, response_body: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract error details from OpenAI error response.

        OpenAI error format:
        {
            "error": {
                "message": "...",
                "type": "insufficient_quota",
                "code": "insufficient_quota"
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
            error_obj = response_body.get("error", {})
            if isinstance(error_obj, dict):
                # Prefer 'type', fallback to 'code'
                error_type = error_obj.get("type") or error_obj.get("code")
                error_message = error_obj.get("message", error_message)
            elif isinstance(error_obj, str):
                # Handle unexpected string error format
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
            400: "bad_request",
            401: "authentication_error",
            403: "permission_denied",
            404: "not_found",
            429: "rate_limit_error",
            500: "server_error",
            502: "bad_gateway",
            503: "service_unavailable",
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
                # System fingerprint (model version identifier)
                if "system_fingerprint" in response_body:
                    additional_response_data["system_fingerprint"] = response_body["system_fingerprint"]
                
                # Finish reason and refusal from first choice
                choices = response_body.get("choices", [])
                if choices:
                    first_choice = choices[0]
                    
                    if "finish_reason" in first_choice:
                        additional_response_data["finish_reason"] = first_choice["finish_reason"]
                    
                    # Check for refusal in message
                    message = first_choice.get("message", {})
                    if "refusal" in message and message["refusal"]:
                        additional_response_data["refusal"] = message["refusal"]
                        
            except Exception:
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
        """Return OpenAI-specific auth headers.
        
        Uses Authorization: Bearer <api_key> when an API key is configured.
        """
        api_key = self.get_api_key()
        if not api_key:
            return {}
        return {"Authorization": f"Bearer {api_key}"}