"""Core LLM middleware with interceptor support."""
import json
import time
from typing import Any, Callable, Dict, List, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.proxy.session import SessionDetector
from src.utils.logger import get_logger

logger = get_logger(__name__)


class LLMMiddleware(BaseHTTPMiddleware):
    """Core middleware that handles LLM request/response detection and runs interceptors."""
    
    def __init__(self, app, **kwargs):
        """Initialize LLM middleware with interceptors and session management.
        
        Args:
            app: FastAPI application
            **kwargs: Contains 'interceptors' and 'session_config' keys
        """
        super().__init__(app)
        interceptors = kwargs.get('interceptors', [])
        self.interceptors = [i for i in interceptors if i.enabled]
        
        # Initialize session detector with configuration
        session_config = kwargs.get('session_config')
        if session_config:
            from src.proxy.session.manager import SessionManager
            session_manager = SessionManager(
                max_sessions=session_config.get('max_sessions', 10000),
                session_ttl_seconds=session_config.get('session_ttl_seconds', 3600),
                enable_fuzzy_matching=session_config.get('enable_fuzzy_matching', True),
                similarity_threshold=session_config.get('similarity_threshold', 0.85)
            )
            self.session_detector = SessionDetector(session_manager)
        else:
            self.session_detector = None
        
        logger.info(f"LLM Middleware initialized with {len(self.interceptors)} interceptors")
        if self.session_detector:
            logger.info("  - Session detection: enabled")
        else:
            logger.info("  - Session detection: disabled")
        
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
            
            # For JSON responses, capture the body before sending
            response_body = None
            if response.headers.get("content-type", "").startswith("application/json"):
                # Read the response body
                body_bytes = b""
                async for chunk in response.body_iterator:
                    body_bytes += chunk
                
                # Parse JSON
                try:
                    response_body = json.loads(body_bytes.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    logger.debug("Failed to parse response body as JSON")
                
                # Create new response with the same body
                response = Response(
                    content=body_bytes,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
            
            # Create response data with parsed body
            response_data = LLMResponseData(
                response=response,
                body=response_body,
                duration_ms=duration_ms,
                session_id=request_data.session_id,
                status_code=response.status_code
            )
            
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
            
            # Extract model from request body first
            model = body.get("model") if body else None
            
            # Detect session information using core platform session detection
            session_id = None
            provider = None
            
            # Enrich the LLMRequestData with session information
            if self.session_detector:
                try:
                    session_info = await self.session_detector.analyze_request(request)
                    if session_info:
                        session_id = session_info.get("session_id")
                        provider = session_info.get("provider")
                        # Use model from session detection if not found in body
                        if not model and session_info.get("model"):
                            model = session_info["model"]
                        # Also update streaming info if available
                        if session_info.get("is_streaming") is not None:
                            is_streaming = session_info["is_streaming"]
                except Exception as e:
                    logger.debug(f"Failed to analyze session: {e}")

            # TODO: Event Data
            
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