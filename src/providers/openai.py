"""OpenAI provider for session detection."""
import hashlib
from typing import Any, Dict, Optional

from fastapi import Request

from .base import BaseProvider, SessionInfo


class OpenAIProvider(BaseProvider):
    """OpenAI API provider implementation."""
    
    @property
    def name(self) -> str:
        return "openai"
    
    def can_handle(self, request: Request) -> bool:
        """Check if this is an OpenAI API request."""
        path = request.url.path
        return (
            path.startswith("/v1/chat/completions") or
            path.startswith("/v1/completions") or
            "openai" in request.headers.get("user-agent", "").lower()
        )
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from OpenAI request."""
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
        
        return SessionInfo(
            is_session_start=is_session_start,
            is_session_end=is_session_end,
            conversation_id=conversation_id,
            message_count=message_count,
            model=self.extract_model_from_body(body),
            is_streaming=self.extract_streaming_from_body(body),
            metadata=self.extract_conversation_metadata(body)
        )
    
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