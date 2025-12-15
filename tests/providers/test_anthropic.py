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
    
    def test_extract_response_events_with_stop_reason(self):
        """Test extracting stop_reason from Anthropic response."""
        response_body = {
            "stop_reason": "end_turn",
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == "end_turn"
    
    def test_extract_response_events_with_stop_sequence(self):
        """Test extracting stop_sequence from Anthropic response."""
        response_body = {
            "stop_reason": "stop_sequence",
            "stop_sequence": "\n\n",
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == "stop_sequence"
        assert "stop_sequence" in llm_event.attributes
        assert llm_event.attributes["stop_sequence"] == "\n\n"
    
    def test_extract_response_events_with_tool_use_stop(self):
        """Test extracting stop_reason when stopped for tool use."""
        response_body = {
            "stop_reason": "tool_use",
            "content": [
                {"type": "text", "text": "I'll help you with that calculation."},
                {"type": "tool_use", "id": "toolu_123", "name": "calculator", "input": {"expression": "2+2"}}
            ],
            "usage": {"input_tokens": 20, "output_tokens": 15}
        }
        
        session_id = "test-session"
        duration_ms = 150.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == "tool_use"
        
        # Should not have stop_sequence since it wasn't provided
        assert "stop_sequence" not in llm_event.attributes
    
    def test_extract_response_events_all_new_fields(self):
        """Test extracting all new response fields together."""
        response_body = {
            "stop_reason": "stop_sequence",
            "stop_sequence": "###",
            "content": [
                {"type": "text", "text": "This is a response that was stopped by a sequence."}
            ],
            "usage": {"input_tokens": 50, "output_tokens": 25}
        }
        
        session_id = "test-session"
        duration_ms = 200.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-haiku-20240307"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should have both new fields
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == "stop_sequence"
        assert "stop_sequence" in llm_event.attributes
        assert llm_event.attributes["stop_sequence"] == "###"
    
    def test_extract_response_events_missing_fields(self):
        """Test graceful handling when new fields are missing."""
        response_body = {
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
            # No stop_reason or stop_sequence
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should not have any of the new fields
        assert "stop_reason" not in llm_event.attributes
        assert "stop_sequence" not in llm_event.attributes
        
        # But should still have existing fields
        assert "llm.vendor" in llm_event.attributes
        assert "llm.model" in llm_event.attributes
    
    def test_extract_response_events_null_stop_sequence(self):
        """Test handling when stop_sequence is null/empty."""
        response_body = {
            "stop_reason": "end_turn",
            "stop_sequence": None,  # Should not be included when null
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should have stop_reason but not stop_sequence (since it was null)
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == "end_turn"
        assert "stop_sequence" not in llm_event.attributes
    
    def test_extract_response_events_empty_stop_sequence(self):
        """Test handling when stop_sequence is empty string."""
        response_body = {
            "stop_reason": "stop_sequence",
            "stop_sequence": "",  # Empty string should not be included
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should have stop_reason but not stop_sequence (since it was empty)
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == "stop_sequence"
        assert "stop_sequence" not in llm_event.attributes
    
    def test_extract_response_events_malformed_response(self):
        """Test error resilience with malformed response data."""
        response_body = {
            "stop_reason": 123,  # Different type, should still work
            "content": "not_a_list",  # Malformed: should be list
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }
        
        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
        }
        
        # Should not crash, should handle gracefully
        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )
        
        assert len(events) == 1
        llm_event = events[0]
        
        # Should still extract stop_reason despite malformed content
        assert "stop_reason" in llm_event.attributes
        assert llm_event.attributes["stop_reason"] == 123


class TestAgentWorkflowIdInEvents:
    """Tests for agent_workflow_id in event attributes."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()

    def test_agent_workflow_id_added_to_finish_event(self):
        """Test agent_workflow.id is added to llm.call.finish event."""
        response_body = {
            "stop_reason": "end_turn",
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }

        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229",
            "agent_workflow_id": "my-agent-workflow"  # Include agent_workflow_id
        }

        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )

        assert len(events) == 1
        llm_event = events[0]
        assert "agent_workflow.id" in llm_event.attributes
        assert llm_event.attributes["agent_workflow.id"] == "my-agent-workflow"

    def test_agent_workflow_id_none_when_not_provided(self):
        """Test agent_workflow.id is not added when not in request_metadata."""
        response_body = {
            "stop_reason": "end_turn",
            "content": [
                {"type": "text", "text": "Hello there!"}
            ],
            "usage": {"input_tokens": 10, "output_tokens": 5}
        }

        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "claude-3-sonnet-20240229"
            # No agent_workflow_id
        }

        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )

        assert len(events) == 1
        llm_event = events[0]
        # agent_workflow.id should not be in attributes
        assert "agent_workflow.id" not in llm_event.attributes