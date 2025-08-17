"""Tests for OpenAI provider _extract_system_prompt method."""
import pytest
from src.providers.openai import OpenAIProvider


class TestOpenAIExtractSystemPrompt:
    """Test suite for OpenAI provider _extract_system_prompt method."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
    
    def test_extract_system_prompt_from_messages(self):
        """Test extracting system prompt from messages array."""
        body = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "You are a helpful assistant."
    
    def test_extract_system_prompt_from_instructions(self):
        """Test extracting system prompt from instructions field (Responses API)."""
        body = {
            "instructions": "You are a math assistant."
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "You are a math assistant."
    
    def test_extract_system_prompt_no_system_message(self):
        """Test extracting system prompt when no system message exists."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello!"},
                {"role": "assistant", "content": "Hi there!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"
    
    def test_extract_system_prompt_empty_messages(self):
        """Test extracting system prompt with empty messages array."""
        body = {
            "messages": []
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"
    
    def test_extract_system_prompt_no_messages_field(self):
        """Test extracting system prompt when messages field is missing."""
        body = {}
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"
    
    def test_extract_system_prompt_messages_priority(self):
        """Test that system messages take priority over instructions field."""
        body = {
            "messages": [
                {"role": "system", "content": "You are a regular assistant."}
            ],
            "instructions": "You are a specialized math assistant."
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "You are a regular assistant."
    
    def test_extract_system_prompt_fallback_to_instructions(self):
        """Test that instructions field is used when no system message exists."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello!"}
            ],
            "instructions": "You are a specialized math assistant."
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "You are a specialized math assistant."
    
    def test_extract_system_prompt_non_string_content(self):
        """Test extracting system prompt when content is not a string."""
        body = {
            "messages": [
                {"role": "system", "content": ["You are a helpful assistant."]},
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "['You are a helpful assistant.']"
    
    def test_extract_system_prompt_multiple_system_messages(self):
        """Test extracting system prompt when multiple system messages exist (should take first)."""
        body = {
            "messages": [
                {"role": "system", "content": "First system message."},
                {"role": "user", "content": "Hello!"},
                {"role": "system", "content": "Second system message."}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "First system message."
    
    def test_extract_system_prompt_empty_system_content(self):
        """Test extracting system prompt when system message has empty content."""
        body = {
            "messages": [
                {"role": "system", "content": ""},
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == ""
    
    def test_extract_system_prompt_from_input_field(self):
        """Test extracting system prompt from input field (Responses API)."""
        body = {
            "input": [
                {"role": "system", "content": "You are a super helpful math assistant."},
                {"role": "user", "content": "What is 15 + 25?"}
            ],
            "model": "gpt-4o-mini"
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "You are a super helpful math assistant."
    
    def test_extract_system_prompt_messages_priority_over_input(self):
        """Test that messages field takes priority over input field."""
        body = {
            "messages": [
                {"role": "system", "content": "System from messages field."}
            ],
            "input": [
                {"role": "system", "content": "System from input field."},
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "System from messages field."
    
    def test_extract_system_prompt_input_no_system_message(self):
        """Test extracting system prompt from input field when no system message exists."""
        body = {
            "input": [
                {"role": "user", "content": "What is 15 + 25?"},
                {"role": "assistant", "content": "The answer is 40."}
            ],
            "model": "gpt-4o-mini"
        }
        
        result = self.provider._extract_system_prompt(body)
        assert result == "default-system"