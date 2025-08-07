"""Enhanced session manager for LLM conversation tracking."""
import hashlib
import time
import uuid
from collections import OrderedDict
from datetime import datetime, timedelta
from threading import RLock
from typing import Any, Dict, List, Optional, Tuple

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Configuration constants
DEFAULT_MAX_SESSIONS = 10000
DEFAULT_SESSION_TTL_SECONDS = 3600
SIGNATURE_CONTENT_MAX_CHARS = 100
SYSTEM_PROMPT_MAX_CHARS = 100


class SessionRecord:
    """Information about a tracked session."""
    
    def __init__(
        self,
        session_id: str,
        signature: str,
        created_at: datetime,
        last_accessed: datetime,
        message_count: int,
        metadata: Dict[str, Any]
    ):
        self.session_id = session_id
        self.signature = signature
        self.created_at = created_at
        self.last_accessed = last_accessed
        self.message_count = message_count
        self.metadata = metadata


class SessionManager:
    """Manages session detection and tracking using message history hashing."""
    
    def __init__(
        self,
        max_sessions: int = DEFAULT_MAX_SESSIONS,
        session_ttl_seconds: int = DEFAULT_SESSION_TTL_SECONDS
    ):
        """Initialize session manager.
        
        Args:
            max_sessions: Maximum number of sessions to track
            session_ttl_seconds: Time-to-live for sessions in seconds
        """
        self.max_sessions = max_sessions
        self.session_ttl = timedelta(seconds=session_ttl_seconds)
        
        # Thread-safe session storage
        self._lock = RLock()
        self._sessions: OrderedDict[str, SessionRecord] = OrderedDict()
        self._signature_to_session: Dict[str, str] = {}  # signature -> session_id
        
        # Metrics
        self._metrics = {
            "sessions_created": 0,
            "sessions_expired": 0,
            "cache_hits": 0,
            "cache_misses": 0
        }
    
    def detect_session(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, bool]:
        """Detect session from message history using hash-based lookup.
        
        This method implements a hash-based session detection algorithm:
        1. For first messages, create a new session
        2. For continuing conversations, look up previous conversation state
        3. Update existing session with new conversation state
        
        Args:
            messages: List of message dictionaries
            system_prompt: Optional system prompt
            metadata: Optional metadata to store with session
            
        Returns:
            Tuple of (session_id, is_new_session)
        """
        with self._lock:
            self._cleanup_expired_sessions()
            
            # Handle first message case
            if self._is_first_message(messages):
                return self._create_new_session(messages, system_prompt, metadata)
            
            # Try to find existing session for continuing conversation
            existing_session_id = self._find_existing_session(messages, system_prompt)
            if existing_session_id:
                return self._continue_existing_session(existing_session_id, messages, system_prompt)
            
            # No existing session found, create new one
            return self._create_new_session(messages, system_prompt, metadata)
    
    def _is_first_message(self, messages: List[Dict[str, Any]]) -> bool:
        """Check if this is the first message in a conversation."""
        return len(messages) <= 1
    
    def _create_new_session(
        self, 
        messages: List[Dict[str, Any]], 
        system_prompt: Optional[str], 
        metadata: Optional[Dict[str, Any]]
    ) -> Tuple[str, bool]:
        """Create a new session for this conversation."""
        session_id = str(uuid.uuid4())
        signature = self._compute_signature(messages, system_prompt)
        self._create_session(session_id, signature, messages, metadata or {})
        
        self._metrics["cache_misses"] += 1
        logger.info(f"New session created: {session_id[:8]}")
        return session_id, True
    
    def _find_existing_session(
        self, 
        messages: List[Dict[str, Any]], 
        system_prompt: Optional[str]
    ) -> Optional[str]:
        """Find existing session by looking up previous conversation state."""
        previous_messages = self._get_messages_without_last_exchange(messages)
        if not previous_messages:
            return None
        
        lookup_signature = self._compute_signature(previous_messages, system_prompt)
        session_id = self._signature_to_session.get(lookup_signature)
        
        
        return session_id
    
    def _continue_existing_session(
        self, 
        session_id: str, 
        messages: List[Dict[str, Any]], 
        system_prompt: Optional[str]
    ) -> Tuple[str, bool]:
        """Continue an existing session with new message."""
        full_signature = self._compute_signature(messages, system_prompt)
        self._update_session_signature(session_id, full_signature, len(messages))
        
        self._metrics["cache_hits"] += 1
        logger.debug(f"Session continued: {session_id[:8]}")
        return session_id, False
    
    def get_session_info(self, session_id: str) -> Optional[SessionRecord]:
        """Get information about a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionInfo if found, None otherwise
        """
        with self._lock:
            return self._sessions.get(session_id)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get session manager metrics.
        
        Returns:
            Dictionary of metrics
        """
        with self._lock:
            return {
                **self._metrics,
                "active_sessions": len(self._sessions),
                "max_sessions": self.max_sessions,
                "session_ttl_seconds": self.session_ttl.total_seconds()
            }
    
    def _compute_signature(self, messages: List[Dict[str, Any]], system_prompt: Optional[str] = None) -> str:
        """Compute signature for conversation using rolling hash.
        
        Args:
            messages: List of messages
            system_prompt: Optional system prompt
            
        Returns:
            Hex string signature
        """
        # Build signature components
        sig_parts = []
        
        # Include system prompt if present
        if system_prompt:
            sig_parts.append(f"system:{system_prompt[:SYSTEM_PROMPT_MAX_CHARS]}")
        
        # Include message history with role and content prefix
        for msg in messages:
            role = msg.get('role', 'unknown')
            content_text = self._extract_content_text(msg.get('content'))
            
            # Use first N chars of content for signature
            content_prefix = content_text[:SIGNATURE_CONTENT_MAX_CHARS].strip()
            sig_parts.append(f"{role}:{content_prefix}")
        
        # Create hash
        signature_string = "|".join(sig_parts)
        return hashlib.sha256(signature_string.encode()).hexdigest()
    
    def _extract_content_text(self, content: Any) -> str:
        """Safely extract text content from various content formats.
        
        Args:
            content: Content field which may be string, list, dict, or None
            
        Returns:
            Extracted text content as string
        """
        if content is None:
            return ""
        
        if isinstance(content, str):
            return content
        
        if isinstance(content, list):
            # Anthropic's structured content format
            content_parts = []
            for item in content:
                if isinstance(item, dict) and item.get('type') == 'text':
                    text = item.get('text', '')
                    if isinstance(text, str):
                        content_parts.append(text)
            return ''.join(content_parts)
        
        # For any other type, convert to string safely
        return str(content)
    
    def _create_session(
        self,
        session_id: str,
        signature: str,
        messages: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ):
        """Create a new session.
        
        Args:
            session_id: Session identifier
            signature: Conversation signature
            messages: List of messages
            metadata: Session metadata
        """
        # Enforce max sessions limit (LRU eviction)
        if len(self._sessions) >= self.max_sessions:
            # Remove oldest session and clean up signature mapping
            oldest_id, oldest_info = self._sessions.popitem(last=False)
            if oldest_info.signature in self._signature_to_session:
                del self._signature_to_session[oldest_info.signature]
            logger.debug(f"Evicted oldest session: {oldest_id[:8]}")
        
        
        # Create session info
        now = datetime.utcnow()
        session_info = SessionRecord(
            session_id=session_id,
            signature=signature,
            created_at=now,
            last_accessed=now,
            message_count=len(messages),
            metadata=metadata
        )
        
        # Store session
        self._sessions[session_id] = session_info
        self._signature_to_session[signature] = session_id
        self._metrics["sessions_created"] += 1
    
    def _update_session_access(self, session_id: str):
        """Update session last access time.
        
        Args:
            session_id: Session identifier
        """
        if session_id in self._sessions:
            session_info = self._sessions[session_id]
            session_info.last_accessed = datetime.utcnow()
            
            # Move to end (most recently used)
            self._sessions.move_to_end(session_id)
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions based on TTL."""
        now = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session_info in self._sessions.items():
            if now - session_info.last_accessed > self.session_ttl:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            session_info = self._sessions.pop(session_id)
            del self._signature_to_session[session_info.signature]
            self._metrics["sessions_expired"] += 1
            logger.debug(f"Expired session: {session_id[:8]}")
    
    def _get_messages_without_last_exchange(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get messages representing the previous conversation state.
        
        This finds the conversation state before the current user message, which
        should match an existing session's signature for continuation.
        
        Examples:
        - [user1, assistant1, user2] → [user1] (to match original session with just user1)
        - [user1, assistant1, user2, assistant2, user3] → [user1, assistant1, user2] 
        - [user1, user2] → [user1]
        - [user1] → [] (no previous state)
        
        Args:
            messages: List of messages
            
        Returns:
            Messages representing the previous conversation state
        """
        if len(messages) <= 1:
            return []
        
        # Find all user message indices
        user_indices = []
        for i, msg in enumerate(messages):
            if msg.get('role') == 'user':
                user_indices.append(i)
        
        if len(user_indices) < 2:
            # Only one user message - no previous conversation state to look up
            return []
        
        # Get the second-to-last user message index
        # This represents where the previous conversation state ended
        second_last_user_index = user_indices[-2]
        
        # Return all messages up to and including the second-to-last user message
        # This should match the signature when that user message was first processed
        return messages[:second_last_user_index + 1]
    
    def _update_session_signature(self, session_id: str, new_signature: str, message_count: int):
        """Update a session's signature and message count.
        
        Args:
            session_id: Session identifier
            new_signature: New signature to set
            message_count: Updated message count
        """
        if session_id not in self._sessions:
            return
        
        session_info = self._sessions[session_id]
        old_signature = session_info.signature
        
        # Remove old signature mapping
        if old_signature in self._signature_to_session:
            del self._signature_to_session[old_signature]
        
        # Update signature, message count, and access time
        session_info.signature = new_signature
        session_info.message_count = message_count
        session_info.last_accessed = datetime.utcnow()
        self._signature_to_session[new_signature] = session_id
        
        # Move to end of OrderedDict to maintain LRU order
        self._sessions.move_to_end(session_id)