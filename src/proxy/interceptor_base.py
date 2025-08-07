"""Base interceptor interface for the new middleware system."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from fastapi import Request, Response

class LLMRequestData:
    """Container for parsed LLM request data."""
    
    def __init__(
        self,
        request: Request,
        body: Optional[Dict[str, Any]] = None,
        is_streaming: bool = False,
        session_id: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        is_new_session: bool = False,
        tool_results: Optional[List[Dict[str, Any]]] = None,
        events: Optional[List[Any]] = None
    ):
        self.request = request
        self.body = body
        self.is_streaming = is_streaming
        self.session_id = session_id
        self.provider = provider
        self.model = model
        self.is_new_session = is_new_session
        self.metadata: Dict[str, Any] = {}
        
        # Set tool information from parsed data
        self.tool_results = tool_results or []
        self.has_tool_results = bool(self.tool_results)
        
        # Set events from parsed data
        self.events = events or []
    

class LLMResponseData:
    """Container for parsed LLM response data."""
    
    def __init__(
        self,
        response: Response,
        body: Optional[Dict[str, Any]] = None,
        duration_ms: float = 0.0,
        session_id: Optional[str] = None,
        status_code: int = 200,
        tool_uses_request: Optional[List[Dict[str, Any]]] = None,
        events: Optional[List[Any]] = None
    ):
        self.response = response
        self.body = body
        self.duration_ms = duration_ms
        self.session_id = session_id
        self.status_code = status_code
        self.metadata: Dict[str, Any] = {}
        
        # Set tool information from parsed data
        self.tool_uses_request = tool_uses_request or []
        self.has_tool_requests = bool(self.tool_uses_request)
        
        # Set events from parsed data
        self.events = events or []
    

class BaseInterceptor(ABC):
    """Base class for all interceptors."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize interceptor with configuration.
        
        Args:
            config: Interceptor configuration dictionary
        """
        self.config = config
        self.enabled = config.get("enabled", True)
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the name of this interceptor."""
        pass
    
    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Called before request is sent to LLM provider.
        
        Args:
            request_data: Container with request information
            
        Returns:
            Modified request_data or None to continue with original
        """
        return None
    
    async def after_response(self, request_data: LLMRequestData, response_data: LLMResponseData) -> Optional[LLMResponseData]:
        """Called after response is received from LLM provider.
        
        Args:
            request_data: Original request data
            response_data: Container with response information
            
        Returns:
            Modified response_data or None to continue with original
        """
        return None
    
    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Called when an error occurs during request processing.
        
        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        pass