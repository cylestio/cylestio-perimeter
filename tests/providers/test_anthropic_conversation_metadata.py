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
    
    def test_extract_conversation_metadata_with_user_metadata(self):
        """Test extracting user-provided metadata."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "metadata": {"user_id": "123", "session_type": "demo", "context": "test"},
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "user_metadata": {"user_id": "123", "session_type": "demo", "context": "test"}
        }
        assert result == expected
    
    def test_extract_conversation_metadata_with_tool_choice_any(self):
        """Test extracting tool_choice with type 'any'."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "tool_choice": {"type": "any"},
            "tools": [
                {"name": "calculator", "type": "function"}
            ],
            "messages": [
                {"role": "user", "content": "Calculate 2+2"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "tools_count": 1,
            "tool_names": ["calculator"],
            "tool_choice": {"type": "any"}
        }
        assert result == expected
    
    def test_extract_conversation_metadata_with_tool_choice_specific(self):
        """Test extracting tool_choice with specific tool."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "tool_choice": {"type": "tool", "name": "calculator"},
            "tools": [
                {"name": "calculator", "type": "function"},
                {"name": "weather", "type": "function"}
            ],
            "messages": [
                {"role": "user", "content": "Calculate 2+2"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "tools_count": 2,
            "tool_names": ["calculator", "weather"],
            "tool_choice": {"type": "tool", "name": "calculator"}
        }
        assert result == expected
    
    def test_extract_conversation_metadata_with_stop_sequences(self):
        """Test extracting stop_sequences."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "stop_sequences": ["\n\n", "END", "STOP", "###"],
            "messages": [
                {"role": "user", "content": "Generate some text"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "stop_sequences": ["\n\n", "END", "STOP", "###"]
        }
        assert result == expected
    
    def test_extract_conversation_metadata_all_new_fields(self):
        """Test extracting all new fields together."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": 1000,
            "temperature": 0.7,
            "metadata": {"user_id": "123", "context": "test"},
            "tool_choice": {"type": "any"},
            "stop_sequences": ["\n\n", "END"],
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
            "tools_count": 1,
            "tool_names": ["calculator"],
            "user_metadata": {"user_id": "123", "context": "test"},
            "tool_choice": {"type": "any"},
            "stop_sequences": ["\n\n", "END"]
        }
        assert result == expected
    
    def test_extract_conversation_metadata_malformed_metadata(self):
        """Test graceful handling of malformed metadata field."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "metadata": "not_an_object",  # Should be dict
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        # Should not crash and should not include user_metadata
        assert "user_metadata" not in result
    
    def test_extract_conversation_metadata_malformed_stop_sequences(self):
        """Test graceful handling of malformed stop_sequences field."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "stop_sequences": "not_an_array",  # Should be list
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        # Should not crash and should not include stop_sequences
        assert "stop_sequences" not in result
    
    def test_extract_conversation_metadata_null_fields(self):
        """Test graceful handling of null fields."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "metadata": None,
            "tool_choice": None,
            "stop_sequences": None,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        # Should not crash and should not include any of the null fields
        assert "user_metadata" not in result
        assert "tool_choice" not in result
        assert "stop_sequences" not in result
    
    def test_extract_conversation_metadata_empty_arrays_and_objects(self):
        """Test handling of empty but valid arrays and objects."""
        body = {
            "model": "claude-3-sonnet-20240229",
            "metadata": {},  # Empty but valid dict
            "stop_sequences": [],  # Empty but valid list
            "tool_choice": {"type": "auto"},  # Valid tool_choice
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body)
        expected = {
            "user_metadata": {},
            "stop_sequences": [],
            "tool_choice": {"type": "auto"}
        }
        assert result == expected