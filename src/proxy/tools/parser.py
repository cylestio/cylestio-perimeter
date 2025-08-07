"""Tool parsing utilities for LLM requests and responses."""
from typing import Any, Dict, List, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)


class ToolParser:
    """Parser for tool usage in LLM requests and responses.
    
    Handles parsing of tool execution requests and results from 
    both OpenAI and Anthropic API formats.
    """
    
    def parse_tool_results(self, body: Optional[Dict[str, Any]], provider: Optional[str] = None) -> List[Dict[str, Any]]:
        """Extract tool results from request messages.
        
        Args:
            body: Request body
            provider: Provider name (openai, anthropic) to use appropriate parsing logic
            
        Returns:
            List of tool result dictionaries
        """
        if not body:
            return []
        
        provider_name = provider.lower() if provider else ""
        
        # OpenAI format: tool results in messages
        if provider_name == "openai":
            return self._parse_openai_tool_results(body)
        
        # Anthropic format: tool_result in content[]
        elif provider_name == "anthropic":
            return self._parse_anthropic_tool_results(body)
        
        # Fallback: try both formats
        else:
            # Try OpenAI first
            openai_results = self._parse_openai_tool_results(body)
            if openai_results:
                return openai_results
            
            # Then try Anthropic
            return self._parse_anthropic_tool_results(body)
    
    def _parse_openai_tool_results(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool results from OpenAI request format."""
        if "messages" not in body:
            return []
        
        tool_results = []
        for message in body["messages"]:
            # OpenAI tool results come in "tool" role messages
            if message.get("role") == "tool":
                tool_results.append({
                    "tool_use_id": message.get("tool_call_id"),
                    "content": message.get("content"),
                    "name": message.get("name"),
                    "is_error": False  # OpenAI doesn't have explicit error flag
                })
        
        return tool_results
    
    def _parse_anthropic_tool_results(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool results from Anthropic request format."""
        if "messages" not in body:
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
    
    def parse_tool_requests(self, body: Optional[Dict[str, Any]], provider: Optional[str] = None) -> List[Dict[str, Any]]:
        """Extract tool use requests from response content (typically from LLM assistant's response).
        
        Args:
            body: Response body
            provider: Provider name (openai, anthropic) to use appropriate parsing logic
            
        Returns:
            List of tool use dictionaries
        """
        if not body:
            return []
        
        provider_name = provider.lower() if provider else ""
        
        # OpenAI format: tool_calls in choices[].message
        if provider_name == "openai":
            return self._parse_openai_tool_requests(body)
        
        # Anthropic format: tool_use in content[]
        elif provider_name == "anthropic":
            return self._parse_anthropic_tool_requests(body)
        
        # Fallback: try both formats
        else:
            # Try OpenAI first
            openai_tools = self._parse_openai_tool_requests(body)
            if openai_tools:
                return openai_tools
            
            # Then try Anthropic
            return self._parse_anthropic_tool_requests(body)
    
    def _parse_openai_tool_requests(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool requests from OpenAI response format."""
        tool_uses = []
        choices = body.get("choices", [])
        
        for choice in choices:
            message = choice.get("message", {})
            tool_calls = message.get("tool_calls", [])
            
            for tool_call in tool_calls:
                function = tool_call.get("function", {})
                tool_uses.append({
                    "id": tool_call.get("id"),
                    "name": function.get("name"),
                    "input": function.get("arguments", {})
                })
        
        return tool_uses
    
    def _parse_anthropic_tool_requests(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse tool requests from Anthropic response format."""
        if "content" not in body:
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