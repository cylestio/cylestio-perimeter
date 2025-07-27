"""Cylestio session management interceptor."""
import asyncio
import json
import time
import uuid
from typing import Any, Dict, Optional

from fastapi import Request

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.models.events import EventType, MonitoringEvent, LLMEvent
from src.providers.registry import registry
from src.providers.base import SessionInfo
from src.utils.logger import get_logger
from .session_manager import SessionManager

logger = get_logger(__name__)


class CylestioSessionInterceptor(BaseInterceptor):
    """Smart interceptor that handles session detection and management for Cylestio."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Cylestio session interceptor.
        
        Args:
            config: Interceptor configuration
        """
        super().__init__(config)
        
        # Session manager configuration
        self._session_manager = SessionManager(
            max_sessions=config.get("max_sessions", 10000),
            session_ttl_seconds=config.get("session_ttl_seconds", 3600),
            enable_fuzzy_matching=config.get("enable_fuzzy_matching", True),
            similarity_threshold=config.get("similarity_threshold", 0.85)
        )
        
        # Track active sessions for compatibility
        self._active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Configuration options
        self.track_session_metrics = config.get("track_session_metrics", True)
        self.include_client_info = config.get("include_client_info", True)
        self.log_session_events = config.get("log_session_events", True)
    
    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "cylestio_session"
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Detect session information and attach to request metadata.
        
        Args:
            request_data: Request data container
            
        Returns:
            Modified request data with session information
        """
        try:
            # Generate trace ID for this request
            trace_id = str(uuid.uuid4())
            
            # Analyze request for session information
            session_info = await self._analyze_request(request_data.request, trace_id)
            
            if session_info:
                # Add session information to request metadata
                request_data.session_id = session_info["session_id"]
                request_data.provider = session_info["provider"]
                request_data.model = session_info["model"]
                
                # Store additional session info in metadata
                request_data.metadata.update({
                    "cylestio_session": session_info,
                    "trace_id": trace_id,
                    "session_start_time": time.time()
                })
                
                if self.log_session_events:
                    if session_info.get("is_new_session"):
                        logger.info(f"🚀 New session started: {session_info['session_id'][:8]} ({session_info['provider']})")
                    else:
                        logger.debug(f"📍 Continuing session: {session_info['session_id'][:8]}")
            
            return request_data
            
        except Exception as e:
            logger.error(f"Error in Cylestio session detection: {e}", exc_info=True)
            return request_data
    
    async def after_response(
        self, 
        request_data: LLMRequestData, 
        response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Handle session completion tracking after response.
        
        Args:
            request_data: Original request data
            response_data: Response data container
            
        Returns:
            Response data (unchanged)
        """
        try:
            session_info = request_data.metadata.get("cylestio_session")
            if not session_info:
                return response_data
            
            # Calculate tokens used if available
            tokens_used = None
            if response_data.body and "usage" in response_data.body:
                usage = response_data.body["usage"]
                tokens_used = usage.get("total_tokens")
            
            # Create LLM finish event
            trace_id = request_data.metadata.get("trace_id", "unknown")
            session_id = session_info["session_id"]
            provider = session_info["provider"]
            
            llm_finish_event = self._create_llm_finish_event(
                session_id=session_id,
                trace_id=trace_id,
                status_code=response_data.status_code,
                duration_ms=response_data.duration_ms,
                provider=provider,
                tokens_used=tokens_used
            )
            
            # Store finish event in response metadata
            response_data.metadata["llm_finish_event"] = llm_finish_event
            
            # Log completion
            if self.log_session_events:
                status_emoji = "✅" if 200 <= response_data.status_code < 300 else "❌"
                logger.debug(f"{status_emoji} LLM call completed: {session_id[:8]} ({response_data.duration_ms:.0f}ms)")
                if tokens_used:
                    logger.debug(f"   Tokens used: {tokens_used}")
            
            return response_data
            
        except Exception as e:
            logger.error(f"Error in Cylestio session response handling: {e}", exc_info=True)
            return response_data
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Handle session error tracking.
        
        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        try:
            session_info = request_data.metadata.get("cylestio_session")
            if session_info and self.log_session_events:
                session_id = session_info["session_id"]
                logger.error(f"🔴 Session error: {session_id[:8]} - {type(error).__name__}: {str(error)}")
        except Exception as e:
            logger.error(f"Error in Cylestio session error handling: {e}", exc_info=True)
    
    async def _analyze_request(self, request: Request, trace_id: str) -> Optional[Dict[str, Any]]:
        """Analyze request for session and LLM information.
        
        Args:
            request: FastAPI request object
            trace_id: Trace identifier
            
        Returns:
            Dictionary with session information or None
        """
        # Get provider for this request
        provider = registry.get_provider(request)
        if not provider:
            logger.debug(f"No provider found for request: {request.url.path}")
            return None
        
        # Parse request body
        try:
            # Handle both real requests and mocks
            if hasattr(request.body, '__call__'):
                if asyncio.iscoroutinefunction(request.body):
                    body_bytes = await request.body()
                else:
                    body_bytes = request.body()
            else:
                body_bytes = request.body
            
            if not body_bytes:
                return None
            
            body = json.loads(body_bytes) if body_bytes else {}
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to parse request body: {e}")
            return None
        
        # Get session info from provider
        session_info = await provider.detect_session_info(request, body)
        
        # Use SessionManager to detect session
        messages = body.get("messages", [])
        system_prompt = body.get("system")
        metadata = {
            "provider": provider.name,
            "conversation_id": session_info.conversation_id,
            "model": session_info.model,
            "client_info": self._extract_client_info(request) if self.include_client_info else {}
        }
        
        session_id, is_new_session = self._session_manager.detect_session(
            messages=messages,
            system_prompt=system_prompt,
            metadata=metadata
        )
        
        # Track session in our local cache
        if is_new_session:
            self._active_sessions[session_id] = {
                "provider": provider.name,
                "conversation_id": session_info.conversation_id,
                "model": session_info.model,
                "start_time": time.time(),
                "message_count": session_info.message_count
            }
        
        return {
            "session_id": session_id,
            "provider": provider.name,
            "model": session_info.model,
            "conversation_id": session_info.conversation_id,
            "message_count": session_info.message_count,
            "is_streaming": session_info.is_streaming,
            "is_new_session": is_new_session,
            "trace_id": trace_id,
            "client_info": self._extract_client_info(request) if self.include_client_info else {}
        }
    
    def _create_llm_finish_event(
        self, 
        session_id: str, 
        trace_id: str, 
        status_code: int, 
        duration_ms: float, 
        provider: str, 
        tokens_used: Optional[int] = None
    ) -> LLMEvent:
        """Create LLM call finish event.
        
        Args:
            session_id: Session identifier
            trace_id: Trace identifier
            status_code: HTTP status code
            duration_ms: Request duration in milliseconds
            provider: Provider name
            tokens_used: Number of tokens used
            
        Returns:
            LLMEvent for call completion
        """
        event_type = EventType.LLM_CALL_FINISH if 200 <= status_code < 300 else EventType.LLM_CALL_ERROR
        
        return LLMEvent(
            event_type=event_type,
            session_id=session_id,
            provider=provider,
            trace_id=trace_id,
            method="",  # Not available in response
            url="",     # Not available in response
            status_code=status_code,
            duration_ms=duration_ms,
            response_tokens=tokens_used
        )
    
    def _extract_client_info(self, request: Request) -> Dict[str, Any]:
        """Extract client information from request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Dictionary of client information
        """
        client_info = {}
        
        # Client address
        if hasattr(request, 'client') and request.client:
            client_info["ip"] = request.client.host
            client_info["port"] = request.client.port
        
        # User agent
        user_agent = request.headers.get("user-agent")
        if user_agent:
            client_info["user_agent"] = user_agent
        
        # API key hint (first/last few chars for debugging)
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            key = auth_header[7:]
            if len(key) > 10:
                client_info["api_key_hint"] = f"{key[:4]}...{key[-4:]}"
        
        return client_info
    
    def get_session_metrics(self) -> Dict[str, Any]:
        """Get metrics from the session manager.
        
        Returns:
            Dictionary of session metrics
        """
        if self.track_session_metrics:
            return self._session_manager.get_metrics()
        return {}
    
    def get_active_sessions(self) -> Dict[str, Dict[str, Any]]:
        """Get currently active sessions.
        
        Returns:
            Dictionary of active sessions
        """
        return self._active_sessions.copy()