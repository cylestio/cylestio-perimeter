"""Tests for Anthropic provider _extract_system_prompt method."""
import pytest
from src.providers.anthropic import AnthropicProvider


class TestAnthropicExtractSystemPrompt:
    """Test suite for Anthropic provider _extract_system_prompt method."""
    
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