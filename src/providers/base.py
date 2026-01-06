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
        metadata: Optional[Dict[str, Any]] = None,
        last_processed_index: int = 0
    ):
        self.is_session_start = is_session_start
        self.is_session_end = is_session_end
        self.conversation_id = conversation_id
        self.message_count = message_count
        self.model = model
        self.is_streaming = is_streaming
        self.metadata = metadata or {}
        self.last_processed_index = last_processed_index


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
    
    def parse_streaming_response(self, body_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Parse SSE streaming response into structured data.
        
        This is provider-specific as different providers use different SSE formats.
        Default implementation returns None (provider doesn't support streaming parsing).
        
        Args:
            body_bytes: Raw SSE response bytes
            
        Returns:
            Parsed response dict suitable for event extraction, or None if parsing fails
        """
        return None
    
    def extract_conversation_metadata(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract additional conversation metadata.
        
        Args:
            body: Parsed request body
            
        Returns:
            Dictionary of metadata
        """
        return {}
    
    async def create_or_get_session(self, session_id: str, body: Dict[str, Any], 
                                  metadata: Optional[Dict[str, Any]] = None) -> SessionInfo:
        """Create or get session with given ID, returning SessionInfo object."""
        # Check if session already exists
        session_record = self._session_utility.get_session_info(session_id)
        
        if session_record:
            # Continue existing session
            return SessionInfo(
                conversation_id=session_id,
                is_session_start=False,
                last_processed_index=session_record.last_processed_index,
                model=self.extract_model_from_body(body),
                is_streaming=self.extract_streaming_from_body(body),
                metadata=session_record.metadata
            )
        else:
            # Create new external session
            from datetime import datetime
            now = datetime.utcnow()
            self._session_utility._create_session(
                session_id=session_id,
                signature=f"external-{session_id}",
                messages=[],
                metadata=metadata or {}
            )
            
            return SessionInfo(
                conversation_id=session_id,
                is_session_start=True,
                last_processed_index=0,
                model=self.extract_model_from_body(body),
                is_streaming=self.extract_streaming_from_body(body),
                metadata=metadata
            )

    def get_session_info(self, session_id: str) -> Optional[SessionInfo]:
        """Get session information by ID."""
        session_record = self._session_utility.get_session_info(session_id)
        if not session_record:
            return None
        
        return SessionInfo(
            conversation_id=session_id,
            is_session_start=False,
            last_processed_index=session_record.last_processed_index,
            model=None,  # Would need to be set from context
            is_streaming=False  # Would need to be set from context
        )

    def update_session_processed_index(self, session_id: str, new_index: int) -> None:
        """Update the last processed message index for a session."""
        self._session_utility.update_processed_index(session_id, new_index)
    
    def update_session_span_id(self, session_id: str, new_span_id: str) -> None:
        """Update the last span ID for a session."""
        self._session_utility.update_span_id(session_id, new_span_id)
    
    def get_session_span_id(self, session_id: str) -> Optional[str]:
        """Get the last span ID for a session."""
        session_record = self._session_utility.get_session_info(session_id)
        if not session_record:
            return None
        return session_record.last_span_id

    def get_trace_id(self, session_id: str) -> str:
        """Get trace ID for a session (32-char hex from session_id)."""
        if not session_id:
            from src.events.base import generate_span_id
            return generate_span_id() + generate_span_id()  # 32 chars
        
        # Create deterministic ID from session ID
        import hashlib
        hash_obj = hashlib.md5(session_id.encode(), usedforsecurity=False)
        return hash_obj.hexdigest()  # 32-char hex string
    
    def generate_new_span_id(self) -> str:
        """Generate a new 16-char span ID."""
        from src.events.base import generate_span_id
        return generate_span_id()  # 16-char hex string
    
    
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
                             last_processed_index: int = 0,
                             computed_agent_id: Optional[str] = None) -> Tuple[List[Any], int]:
        """Extract and create events from request data.
        
        Args:
            body: Request body
            session_info: Session information
            session_id: Session identifier
            is_new_session: Whether this is a new session
            last_processed_index: Index of last processed message
            
        Returns:
            Tuple of (events, new_last_processed_index)
        """
        return [], last_processed_index
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Return provider-specific auth headers if applicable.
        
        Default implementation uses `get_api_key` and returns an empty dict
        when no API key is configured.
        
        Returns:
            Dict of header name to value for authentication
        """
        api_key = self.get_api_key()
        if not api_key:
            return {}
        # Base provider does not assume header format; concrete providers should override
        return {}
    
    def _get_agent_id(self, body: Dict[str, Any]) -> str:
        """Get agent ID derived from system prompt hash (calculated per request).
        
        This is a base implementation that should be overridden by concrete providers
        to handle their specific system prompt extraction logic.
        
        Args:
            body: Request body
            
        Returns:
            Agent ID string
        """
        system_prompt = self._extract_system_prompt(body)
        
        # Generate agent ID as hash of system prompt
        import hashlib
        hash_obj = hashlib.md5(system_prompt.encode(), usedforsecurity=False)
        return f"prompt-{hash_obj.hexdigest()[:12]}"
    
    def _extract_system_prompt(self, body: Dict[str, Any]) -> str:
        """Extract system prompt from request body.
        
        This is a base implementation that should be overridden by concrete providers
        to handle their specific message format.
        
        Args:
            body: Request body
            
        Returns:
            System prompt string
        """
        # Default implementation - concrete providers should override
        return "default-system"
    
    def evaluate_agent_id(self, body: Dict[str, Any], external_agent_id: Optional[str] = None) -> str:
        """Evaluate and return the appropriate agent ID for a request.
        
        This method provides a consistent interface for agent ID evaluation across
        all providers. It prioritizes external agent ID if provided, otherwise
        falls back to computed agent ID from the request body.
        
        Args:
            body: Request body
            external_agent_id: Optional external agent ID from headers
            
        Returns:
            The agent ID to use for this request
        """
        if external_agent_id:
            return external_agent_id
        return self._get_agent_id(body)
    
    def is_error_response(self, status_code: int, response_body: Optional[Dict[str, Any]]) -> bool:
        """Check if response indicates an error.

        Default implementation checks for HTTP 4xx/5xx status codes.
        Subclasses should override for provider-specific error detection.

        Args:
            status_code: HTTP status code
            response_body: Parsed response body (may be None)

        Returns:
            True if response is an error
        """
        return status_code >= 400

    def extract_error_info(self, status_code: int, response_body: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract error details from error response.

        Default implementation provides fallback for unknown error formats.
        Subclasses should override for provider-specific error extraction.

        Args:
            status_code: HTTP status code
            response_body: Parsed response body (may be None)

        Returns:
            Dict with error_type, error_message, status_code
        """
        return {
            "status_code": status_code,
            "error_type": f"http_{status_code}",
            "error_message": f"HTTP {status_code} error",
        }

    def _infer_error_type_from_status(self, status_code: int) -> str:
        """Infer error type from HTTP status code when not provided in body.

        Base implementation provides common HTTP status mappings.
        Subclasses can override for provider-specific mappings.

        Args:
            status_code: HTTP status code

        Returns:
            Error type string
        """
        status_map = {
            400: "bad_request",
            401: "authentication_error",
            403: "permission_denied",
            404: "not_found",
            429: "rate_limit_error",
            500: "server_error",
            502: "bad_gateway",
            503: "service_unavailable",
        }
        return status_map.get(status_code, f"http_{status_code}")

    def extract_response_events(self, response_body: Optional[Dict[str, Any]],
                              session_id: str, duration_ms: float,
                              tool_uses: List[Dict[str, Any]],
                              request_metadata: Dict[str, Any],
                              status_code: int = 200) -> List[Any]:
        """Extract and create events from response data.

        Args:
            response_body: Response body
            session_id: Session identifier
            duration_ms: Response duration
            tool_uses: Any tool uses from response
            request_metadata: Metadata from request processing
            status_code: HTTP status code (for error detection)

        Returns:
            List of event objects to be sent
        """
        return []