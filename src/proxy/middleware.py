"""Core LLM middleware with interceptor support."""
import json
import time
from typing import Any, Callable, Dict, List, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.proxy.session import SessionDetector
from src.proxy.tools import ToolParser
from src.providers.base import BaseProvider
from src.utils.logger import get_logger

logger = get_logger(__name__)


class LLMMiddleware(BaseHTTPMiddleware):
    """Core middleware that handles LLM request/response detection and runs interceptors."""
    
    def __init__(self, app, provider: BaseProvider, **kwargs):
        """Initialize LLM middleware with provider, interceptors and session management.
        
        Args:
            app: FastAPI application
            provider: The provider instance for this middleware
            **kwargs: Contains 'interceptors' and 'session_config' keys
        """
        super().__init__(app)
        self.provider = provider
        interceptors = kwargs.get('interceptors', [])
        self.interceptors = [i for i in interceptors if i.enabled]
        
        # Initialize tool parser
        self.tool_parser = ToolParser()
        
        # Initialize session detector with provider and configuration
        session_config = kwargs.get('session_config')
        if session_config:
            from src.proxy.session.manager import SessionManager
            session_manager = SessionManager(
                max_sessions=session_config.get('max_sessions', 10000),
                session_ttl_seconds=session_config.get('session_ttl_seconds', 3600),
            )
            self.session_detector = SessionDetector(provider, session_manager)
        else:
            self.session_detector = SessionDetector(provider)
        
        logger.info(f"LLM Middleware initialized with {len(self.interceptors)} interceptors")
        logger.info(f"  - Provider: {self.provider.name}")
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
            
            # Parse tool information from response
            tool_uses_request = self.tool_parser.parse_tool_requests(response_body, request_data.provider)
            
            # Extract events from response using provider
            response_events = []
            if request_data.session_id and response_body:
                try:
                    # Get metadata from request state
                    request_metadata = {
                        'cylestio_trace_span_id': getattr(request_data.request.state, 'cylestio_trace_span_id', None),
                        'agent_id': getattr(request_data.request.state, 'agent_id', 'unknown'),
                        'model': getattr(request_data.request.state, 'model', request_data.model or 'unknown')
                    }
                    
                    response_events = self.provider.extract_response_events(
                        response_body=response_body,
                        session_id=request_data.session_id,
                        duration_ms=duration_ms,
                        tool_uses=tool_uses_request,
                        request_metadata=request_metadata
                    )
                except Exception as e:
                    logger.debug(f"Error extracting response events: {e}")
            
            # Create response data with parsed body
            response_data = LLMResponseData(
                response=response,
                body=response_body,
                duration_ms=duration_ms,
                session_id=request_data.session_id,
                status_code=response.status_code,
                tool_uses_request=tool_uses_request,
                events=response_events
            )
            
            # Run after_response interceptors
            for interceptor in self.interceptors:
                try:
                    modified_response = await interceptor.after_response(request_data, response_data)
                    if modified_response:
                        response_data = modified_response
                except Exception as e:
                    logger.error(f"Error in {interceptor.name}.after_response: {e}", exc_info=True)
            
            # Notify provider of response if we have session info
            if request_data.session_id and response_body:
                try:
                    await self.provider.notify_response(
                        session_id=request_data.session_id,
                        request=request_data.request,
                        response_body=response_body
                    )
                except Exception as e:
                    logger.debug(f"Error notifying provider of response: {e}")
            
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
            
            # Extract model from request body first, then use provider if needed
            model = None
            if body:
                model = self.provider.extract_model_from_body(body)
            
            # Detect session information using provider-aware session detection
            session_id = None
            provider_name = self.provider.name
            
            # Enrich the LLMRequestData with session information
            is_new_session = False
            if self.session_detector:
                try:
                    session_info = await self.session_detector.analyze_request(request, body)
                    if session_info:
                        session_id = session_info.get("session_id")
                        is_new_session = session_info.get("is_new_session", False)
                        # Use model from session detection if not found in body
                        if not model and session_info.get("model"):
                            model = session_info["model"]
                        # Also update streaming info if available
                        if session_info.get("is_streaming") is not None:
                            is_streaming = session_info["is_streaming"]
                except Exception as e:
                    logger.debug(f"Failed to analyze session: {e}")

            # Parse tool information from request
            tool_results = self.tool_parser.parse_tool_results(body, provider_name)
            
            # Extract events from request using provider
            events = []
            if session_id and body:
                try:
                    # Get session info from session detector for event creation
                    session_info_obj = None
                    if self.session_detector and hasattr(self.session_detector, 'provider'):
                        session_info_obj = await self.session_detector.provider.detect_session_info(request, body)
                    
                    if session_info_obj:
                        events = self.provider.extract_request_events(
                            body=body,
                            session_info=session_info_obj,
                            session_id=session_id,
                            is_new_session=is_new_session,
                            tool_results=tool_results
                        )
                        
                        # Store trace/span ID and other metadata for response events
                        if events and hasattr(self.provider, '_session_to_trace_span_id'):
                            trace_span_id = self.provider._session_to_trace_span_id(session_id)
                            agent_id = self.provider._get_agent_id(body)
                            request.state.cylestio_trace_span_id = trace_span_id
                            request.state.agent_id = agent_id
                            request.state.model = model
                            
                except Exception as e:
                    logger.debug(f"Error extracting request events: {e}")
            
            # Create request data
            return LLMRequestData(
                request=request,
                body=body,
                is_streaming=is_streaming,
                session_id=session_id,
                provider=provider_name,
                model=model,
                is_new_session=is_new_session,
                tool_results=tool_results,
                events=events
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
