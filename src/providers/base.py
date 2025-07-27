"""Base provider interface for session detection."""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Tuple

from fastapi import Request


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
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name identifier."""
        pass
    
    @abstractmethod
    def can_handle(self, request: Request) -> bool:
        """Check if this provider can handle the request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            True if provider can handle this request
        """
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