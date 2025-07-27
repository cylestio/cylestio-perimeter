"""Core LLM middleware with interceptor support."""
import json
import time
from typing import Any, Callable, Dict, List, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

logger = get_logger(__name__)


class LLMMiddleware(BaseHTTPMiddleware):
    """Core middleware that handles LLM request/response detection and runs interceptors."""
    
    def __init__(self, app, **kwargs):
        """Initialize LLM middleware with interceptors.
        
        Args:
            app: FastAPI application
            **kwargs: Contains 'interceptors' key with list of interceptor instances
        """
        super().__init__(app)
        interceptors = kwargs.get('interceptors', [])
        self.interceptors = [i for i in interceptors if i.enabled]
        logger.info(f"LLM Middleware initialized with {len(self.interceptors)} interceptors")
        
        for interceptor in self.interceptors:
            logger.info(f"  - {interceptor.name}: enabled")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through interceptor chain.
        
        Args:
            request: Incoming request
            call_next: Next middleware or endpoint
            
        Returns:
            Response object
        """
        # Skip non-proxy requests (health, metrics, config)
        if request.url.path in ["/health", "/metrics", "/config"]:
            return await call_next(request)
        
        start_time = time.time()
        
        # Parse and analyze request
        request_data = await self._create_request_data(request)
        
        if not request_data:
            # Not an LLM request, pass through
            return await call_next(request)
        
        logger.debug(f"Processing LLM request: {request.method} {request.url.path}")
        
        try:
            # Run before_request interceptors
            for interceptor in self.interceptors:
                try:
                    modified_data = await interceptor.before_request(request_data)
                    if modified_data:
                        request_data = modified_data
                except Exception as e:
                    logger.error(f"Error in {interceptor.name}.before_request: {e}", exc_info=True)
            
            # Process the request
            response = await call_next(request_data.request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Create response data
            response_data = await self._create_response_data(response, duration_ms, request_data.session_id)
            
            # Run after_response interceptors
            for interceptor in self.interceptors:
                try:
                    modified_response = await interceptor.after_response(request_data, response_data)
                    if modified_response:
                        response_data = modified_response
                except Exception as e:
                    logger.error(f"Error in {interceptor.name}.after_response: {e}", exc_info=True)
            
            return response_data.response
            
        except Exception as e:
            logger.error(f"Error processing LLM request: {e}", exc_info=True)
            
            # Run error interceptors
            for interceptor in self.interceptors:
                try:
                    await interceptor.on_error(request_data, e)
                except Exception as ie:
                    logger.error(f"Error in {interceptor.name}.on_error: {ie}", exc_info=True)
            
            # Re-raise the original error
            raise
    
    async def _create_request_data(self, request: Request) -> Optional[LLMRequestData]:
        """Parse request and create LLMRequestData.
        
        Args:
            request: FastAPI request object
            
        Returns:
            LLMRequestData or None if not an LLM request
        """
        try:
            # Get request body
            body_bytes = await request.body()
            body = None
            is_streaming = False
            
            if body_bytes and request.headers.get("content-type", "").startswith("application/json"):
                try:
                    body = json.loads(body_bytes)
                    is_streaming = body.get("stream", False) is True
                except json.JSONDecodeError:
                    logger.warning("Failed to parse request body as JSON")
                    return None
            
            # Session information will be populated by Cylestio interceptor
            session_id = None
            provider = None
            model = None
            
            # Create request data
            return LLMRequestData(
                request=request,
                body=body,
                is_streaming=is_streaming,
                session_id=session_id,
                provider=provider,
                model=model
            )
            
        except Exception as e:
            logger.error(f"Error creating request data: {e}", exc_info=True)
            return None
    
    async def _create_response_data(
        self, 
        response: Response, 
        duration_ms: float, 
        session_id: Optional[str]
    ) -> LLMResponseData:
        """Parse response and create LLMResponseData.
        
        Args:
            response: FastAPI response object
            duration_ms: Request duration in milliseconds
            session_id: Session ID from request
            
        Returns:
            LLMResponseData
        """
        body = None
        
        # Try to parse response body if it's JSON
        if hasattr(response, 'body') and response.headers.get("content-type", "").startswith("application/json"):
            try:
                body = json.loads(response.body)
            except (json.JSONDecodeError, AttributeError):
                logger.debug("Could not parse response body as JSON")
        
        return LLMResponseData(
            response=response,
            body=body,
            duration_ms=duration_ms,
            session_id=session_id,
            status_code=response.status_code
        )
    
    def _is_llm_request(self, request: Request) -> bool:
        """Check if request is for LLM processing.
        
        Args:
            request: Request object
            
        Returns:
            True if this is an LLM request
        """
        # Skip health, metrics, and config endpoints
        if request.url.path in ["/health", "/metrics", "/config"]:
            return False
        
        # For now, assume all other requests are LLM requests
        # You could add more sophisticated detection here
        return True