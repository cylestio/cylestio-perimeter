"""Platform event types for LLM operations."""
from typing import Any, Dict, List, Optional

from pydantic import Field

from .base import BaseEvent, EventName, EventLevel, validate_required_string


class LLMCallStartEvent(BaseEvent):
    """LLM call start event."""
    
    name: EventName = Field(default=EventName.LLM_CALL_START, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        vendor: str,
        model: str,
        request_data: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> "LLMCallStartEvent":
        """Create LLM call start event.
        
        Raises:
            ValueError: If required parameters are missing or invalid
        """
        # Input validation
        validate_required_string(trace_id, "trace_id")
        validate_required_string(span_id, "span_id")
        validate_required_string(agent_id, "agent_id")
        validate_required_string(vendor, "vendor")
        validate_required_string(model, "model")
        attributes = {
            "llm.vendor": vendor,
            "llm.model": model,
            "llm.request.data": request_data
        }
        
        if session_id:
            attributes["session.id"] = session_id
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class LLMCallFinishEvent(BaseEvent):
    """LLM call finish event."""
    
    name: EventName = Field(default=EventName.LLM_CALL_FINISH, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        vendor: str,
        model: str,
        duration_ms: float,
        input_tokens: Optional[int] = None,
        output_tokens: Optional[int] = None,
        total_tokens: Optional[int] = None,
        response_content: Optional[List[Dict[str, Any]]] = None,
        session_id: Optional[str] = None
    ) -> "LLMCallFinishEvent":
        """Create LLM call finish event."""
        attributes = {
            "llm.vendor": vendor,
            "llm.model": model,
            "llm.response.duration_ms": duration_ms
        }
        
        if input_tokens is not None:
            attributes["llm.usage.input_tokens"] = input_tokens
        if output_tokens is not None:
            attributes["llm.usage.output_tokens"] = output_tokens
        if total_tokens is not None:
            attributes["llm.usage.total_tokens"] = total_tokens
        if response_content is not None:
            attributes["llm.response.content"] = response_content
        if session_id:
            attributes["session.id"] = session_id
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class LLMCallErrorEvent(BaseEvent):
    """LLM call error event."""
    
    name: EventName = Field(default=EventName.LLM_CALL_ERROR, frozen=True)
    level: EventLevel = Field(default=EventLevel.ERROR, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        vendor: str,
        model: str,
        error_message: str,
        error_type: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> "LLMCallErrorEvent":
        """Create LLM call error event."""
        attributes = {
            "llm.vendor": vendor,
            "llm.model": model,
            "error.message": error_message
        }
        
        if error_type:
            attributes["error.type"] = error_type
        if session_id:
            attributes["session.id"] = session_id
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class ToolExecutionEvent(BaseEvent):
    """Tool execution event."""
    
    name: EventName = Field(default=EventName.TOOL_EXECUTION, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        tool_name: str,
        tool_params: Dict[str, Any],
        framework_name: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> "ToolExecutionEvent":
        """Create tool execution event."""
        attributes = {
            "tool.name": tool_name,
            "tool.params": tool_params
        }
        
        if framework_name:
            attributes["framework.name"] = framework_name
        if session_id:
            attributes["session.id"] = session_id
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class ToolResultEvent(BaseEvent):
    """Tool result event."""
    
    name: EventName = Field(default=EventName.TOOL_RESULT, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        tool_name: str,
        status: str,
        execution_time_ms: float,
        result: Optional[Any] = None,
        error_message: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> "ToolResultEvent":
        """Create tool result event."""
        attributes = {
            "tool.name": tool_name,
            "tool.status": status,
            "tool.execution_time_ms": execution_time_ms
        }
        
        if result is not None:
            attributes["tool.result"] = result
        if error_message:
            attributes["error.message"] = error_message
        if session_id:
            attributes["session.id"] = session_id
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class SessionStartEvent(BaseEvent):
    """Session start event."""
    
    name: EventName = Field(default=EventName.SESSION_START, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        session_id: str,
        user_id: Optional[str] = None,
        client_type: Optional[str] = None,
        vendor: Optional[str] = None,
        model: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        prompt: Optional[str] = None
    ) -> "SessionStartEvent":
        """Create session start event."""
        attributes = {
            "session.id": session_id
        }
        
        if user_id:
            attributes["user.id"] = user_id
        if client_type:
            attributes["client.type"] = client_type
        if vendor:
            attributes["llm.vendor"] = vendor
        if model:
            attributes["llm.model"] = model
        if tools:
            attributes["tools"] = tools
        if prompt:
            attributes["prompt"] = prompt
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class SessionEndEvent(BaseEvent):
    """Session end event."""
    
    name: EventName = Field(default=EventName.SESSION_END, frozen=True)
    
    @classmethod
    def create(
        cls,
        trace_id: str,
        span_id: str,
        agent_id: str,
        session_id: str,
        duration_ms: float,
        events_count: int
    ) -> "SessionEndEvent":
        """Create session end event."""
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes={
                "session.id": session_id,
                "session.duration_ms": duration_ms,
                "session.events_count": events_count
            }
        )