"""Tests for ToolParser functionality."""
from src.proxy.tools.parser import ToolParser


class TestToolParserOpenAI:
    """Test suite for OpenAI tool parsing."""

    def setup_method(self):
        """Set up test fixtures."""
        self.parser = ToolParser()

    def test_parse_tool_results_extracts_name_from_tool_calls(self):
        """Test that tool name is extracted from assistant's tool_calls when not in tool message."""
        body = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Calculate sqrt of 144"},
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_abc123",
                            "type": "function",
                            "function": {
                                "name": "math_calculator",
                                "arguments": '{"operation":"sqrt","number":144}',
                            },
                        }
                    ],
                },
                {"role": "tool", "tool_call_id": "call_abc123", "content": "12.0"},
            ]
        }

        results = self.parser.parse_tool_results(body, provider="openai")

        assert len(results) == 1
        assert results[0]["name"] == "math_calculator"
        assert results[0]["tool_use_id"] == "call_abc123"
        assert results[0]["result"] == "12.0"

    def test_parse_tool_results_multiple_tool_calls(self):
        """Test parsing multiple sequential tool calls in a conversation."""
        body = {
            "messages": [
                {"role": "user", "content": "Calculate sqrt of 144 and 36"},
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "type": "function",
                            "function": {"name": "sqrt", "arguments": '{"n":144}'},
                        }
                    ],
                },
                {"role": "tool", "tool_call_id": "call_1", "content": "12.0"},
                {"role": "assistant", "content": "The sqrt of 144 is 12."},
                {"role": "user", "content": "Now sqrt of 36"},
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_2",
                            "type": "function",
                            "function": {"name": "sqrt", "arguments": '{"n":36}'},
                        }
                    ],
                },
                {"role": "tool", "tool_call_id": "call_2", "content": "6.0"},
            ]
        }

        results = self.parser.parse_tool_results(body, provider="openai")

        assert len(results) == 2
        assert results[0]["name"] == "sqrt"
        assert results[0]["tool_use_id"] == "call_1"
        assert results[1]["name"] == "sqrt"
        assert results[1]["tool_use_id"] == "call_2"

    def test_parse_tool_results_backward_compat_message_name(self):
        """Test backward compatibility: use message.name if present."""
        body = {
            "messages": [
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_abc",
                            "function": {"name": "tool_from_call", "arguments": "{}"},
                        }
                    ],
                },
                {
                    "role": "tool",
                    "tool_call_id": "call_abc",
                    "name": "tool_from_message",  # Has name in message (rare but possible)
                    "content": "result",
                },
            ]
        }

        results = self.parser.parse_tool_results(body, provider="openai")

        assert len(results) == 1
        # Should prefer message.name (backward compat)
        assert results[0]["name"] == "tool_from_message"

    def test_parse_tool_results_no_matching_tool_call(self):
        """Test handling when tool result has no matching tool_call."""
        body = {
            "messages": [
                {"role": "tool", "tool_call_id": "orphan_call", "content": "result"}
            ]
        }

        results = self.parser.parse_tool_results(body, provider="openai")

        assert len(results) == 1
        assert results[0]["name"] is None  # No matching tool_call found
        assert results[0]["tool_use_id"] == "orphan_call"

    def test_parse_tool_results_empty_messages(self):
        """Test with empty messages array."""
        body = {"messages": []}

        results = self.parser.parse_tool_results(body, provider="openai")

        assert results == []

    def test_parse_tool_results_no_tool_messages(self):
        """Test conversation without any tool messages."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
            ]
        }

        results = self.parser.parse_tool_results(body, provider="openai")

        assert results == []


class TestToolParserAnthropic:
    """Test suite for Anthropic tool parsing."""

    def setup_method(self):
        """Set up test fixtures."""
        self.parser = ToolParser()

    def test_parse_tool_results_extracts_name_from_tool_use(self):
        """Test that tool name is extracted from assistant's tool_use blocks."""
        body = {
            "messages": [
                {"role": "user", "content": "What is 25 + 17?"},
                {
                    "role": "assistant",
                    "content": [
                        {"type": "text", "text": "Let me calculate that."},
                        {
                            "type": "tool_use",
                            "id": "toolu_123",
                            "name": "add",
                            "input": {"a": 25, "b": 17},
                        },
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": "toolu_123",
                            "content": "42",
                        }
                    ],
                },
            ]
        }

        results = self.parser.parse_tool_results(body, provider="anthropic")

        assert len(results) == 1
        assert results[0]["name"] == "add"
        assert results[0]["tool_use_id"] == "toolu_123"
        assert results[0]["result"] == "42"


class TestBuildOpenAIToolCallMap:
    """Test suite for the helper method that builds tool_call_id -> name map."""

    def setup_method(self):
        """Set up test fixtures."""
        self.parser = ToolParser()

    def test_builds_map_from_single_assistant_message(self):
        """Test map building from a single assistant message with tool_calls."""
        messages = [
            {
                "role": "assistant",
                "tool_calls": [
                    {"id": "call_1", "function": {"name": "tool_a", "arguments": "{}"}},
                    {"id": "call_2", "function": {"name": "tool_b", "arguments": "{}"}},
                ],
            }
        ]

        result = self.parser._build_openai_tool_call_map(messages)

        assert result == {"call_1": "tool_a", "call_2": "tool_b"}

    def test_builds_map_from_multiple_assistant_messages(self):
        """Test map building across multiple assistant messages."""
        messages = [
            {
                "role": "assistant",
                "tool_calls": [
                    {"id": "call_1", "function": {"name": "tool_a", "arguments": "{}"}}
                ],
            },
            {"role": "tool", "tool_call_id": "call_1", "content": "result"},
            {"role": "assistant", "content": "First result received."},
            {
                "role": "assistant",
                "tool_calls": [
                    {"id": "call_2", "function": {"name": "tool_b", "arguments": "{}"}}
                ],
            },
        ]

        result = self.parser._build_openai_tool_call_map(messages)

        assert result == {"call_1": "tool_a", "call_2": "tool_b"}

    def test_ignores_non_assistant_messages(self):
        """Test that non-assistant messages are ignored."""
        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "system", "content": "You are helpful"},
            {"role": "tool", "tool_call_id": "call_x", "content": "result"},
        ]

        result = self.parser._build_openai_tool_call_map(messages)

        assert result == {}

    def test_handles_missing_function_name(self):
        """Test handling of tool_calls without function name."""
        messages = [
            {
                "role": "assistant",
                "tool_calls": [
                    {"id": "call_1", "function": {}},  # No name
                    {"id": "call_2", "function": {"name": "tool_b"}},  # Has name
                ],
            }
        ]

        result = self.parser._build_openai_tool_call_map(messages)

        # Only call_2 should be in map (call_1 has no name)
        assert result == {"call_2": "tool_b"}

    def test_handles_empty_messages(self):
        """Test with empty messages list."""
        result = self.parser._build_openai_tool_call_map([])

        assert result == {}
