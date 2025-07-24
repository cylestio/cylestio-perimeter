"""Printer middleware for displaying request/response information."""
import json
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.utils.logger import get_logger

logger = get_logger(__name__)


class PrinterMiddleware(BaseHTTPMiddleware):
    """Middleware for printing request/response information to console."""
    
    def __init__(self, app, config: dict):
        """Initialize printer middleware.
        
        Args:
            app: FastAPI application
            config: Middleware configuration
        """
        super().__init__(app)
        self.config = config
        self.log_requests = config.get("log_requests", True)
        self.log_responses = config.get("log_responses", True)
        self.log_body = config.get("log_body", False)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and response for printing.
        
        Args:
            request: Incoming request
            call_next: Next middleware or endpoint
            
        Returns:
            Response object
        """
        # Skip printing for health checks
        if request.url.path == "/health":
            return await call_next(request)
        
        start_time = time.time()
        
        # Log request
        if self.log_requests:
            await self._log_request(request)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Log response
        if self.log_responses:
            self._log_response(response, duration_ms)
        
        return response
    
    async def _log_request(self, request: Request) -> None:
        """Log request information.
        
        Args:
            request: FastAPI request object
        """
        log_data = {
            "method": request.method,
            "path": request.url.path,
            "query": str(request.url.query) if request.url.query else None,
        }
        
        if self.log_body:
            body = await request.body()
            if body:
                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        log_data["body"] = json.loads(body)
                    except json.JSONDecodeError:
                        log_data["body"] = body.decode("utf-8", errors="ignore")
                else:
                    log_data["body"] = f"<{len(body)} bytes>"
        
        logger.info(f"→ Request: {request.method} {request.url.path}", extra=log_data)
    
    def _log_response(self, response: Response, duration_ms: float) -> None:
        """Log response information.
        
        Args:
            response: FastAPI response object
            duration_ms: Request duration in milliseconds
        """
        log_data = {
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }
        
        logger.info(
            f"← Response: {response.status_code} ({duration_ms:.2f}ms)",
            extra=log_data
        )