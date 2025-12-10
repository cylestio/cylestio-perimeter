"""Base event system for the LLM proxy platform."""
import hashlib
import platform
import socket
import sys
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


# Constants
DEFAULT_SCHEMA_VERSION = "1.0"
DEFAULT_CLIENT_TYPE = "gateway"
DEFAULT_TOOL_STATUS = "success"
DEFAULT_EXECUTION_TIME = 0.0


def get_system_info() -> Dict[str, Any]:
    """Get system information for event enrichment."""
    return {
        "os.type": platform.system(),
        "os.version": platform.release(), 
        "env.python.version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "env.machine.type": platform.machine(),
        "host.name": socket.gethostname()
    }


# Cache system info since it doesn't change during runtime
_SYSTEM_INFO = get_system_info()


def get_cached_system_info() -> Dict[str, Any]:
    """Get cached system information for performance."""
    return _SYSTEM_INFO


def generate_trace_id() -> str:
    """Generate OpenTelemetry-compatible trace ID (32-char hex)."""
    return uuid.uuid4().hex + uuid.uuid4().hex[:16]


def generate_span_id() -> str:
    """Generate OpenTelemetry-compatible span ID (16-char hex)."""
    return uuid.uuid4().hex[:16]


def validate_required_string(value: str, field_name: str) -> None:
    """Validate that a required string field is not empty.
    
    Args:
        value: The string value to validate
        field_name: Name of the field for error messages
        
    Raises:
        ValueError: If the value is empty or whitespace-only
    """
    if not value or not value.strip():
        raise ValueError(f"{field_name} is required and cannot be empty")


def session_id_to_trace_span_id(session_id: str) -> str:
    """Convert session ID to OpenTelemetry-compatible trace/span ID (32-char hex).
    
    For now, trace_id and span_id are identical and derived from session_id.
    
    Args:
        session_id: Session identifier
        
    Returns:
        32-character hex string for trace/span ID
    """
    if not session_id:
        return generate_span_id() + generate_span_id()  # 32 chars
    
    # Create deterministic ID from session ID
    hash_obj = hashlib.md5(session_id.encode(), usedforsecurity=False)
    return hash_obj.hexdigest()  # 32-char hex string


class EventLevel(str, Enum):
    """Event level enumeration."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class EventName(str, Enum):
    """Event name enumeration."""
    LLM_CALL_START = "llm.call.start"
    LLM_CALL_FINISH = "llm.call.finish"
    LLM_CALL_ERROR = "llm.call.error"
    TOOL_EXECUTION = "tool.execution"
    TOOL_RESULT = "tool.result"
    SESSION_START = "session.start"
    SESSION_END = "session.end"


class BaseEvent(BaseModel):
    """Base event model for the platform."""
    
    schema_version: str = Field(default=DEFAULT_SCHEMA_VERSION, description="Event schema version")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    trace_id: str = Field(..., description="OpenTelemetry trace ID")
    span_id: str = Field(..., description="OpenTelemetry span ID")
    name: EventName = Field(..., description="Event name")
    level: EventLevel = Field(default=EventLevel.INFO, description="Event level")
    agent_id: str = Field(..., description="Agent identifier")
    session_id: Optional[str] = Field(default=None, description="Session identifier")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Event-specific attributes")
    
    def model_post_init(self, _context: Any) -> None:
        """Post-initialization to enrich with system information."""
        system_info = get_cached_system_info()
        self.attributes.update(system_info)