"""Shared session detection utilities for LLM providers."""
import hashlib
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
        metadata: Dict[str, Any],
        last_processed_index: int = 0,
        last_span_id: Optional[str] = None
    ):
        self.session_id = session_id
        self.signature = signature
        self.created_at = created_at
        self.last_accessed = last_accessed
        self.message_count = message_count
        self.metadata = metadata
        self.last_processed_index = last_processed_index
        self.last_span_id = last_span_id


class SessionDetectionUtility:
    """Shared utility for provider-level session detection using message history hashing."""
    
    def __init__(
        self,
        max_sessions: int = DEFAULT_MAX_SESSIONS,
        session_ttl_seconds: int = DEFAULT_SESSION_TTL_SECONDS
    ):
        """Initialize session detection utility.
        
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
            "sessions_fragmented": 0,
            "cache_hits": 0,
            "cache_misses": 0
        }
    
    def detect_session(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, bool, bool, int]:
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
            Tuple of (session_id, is_new_session, is_fragmented, last_processed_index)
            - session_id: The session identifier
            - is_new_session: True if this is genuinely a new conversation  
            - is_fragmented: True if we created a new session but it's likely a continuation
            - last_processed_index: Index of last processed message in this session
        """
        with self._lock:
            self._cleanup_expired_sessions()
            
            # Handle first message case
            if self._is_first_message(messages):
                return self._create_new_session(messages, system_prompt, metadata, is_fragmented=False)
            
            # Try to find existing session for continuing conversation
            existing_session_id = self._find_existing_session(messages, system_prompt)
            if existing_session_id:
                return self._continue_existing_session(existing_session_id, messages, system_prompt)
            
            # No existing session found, create new one (this is fragmentation)
            return self._create_new_session(messages, system_prompt, metadata, is_fragmented=True)
    
    def get_session_info(self, session_id: str) -> Optional[SessionRecord]:
        """Get information about a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionRecord if found, None otherwise
        """
        with self._lock:
            return self._sessions.get(session_id)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get session detection metrics.
        
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
    
    def _is_client_message(self, msg: Dict[str, Any]) -> bool:
        """Check if a message is client-initiated (not from LLM).
        
        Client messages include:
        - user messages (role: user)
        - tool responses (role: tool) 
        - function call outputs (type: function_call_output)
        - system prompts (role: system)
        
        LLM messages include:
        - assistant responses (role: assistant)
        - function calls (type: function_call)
        """
        role = msg.get('role')
        msg_type = msg.get('type')
        
        # Standard role-based messages
        if role in ['user', 'tool', 'system']:
            return True
        
        # OpenAI Responses API format
        if msg_type == 'function_call_output':
            return True
        
        # Everything else is LLM-initiated
        return False
    
    def _is_first_message(self, messages: List[Dict[str, Any]]) -> bool:
        """Check if this is the first message in a conversation."""
        if len(messages) <= 1:
            return True
        
        # Count client messages (excluding system) to determine if this is first interaction
        client_interaction_count = 0
        for msg in messages:
            if self._is_client_message(msg) and msg.get('role') != 'system':
                client_interaction_count += 1
        
        return client_interaction_count <= 1
    
    def _create_new_session(
        self, 
        messages: List[Dict[str, Any]], 
        system_prompt: Optional[str], 
        metadata: Optional[Dict[str, Any]],
        is_fragmented: bool = False
    ) -> Tuple[str, bool, bool, int]:
        """Create a new session for this conversation."""
        session_id = str(uuid.uuid4())
        signature = self._compute_signature(messages, system_prompt)
        self._create_session(session_id, signature, messages, metadata or {})
        
        self._metrics["cache_misses"] += 1
        if is_fragmented:
            self._metrics["sessions_fragmented"] += 1
            logger.warning(f"Fragmented session created: {session_id[:8]}")
        else:
            logger.info(f"New session created: {session_id[:8]}")
        # New sessions start with index 0 (nothing processed yet)
        return session_id, True, is_fragmented, 0
    
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
    ) -> Tuple[str, bool, bool, int]:
        """Continue an existing session with new message."""
        full_signature = self._compute_signature(messages, system_prompt)
        self._update_session_signature(session_id, full_signature, len(messages))
        
        # Get last processed index from existing session
        session_record = self._sessions.get(session_id)
        last_processed_index = session_record.last_processed_index if session_record else 0
        
        self._metrics["cache_hits"] += 1
        logger.debug(f"Session continued: {session_id[:8]}")
        return session_id, False, False, last_processed_index
    
    def _compute_signature(self, messages: List[Dict[str, Any]], system_prompt: Optional[str] = None) -> str:
        """Compute signature for conversation using message hashing.
        
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
            prompt_prefix = system_prompt[:SYSTEM_PROMPT_MAX_CHARS]
            sig_parts.append(f"system:{prompt_prefix}")
        
        # Include message history with role and content prefix
        for msg in messages:
            role = msg.get('role', 'unknown')
            content_text = self._extract_content_text(msg.get('content'))
            
            # Use first N chars of content for signature
            content_prefix = content_text[:SIGNATURE_CONTENT_MAX_CHARS].strip()
            sig_part = f"{role}:{content_prefix}"
            sig_parts.append(sig_part)
        
        # Create hash - using MD5 for consistency with providers
        signature_string = "|".join(sig_parts)
        signature_hash = hashlib.md5(signature_string.encode()).hexdigest()
        return signature_hash

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
            metadata=metadata,
            last_processed_index=0,
            last_span_id=None
        )
        
        # Store session
        self._sessions[session_id] = session_info
        self._signature_to_session[signature] = session_id
        self._metrics["sessions_created"] += 1
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions based on TTL."""
        now = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session_info in self._sessions.items():
            if now - session_info.last_accessed > self.session_ttl:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            session_info = self._sessions.pop(session_id)
            if session_info.signature in self._signature_to_session:
                del self._signature_to_session[session_info.signature]
            self._metrics["sessions_expired"] += 1
            logger.debug(f"Expired session: {session_id[:8]}")
    
    def _get_messages_without_last_exchange(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get messages representing the previous conversation state.
        
        This finds the conversation state that should match an existing session's signature.
        If messages don't end with a client message, we first trim back to the last client message,
        then apply the normal logic.
        
        Examples:
        - [user1, assistant1, user2] → [user1] (to match original session with just user1)
        - [user1, assistant1, user2, tool1, assistant2] → [user1, assistant1, user2] (trim to tool1, then get previous)
        - [user1, assistant1, tool1] → [user1] (trim to tool1, then get previous)
        - [user1] → [] (no previous state)
        
        Args:
            messages: List of messages
            
        Returns:
            Messages representing the previous conversation state
        """
        if len(messages) <= 1:
            return []
        
        # First, trim messages to end at the last client message if not already
        trimmed_messages = self._trim_to_last_client_message(messages)
        if len(trimmed_messages) <= 1:
            return []
        
        # Find all client message indices in trimmed messages
        client_indices = []
        for i, msg in enumerate(trimmed_messages):
            if self._is_client_message(msg):
                client_indices.append(i)
        
        if len(client_indices) < 2:
            # Only one client message - return everything up to that client message
            # This allows matching against the previous conversation state
            if client_indices:
                return trimmed_messages[:client_indices[0] + 1]
            return []
        
        # Get the second-to-last client message index
        # This represents where the previous conversation state ended
        second_last_client_index = client_indices[-2]
        
        # Return all messages up to and including the second-to-last client message
        # This should match the signature when that client message was first processed
        return trimmed_messages[:second_last_client_index + 1]
    
    def _trim_to_last_client_message(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Trim messages to end at the last client message.
        
        If the conversation already ends with a client message, return as-is.
        Otherwise, remove messages from the end until we reach a client message.
        
        Args:
            messages: List of messages
            
        Returns:
            Messages trimmed to end at last client message
        """
        if not messages:
            return messages
            
        # If already ends with client message, return as-is
        if self._is_client_message(messages[-1]):
            return messages
        
        # Find the last client message index
        last_client_index = -1
        for i in range(len(messages) - 1, -1, -1):
            if self._is_client_message(messages[i]):
                last_client_index = i
                break
        
        # If no client message found, return empty (shouldn't happen in practice)
        if last_client_index == -1:
            return []
        
        # Return messages up to and including the last client message
        return messages[:last_client_index + 1]
    
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
    
    def update_processed_index(self, session_id: str, new_index: int):
        """Update the last processed message index for a session.
        
        Args:
            session_id: Session identifier
            new_index: New index of last processed message
        """
        if session_id not in self._sessions:
            logger.warning(f"Attempted to update processed index for non-existent session: {session_id[:8]}")
            return
        
        session_info = self._sessions[session_id]
        session_info.last_processed_index = new_index
        session_info.last_accessed = datetime.utcnow()
        
        # Move to end of OrderedDict to maintain LRU order
        self._sessions.move_to_end(session_id)
    
    def update_span_id(self, session_id: str, new_span_id: str):
        """Update a session's last span ID.
        
        Args:
            session_id: Session identifier
            new_span_id: New span ID to store
        """
        with self._lock:
            if session_id not in self._sessions:
                return
            
            session_info = self._sessions[session_id]
            session_info.last_span_id = new_span_id
            session_info.last_accessed = datetime.utcnow()
            
            # Move to end of OrderedDict to maintain LRU order
            self._sessions.move_to_end(session_id)


def create_session_utility(
    max_sessions: int = DEFAULT_MAX_SESSIONS,
    session_ttl_seconds: int = DEFAULT_SESSION_TTL_SECONDS
) -> SessionDetectionUtility:
    """Create a new session detection utility instance.
    
    Args:
        max_sessions: Maximum number of sessions to track
        session_ttl_seconds: Time-to-live for sessions in seconds
        
    Returns:
        New SessionDetectionUtility instance
    """
    return SessionDetectionUtility(
        max_sessions=max_sessions,
        session_ttl_seconds=session_ttl_seconds
    )
