"""Tests for Anthropic provider _extract_usage_tokens method."""
import pytest
from src.providers.anthropic import AnthropicProvider


class TestAnthropicUsageTokens:
    """Test suite for Anthropic provider _extract_usage_tokens method."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
    
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