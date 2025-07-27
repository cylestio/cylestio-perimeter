"""Event models for monitoring system events."""
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class EventType(str, Enum):
    """Event type enumeration."""
    MONITORING_START = "monitoring.start"
    MONITORING_STOP = "monitoring.stop"
    LLM_CALL_START = "llm.call.start"
    LLM_CALL_FINISH = "llm.call.finish"
    LLM_CALL_ERROR = "llm.call.error"
    TOOL_EXECUTION = "tool.execution"
    TOOL_RESULT = "tool.result"


class BaseEvent(BaseModel):
    """Base event model."""
    
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: EventType
    session_id: str
    provider: Optional[str] = None
    trace_id: Optional[str] = None


class MonitoringEvent(BaseEvent):
    """Monitoring event for session start/stop."""
    
    client_info: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None
    message_count: Optional[int] = None
    model: Optional[str] = None


class LLMEvent(BaseEvent):
    """LLM API call event."""
    
    method: str
    url: str
    model: Optional[str] = None
    is_streaming: bool = False
    request_tokens: Optional[int] = None
    response_tokens: Optional[int] = None
    duration_ms: Optional[float] = None
    status_code: Optional[int] = None
    error_message: Optional[str] = None


class ToolEvent(BaseEvent):
    """Tool execution event for MCP tools."""
    
    tool_name: str
    tool_args: Optional[Dict[str, Any]] = None
    result: Optional[Any] = None
    duration_ms: Optional[float] = None
    error_message: Optional[str] = None


class EventData(BaseModel):
    """Container for event data with metadata."""
    
    events: list[BaseEvent] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def to_file_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for file storage."""
        data = self.model_dump()
        # Convert datetime objects to ISO format strings
        for event in data["events"]:
            if "timestamp" in event:
                event["timestamp"] = event["timestamp"].isoformat() if isinstance(event["timestamp"], datetime) else event["timestamp"]
        return data