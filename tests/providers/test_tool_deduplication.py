"""Tests for index-based event deduplication functionality."""
import pytest
from src.providers.openai import OpenAIProvider
from src.providers.anthropic import AnthropicProvider
from src.providers.base import SessionInfo
from src.proxy.tools.parser import ToolParser


class TestIndexBasedDeduplication:
    """Test suite for index-based event deduplication across providers."""

    def setup_method(self):
        """Set up test fixtures."""
        self.openai_provider = OpenAIProvider()
        self.anthropic_provider = AnthropicProvider()
        self.tool_parser = ToolParser()

    def test_openai_chat_completions_incremental_processing(self):
        """Test incremental processing for OpenAI Chat Completions API."""
        body = {
            'messages': [
                {'role': 'system', 'content': 'You are a helpful assistant.'},
                {'role': 'user', 'content': 'What is 25 + 17?'},
                {'role': 'assistant', 'content': None, 'tool_calls': [
                    {'id': 'call_abc123', 'function': {'arguments': '{"a":25,"b":17}', 'name': 'calculator'}, 'type': 'function'}
                ]},
                {'role': 'tool', 'tool_call_id': 'call_abc123', 'content': '42'},
                {'role': 'assistant', 'content': 'The result is 42.'},
                {'role': 'user', 'content': 'Now multiply by 2'},
                {'role': 'assistant', 'content': None, 'tool_calls': [
                    {'id': 'call_def456', 'function': {'arguments': '{"a":42,"b":2}', 'name': 'calculator'}, 'type': 'function'}
                ]},
                {'role': 'tool', 'tool_call_id': 'call_def456', 'content': '84'},
                {'role': 'assistant', 'content': 'The result is 84.'},
            ],
            'model': 'gpt-4'
        }

        # Create session info
        session_info = SessionInfo(
            conversation_id="test-conv-123",
            message_count=len(body['messages']),
            model="gpt-4",
            last_processed_index=0
        )

        session_id = "test-session-123"

        # First call: should process all messages (starting from index 0)
        events1, new_index1 = self.openai_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id=session_id,
            is_new_session=True,
            last_processed_index=0
        )

        # Should process all 9 messages
        assert new_index1 == 9

        # Should have session start event, LLM call start event, and tool result events
        tool_events1 = [e for e in events1 if e.name == "tool.result"]
        assert len(tool_events1) == 2  # Two tool results
        # Verify tool names are correctly extracted from tool_calls
        for event in tool_events1:
            assert event.attributes.get("tool.name") == "calculator"

        # Second call: should process no new messages (all already processed)
        events2, new_index2 = self.openai_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id=session_id,
            is_new_session=False,
            last_processed_index=new_index1
        )

        # No new messages to process
        assert new_index2 == 9  # Same as before
        assert len(events2) == 0  # No new events

    def test_openai_responses_api_incremental_processing(self):
        """Test incremental processing for OpenAI Responses API."""
        body = {
            'input': [
                {'role': 'system', 'content': 'You are a helpful assistant.'},
                {'role': 'user', 'content': 'What is 15 + 25?'},
                {
                    'arguments': '{"a":15,"b":25}',
                    'call_id': 'call_xyz123',
                    'name': 'calculator',
                    'type': 'function_call',
                    'status': 'completed'
                },
                {
                    'type': 'function_call_output',
                    'call_id': 'call_xyz123',
                    'output': '40'
                },
                {'role': 'user', 'content': 'Now multiply by 3'},
                {
                    'arguments': '{"a":40,"b":3}',
                    'call_id': 'call_uvw456',
                    'name': 'calculator',
                    'type': 'function_call',
                    'status': 'completed'
                },
                {
                    'type': 'function_call_output',
                    'call_id': 'call_uvw456',
                    'output': '120'
                }
            ],
            'model': 'gpt-4'
        }

        session_info = SessionInfo(last_processed_index=0)

        # First call: process all messages
        events1, new_index1 = self.openai_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=True,
            last_processed_index=0
        )

        assert new_index1 == 7  # All 7 messages processed

        # Second call: no new messages
        events2, new_index2 = self.openai_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=False,
            last_processed_index=new_index1
        )

        assert new_index2 == 7  # Same index
        assert len(events2) == 0  # No new events

    def test_anthropic_api_incremental_processing(self):
        """Test incremental processing for Anthropic API."""
        body = {
            'messages': [
                {'role': 'user', 'content': [
                    {'type': 'text', 'text': 'What is the weather like?'}
                ]},
                {'role': 'assistant', 'content': [
                    {'type': 'tool_use', 'id': 'toolu_123', 'name': 'get_weather', 'input': {'location': 'San Francisco'}}
                ]},
                {'role': 'user', 'content': [
                    {'type': 'tool_result', 'tool_use_id': 'toolu_123', 'content': 'Sunny, 72°F'}
                ]},
                {'role': 'assistant', 'content': [
                    {'type': 'text', 'text': 'The weather in San Francisco is sunny and 72°F.'}
                ]}
            ],
            'model': 'claude-3-sonnet-20240229'
        }

        session_info = SessionInfo(last_processed_index=0)

        # First call: process all messages
        events1, new_index1 = self.anthropic_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=True,
            last_processed_index=0
        )

        assert new_index1 == 4  # All 4 messages processed

        # Should have tool result events
        tool_events1 = [e for e in events1 if e.name == "tool.result"]
        assert len(tool_events1) == 1
        # Verify tool name is correctly extracted from tool_use
        assert tool_events1[0].attributes.get("tool.name") == "get_weather"

        # Second call: no new messages
        events2, new_index2 = self.anthropic_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=False,
            last_processed_index=new_index1
        )

        assert new_index2 == 4  # Same index
        assert len(events2) == 0  # No new events

    def test_partial_incremental_processing(self):
        """Test that only new messages are processed when conversation grows."""
        # Initial conversation
        initial_body = {
            'messages': [
                {'role': 'system', 'content': 'You are a helpful assistant.'},
                {'role': 'user', 'content': 'What is 25 + 17?'},
                {'role': 'assistant', 'content': None, 'tool_calls': [
                    {'id': 'call_abc123', 'function': {'arguments': '{"a":25,"b":17}', 'name': 'calculator'}, 'type': 'function'}
                ]},
                {'role': 'tool', 'tool_call_id': 'call_abc123', 'content': '42'},
                {'role': 'assistant', 'content': 'The result is 42.'}
            ],
            'model': 'gpt-4'
        }

        # Extended conversation with additional messages
        extended_body = {
            'messages': initial_body['messages'] + [
                {'role': 'user', 'content': 'Now multiply by 2'},
                {'role': 'assistant', 'content': None, 'tool_calls': [
                    {'id': 'call_def456', 'function': {'arguments': '{"a":42,"b":2}', 'name': 'calculator'}, 'type': 'function'}
                ]},
                {'role': 'tool', 'tool_call_id': 'call_def456', 'content': '84'},
                {'role': 'assistant', 'content': 'The result is 84.'}
            ],
            'model': 'gpt-4'
        }

        session_info = SessionInfo(last_processed_index=0)

        # Process initial conversation
        events1, processed_index = self.openai_provider.extract_request_events(
            body=initial_body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=True,
            last_processed_index=0
        )

        assert processed_index == 5  # 5 messages in initial conversation

        # Process extended conversation (should only process new messages)
        events2, new_processed_index = self.openai_provider.extract_request_events(
            body=extended_body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=False,
            last_processed_index=processed_index
        )

        assert new_processed_index == 9  # Total messages in extended conversation

        # Should only process the new messages (indices 5-8)
        # This means only the new tool result should be processed
        tool_events2 = [e for e in events2 if e.name == "tool.result"]
        assert len(tool_events2) == 1  # Only the new tool result
        # Verify tool name is correctly extracted
        assert tool_events2[0].attributes.get("tool.name") == "calculator"

    def test_empty_conversation_processing(self):
        """Test that no events are created when there are no new messages."""
        body = {
            'messages': [
                {'role': 'system', 'content': 'You are a helpful assistant.'},
                {'role': 'user', 'content': 'Hello!'},
                {'role': 'assistant', 'content': 'Hello! How can I help you?'}
            ],
            'model': 'gpt-4'
        }

        session_info = SessionInfo(last_processed_index=3)  # All messages already processed

        # Should process no new messages
        events, new_index = self.openai_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=False,
            last_processed_index=3
        )

        assert new_index == 3  # Same index
        assert len(events) == 0  # No events created

    def test_conversation_growth_cylestio_metadata(self):
        """Test that metadata correctly reflects conversation growth."""
        initial_messages = [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': 'Hello!'}
        ]

        extended_messages = initial_messages + [
            {'role': 'assistant', 'content': 'Hello! How can I help you?'},
            {'role': 'user', 'content': 'What is 2+2?'}
        ]

        initial_body = {'messages': initial_messages, 'model': 'gpt-4'}
        extended_body = {'messages': extended_messages, 'model': 'gpt-4'}

        session_info = SessionInfo(last_processed_index=0)

        # Process initial messages
        events1, index1 = self.openai_provider.extract_request_events(
            body=initial_body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=True,
            last_processed_index=0
        )

        # Process extended conversation
        events2, index2 = self.openai_provider.extract_request_events(
            body=extended_body,
            session_info=session_info,
            session_id="test-session",
            is_new_session=False,
            last_processed_index=index1
        )

        assert index1 == 2  # Initial messages
        assert index2 == 4  # Extended messages

        # Check that the LLM call start event contains metadata about message growth
        llm_events2 = [e for e in events2 if e.name == "llm.call.start"]
        if llm_events2:
            event_data = llm_events2[0].data
            metadata = event_data.get("request_data", {}).get("_cylestio_metadata", {})
            assert metadata.get("total_messages") == 4
            assert metadata.get("new_messages") == 2
            assert metadata.get("from_index") == 2
