"""Provider-specific parsers for extracting data from requests/responses."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple


class BaseProviderParser(ABC):
    """Base class for provider-specific parsing logic."""
    
    @abstractmethod
    def extract_usage_tokens(self, response_body: Optional[Dict[str, Any]]) -> Tuple[Optional[int], Optional[int], Optional[int]]:
        """Extract token usage from response body.
        
        Returns:
            Tuple of (input_tokens, output_tokens, total_tokens)
        """
        pass
    
    @abstractmethod
    def extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Extract response content from response body."""
        pass
    
    @abstractmethod
    def extract_system_prompt(self, request_body: Optional[Dict[str, Any]]) -> str:
        """Extract system prompt from request body."""
        pass


class OpenAIParser(BaseProviderParser):
    """Parser for OpenAI API requests and responses."""
    
    def extract_usage_tokens(self, response_body: Optional[Dict[str, Any]]) -> Tuple[Optional[int], Optional[int], Optional[int]]:
        """Extract token usage from OpenAI response."""
        if not response_body:
            return None, None, None
        
        usage = response_body.get("usage", {})
        if usage:
            return (
                usage.get("prompt_tokens"),
                usage.get("completion_tokens"),
                usage.get("total_tokens")
            )
        
        return None, None, None
    
    def extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Extract response content from OpenAI response."""
        if not response_body:
            return None
        
        choices = response_body.get("choices", [])
        if not choices:
            return None
        
        content = []
        for choice in choices:
            message = choice.get("message", {})
            
            # Handle text content
            if "content" in message and message["content"]:
                content.append({"text": message["content"]})
            
            # Handle tool calls (OpenAI format)
            if "tool_calls" in message:
                for tool_call in message["tool_calls"]:
                    content.append({
                        "tool_use": {
                            "id": tool_call.get("id"),
                            "name": tool_call.get("function", {}).get("name"),
                            "input": tool_call.get("function", {}).get("arguments")
                        }
                    })
        
        return content if content else None
    
    def extract_system_prompt(self, request_body: Optional[Dict[str, Any]]) -> str:
        """Extract system prompt from OpenAI request."""
        if not request_body:
            return "default-agent"
        
        messages = request_body.get("messages", [])
        for message in messages:
            if message.get("role") == "system":
                content = message.get("content", "")
                if isinstance(content, str):
                    return content
        
        return "default-agent"


class AnthropicParser(BaseProviderParser):
    """Parser for Anthropic API requests and responses."""
    
    def extract_usage_tokens(self, response_body: Optional[Dict[str, Any]]) -> Tuple[Optional[int], Optional[int], Optional[int]]:
        """Extract token usage from Anthropic response."""
        if not response_body:
            return None, None, None
        
        usage = response_body.get("usage", {})
        if usage:
            input_tokens = usage.get("input_tokens")
            output_tokens = usage.get("output_tokens")
            total_tokens = None
            if input_tokens and output_tokens:
                total_tokens = input_tokens + output_tokens
            
            return (input_tokens, output_tokens, total_tokens)
        
        return None, None, None
    
    def extract_response_content(self, response_body: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """Extract response content from Anthropic response."""
        if not response_body:
            return None
        
        anthropic_content = response_body.get("content")
        if not anthropic_content:
            return None
        
        if isinstance(anthropic_content, str):
            return [{"text": anthropic_content}]
        
        if isinstance(anthropic_content, list):
            content = []
            for item in anthropic_content:
                if item.get("type") == "text":
                    content.append({"text": item.get("text", "")})
                elif item.get("type") == "tool_use":
                    content.append({
                        "tool_use": {
                            "id": item.get("id"),
                            "name": item.get("name"),
                            "input": item.get("input")
                        }
                    })
            return content if content else None
        
        return None
    
    def extract_system_prompt(self, request_body: Optional[Dict[str, Any]]) -> str:
        """Extract system prompt from Anthropic request."""
        if not request_body:
            return "default-agent"
        
        # Anthropic uses a top-level "system" field
        system_prompt = request_body.get("system", "")
        if isinstance(system_prompt, str) and system_prompt:
            return system_prompt
        
        return "default-agent"


def get_parser_for_provider(provider_name: str) -> BaseProviderParser:
    """Factory function to get the appropriate parser for a provider.
    
    Args:
        provider_name: Name of the provider (e.g., 'openai', 'anthropic')
        
    Returns:
        Provider-specific parser instance
    """
    provider_name_lower = provider_name.lower() if provider_name else ""
    
    if provider_name_lower == "openai":
        return OpenAIParser()
    elif provider_name_lower == "anthropic":
        return AnthropicParser()
    else:
        # Default to OpenAI parser for unknown providers
        return OpenAIParser()