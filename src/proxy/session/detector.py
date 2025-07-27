"""Session detection utility for LLM conversations."""
import asyncio
import json
import uuid
from typing import Any, Dict, Optional

from fastapi import Request

from src.models.events import EventType, MonitoringEvent, LLMEvent
from src.providers.registry import registry
from src.providers.base import SessionInfo
from src.utils.logger import get_logger
from .manager import SessionManager

logger = get_logger(__name__)


class SessionDetector:
    """Detects and tracks LLM conversation sessions."""
    
    def __init__(self, session_manager: Optional[SessionManager] = None):
        # Use provided session manager or create default one
        self._session_manager = session_manager or SessionManager(
            max_sessions=10000,
            session_ttl_seconds=3600,
            enable_fuzzy_matching=True,
            similarity_threshold=0.85
        )
        self._active_sessions: Dict[str, Dict[str, Any]] = {}
    
    async def analyze_request(self, request: Request, trace_id: str) -> tuple[Optional[MonitoringEvent], Optional[LLMEvent]]:
        """Analyze request for session and LLM events.
        
        Args:
            request: FastAPI request object
            trace_id: Trace identifier
            
        Returns:
            Tuple of (monitoring_event, llm_event) or (None, None)
        """
        # Get provider for this request
        provider = registry.get_provider(request)
        if not provider:
            logger.debug(f"No provider found for request: {request.url.path}")
            return None, None
        
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
                return None, None
            
            body = json.loads(body_bytes) if body_bytes else {}
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to parse request body: {e}")
            return None, None
        
        # Get session info from provider
        session_info = await provider.detect_session_info(request, body)
        
        # Debug logging (can be enabled for troubleshooting)
        logger.debug(f"Session analysis: conversation_id={session_info.conversation_id}, "
                    f"is_start={session_info.is_session_start}, "
                    f"message_count={session_info.message_count}")
        
        # Use SessionManager to detect session
        messages = body.get("messages", [])
        system_prompt = body.get("system")
        metadata = {
            "provider": provider.name,
            "conversation_id": session_info.conversation_id,
            "model": session_info.model,
            "client_info": self._extract_client_info(request)
        }
        
        session_id, is_new_session = self._session_manager.detect_session(
            messages=messages,
            system_prompt=system_prompt,
            metadata=metadata
        )
        
        # Create events
        monitoring_event = None
        llm_event = None
        
        # Create monitoring event if new session
        if is_new_session:
            monitoring_event = MonitoringEvent(
                event_type=EventType.MONITORING_START,
                session_id=session_id,
                provider=provider.name,
                trace_id=trace_id,
                client_info=self._extract_client_info(request),
                conversation_id=session_info.conversation_id,
                message_count=session_info.message_count,
                model=session_info.model
            )
            
            # Track session in our local cache for compatibility
            self._active_sessions[session_id] = {
                "provider": provider.name,
                "conversation_id": session_info.conversation_id,
                "model": session_info.model,
                "start_time": monitoring_event.timestamp,
                "message_count": session_info.message_count
            }
            
            logger.debug(f"Session started: {session_id} ({provider.name})")
        
        # Always create LLM event for API calls
        llm_event = LLMEvent(
            event_type=EventType.LLM_CALL_START,
            session_id=session_id,
            provider=provider.name,
            trace_id=trace_id,
            method=request.method,
            url=str(request.url),
            model=session_info.model,
            is_streaming=session_info.is_streaming
        )
        
        return monitoring_event, llm_event
    
    def create_session_end_event(self, session_id: str, trace_id: str, success: bool = True) -> Optional[MonitoringEvent]:
        """Create session end event.
        
        Args:
            session_id: Session identifier
            trace_id: Trace identifier
            success: Whether session ended successfully
            
        Returns:
            MonitoringEvent for session end or None
        """
        if session_id not in self._active_sessions:
            return None
        
        session_data = self._active_sessions.pop(session_id)
        
        event = MonitoringEvent(
            event_type=EventType.MONITORING_STOP,
            session_id=session_id,
            provider=session_data["provider"],
            trace_id=trace_id,
            conversation_id=session_data["conversation_id"],
            model=session_data["model"]
        )
        
        logger.debug(f"Session ended: {session_id} ({'success' if success else 'error'})")
        return event
    
    def create_llm_finish_event(self, session_id: str, trace_id: str, status_code: int, duration_ms: float, 
                               provider: str, tokens_used: Optional[int] = None) -> LLMEvent:
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
        return self._session_manager.get_metrics()
    


# Global instance (will be initialized with config)
session_detector: Optional[SessionDetector] = None


def initialize_session_detector(config: Optional[Dict[str, Any]] = None) -> SessionDetector:
    """Initialize or reconfigure the global session detector.
    
    Args:
        config: Session configuration dictionary
        
    Returns:
        Configured SessionDetector instance
    """
    global session_detector
    
    if config:
        # Extract session manager configuration
        session_manager = SessionManager(
            max_sessions=config.get("max_sessions", 10000),
            session_ttl_seconds=config.get("session_ttl_seconds", 3600),
            enable_fuzzy_matching=config.get("enable_fuzzy_matching", True),
            similarity_threshold=config.get("similarity_threshold", 0.85)
        )
        
        # Update reset phrases if provided
        if "reset_phrases" in config:
            # This would require adding a method to SessionManager to update reset phrases
            # For now, we'll use the default ones
            pass
        
        session_detector = SessionDetector(session_manager=session_manager)
    else:
        # Use default configuration
        session_detector = SessionDetector()
    
    return session_detector


# Initialize with defaults on import
session_detector = initialize_session_detector()