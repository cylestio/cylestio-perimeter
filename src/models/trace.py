"""Data models for request/response tracing."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class RequestTrace(BaseModel):
    """Request trace data."""
    
    method: str
    url: str
    headers: Dict[str, str]
    body: Optional[Any] = None
    query_params: Optional[Dict[str, str]] = None


class ResponseTrace(BaseModel):
    """Response trace data."""
    
    status_code: int
    headers: Dict[str, str]
    body: Optional[Any] = None
    chunks: Optional[List[str]] = Field(default_factory=list, description="For streaming responses")
    is_streaming: bool = False


class TraceData(BaseModel):
    """Complete trace data for a request/response cycle."""
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request: RequestTrace
    response: ResponseTrace
    duration_ms: float
    trace_id: str = Field(description="Unique trace identifier")
    
    def to_file_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for file storage."""
        data = self.model_dump()
        # Convert datetime to ISO format string
        data["timestamp"] = self.timestamp.isoformat()
        return data