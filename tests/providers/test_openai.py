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
            "cylestio_trace_id": "test-trace-id",
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
            "cylestio_trace_id": "test-trace-id",
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
            "cylestio_trace_id": "test-trace-id",
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
            "cylestio_trace_id": "test-trace-id",
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
            "cylestio_trace_id": "test-trace-id",
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
            "cylestio_trace_id": "test-trace-id",
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
    
    def test_extract_conversation_metadata_required_fields_all_present(self):
        """Test extraction of all required fields when present."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "seed": 12345,
            "response_format": {"type": "json_object"},
            "tool_choice": "auto",
            "logit_bias": {"50256": -100, "50257": 50},
            "n": 2,
            "stop": ["\n", "END"],
            "user": "user123",
            "temperature": 0.7  # Existing field for validation
        }
        
        result = self.provider.extract_conversation_metadata(body)
        
        # Verify all new required fields are extracted
        assert result["seed"] == 12345
        assert result["response_format"] == {"type": "json_object"}
        assert result["tool_choice"] == "auto"
        assert result["logit_bias"] == {"50256": -100, "50257": 50}
        assert result["n"] == 2
        assert result["stop"] == ["\n", "END"]
        assert result["user"] == "user123"
        
        # Verify existing fields still work
        assert result["temperature"] == 0.7
    
    def test_extract_conversation_metadata_required_fields_partial(self):
        """Test extraction when only some required fields are present."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "seed": 42,
            "tool_choice": "none",
            "user": "partial_user"
            # Missing: response_format, logit_bias, n, stop
        }
        
        result = self.provider.extract_conversation_metadata(body)
        
        # Should extract only present fields
        assert result["seed"] == 42
        assert result["tool_choice"] == "none"
        assert result["user"] == "partial_user"
        
        # Should not include missing fields
        assert "response_format" not in result
        assert "logit_bias" not in result
        assert "n" not in result
        assert "stop" not in result
    
    def test_extract_conversation_metadata_required_fields_none_present(self):
        """Test graceful handling when no new required fields are present."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "temperature": 0.5  # Only existing field
        }
        
        result = self.provider.extract_conversation_metadata(body)
        
        # Should not crash or add any new fields
        assert "seed" not in result
        assert "response_format" not in result
        assert "tool_choice" not in result
        assert "logit_bias" not in result
        assert "n" not in result
        assert "stop" not in result
        assert "user" not in result
        
        # Should still handle existing fields
        assert result["temperature"] == 0.5
    
    def test_extract_conversation_metadata_complex_response_format(self):
        """Test extraction of complex response_format objects."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "response",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "answer": {"type": "string"},
                            "confidence": {"type": "number"}
                        }
                    }
                }
            }
        }
        
        result = self.provider.extract_conversation_metadata(body)
        
        # Should capture entire complex object
        assert "response_format" in result
        assert result["response_format"]["type"] == "json_schema"
        assert "json_schema" in result["response_format"]
        assert result["response_format"]["json_schema"]["name"] == "response"
    
    def test_extract_conversation_metadata_tool_choice_variations(self):
        """Test extraction of different tool_choice formats."""
        # String format
        body_string = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "tool_choice": "required"
        }
        
        result = self.provider.extract_conversation_metadata(body_string)
        assert result["tool_choice"] == "required"
        
        # Object format
        body_object = {
            "model": "gpt-4", 
            "messages": [{"role": "user", "content": "Hello"}],
            "tool_choice": {
                "type": "function",
                "function": {"name": "get_weather"}
            }
        }
        
        result = self.provider.extract_conversation_metadata(body_object)
        assert result["tool_choice"]["type"] == "function"
        assert result["tool_choice"]["function"]["name"] == "get_weather"
    
    def test_extract_conversation_metadata_stop_variations(self):
        """Test extraction of different stop sequence formats."""
        # String format
        body_string = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "stop": "\\n"
        }
        
        result = self.provider.extract_conversation_metadata(body_string)
        assert result["stop"] == "\\n"
        
        # Array format
        body_array = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "stop": ["\\n", "END", "STOP", "###"]
        }
        
        result = self.provider.extract_conversation_metadata(body_array)
        assert result["stop"] == ["\\n", "END", "STOP", "###"]
        assert len(result["stop"]) == 4
    
    def test_extract_conversation_metadata_malformed_fields(self):
        """Test error resilience with malformed field values."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "seed": "not_a_number",  # Should be integer
            "response_format": "invalid_format",  # Should be object
            "tool_choice": 123,  # Should be string or object
            "logit_bias": "not_an_object",  # Should be object
            "n": "not_a_number",  # Should be integer
            "stop": 42,  # Should be string or array
            "user": {"not": "a_string"}  # Should be string
        }
        
        # Should not crash, should extract fields as-is
        result = self.provider.extract_conversation_metadata(body)
        
        # Should still extract all fields (no validation, just collection)
        assert result["seed"] == "not_a_number"
        assert result["response_format"] == "invalid_format"
        assert result["tool_choice"] == 123
        assert result["logit_bias"] == "not_an_object"
        assert result["n"] == "not_a_number" 
        assert result["stop"] == 42
        assert result["user"] == {"not": "a_string"}
    
    def test_extract_conversation_metadata_null_values(self):
        """Test handling of null/None values."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "seed": None,
            "response_format": None,
            "tool_choice": None,
            "logit_bias": None,
            "n": None,
            "stop": None,
            "user": None
        }
        
        result = self.provider.extract_conversation_metadata(body)
        
        # Should extract None values (let backend handle validation)
        assert result["seed"] is None
        assert result["response_format"] is None
        assert result["tool_choice"] is None
        assert result["logit_bias"] is None
        assert result["n"] is None
        assert result["stop"] is None
        assert result["user"] is None
    
    def test_extract_conversation_metadata_backward_compatibility(self):
        """Test that existing functionality is preserved."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": "Hello"}
            ],
            "max_tokens": 100,
            "temperature": 0.7,
            "top_p": 0.9,
            "frequency_penalty": 0.1,
            "presence_penalty": 0.2,
            "tools": [
                {"type": "function", "function": {"name": "get_weather"}}
            ],
            # Add some new fields too
            "seed": 999,
            "user": "compatibility_test"
        }
        
        result = self.provider.extract_conversation_metadata(body)
        
        # Verify all existing functionality still works
        assert result["max_tokens"] == 100
        assert result["temperature"] == 0.7
        assert result["top_p"] == 0.9
        assert result["frequency_penalty"] == 0.1
        assert result["presence_penalty"] == 0.2
        assert result["has_system_message"] is True
        assert result["system_length"] == 16  # "You are helpful." is 16 characters
        assert result["tools_count"] == 1
        assert result["tool_names"] == ["get_weather"]
        
        # Verify new fields also work
        assert result["seed"] == 999
        assert result["user"] == "compatibility_test"
    
    def test_extract_request_events_includes_enhanced_metadata(self):
        """Test that enhanced metadata appears in generated events."""
        from src.providers.base import SessionInfo
        
        # Create body with enhanced fields
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello"}],
            "seed": 12345,
            "response_format": {"type": "json_object"},
            "tool_choice": "auto",
            "user": "event_test_user",
            "temperature": 0.7
        }
        
        # Extract metadata first
        metadata = self.provider.extract_conversation_metadata(body)
        
        # Create SessionInfo with the metadata
        session_info = SessionInfo(
            conversation_id="test_session",
            is_session_start=True,
            last_processed_index=0,
            model="gpt-4",
            is_streaming=False,
            metadata=metadata
        )
        
        # Generate events
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test_session",
            is_new_session=True,
            computed_agent_id="test_agent"
        )
        
        # Verify events were generated
        assert len(events) >= 1
        
        # Find LLM start event
        llm_start_event = None
        for event in events:
            if hasattr(event, 'attributes') and 'llm.request.data' in event.attributes:
                llm_start_event = event
                break
        
        assert llm_start_event is not None, "LLM start event should be generated"
        
        # Verify enhanced metadata is included in request data
        request_data = llm_start_event.attributes['llm.request.data']
        
        # Check that all enhanced fields are present
        assert 'seed' in request_data
        assert request_data['seed'] == 12345
        assert 'response_format' in request_data
        assert request_data['response_format'] == {"type": "json_object"}
        assert 'tool_choice' in request_data
        assert request_data['tool_choice'] == "auto"
        assert 'user' in request_data
        assert request_data['user'] == "event_test_user"
        
        # Verify existing fields are still present
        assert 'model' in request_data
        assert request_data['model'] == "gpt-4"
        assert 'messages' in request_data
        assert 'temperature' in request_data
        assert request_data['temperature'] == 0.7


class TestAgentWorkflowIdInEvents:
    """Tests for agent_workflow_id in event attributes."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()

    def test_agent_workflow_id_added_to_finish_event(self):
        """Test agent_workflow.id is added to llm.call.finish event."""
        response_body = {
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Hello there!"
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
            }
        }

        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "gpt-4",
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
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Hello there!"
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
            }
        }

        session_id = "test-session"
        duration_ms = 100.0
        tool_uses = []
        request_metadata = {
            "cylestio_trace_id": "test-trace-id",
            "agent_id": "test-agent",
            "model": "gpt-4"
            # No agent_workflow_id
        }

        events = self.provider.extract_response_events(
            response_body, session_id, duration_ms, tool_uses, request_metadata
        )

        assert len(events) == 1
        llm_event = events[0]
        # agent_workflow.id should not be in attributes
        assert "agent_workflow.id" not in llm_event.attributes