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


class SessionInfo:
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
        max_sessions: int = 10000,
        session_ttl_seconds: int = 3600,
        enable_fuzzy_matching: bool = True,
        similarity_threshold: float = 0.85
    ):
        """Initialize session manager.
        
        Args:
            max_sessions: Maximum number of sessions to track
            session_ttl_seconds: Time-to-live for sessions in seconds
            enable_fuzzy_matching: Enable fuzzy matching for continued conversations
            similarity_threshold: Similarity threshold for fuzzy matching (0-1)
        """
        self.max_sessions = max_sessions
        self.session_ttl = timedelta(seconds=session_ttl_seconds)
        self.enable_fuzzy_matching = enable_fuzzy_matching
        self.similarity_threshold = similarity_threshold
        
        # Thread-safe session storage
        self._lock = RLock()
        self._sessions: OrderedDict[str, SessionInfo] = OrderedDict()
        self._signature_to_session: Dict[str, str] = {}  # signature -> session_id
        
        # Metrics
        self._metrics = {
            "sessions_created": 0,
            "sessions_expired": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "fuzzy_matches": 0
        }
    
    def detect_session(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, bool]:
        """Detect session from message history.
        
        Args:
            messages: List of message dictionaries
            system_prompt: Optional system prompt
            metadata: Optional metadata to store with session
            
        Returns:
            Tuple of (session_id, is_new_session)
        """
        with self._lock:
            # Clean up expired sessions
            self._cleanup_expired_sessions()
            
            # Compute conversation signature
            signature = self._compute_signature(messages, system_prompt)
            
            # Check for exact match
            if signature in self._signature_to_session:
                session_id = self._signature_to_session[signature]
                self._update_session_access(session_id)
                self._metrics["cache_hits"] += 1
                logger.debug(f"Session cache hit: {session_id[:8]} (signature: {signature[:8]})")
                return session_id, False
            
            self._metrics["cache_misses"] += 1
            
            # Check if this is a new session
            is_new_session = self._is_session_start(messages)
            
            if not is_new_session and self.enable_fuzzy_matching:
                # Try fuzzy matching for continued conversations
                similar_session_id = self._find_similar_session(messages, system_prompt)
                if similar_session_id:
                    self._metrics["fuzzy_matches"] += 1
                    logger.debug(f"Fuzzy match found: {similar_session_id[:8]}")
                    return similar_session_id, False
            
            # Create new session
            session_id = str(uuid.uuid4())
            self._create_session(session_id, signature, messages, metadata or {})
            logger.info(f"New session created: {session_id[:8]} (signature: {signature[:8]}, "
                       f"messages: {len(messages)}, is_start: {is_new_session})")
            return session_id, True
    
    def get_session_info(self, session_id: str) -> Optional[SessionInfo]:
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
            sig_parts.append(f"system:{system_prompt[:100]}")
        
        # Include message history with role and content prefix
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = str(msg.get('content', ''))
            
            # Handle different content formats
            if isinstance(content, list):
                # Anthropic's structured content
                content_text = ""
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'text':
                        content_text += item.get('text', '')
                content = content_text
            
            # Use first 100 chars of content for signature
            content_prefix = content[:100].strip()
            sig_parts.append(f"{role}:{content_prefix}")
        
        # Create hash
        signature_string = "|".join(sig_parts)
        return hashlib.sha256(signature_string.encode()).hexdigest()
    
    def _is_session_start(self, messages: List[Dict[str, Any]]) -> bool:
        """Determine if this represents a session start using multiple heuristics.
        
        Args:
            messages: List of messages
            
        Returns:
            True if this is likely a session start
        """
        if not messages:
            return True
        
        # Count message types
        user_messages = [m for m in messages if m.get('role') == 'user']
        assistant_messages = [m for m in messages if m.get('role') == 'assistant']
        
        # Heuristic 1: No assistant messages and few user messages
        if len(assistant_messages) == 0 and len(user_messages) <= 2:
            return True
        
        # Heuristic 2: Very short conversation (total messages <= 3)
        if len(messages) <= 3 and len(assistant_messages) <= 1:
            return True
        
        # Heuristic 3: Reset phrases in last user message
        if user_messages:
            last_user_content = str(user_messages[-1].get('content', '')).lower()
            reset_phrases = [
                'start over', 'new conversation', 'reset', 'clear',
                'begin again', 'fresh start', 'new session', 'new chat'
            ]
            if any(phrase in last_user_content for phrase in reset_phrases):
                return True
        
        return False
    
    def _find_similar_session(self, messages: List[Dict[str, Any]], system_prompt: Optional[str] = None) -> Optional[str]:
        """Find similar session using fuzzy matching.
        
        Args:
            messages: Current messages
            system_prompt: Optional system prompt
            
        Returns:
            Session ID if similar session found, None otherwise
        """
        if not messages:
            return None
        
        # For fuzzy matching, we'll compare the beginning of conversations
        # This helps identify conversations that are continuations
        current_prefix = self._get_conversation_prefix(messages)
        
        # Check recent sessions (most recent first)
        for session_id, session_info in reversed(self._sessions.items()):
            # Skip if session is too old (likely different conversation)
            if datetime.utcnow() - session_info.last_accessed > timedelta(minutes=30):
                continue
            
            # Compare message counts - continuation should have more messages
            if len(messages) <= session_info.message_count:
                continue
            
            # Check if current messages could be a continuation
            # This is a simplified check - you could make this more sophisticated
            similarity = self._calculate_similarity(current_prefix, session_info.metadata.get('prefix', ''))
            if similarity >= self.similarity_threshold:
                return session_id
        
        return None
    
    def _get_conversation_prefix(self, messages: List[Dict[str, Any]]) -> str:
        """Get conversation prefix for comparison.
        
        Args:
            messages: List of messages
            
        Returns:
            String representation of conversation start
        """
        # Get first few messages for comparison
        prefix_messages = messages[:3]
        prefix_parts = []
        
        for msg in prefix_messages:
            role = msg.get('role', '')
            content = str(msg.get('content', ''))[:50]
            prefix_parts.append(f"{role}:{content}")
        
        return "|".join(prefix_parts)
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using simple character overlap.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        if not text1 or not text2:
            return 0.0
        
        # Simple character-based similarity
        # You could use more sophisticated algorithms like Levenshtein distance
        set1 = set(text1.lower())
        set2 = set(text2.lower())
        
        if not set1 or not set2:
            return 0.0
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union if union > 0 else 0.0
    
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
            # Remove oldest session
            oldest_id, oldest_info = self._sessions.popitem(last=False)
            del self._signature_to_session[oldest_info.signature]
            logger.debug(f"Evicted oldest session: {oldest_id[:8]}")
        
        # Store conversation prefix for fuzzy matching
        metadata['prefix'] = self._get_conversation_prefix(messages)
        
        # Create session info
        now = datetime.utcnow()
        session_info = SessionInfo(
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