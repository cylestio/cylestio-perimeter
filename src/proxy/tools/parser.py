"""Tool parsing utilities for LLM requests and responses."""
from typing import Any, Dict, List, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)


class ToolParser:
    """Parser for tool usage in LLM requests and responses.
    
    Handles parsing of tool execution requests and results from 
    Anthropic API format.
    """
    
    def parse_tool_results(self, body: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract tool results from request messages.
        
        Args:
            body: Request body
            
        Returns:
            List of tool result dictionaries
        """
        if not body or "messages" not in body:
            return []
        
        tool_results = []
        for message in body["messages"]:
            if message.get("role") == "user" and isinstance(message.get("content"), list):
                for content_item in message["content"]:
                    if isinstance(content_item, dict) and content_item.get("type") == "tool_result":
                        tool_results.append({
                            "tool_use_id": content_item.get("tool_use_id"),
                            "content": content_item.get("content"),
                            "is_error": content_item.get("is_error", False)
                        })
        
        return tool_results
    
    def parse_tool_requests(self, body: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract tool uses from response content.
        
        Args:
            body: Response body
            
        Returns:
            List of tool use dictionaries
        """
        if not body or "content" not in body:
            return []
        
        tool_uses = []
        content = body["content"]
        if isinstance(content, list):
            for content_item in content:
                if isinstance(content_item, dict) and content_item.get("type") == "tool_use":
                    tool_uses.append({
                        "id": content_item.get("id"),
                        "name": content_item.get("name"),
                        "input": content_item.get("input", {})
                    })
        
        return tool_uses


# Default instance
tool_parser = ToolParser()