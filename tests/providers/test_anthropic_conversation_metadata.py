"""Tests for Anthropic provider extract_conversation_metadata method."""
import pytest
from src.providers.anthropic import AnthropicProvider


class TestAnthropicConversationMetadata:
    """Test suite for Anthropic provider extract_conversation_metadata method."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
    
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