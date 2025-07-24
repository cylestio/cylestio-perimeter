"""Tracing middleware for request/response logging."""
import asyncio
import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message

from src.config.settings import MiddlewareConfig
from src.models.trace import RequestTrace, ResponseTrace, TraceData
from src.utils.logger import get_logger

logger = get_logger(__name__)


class TraceMiddleware(BaseHTTPMiddleware):
    """Middleware for tracing requests and responses."""
    
    def __init__(self, app, config: Dict[str, Any]):
        """Initialize trace middleware.
        
        Args:
            app: FastAPI application
            config: Middleware configuration
        """
        super().__init__(app)
        self.config = config
        self.trace_dir = Path(config.get("directory", "./traces"))
        self.include_headers = config.get("include_headers", True)
        self.include_body = config.get("include_body", True)
        self.max_body_size = config.get("max_body_size", 1048576)  # 1MB default
        
        # Create trace directory if it doesn't exist
        self.trace_dir.mkdir(parents=True, exist_ok=True)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and response for tracing.
        
        Args:
            request: Incoming request
            call_next: Next middleware or endpoint
            
        Returns:
            Response object
        """
        # Skip tracing for health checks
        if request.url.path == "/health":
            return await call_next(request)
        
        # Generate trace ID
        trace_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Capture request data
        request_trace = await self._capture_request(request)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Handle streaming vs regular responses
        if isinstance(response, StreamingResponse):
            # For streaming responses, we need to intercept the stream
            response = await self._handle_streaming_response(
                response, request_trace, trace_id, start_time
            )
        else:
            # For regular responses, capture the response data
            response_trace = await self._capture_response(response)
            
            # Create and save trace data
            trace_data = TraceData(
                trace_id=trace_id,
                request=request_trace,
                response=response_trace,
                duration_ms=duration_ms
            )
            
            await self._save_trace(trace_data)
        
        return response
    
    async def _capture_request(self, request: Request) -> RequestTrace:
        """Capture request data for tracing.
        
        Args:
            request: FastAPI request object
            
        Returns:
            RequestTrace object
        """
        # Get headers
        headers = dict(request.headers) if self.include_headers else {}
        
        # Get body
        body = None
        if self.include_body:
            body_bytes = await request.body()
            if body_bytes and len(body_bytes) <= self.max_body_size:
                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        body = json.loads(body_bytes)
                    except json.JSONDecodeError:
                        body = body_bytes.decode("utf-8", errors="ignore")
                else:
                    body = body_bytes.decode("utf-8", errors="ignore")
        
        # Get query params
        query_params = dict(request.query_params) if request.query_params else None
        
        return RequestTrace(
            method=request.method,
            url=str(request.url),
            headers=headers,
            body=body,
            query_params=query_params
        )
    
    async def _capture_response(self, response: Response) -> ResponseTrace:
        """Capture response data for tracing.
        
        Args:
            response: FastAPI response object
            
        Returns:
            ResponseTrace object
        """
        # Get headers
        headers = dict(response.headers) if self.include_headers else {}
        
        # Get body
        body = None
        if self.include_body and hasattr(response, "body"):
            body_bytes = response.body
            if body_bytes and len(body_bytes) <= self.max_body_size:
                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        body = json.loads(body_bytes)
                    except json.JSONDecodeError:
                        body = body_bytes.decode("utf-8", errors="ignore")
                else:
                    body = body_bytes.decode("utf-8", errors="ignore")
        
        return ResponseTrace(
            status_code=response.status_code,
            headers=headers,
            body=body,
            is_streaming=False
        )
    
    async def _handle_streaming_response(
        self,
        response: StreamingResponse,
        request_trace: RequestTrace,
        trace_id: str,
        start_time: float
    ) -> StreamingResponse:
        """Handle tracing for streaming responses.
        
        Args:
            response: Streaming response object
            request_trace: Captured request data
            trace_id: Unique trace ID
            start_time: Request start time
            
        Returns:
            Modified streaming response
        """
        chunks = []
        
        async def trace_stream():
            """Intercept and trace streaming chunks."""
            async for chunk in response.body_iterator:
                # Capture chunk if body tracing is enabled
                if self.include_body and len(chunks) < 100:  # Limit chunks stored
                    chunks.append(chunk.decode("utf-8", errors="ignore"))
                yield chunk
            
            # After streaming is complete, save the trace
            duration_ms = (time.time() - start_time) * 1000
            
            response_trace = ResponseTrace(
                status_code=response.status_code,
                headers=dict(response.headers) if self.include_headers else {},
                chunks=chunks,
                is_streaming=True
            )
            
            trace_data = TraceData(
                trace_id=trace_id,
                request=request_trace,
                response=response_trace,
                duration_ms=duration_ms
            )
            
            await self._save_trace(trace_data)
        
        # Return new streaming response with tracing
        return StreamingResponse(
            trace_stream(),
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )
    
    async def _save_trace(self, trace_data: TraceData) -> None:
        """Save trace data to file.
        
        Args:
            trace_data: Trace data to save
        """
        try:
            # Generate filename with timestamp
            timestamp = trace_data.timestamp.strftime("%Y-%m-%dT%H-%M-%S-%f")[:-3] + "Z"
            filename = f"trace-{timestamp}.json"
            filepath = self.trace_dir / filename
            
            # Convert to dict and save
            trace_dict = trace_data.to_file_dict()
            
            # Write to file asynchronously
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: filepath.write_text(json.dumps(trace_dict, indent=2))
            )
            
            logger.debug(f"Trace saved: {filename}", extra={"trace_id": trace_data.trace_id})
            
        except Exception as e:
            logger.error(f"Failed to save trace: {str(e)}", exc_info=True)