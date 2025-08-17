"""Session detection utility for LLM conversations."""
import asyncio
import json
from typing import Any, Dict, Optional

from fastapi import Request

from src.providers.base import BaseProvider, SessionInfo
from src.utils.logger import get_logger

logger = get_logger(__name__)


class SessionDetector:
    """Detects and tracks LLM conversation sessions."""
    
    def __init__(self, provider: BaseProvider):
        """Initialize session detector with a provider.
        
        Args:
            provider: The provider instance to use for session detection
        """
        self.provider = provider
    
    async def analyze_request(self, request: Request, body: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Analyze request for session information using the configured provider.
        
        Args:
            request: FastAPI request object
            body: Parsed request body if already available
            
        Returns:
            Dictionary with session info or None if no session detected
        """
        # Use provided parsed body when available to avoid duplicate parsing
        if body is None:
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
        
        # Use provider's session detection directly
        session_id = session_info.conversation_id
        is_new_session = session_info.is_session_start
        
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
            "url": str(request.url),
            "session_info_obj": session_info  # Include the full SessionInfo object
        }
        
        return result
    
    
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
    


def initialize_session_detector(
    provider: BaseProvider, 
    config: Optional[Dict[str, Any]] = None
) -> SessionDetector:
    """Initialize a session detector with a provider.
    
    Args:
        provider: The provider instance to use for session detection
        config: Session configuration dictionary (ignored, kept for backward compatibility)
        
    Returns:
        Configured SessionDetector instance
    """
    # Config is ignored since providers now handle their own session logic
    return SessionDetector(provider=provider)