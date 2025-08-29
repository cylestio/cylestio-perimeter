"""Tests for OpenAI provider functionality."""
import pytest
from src.providers.openai import OpenAIProvider


class TestOpenAIProvider:
    """Test suite for OpenAI provider core methods."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
    
    def test_provider_name(self):
        """Test provider name property."""
        assert self.provider.name == "openai"
    
    def test_extract_model_from_body(self):
        """Test extracting model from request body."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        result = self.provider.extract_model_from_body(body)
        assert result == "gpt-4"
    
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
    
    def test_extract_conversation_metadata_system_messages(self):
        """Test system message extraction from messages array."""
        # Test single system message
        body_single_system = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body_single_system)
        assert result["has_system_message"] is True
        assert result["system_length"] == 28  # Length of "You are a helpful assistant."
        
        # Test multiple system messages
        body_multiple_system = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are helpful."},
                {"role": "system", "content": "Be concise."},
                {"role": "user", "content": "Hello"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body_multiple_system)
        assert result["has_system_message"] is True
        assert result["system_length"] == 27  # Length of "You are helpful.Be concise."
        
        # Test no system message
        body_no_system = {
            "model": "gpt-4",
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body_no_system)
        assert "has_system_message" not in result
        assert "system_length" not in result
        
        # Test empty messages array
        body_empty_messages = {
            "model": "gpt-4",
            "messages": []
        }
        
        result = self.provider.extract_conversation_metadata(body_empty_messages)
        assert "has_system_message" not in result
        assert "system_length" not in result
        
        # Test structured content (non-string)
        body_structured_content = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": {"type": "text", "text": "You are helpful"}},
                {"role": "user", "content": "Hello"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body_structured_content)
        assert result["has_system_message"] is True
        assert result["system_length"] > 0  # Should convert dict to string
        
        # Test missing content field
        body_missing_content = {
            "model": "gpt-4",
            "messages": [
                {"role": "system"},  # No content field
                {"role": "user", "content": "Hello"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body_missing_content)
        assert result["has_system_message"] is True
        assert result["system_length"] == 0  # Empty content
        
        # Test malformed messages (no role field)
        body_no_role = {
            "model": "gpt-4",
            "messages": [
                {"content": "Some content"},  # No role field
                {"role": "user", "content": "Hello"}
            ]
        }
        
        result = self.provider.extract_conversation_metadata(body_no_role)
        assert "has_system_message" not in result
        assert "system_length" not in result
    
    def test_extract_response_events_with_finish_reason(self):
        """Test extracting finish_reason from OpenAI response."""
        response_body = {
            "choices": [
                {
                    "finish_reason": "stop",
                    "message": {"content": "Hello there!"}
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_span_id": "test-trace-span",
            "agent_id": "test-agent",
            "model": "gpt-4"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        assert "finish_reason" in llm_event.attributes
        assert llm_event.attributes["finish_reason"] == "stop"
    
    def test_extract_response_events_with_system_fingerprint(self):
        """Test extracting system_fingerprint from OpenAI response."""
        response_body = {
            "system_fingerprint": "fp_12345",
            "choices": [
                {
                    "finish_reason": "stop",
                    "message": {"content": "Hello there!"}
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_span_id": "test-trace-span",
            "agent_id": "test-agent",
            "model": "gpt-4"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        assert "system_fingerprint" in llm_event.attributes
        assert llm_event.attributes["system_fingerprint"] == "fp_12345"
    
    def test_extract_response_events_with_refusal(self):
        """Test extracting refusal from OpenAI response."""
        response_body = {
            "choices": [
                {
                    "finish_reason": "stop",
                    "message": {
                        "content": None,
                        "refusal": "I cannot help with that request."
                    }
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_span_id": "test-trace-span",
            "agent_id": "test-agent",
            "model": "gpt-4"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        assert "refusal" in llm_event.attributes
        assert llm_event.attributes["refusal"] == "I cannot help with that request."
    
    def test_extract_response_events_all_new_fields(self):
        """Test extracting all new response fields together."""
        response_body = {
            "system_fingerprint": "fp_67890",
            "choices": [
                {
                    "finish_reason": "length",
                    "message": {
                        "content": "This is a partial response...",
                        "refusal": None  # Should not be included when null
                    }
                }
            ],
            "usage": {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150}
        }
        
        session_id = "test-session"
        duration_ms = 200.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_span_id": "test-trace-span",
            "agent_id": "test-agent",
            "model": "gpt-4-turbo"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should have system_fingerprint and finish_reason
        assert "system_fingerprint" in llm_event.attributes
        assert llm_event.attributes["system_fingerprint"] == "fp_67890"
        assert "finish_reason" in llm_event.attributes
        assert llm_event.attributes["finish_reason"] == "length"
        
        # Should NOT have refusal since it was null
        assert "refusal" not in llm_event.attributes
    
    def test_extract_response_events_missing_fields(self):
        """Test graceful handling when new fields are missing."""
        response_body = {
            "choices": [
                {
                    "message": {"content": "Hello there!"}
                    # No finish_reason
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
            # No system_fingerprint
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_span_id": "test-trace-span",
            "agent_id": "test-agent",
            "model": "gpt-4"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should not have any of the new fields
        assert "finish_reason" not in llm_event.attributes
        assert "system_fingerprint" not in llm_event.attributes
        assert "refusal" not in llm_event.attributes
        
        # But should still have existing fields
        assert "llm.vendor" in llm_event.attributes
        assert "llm.model" in llm_event.attributes
    
    def test_extract_response_events_malformed_response(self):
        """Test error resilience with malformed response data."""
        response_body = {
            "choices": "not_a_list",  # Malformed: should be list
            "system_fingerprint": 12345  # Different type, should still work
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_span_id": "test-trace-span",
            "agent_id": "test-agent",
            "model": "gpt-4"
        }
        
        # Should not crash, should handle gracefully
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should still extract system_fingerprint despite malformed choices
        assert "system_fingerprint" in llm_event.attributes
        assert llm_event.attributes["system_fingerprint"] == 12345