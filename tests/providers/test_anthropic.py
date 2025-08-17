"""Tests for Anthropic provider functionality."""
import pytest
from src.providers.anthropic import AnthropicProvider


class TestAnthropicProvider:
    """Test suite for Anthropic provider core methods."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
    
    def test_provider_name(self):
        """Test provider name property."""
        assert self.provider.name == "anthropic"
    
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
    
    def test_extract_streaming_from_body(self):
        """Test extracting streaming flag from request body."""
        # Test streaming enabled
        body_streaming = {
            "stream": True,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_streaming_from_body(body_streaming)
        assert result is True
        
        # Test streaming disabled
        body_no_streaming = {
            "stream": False,
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_streaming_from_body(body_no_streaming)
        assert result is False
        
        # Test default (no stream field)
        body_default = {
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_streaming_from_body(body_default)
        assert result is False