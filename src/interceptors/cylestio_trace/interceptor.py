"""Cylestio trace interceptor for sending events to Cylestio API."""
import hashlib
import logging
import time
from typing import Any, Dict, List, Optional

from ...proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from .client import CylestioClient, CylestioAPIError
from .events import (
    LLMCallStartEvent, LLMCallFinishEvent, LLMCallErrorEvent,
    ToolExecutionEvent, ToolResultEvent,
    SessionStartEvent, SessionEndEvent,
    generate_span_id
)

logger = logging.getLogger(__name__)


class CylestioTraceInterceptor(BaseInterceptor):
    """Interceptor for sending trace events to Cylestio API."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Cylestio trace interceptor.
        
        Args:
            config: Configuration dict with Cylestio settings
        """
        super().__init__(config)
        
        # Extract Cylestio configuration
        self.api_url = config.get("api_url")
        self.access_key = config.get("access_key")
        self.timeout = config.get("timeout", 10)
        
        # Validate required configuration
        if not all([self.api_url, self.access_key]):
            raise ValueError("Cylestio interceptor requires api_url and access_key")
        
        # Track sessions for session events
        self._active_sessions: Dict[str, float] = {}  # session_id -> start_time
        self._session_event_counts: Dict[str, int] = {}  # session_id -> event_count
    
    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "cylestio_trace"
    
    def _get_agent_id(self, request_data: LLMRequestData) -> str:
        """Get agent ID derived from system prompt hash (calculated per request)."""
        # Extract system prompt from request body (TODO: is this OpenAI?)
        system_prompt = ""
        if request_data.body:
            messages = request_data.body.get("messages", [])
            for message in messages:
                if message.get("role") == "system":
                    content = message.get("content", "")
                    if isinstance(content, str):
                        system_prompt = content
                    break
        
        # Fallback to default if no system prompt found
        if not system_prompt:
            system_prompt = request_data.body.get("system", "default-agent")
        
        # Generate agent ID as hash of system prompt
        hash_obj = hashlib.md5(system_prompt.encode())
        return f"prompt-{hash_obj.hexdigest()[:12]}"
    
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
        
        # Check for OpenAI format
        usage = response_body.get("usage", {})
        if usage:
            return (
                usage.get("prompt_tokens"),
                usage.get("completion_tokens"),
                usage.get("total_tokens")
            )
        
        # Check for Anthropic format
        if "usage" in response_body:
            usage = response_body["usage"]
            return (
                usage.get("input_tokens"),
                usage.get("output_tokens"),
                usage.get("input_tokens", 0) + usage.get("output_tokens", 0) if 
                usage.get("input_tokens") and usage.get("output_tokens") else None
            )
        
        return None, None, None
    
    def _extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Extract response content from response body."""
        if not response_body:
            return None
        
        # OpenAI format
        choices = response_body.get("choices", [])
        if choices:
            content = []
            for choice in choices:
                message = choice.get("message", {})
                if "content" in message:
                    content.append({"text": message["content"]})
            return content if content else None
        
        # Anthropic format
        if "content" in response_body:
            anthropic_content = response_body["content"]
            if isinstance(anthropic_content, list):
                content = []
                for item in anthropic_content:
                    if item.get("type") == "text":
                        content.append({"text": item.get("text", "")})
                return content if content else None
            elif isinstance(anthropic_content, str):
                return [{"text": anthropic_content}]
        
        return None
    
    async def _send_event_safe(self, event) -> bool:
        """Send event with error handling."""
        try:
            async with CylestioClient(self.api_url, self.access_key, self.timeout) as client:
                return await client.send_event(event)
        except CylestioAPIError as e:
            logger.error(f"Cylestio API error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending Cylestio event: {e}")
            return False
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Send LLM call start event and session start if new session."""
        if not self.enabled:
            return None
        
        session_id = request_data.session_id
        if not session_id:
            logger.warning("No session ID available for Cylestio tracing")
            return None

        # Use same ID for both trace and span (derived from session)
        trace_span_id = self._session_to_trace_span_id(session_id)
        trace_id = trace_span_id
        span_id = trace_span_id
        
        # Handle session start event
        if request_data.is_new_session:
            self._active_sessions[session_id] = time.time()
            self._session_event_counts[session_id] = 0
            
            session_start_event = SessionStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,  # Same as trace_id
                agent_id=self._get_agent_id(request_data),
                session_id=session_id,
                client_type="gateway"
            )
            await self._send_event_safe(session_start_event)
            self._session_event_counts[session_id] += 1
        
        # Send LLM call start event
        if request_data.provider and request_data.model:
            llm_start_event = LLMCallStartEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=self._get_agent_id(request_data),
                vendor=request_data.provider,
                model=request_data.model,
                request_data=request_data.body or {},
                session_id=session_id
            )
            await self._send_event_safe(llm_start_event)
            
            if session_id in self._session_event_counts:
                self._session_event_counts[session_id] += 1
        
        # Handle tool execution events if present
        if request_data.has_tool_results:
            for tool_result in request_data.tool_results:
                tool_event = ToolExecutionEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=self._get_agent_id(request_data),
                    tool_name=tool_result.get("name", "unknown"),
                    tool_params=tool_result.get("params", {}),
                    session_id=session_id
                )
                await self._send_event_safe(tool_event)
                
                if session_id in self._session_event_counts:
                    self._session_event_counts[session_id] += 1
        
        # Store trace/span ID for use in response (they're the same now)
        request_data.metadata["cylestio_trace_span_id"] = trace_span_id
        
        return None
    
    async def after_response(self, request_data: LLMRequestData, response_data: LLMResponseData) -> Optional[LLMResponseData]:
        """Send LLM call finish event and tool result events."""
        if not self.enabled:
            return None
        
        session_id = request_data.session_id
        if not session_id:
            return None
        
        # Get trace/span ID from request metadata (they're the same)
        trace_span_id = request_data.metadata.get("cylestio_trace_span_id")
        
        if not trace_span_id:
            logger.warning("Missing trace/span ID for Cylestio response event")
            return None
        
        trace_id = trace_span_id
        span_id = trace_span_id
        
        # Extract token usage and response content
        input_tokens, output_tokens, total_tokens = self._extract_usage_tokens(response_data.body)
        response_content = self._extract_response_content(response_data.body)
        
        # Send LLM call finish event
        if request_data.provider and request_data.model:
            llm_finish_event = LLMCallFinishEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=self._get_agent_id(request_data),
                vendor=request_data.provider,
                model=request_data.model,
                duration_ms=response_data.duration_ms,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                response_content=response_content,
                session_id=session_id
            )
            await self._send_event_safe(llm_finish_event)
            
            if session_id in self._session_event_counts:
                self._session_event_counts[session_id] += 1
        
        # Handle tool result events if present
        if response_data.has_tool_requests:
            for tool_request in response_data.tool_uses_request:
                tool_result_event = ToolResultEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=self._get_agent_id(request_data),
                    tool_name=tool_request.get("name", "unknown"),
                    status="success",  # Assume success for now
                    execution_time_ms=0.0,  # Not available
                    result=tool_request.get("result"),
                    session_id=session_id
                )
                await self._send_event_safe(tool_result_event)
                
                if session_id in self._session_event_counts:
                    self._session_event_counts[session_id] += 1
        
        return None
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Send LLM call error event."""
        if not self.enabled:
            return
        
        session_id = request_data.session_id
        if not session_id:
            return
        
        # Get trace/span ID from request metadata (they're the same)
        trace_span_id = request_data.metadata.get("cylestio_trace_span_id")
        
        if not trace_span_id:
            # Generate new ID if not available
            trace_span_id = self._session_to_trace_span_id(session_id)
        
        trace_id = trace_span_id
        span_id = trace_span_id
        
        # Send LLM call error event
        if request_data.provider and request_data.model:
            llm_error_event = LLMCallErrorEvent.create(
                trace_id=trace_id,
                span_id=span_id,
                agent_id=self._get_agent_id(request_data),
                vendor=request_data.provider,
                model=request_data.model,
                error_message=str(error),
                error_type=type(error).__name__,
                session_id=session_id
            )
            await self._send_event_safe(llm_error_event)
            
            if session_id in self._session_event_counts:
                self._session_event_counts[session_id] += 1
    
    async def end_session(self, session_id: str) -> None:
        """Send session end event for a given session.
        
        This should be called when a session ends.
        """
        if not self.enabled or session_id not in self._active_sessions:
            return
        
        start_time = self._active_sessions[session_id]
        duration_ms = (time.time() - start_time) * 1000
        event_count = self._session_event_counts.get(session_id, 0)
        
        trace_span_id = self._session_to_trace_span_id(session_id)
        
        # Note: We would need request_data to get agent_id, but this method doesn't have it
        # For session end events, we use a generic agent_id
        default_agent_id = "agent-unknown"
        
        session_end_event = SessionEndEvent.create(
            trace_id=trace_span_id,
            span_id=trace_span_id,
            agent_id=default_agent_id,
            session_id=session_id,
            duration_ms=duration_ms,
            events_count=event_count
        )
        
        await self._send_event_safe(session_end_event)
        
        # Clean up session tracking
        del self._active_sessions[session_id]
        del self._session_event_counts[session_id]