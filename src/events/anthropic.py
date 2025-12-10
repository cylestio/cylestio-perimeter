"""Anthropic event builder for creating platform events."""
import hashlib
from typing import Any, Dict, List, Optional

from .types import ToolExecutionEvent, ToolResultEvent
from .base import generate_span_id


class AnthropicEventBuilder:
    """Build events from Anthropic API data."""
    
    def __init__(self, session_id: Optional[str] = None, agent_id: Optional[str] = None):
        """Initialize event builder."""
        self.session_id = session_id
        self.agent_id = agent_id or "default-agent"
    
    def _get_trace_span_ids(self) -> tuple[str, str]:
        """Get trace and span IDs from session."""
        if self.session_id:
            # Create deterministic ID from session ID
            hash_obj = hashlib.md5(self.session_id.encode(), usedforsecurity=False)
            trace_span_id = hash_obj.hexdigest()  # 32-char hex string
            return trace_span_id, trace_span_id
        else:
            # Generate new IDs
            span_id = generate_span_id()
            trace_id = span_id + span_id  # 32 chars
            return trace_id, span_id
    
    def build_tool_result_events(self, messages: List[Dict[str, Any]]) -> List[ToolResultEvent]:
        """Build tool result events from Anthropic messages."""
        events = []
        trace_id, span_id = self._get_trace_span_ids()
        
        for message in messages:
            if message.get("role") == "user" and isinstance(message.get("content"), list):
                for content_item in message["content"]:
                    if isinstance(content_item, dict) and content_item.get("type") == "tool_result":
                        status = "error" if content_item.get("is_error", False) else "success"
                        
                        event = ToolResultEvent.create(
                            trace_id=trace_id,
                            span_id=span_id,
                            agent_id=self.agent_id,
                            tool_name=content_item.get("name", "unknown"),
                            status=status,
                            execution_time_ms=0.0,  # Not available in request
                            result=content_item.get("content"),
                            error_message=content_item.get("content") if status == "error" else None,
                            session_id=self.session_id
                        )
                        events.append(event)
        
        return events
    
    def build_tool_execution_events(self, content: List[Dict[str, Any]]) -> List[ToolExecutionEvent]:
        """Build tool execution events from Anthropic response content."""
        events = []
        trace_id, span_id = self._get_trace_span_ids()
        
        for content_item in content:
            if isinstance(content_item, dict) and content_item.get("type") == "tool_use":
                event = ToolExecutionEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=self.agent_id,
                    tool_name=content_item.get("name", "unknown"),
                    tool_params=content_item.get("input", {}),
                    session_id=self.session_id
                )
                events.append(event)
        
        return events