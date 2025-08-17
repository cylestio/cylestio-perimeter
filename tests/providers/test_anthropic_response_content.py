"""Tests for Anthropic provider _extract_response_content method."""
import pytest
from src.providers.anthropic import AnthropicProvider


class TestAnthropicResponseContent:
    """Test suite for Anthropic provider _extract_response_content method."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
    
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