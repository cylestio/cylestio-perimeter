"""OpenAI event builder for creating platform events."""
import hashlib
from typing import Any, Dict, List, Optional

from .types import ToolExecutionEvent, ToolResultEvent
from .base import generate_span_id


class OpenAIEventBuilder:
    """Build events from OpenAI API data."""
    
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
        """Build tool result events from OpenAI messages."""
        events = []
        trace_id, span_id = self._get_trace_span_ids()
        
        for message in messages:
            if message.get("role") == "tool":
                event = ToolResultEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=self.agent_id,
                    tool_name=message.get("name", "unknown"),
                    status="success",  # Assume success since result is present
                    execution_time_ms=0.0,  # Not available in request
                    result=message.get("content"),
                    session_id=self.session_id
                )
                events.append(event)
        
        return events
    
    def build_tool_execution_events(self, choices: List[Dict[str, Any]]) -> List[ToolExecutionEvent]:
        """Build tool execution events from OpenAI response choices."""
        events = []
        trace_id, span_id = self._get_trace_span_ids()
        
        for choice in choices:
            message = choice.get("message", {})
            tool_calls = message.get("tool_calls", [])
            
            for tool_call in tool_calls:
                function = tool_call.get("function", {})
                
                # Parse arguments if it's a string
                args = function.get("arguments", {})
                if isinstance(args, str):
                    try:
                        import json
                        args = json.loads(args)
                    except (json.JSONDecodeError, TypeError):
                        args = {"raw_arguments": args}
                
                event = ToolExecutionEvent.create(
                    trace_id=trace_id,
                    span_id=span_id,
                    agent_id=self.agent_id,
                    tool_name=function.get("name", "unknown"),
                    tool_params=args,
                    session_id=self.session_id
                )
                events.append(event)
        
        return events