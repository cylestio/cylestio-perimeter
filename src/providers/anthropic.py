"""Anthropic provider for session detection."""
import hashlib
from typing import Any, Dict, Optional

from fastapi import Request

from .base import BaseProvider, SessionInfo


class AnthropicProvider(BaseProvider):
    """Anthropic API provider implementation."""
    
    def __init__(self, settings=None):
        """Initialize Anthropic provider."""
        super().__init__(settings)
    
    @property
    def name(self) -> str:
        return "anthropic"
    
    async def detect_session_info(self, request: Request, body: Dict[str, Any]) -> SessionInfo:
        """Detect session info from Anthropic request."""
        messages = body.get("messages", [])
        message_count = len(messages)
        
        # Generate conversation ID from message history
        conversation_id = self._generate_conversation_id(messages, body.get("system"))
        
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
        """Extract model from Anthropic request."""
        return body.get("model")
    
    def extract_streaming_from_body(self, body: Dict[str, Any]) -> bool:
        """Check if Anthropic request is for streaming."""
        return body.get("stream", False) is True
    
    def extract_conversation_metadata(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Extract Anthropic-specific metadata."""
        metadata = {}
        
        # Token limits
        if "max_tokens" in body:
            metadata["max_tokens"] = body["max_tokens"]
        
        # Temperature and other params
        for param in ["temperature", "top_p", "top_k"]:
            if param in body:
                metadata[param] = body[param]
        
        # System message
        if "system" in body:
            metadata["has_system_message"] = True
            metadata["system_length"] = len(str(body["system"]))
        
        # Tools information
        if "tools" in body:
            metadata["tools_count"] = len(body["tools"])
            metadata["tool_names"] = [tool.get("name") for tool in body["tools"]]
        
        return metadata
    
    def _generate_conversation_id(self, messages: list, system_message: Optional[str] = None) -> str:
        """Generate a conversation ID from message history and system message."""
        if not messages:
            return "empty"
        
        # Start with system message if present
        conversation_text = ""
        if system_message:
            conversation_text += f"system:{system_message[:100]}"
        
        # Use first user message to create stable ID (this defines the conversation)
        first_user_msg = None
        for msg in messages:
            if msg.get("role") == "user":
                first_user_msg = msg
                break
        
        if first_user_msg:
            content = first_user_msg.get("content", "")
            if isinstance(content, str):
                conversation_text += f"user:{content[:100]}"  # First 100 chars
            elif isinstance(content, list):
                # Handle Claude's structured content format
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        conversation_text += f"user:{item.get('text', '')[:100]}"
                        break
        
        # Create short hash
        return hashlib.md5(conversation_text.encode()).hexdigest()[:8]