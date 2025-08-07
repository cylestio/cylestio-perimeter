"""Base provider interface for session detection."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Request
from src.config.settings import Settings


class SessionInfo:
    """Information about a detected session."""
    
    def __init__(
        self,
        is_session_start: bool = False,
        is_session_end: bool = False,
        conversation_id: Optional[str] = None,
        message_count: int = 0,
        model: Optional[str] = None,
        is_streaming: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.is_session_start = is_session_start
        self.is_session_end = is_session_end
        self.conversation_id = conversation_id
        self.message_count = message_count
        self.model = model
        self.is_streaming = is_streaming
        self.metadata = metadata or {}


class BaseProvider(ABC):
    """Base class for LLM provider session detection."""
    
    def __init__(self, settings: Optional[Settings] = None):
        """Initialize provider with settings.
        
        Args:
            settings: Application settings (optional for backward compatibility)
        """
        self.settings = settings
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name identifier."""
        pass
    
    @abstractmethod
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session information from request.
        
        Args:
            request: FastAPI request object
            body: Parsed request body
            
        Returns:
            SessionInfo object with session details
        """
        pass
    
    @abstractmethod
    def extract_model_from_body(self, body: Dict[str, Any]) -> Optional[str]:
        """Extract model name from request body.
        
        Args:
            body: Parsed request body
            
        Returns:
            Model name if found
        """
        pass
    
    @abstractmethod
    def extract_streaming_from_body(self, body: Dict[str, Any]) -> bool:
        """Check if request is for streaming response.
        
        Args:
            body: Parsed request body
            
        Returns:
            True if streaming is requested
        """
        pass
    
    def extract_conversation_metadata(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract additional conversation metadata.
        
        Args:
            body: Parsed request body
            
        Returns:
            Dictionary of metadata
        """
        return {}
    
    async def notify_response(self, session_id: str, request: Request, 
                            response_body: Optional[Dict[str, Any]]) -> None:
        """Notify provider of response data.
        
        Called after a response is received from the LLM API.
        Providers can use this to track response IDs or other stateful information.
        
        Args:
            session_id: The session ID associated with this request
            request: The original request object
            response_body: The parsed response body (if JSON)
        """
        pass
    
    def get_base_url(self) -> str:
        """Get the base URL for this provider.
        
        Returns:
            Base URL from settings or default
        """
        if self.settings:
            return self.settings.llm.base_url
        return ""
    
    def get_api_key(self) -> Optional[str]:
        """Get the API key for this provider.
        
        Returns:
            API key from settings if available
        """
        if self.settings:
            return self.settings.llm.api_key
        return None
    
    def extract_request_events(self, body: Dict[str, Any], session_info: SessionInfo, 
                             session_id: str, is_new_session: bool, 
                             tool_results: List[Dict[str, Any]]) -> List[Any]:
        """Extract and create events from request data.
        
        Args:
            body: Request body
            session_info: Session information
            session_id: Session identifier
            is_new_session: Whether this is a new session
            tool_results: Any tool results from request
            
        Returns:
            List of event objects to be sent
        """
        return []
    
    def extract_response_events(self, response_body: Optional[Dict[str, Any]], 
                              session_id: str, duration_ms: float, 
                              tool_uses: List[Dict[str, Any]], 
                              request_metadata: Dict[str, Any]) -> List[Any]:
        """Extract and create events from response data.
        
        Args:
            response_body: Response body
            session_id: Session identifier
            duration_ms: Response duration
            tool_uses: Any tool uses from response
            request_metadata: Metadata from request processing
            
        Returns:
            List of event objects to be sent
        """
        return []