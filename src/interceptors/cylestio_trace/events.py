"""Event models for Cylestio API integration."""
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EventLevel(str, Enum):
    """Event level enumeration."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class EventName(str, Enum):
    """Cylestio event name enumeration."""
    LLM_CALL_START = "llm.call.start"
    LLM_CALL_FINISH = "llm.call.finish"
    LLM_CALL_ERROR = "llm.call.error"
    TOOL_EXECUTION = "tool.execution"
    TOOL_RESULT = "tool.result"
    SESSION_START = "session.start"
    SESSION_END = "session.end"


def generate_trace_id() -> str:
    """Generate OpenTelemetry-compatible trace ID (32-char hex)."""
    return uuid.uuid4().hex + uuid.uuid4().hex[:16]


def generate_span_id() -> str:
    """Generate OpenTelemetry-compatible span ID (16-char hex)."""
    return uuid.uuid4().hex[:16]


class CylestioEvent(BaseModel):
    """Base Cylestio event model matching API schema."""
    
    schema_version: str = Field(default="1.0", description="Event schema version")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    trace_id: str = Field(..., description="OpenTelemetry trace ID")
    span_id: str = Field(..., description="OpenTelemetry span ID")
    name: EventName = Field(..., description="Event name")
    level: EventLevel = Field(default=EventLevel.INFO, description="Event level")
    agent_id: str = Field(..., description="Agent identifier")
    session_id: Optional[str] = Field(default=None, description="Session identifier")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Event-specific attributes")


class LLMCallStartEvent(CylestioEvent):
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
        """Create LLM call start event."""
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes={
                "llm.vendor": vendor,
                "llm.model": model,
                "llm.request.data": request_data
            }
        )


class LLMCallFinishEvent(CylestioEvent):
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
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class LLMCallErrorEvent(CylestioEvent):
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
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class ToolExecutionEvent(CylestioEvent):
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
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class ToolResultEvent(CylestioEvent):
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
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class SessionStartEvent(CylestioEvent):
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
        client_type: Optional[str] = None
    ) -> "SessionStartEvent":
        """Create session start event."""
        attributes = {
            "session.id": session_id
        }
        
        if user_id:
            attributes["user.id"] = user_id
        if client_type:
            attributes["client.type"] = client_type
            
        return cls(
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            session_id=session_id,
            attributes=attributes
        )


class SessionEndEvent(CylestioEvent):
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