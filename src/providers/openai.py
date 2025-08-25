"""OpenAI provider for session detection."""
import hashlib
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
    
    @property
    def name(self) -> str:
        return "openai"
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from OpenAI request."""
        path = request.url.path

        # Handle the new /v1/responses endpoint differently
        if "/responses" in path:
            # Check for previous_response_id to maintain session continuity
            previous_response_id = body.get("previous_response_id")
            if previous_response_id and previous_response_id in self.response_sessions:
                # Continue existing session based on response ID chain
                conversation_id = self.response_sessions[previous_response_id]
                is_session_start = False
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
    
    def _session_to_trace_span_id(self, session_id: str) -> str:
        """Convert session ID to OpenTelemetry-compatible trace/span ID (32-char hex).
        
        For now, trace_id and span_id are identical and derived from session_id.
        """
        if not session_id:
            return generate_span_id() + generate_span_id()  # 32 chars
        
        # Create deterministic ID from session ID
        hash_obj = hashlib.md5(session_id.encode())
        return hash_obj.hexdigest()  # 32-char hex string
    
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
        
        choices = response_body.get("choices", [])
        if not choices:
            return None
        
        content = []
        for choice in choices:
            message = choice.get("message", {})
            if message:
                content.append(message)
        
        return content if content else None
    
    def extract_request_events(self, body: Dict[str, Any], session_info: SessionInfo, 
                             session_id: str, is_new_session: bool, 
                             last_processed_index: int = 0) -> Tuple[List[Any], int]:
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
        input_data = body.get("input", [])
        all_messages = messages or input_data
        
        # Only process new messages since last processed index
        new_messages = all_messages[last_processed_index:]
        new_last_processed_index = len(all_messages)
        
        # If no new messages, no events to create
        if not new_messages:
            return events, last_processed_index
        
        # Use same ID for last_processed_index
        trace_span_id = self._session_to_trace_span_id(session_id)
        trace_id = trace_span_id
        span_id = trace_span_id
        # Agent ID is now evaluated centrally in middleware
        agent_id = self._get_agent_id(body)
        
        # Handle session start event (only for new sessions)
        if is_new_session or session_info.is_session_start:
            session_start_event = SessionStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                session_id=session_id,
                client_type="gateway"
            )
            events.append(session_start_event)
        
        # Parse tool results only from NEW messages
        if messages:
            new_body_for_tools = {"messages": new_messages}
        else:
            new_body_for_tools = {"input": new_messages}
        
        tool_results = self.tool_parser.parse_tool_results(new_body_for_tools, self.name)
        
        # Handle tool result events (all are new since we're only processing new messages)
        for tool_result in tool_results:
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
        
        # Send LLM call start event with only NEW messages
        if session_info.model and new_messages:
            # Create a modified body with only new messages
            new_request_data = {
                **body,
                "_cylestio_metadata": {
                    "total_messages": len(all_messages),
                    "new_messages": len(new_messages),
                    "from_index": last_processed_index
                }
            }
            
            # Replace messages/input with only new messages
            if messages:
                new_request_data["messages"] = new_messages
            if input_data:
                new_request_data["input"] = new_messages
            
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
    
    def extract_response_events(self, response_body: Optional[Dict[str, Any]], 
                              session_id: str, duration_ms: float, 
                              tool_uses: List[Dict[str, Any]], 
                              request_metadata: Dict[str, Any]) -> List[Any]:
        """Extract and create events from response data using original interceptor logic."""
        events = []
        
        if not session_id:
            return events
        
        # Get trace/span ID from request metadata (they're the same)
        trace_span_id = request_metadata.get("cylestio_trace_span_id")
        
        if not trace_span_id:
            return events
        
        trace_id = trace_span_id
        span_id = trace_span_id
        
        # Get agent_id and model from metadata
        agent_id = request_metadata.get("agent_id", "unknown")
        model = request_metadata.get("model", "unknown")
        
        # Extract token usage and response content
        input_tokens, output_tokens, total_tokens = self._extract_usage_tokens(response_body)
        response_content = self._extract_response_content(response_body)
        
        # Send LLM call finish event
        if model:
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
            events.append(llm_finish_event)
        
        # Handle tool execution events if present (when LLM response contains tool use requests)
        if tool_uses:
            for tool_request in tool_uses:
                tool_execution_event = ToolExecutionEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=agent_id,
                    tool_name=tool_request.get("name", "unknown"),
                    tool_params=tool_request.get("input", {}),
                    session_id=session_id
                )
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