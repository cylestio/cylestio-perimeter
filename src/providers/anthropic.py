"""Anthropic provider for session detection."""
import hashlib
import time
from typing import Any, Dict, List, Optional

from fastapi import Request

from .base import BaseProvider, SessionInfo
from src.events.types import (
    SessionStartEvent, LLMCallStartEvent, ToolResultEvent, 
    LLMCallFinishEvent, ToolExecutionEvent, LLMCallErrorEvent
)
from src.events.base import generate_span_id


class AnthropicProvider(BaseProvider):
    """Anthropic API provider implementation."""
    
    def __init__(self, settings=None):
        """Initialize Anthropic provider."""
        super().__init__(settings)
    
    @property
    def name(self) -> str:
        return "anthropic"
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from Anthropic request."""
        messages = body.get("messages", [])
        message_count = len(messages)
        
        # Generate conversation ID from message history
        conversation_id = self._generate_conversation_id(messages, body.get("system"))
        
        # Count user and assistant messages
        user_messages = [m for m in messages if m.get("role") == "user"]
        assistant_messages = [m for m in messages if m.get("role") == "assistant"]
        
        # Session start: Only user messages and no assistant responses (truly new conversation)
        is_session_start = (
            len(user_messages) >= 1 and 
            len(assistant_messages) == 0
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
            metadata=self.extract_conversation_metadata(body)
        )
    
    def extract_model_from_body(self, body: Dict[str, Any]) -> Optional[str]:
        """Extract model from Anthropic request."""
        return body.get("model")
    
    def extract_streaming_from_body(self, body: Dict[str, Any]) -> bool:
        """Check if Anthropic request is for streaming."""
        return body.get("stream", False) is True
    
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
        
        return metadata
    
    def _generate_conversation_id(self, messages: list, system_message: Optional[str] = None) -> str:
        """Generate a conversation ID from message history and system message."""
        if not messages:
            return "empty"
        
        # Start with system message if present
        conversation_text = ""
        if system_message:
            conversation_text += f"system:{system_message[:100]}"
        
        # Use first user message to create stable ID (this defines the conversation)
        first_user_msg = None
        for msg in messages:
            if msg.get("role") == "user":
                first_user_msg = msg
                break
        
        if first_user_msg:
            content = first_user_msg.get("content", "")
            if isinstance(content, str):
                conversation_text += f"user:{content[:100]}"  # First 100 chars
            elif isinstance(content, list):
                # Handle Claude's structured content format
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        conversation_text += f"user:{item.get('text', '')[:100]}"
                        break
        
        # Create short hash
        return hashlib.md5(conversation_text.encode()).hexdigest()[:8]
    
    def _get_agent_id(self, body: Dict[str, Any]) -> str:
        """Get agent ID derived from system prompt hash (calculated per request)."""
        system_prompt = self._extract_system_prompt(body)
        
        # Generate agent ID as hash of system prompt
        hash_obj = hashlib.md5(system_prompt.encode())
        return f"prompt-{hash_obj.hexdigest()[:12]}"
    
    def _extract_system_prompt(self, body: Dict[str, Any]) -> str:
        """Extract system prompt from Anthropic request body."""
        # Look for system message in body
        system = body.get("system")
        if system:
            return system if isinstance(system, str) else str(system)
        
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
                             tool_results: List[Dict[str, Any]]) -> List[Any]:
        """Extract and create events from request data using original interceptor logic."""
        events = []
        
        if not session_id:
            return events
        
        # Use same ID for both trace and span (derived from session)
        trace_span_id = self._session_to_trace_span_id(session_id)
        trace_id = trace_span_id
        span_id = trace_span_id
        agent_id = self._get_agent_id(body)
        
        # Handle session start event
        if is_new_session:
            session_start_event = SessionStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                session_id=session_id,
                client_type="gateway"
            )
            events.append(session_start_event)
        
        # Handle tool result events if present (when request contains tool results from previous execution)
        if tool_results:
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
        
        # Send LLM call start event
        if session_info.model:
            llm_start_event = LLMCallStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                vendor=self.name,
                model=session_info.model,
                request_data=body or {},
                session_id=session_id
            )
            events.append(llm_start_event)
        
        return events
    
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