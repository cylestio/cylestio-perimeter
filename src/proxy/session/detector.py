"""Session detection utility for LLM conversations."""
import asyncio
import json
from typing import Any, Dict, Optional

from fastapi import Request

from src.providers.base import BaseProvider, SessionInfo
from src.utils.logger import get_logger
from .manager import SessionManager

logger = get_logger(__name__)


class SessionDetector:
    """Detects and tracks LLM conversation sessions."""
    
    def __init__(self, provider: BaseProvider, session_manager: Optional[SessionManager] = None):
        """Initialize session detector with a provider.
        
        Args:
            provider: The provider instance to use for session detection
            session_manager: Optional session manager, creates default if not provided
        """
        self.provider = provider
        # Use provided session manager or create default one
        self._session_manager = session_manager or SessionManager(
            max_sessions=10000,
            session_ttl_seconds=3600
        )
    
    async def analyze_request(self, request: Request) -> Optional[Dict[str, Any]]:
        """Analyze request for session information using the configured provider.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Dictionary with session info or None if no session detected
        """
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
        
        # Get session info from the configured provider
        session_info = await self.provider.detect_session_info(request, body)
        
        # Debug logging (can be enabled for troubleshooting)
        logger.debug(f"Session analysis: conversation_id={session_info.conversation_id}, "
                    f"is_start={session_info.is_session_start}, "
                    f"message_count={session_info.message_count}")
        
        # Determine session ID based on provider's session detection
        session_id, is_new_session = self._determine_session(request, body, session_info)
        
        # Prepare session info result
        result = {
            "session_id": session_id,
            "is_new_session": is_new_session,
            "provider": self.provider.name,
            "conversation_id": session_info.conversation_id,
            "model": session_info.model,
            "is_streaming": session_info.is_streaming,
            "message_count": session_info.message_count,
            "client_info": self._extract_client_info(request),
            "method": request.method,
            "url": str(request.url)
        }
        
        return result
    
    def _determine_session(self, request: Request, body: Dict[str, Any], session_info: SessionInfo) -> tuple[str, bool]:
        """Determine session ID and whether it's new, delegating provider-specific logic to the provider.
        
        Args:
            request: FastAPI request object
            body: Parsed request body
            session_info: Session information from provider
            
        Returns:
            Tuple of (session_id, is_new_session)
        """
        # For provider-specific stateful detection, use provider's conversation_id when appropriate
        if session_info.conversation_id and not session_info.is_session_start:
            # Provider indicates this is a continuing session
            return session_info.conversation_id, False
        
        # Use traditional SessionManager detection for regular message-based sessions
        messages = body.get("messages", [])
        system_prompt = body.get("system")
        metadata = {
            "provider": self.provider.name,
            "conversation_id": session_info.conversation_id,
            "model": session_info.model,
            "client_info": self._extract_client_info(request)
        }
        
        return self._session_manager.detect_session(
            messages=messages,
            system_prompt=system_prompt,
            metadata=metadata
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
    


def initialize_session_detector(
    provider: BaseProvider, 
    config: Optional[Dict[str, Any]] = None
) -> SessionDetector:
    """Initialize a session detector with a provider and optional configuration.
    
    Args:
        provider: The provider instance to use for session detection
        config: Session configuration dictionary
        
    Returns:
        Configured SessionDetector instance
    """
    if config:
        # Extract session manager configuration
        session_manager = SessionManager(
            max_sessions=config.get("max_sessions", 10000),
            session_ttl_seconds=config.get("session_ttl_seconds", 3600)
        )
        
        return SessionDetector(provider=provider, session_manager=session_manager)
    else:
        # Use default configuration
        return SessionDetector(provider=provider)