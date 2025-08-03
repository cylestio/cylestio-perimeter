"""OpenAI provider for session detection."""
import hashlib
from typing import Any, Dict, Optional

from fastapi import Request

from .base import BaseProvider, SessionInfo


class OpenAIProvider(BaseProvider):
    """OpenAI API provider implementation."""
    
    def __init__(self):
        """Initialize OpenAI provider."""
        super().__init__()
        self.response_sessions: Dict[str, str] = {}  # response_id → session_id
    
    @property
    def name(self) -> str:
        return "openai"
    
    def can_handle(self, request: Request) -> bool:
        """Check if this is an OpenAI API request."""
        path = request.url.path
        return (
            path.startswith("/v1/chat/completions") or
            path.startswith("/v1/completions") or
            path.startswith("/v1/responses") or
            "openai" in request.headers.get("user-agent", "").lower()
        )
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from OpenAI request."""
        path = request.url.path

        # Handle the new /v1/responses endpoint differently
        if path.startswith("/responses"):
            # Check for previous_response_id to maintain session continuity
            previous_response_id = body.get("previous_response_id")
            if previous_response_id and previous_response_id in self.response_sessions:
                # Continue existing session based on response ID chain
                conversation_id = self.response_sessions[previous_response_id]
                is_session_start = False
            else:
                # New session - generate ID from instructions
                instructions = body.get("instructions", "")
                conversation_id = self._generate_conversation_id_from_instructions(instructions)
                is_session_start = bool(instructions)
            
            is_session_end = False
            message_count = 1  # Responses API is stateful, count individual requests
            
        else:
            # Original logic for chat completions and completions endpoints
            messages = body.get("messages", [])
            message_count = len(messages)
            
            # Generate conversation ID from message history
            conversation_id = self._generate_conversation_id(messages)
            
            # Count user and assistant messages
            user_messages = [m for m in messages if m.get("role") == "user"]
            assistant_messages = [m for m in messages if m.get("role") == "assistant"]
            
            # Session start: Only user messages and no assistant responses (truly new conversation)
            is_session_start = (
                len(user_messages) >= 1 and 
                len(assistant_messages) == 0
            )
            
            # Session end: determined by response success/failure, not request
            is_session_end = False
        
        session_info = SessionInfo(
            is_session_start=is_session_start,
            is_session_end=is_session_end,
            conversation_id=conversation_id,
            message_count=message_count,
            model=self.extract_model_from_body(body),
            is_streaming=self.extract_streaming_from_body(body),
            metadata=self.extract_conversation_metadata(body)
        )
        return session_info
    
    def extract_model_from_body(self, body: Dict[str, Any]) -> Optional[str]:
        """Extract model from OpenAI request."""
        return body.get("model")
    
    def extract_streaming_from_body(self, body: Dict[str, Any]) -> bool:
        """Check if OpenAI request is for streaming."""
        return body.get("stream", False) is True
    
    def extract_conversation_metadata(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract OpenAI-specific metadata."""
        metadata = {}
        
        # Token limits
        if "max_tokens" in body:
            metadata["max_tokens"] = body["max_tokens"]
        
        # Temperature and other params
        for param in ["temperature", "top_p", "frequency_penalty", "presence_penalty"]:
            if param in body:
                metadata[param] = body[param]
        
        # Tools information
        if "tools" in body:
            metadata["tools_count"] = len(body["tools"])
            metadata["tool_names"] = [tool.get("function", {}).get("name") for tool in body["tools"]]
        
        # Responses API specific fields
        if "instructions" in body:
            metadata["has_instructions"] = True
            metadata["instructions_length"] = len(body["instructions"])
        
        # Check for new Responses API capabilities
        if "web_search" in body:
            metadata["web_search_enabled"] = body["web_search"]
        if "computer_use" in body:
            metadata["computer_use_enabled"] = body["computer_use"]
        if "file_search" in body:
            metadata["file_search_enabled"] = body["file_search"]
        
        return metadata
    
    def _generate_conversation_id(self, messages: list) -> str:
        """Generate a conversation ID from message history."""
        if not messages:
            return "empty"
        
        # Start with system message if present
        conversation_text = ""
        system_msg = next((msg for msg in messages if msg.get("role") == "system"), None)
        if system_msg:
            content = system_msg.get("content", "")
            if isinstance(content, str):
                conversation_text += f"system:{content[:100]}"
        
        # Use first user message to create stable ID (this defines the conversation)
        first_user_msg = next((msg for msg in messages if msg.get("role") == "user"), None)
        if first_user_msg:
            content = first_user_msg.get("content", "")
            if isinstance(content, str):
                conversation_text += f"user:{content[:100]}"  # First 100 chars
        
        # Create short hash
        return hashlib.md5(conversation_text.encode()).hexdigest()[:8]
    
    def _generate_conversation_id_from_instructions(self, instructions: str) -> str:
        """Generate a conversation ID from instructions field (for /v1/responses)."""
        if not instructions:
            return "empty-instructions"
        
        # Use the instructions field to create a stable conversation ID
        # Take first 200 chars of instructions for hashing to ensure stability
        instructions_text = f"instructions:{instructions[:200]}"
        
        # Create short hash
        return hashlib.md5(instructions_text.encode()).hexdigest()[:8]
    
    async def notify_response(self, session_id: str, request: Request,
                            response_body: Optional[Dict[str, Any]]) -> None:
        """Track response IDs for session continuity.
        
        Args:
            session_id: The session ID associated with this request
            request: The original request object
            response_body: The parsed response body
        """

        if not response_body or not request.url.path.startswith("/responses"):
            return
        
        # Extract response_id from the response
        response_id = response_body.get("id") or response_body.get("response_id")

        if not response_id:
            return
        
        # Store the mapping using the short session ID (first 8 chars)
        # The session_id here is the full UUID, but conversation_id uses first 8 chars
        short_session_id = session_id.split('-')[0] if '-' in session_id else session_id
        self.response_sessions[response_id] = short_session_id
        
        # Optional: Clean up old entries to prevent memory growth
        # In production, you might want to use a TTL cache or similar
        if len(self.response_sessions) > 10000:
            # Remove oldest entries (simple FIFO for now)
            oldest_entries = list(self.response_sessions.items())[:1000]
            for old_id, _ in oldest_entries:
                del self.response_sessions[old_id]