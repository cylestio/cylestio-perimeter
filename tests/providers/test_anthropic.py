"""Tests for Anthropic provider functionality."""
import pytest
from src.providers.anthropic import AnthropicProvider


class TestAnthropicProvider:
    """Test suite for Anthropic provider."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
    
    def test_extract_system_prompt_from_system_field(self):
        """Test extracting system prompt from system field."""
        body = {
            "system": "You are a helpful assistant.",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "You are a helpful assistant."
    
    def test_extract_system_prompt_no_system_field(self):
        """Test extracting system prompt when no system field exists."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"
    
    def test_extract_system_prompt_empty_body(self):
        """Test extracting system prompt with empty body."""
        body = {}
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"
    
    def test_extract_system_prompt_non_string_system(self):
        """Test extracting system prompt when system is not a string."""
        body = {
            "system": ["You are a helpful assistant."],
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "['You are a helpful assistant.']"
    
    def test_extract_system_prompt_empty_system(self):
        """Test extracting system prompt when system field is empty."""
        body = {
            "system": "",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"  # Empty string is falsy, so returns default
    
    def test_extract_system_prompt_whitespace_system(self):
        """Test extracting system prompt when system field has only whitespace."""
        body = {
            "system": "   ",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "   "  # Whitespace is truthy, so returns as-is
    
    def test_extract_model_from_body(self):
        """Test extracting model from request body."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_model_from_body(body)
        assert result == "claude-3-sonnet-20240229"
    
    def test_extract_model_from_body_missing(self):
        """Test extracting model when not present in body."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_model_from_body(body)
        assert result is None
    
    def test_extract_streaming_from_body_true(self):
        """Test extracting streaming flag when true."""
        body = {
            "stream": True,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_streaming_from_body(body)
        assert result is True
    
    def test_extract_streaming_from_body_false(self):
        """Test extracting streaming flag when false."""
        body = {
            "stream": False,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_streaming_from_body(body)
        assert result is False
    
    def test_extract_streaming_from_body_missing(self):
        """Test extracting streaming flag when not present."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_streaming_from_body(body)
        assert result is False
    
    def test_extract_conversation_metadata_basic(self):
        """Test extracting basic conversation metadata."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": 1000,
            "temperature": 0.7,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "max_tokens": 1000,
            "temperature": 0.7
        }
        assert result == expected
    
    def test_extract_conversation_metadata_with_system(self):
        """Test extracting metadata with system message."""
        body = {
            "system": "You are a helpful assistant.",
            "max_tokens": 1000,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "max_tokens": 1000,
            "has_system_message": True,
            "system_length": 28
        }
        assert result == expected
    
    def test_extract_conversation_metadata_with_tools(self):
        """Test extracting metadata with tools."""
        body = {
            "tools": [
                {"name": "calculator", "type": "function"},
                {"name": "weather", "type": "function"}
            ],
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "tools_count": 2,
            "tool_names": ["calculator", "weather"]
        }
        assert result == expected
    
    def test_extract_conversation_metadata_all_params(self):
        """Test extracting metadata with all supported parameters."""
        body = {
            "system": "You are a helpful assistant.",
            "max_tokens": 1000,
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 50,
            "tools": [
                {"name": "calculator", "type": "function"}
            ],
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "max_tokens": 1000,
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 50,
            "has_system_message": True,
            "system_length": 28,
            "tools_count": 1,
            "tool_names": ["calculator"]
        }
        assert result == expected
    
    def test_extract_conversation_metadata_empty_body(self):
        """Test extracting metadata from empty body."""
        body = {}
        
        result = self.provider.extract_conversation_metadata(body)
        assert result == {}
    
    def test_extract_usage_tokens_complete(self):
        """Test extracting usage tokens with complete data."""
        response_body = {
            "usage": {
                "input_tokens": 100,
                "output_tokens": 50
            }
        }
        
        input_tokens, output_tokens, total_tokens = self.provider._extract_usage_tokens(response_body)
        assert input_tokens == 100
        assert output_tokens == 50
        assert total_tokens == 150
    
    def test_extract_usage_tokens_partial(self):
        """Test extracting usage tokens with partial data."""
        response_body = {
            "usage": {
                "input_tokens": 100
            }
        }
        
        input_tokens, output_tokens, total_tokens = self.provider._extract_usage_tokens(response_body)
        assert input_tokens == 100
        assert output_tokens is None
        assert total_tokens is None
    
    def test_extract_usage_tokens_missing(self):
        """Test extracting usage tokens when not present."""
        response_body = {}
        
        input_tokens, output_tokens, total_tokens = self.provider._extract_usage_tokens(response_body)
        assert input_tokens is None
        assert output_tokens is None
        assert total_tokens is None
    
    def test_extract_usage_tokens_none_body(self):
        """Test extracting usage tokens with None response body."""
        response_body = None
        
        input_tokens, output_tokens, total_tokens = self.provider._extract_usage_tokens(response_body)
        assert input_tokens is None
        assert output_tokens is None
        assert total_tokens is None
    
    def test_extract_response_content_list(self):
        """Test extracting response content when it's a list."""
        response_body = {
            "content": [
                {"type": "text", "text": "Hello!"},
                {"type": "text", "text": "How can I help?"}
            ]
        }
        
        result = self.provider._extract_response_content(response_body)
        expected = [
            {"type": "text", "text": "Hello!"},
            {"type": "text", "text": "How can I help?"}
        ]
        assert result == expected
    
    def test_extract_response_content_single(self):
        """Test extracting response content when it's a single item."""
        response_body = {
            "content": {"type": "text", "text": "Hello!"}
        }
        
        result = self.provider._extract_response_content(response_body)
        expected = [{"type": "text", "text": "Hello!"}]
        assert result == expected
    
    def test_extract_response_content_missing(self):
        """Test extracting response content when not present."""
        response_body = {}
        
        result = self.provider._extract_response_content(response_body)
        assert result is None
    
    def test_extract_response_content_none_body(self):
        """Test extracting response content with None response body."""
        response_body = None
        
        result = self.provider._extract_response_content(response_body)
        assert result is None