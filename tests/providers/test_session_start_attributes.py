"""Tests for session start event attributes functionality."""
import pytest
from src.providers.anthropic import AnthropicProvider
from src.providers.openai import OpenAIProvider
from src.providers.base import SessionInfo
from src.events.types import SessionStartEvent


class TestSessionStartEventAttributes:
    """Test suite for session start event attributes across providers."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.anthropic_provider = AnthropicProvider()
        self.openai_provider = OpenAIProvider()
    
    def test_session_start_event_create_with_all_attributes(self):
        """Test SessionStartEvent.create() with all new attributes."""
        tools = [
            {
                "name": "add",
                "description": "Add two numbers",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "a": {"type": "number"},
                        "b": {"type": "number"}
                    }
                }
            }
        ]
        
        event = SessionStartEvent.create(
            trace_id="test-trace-123",
            span_id="test-span-456", 
            agent_id="test-agent",
            session_id="test-session-789",
            user_id="test-user",
            client_type="gateway",
            vendor="anthropic",
            model="claude-3-haiku-20240307",
            tools=tools,
            prompt="You are a helpful assistant."
        )
        
        # Verify basic attributes
        assert event.trace_id == "test-trace-123"
        assert event.span_id == "test-span-456"
        assert event.agent_id == "test-agent"
        assert event.session_id == "test-session-789"
        assert event.name == "session.start"
        
        # Verify new attributes
        assert event.attributes["llm.vendor"] == "anthropic"
        assert event.attributes["llm.model"] == "claude-3-haiku-20240307"
        assert event.attributes["tools"] == tools
        assert event.attributes["prompt"] == "You are a helpful assistant."
        
        # Verify existing attributes still work
        assert event.attributes["user.id"] == "test-user"
        assert event.attributes["client.type"] == "gateway"
        assert event.attributes["session.id"] == "test-session-789"
    
    def test_session_start_event_create_with_optional_attributes(self):
        """Test SessionStartEvent.create() with only some new attributes."""
        event = SessionStartEvent.create(
            trace_id="test-trace-123",
            span_id="test-span-456",
            agent_id="test-agent", 
            session_id="test-session-789",
            vendor="openai",
            model="gpt-4"
            # tools and prompt not provided
        )
        
        # Verify provided attributes
        assert event.attributes["llm.vendor"] == "openai"
        assert event.attributes["llm.model"] == "gpt-4"
        
        # Verify optional attributes are not present
        assert "tools" not in event.attributes
        assert "prompt" not in event.attributes
        
        # Verify required attributes still work
        assert event.attributes["session.id"] == "test-session-789"
    
    def test_session_start_event_create_without_new_attributes(self):
        """Test SessionStartEvent.create() without any new attributes (backward compatibility)."""
        event = SessionStartEvent.create(
            trace_id="test-trace-123",
            span_id="test-span-456",
            agent_id="test-agent",
            session_id="test-session-789"
        )
        
        # Verify new attributes are not present
        assert "llm.vendor" not in event.attributes
        assert "llm.model" not in event.attributes
        assert "tools" not in event.attributes
        assert "prompt" not in event.attributes
        
        # Verify basic functionality still works
        assert event.attributes["session.id"] == "test-session-789"


class TestAnthropicSessionStartAttributes:
    """Test suite for Anthropic provider session start event attributes."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
    
    def test_extract_tools_for_session_with_tools(self):
        """Test extracting tools from request body."""
        body = {
            "model": "claude-3-haiku-20240307",
            "tools": [
                {
                    "name": "add",
                    "description": "Add two numbers",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "a": {"type": "number"},
                            "b": {"type": "number"}
                        }
                    }
                },
                {
                    "name": "multiply", 
                    "description": "Multiply two numbers",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "a": {"type": "number"},
                            "b": {"type": "number"}
                        }
                    }
                }
            ],
            "messages": [{"role": "user", "content": "Calculate 2+2"}]
        }
        
        result = self.provider._extract_tools_for_session(body)
        
        assert result is not None
        assert len(result) == 2
        assert result[0]["name"] == "add"
        assert result[1]["name"] == "multiply"
    
    def test_extract_tools_for_session_without_tools(self):
        """Test extracting tools when no tools are present."""
        body = {
            "model": "claude-3-haiku-20240307",
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        result = self.provider._extract_tools_for_session(body)
        assert result is None
    
    def test_extract_tools_for_session_empty_tools(self):
        """Test extracting tools when tools array is empty."""
        body = {
            "model": "claude-3-haiku-20240307",
            "tools": [],
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        result = self.provider._extract_tools_for_session(body)
        assert result is None
    
    def test_extract_tools_for_session_invalid_tools(self):
        """Test extracting tools when tools is not a list."""
        body = {
            "model": "claude-3-haiku-20240307",
            "tools": "invalid",
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        result = self.provider._extract_tools_for_session(body)
        assert result is None
    
    def test_anthropic_session_start_with_all_attributes(self):
        """Test Anthropic provider session start event with all new attributes."""
        body = {
            "model": "claude-3-haiku-20240307",
            "system": "You are a helpful math assistant.",
            "tools": [
                {
                    "name": "add",
                    "description": "Add two numbers",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "a": {"type": "number"},
                            "b": {"type": "number"}
                        }
                    }
                }
            ],
            "messages": [{"role": "user", "content": "What is 2+2?"}]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="claude-3-haiku-20240307",
            conversation_id="test-session-123"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-123",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None, "Session start event not found"
        
        # Verify new attributes
        assert session_start_event.attributes["llm.vendor"] == "anthropic"
        assert session_start_event.attributes["llm.model"] == "claude-3-haiku-20240307"
        assert session_start_event.attributes["tools"] is not None
        assert len(session_start_event.attributes["tools"]) == 1
        assert session_start_event.attributes["tools"][0]["name"] == "add"
        assert session_start_event.attributes["prompt"] == "You are a helpful math assistant."
        
        # Verify existing attributes still work
        assert session_start_event.attributes["session.id"] == "test-session-123"
        assert session_start_event.attributes["client.type"] == "gateway"
    
    def test_anthropic_session_start_without_system_prompt(self):
        """Test Anthropic provider session start when no system prompt is provided."""
        body = {
            "model": "claude-3-haiku-20240307",
            "tools": [
                {
                    "name": "add",
                    "description": "Add two numbers"
                }
            ],
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="claude-3-haiku-20240307",
            conversation_id="test-session-123"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-123",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        assert session_start_event.attributes["prompt"] == "default-system"
    
    def test_anthropic_session_start_without_tools(self):
        """Test Anthropic provider session start when no tools are provided."""
        body = {
            "model": "claude-3-haiku-20240307",
            "system": "You are a helpful assistant.",
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="claude-3-haiku-20240307",
            conversation_id="test-session-123"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-123",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        assert "tools" not in session_start_event.attributes


class TestOpenAISessionStartAttributes:
    """Test suite for OpenAI provider session start event attributes."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
    
    def test_extract_tools_for_session_with_tools(self):
        """Test extracting tools from OpenAI request body."""
        body = {
            "model": "gpt-4",
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": "calculate",
                        "description": "Perform calculations",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "expression": {"type": "string"}
                            }
                        }
                    }
                }
            ],
            "messages": [{"role": "user", "content": "Calculate 2+2"}]
        }
        
        result = self.provider._extract_tools_for_session(body)
        
        assert result is not None
        assert len(result) == 1
        assert result[0]["type"] == "function"
        assert result[0]["function"]["name"] == "calculate"
    
    def test_extract_tools_for_session_without_tools(self):
        """Test extracting tools when no tools are present."""
        body = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        result = self.provider._extract_tools_for_session(body)
        assert result is None
    
    def test_openai_session_start_with_system_message(self):
        """Test OpenAI provider session start with system message."""
        body = {
            "model": "gpt-4",
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": "calculate",
                        "description": "Perform calculations"
                    }
                }
            ],
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="gpt-4",
            conversation_id="test-session-456"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-456",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        
        # Verify new attributes
        assert session_start_event.attributes["llm.vendor"] == "openai"
        assert session_start_event.attributes["llm.model"] == "gpt-4"
        assert session_start_event.attributes["tools"] is not None
        assert len(session_start_event.attributes["tools"]) == 1
        assert session_start_event.attributes["prompt"] == "You are a helpful assistant."
    
    def test_openai_session_start_with_instructions(self):
        """Test OpenAI provider session start with instructions (Responses API)."""
        body = {
            "model": "gpt-4",
            "instructions": "You are a helpful math tutor.",
            "input": [
                {"role": "user", "content": "Teach me algebra"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="gpt-4",
            conversation_id="test-session-789"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-789",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        assert session_start_event.attributes["prompt"] == "You are a helpful math tutor."
    
    def test_openai_session_start_without_system_or_instructions(self):
        """Test OpenAI provider session start without system message or instructions."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="gpt-4",
            conversation_id="test-session-999"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-999",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        assert session_start_event.attributes["prompt"] == "default-system"
    
    def test_openai_session_start_system_message_in_input(self):
        """Test OpenAI provider extracting system message from input array (Responses API)."""
        body = {
            "model": "gpt-4",
            "input": [
                {"role": "system", "content": "You are a coding assistant."},
                {"role": "user", "content": "Help me with Python"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="gpt-4",
            conversation_id="test-session-input"
        )
        
        events, _ = self.provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-session-input",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        assert session_start_event.attributes["prompt"] == "You are a coding assistant."


class TestSessionStartAttributesEdgeCases:
    """Test suite for edge cases in session start event attributes."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.anthropic_provider = AnthropicProvider()
        self.openai_provider = OpenAIProvider()
    
    def test_session_start_event_with_none_values(self):
        """Test SessionStartEvent.create() with None values for optional parameters."""
        event = SessionStartEvent.create(
            trace_id="test-trace-123",
            span_id="test-span-456",
            agent_id="test-agent",
            session_id="test-session-789",
            vendor=None,
            model=None,
            tools=None,
            prompt=None
        )
        
        # Verify None values don't create attributes
        assert "llm.vendor" not in event.attributes
        assert "llm.model" not in event.attributes
        assert "tools" not in event.attributes
        assert "prompt" not in event.attributes
    
    def test_session_start_event_with_empty_strings(self):
        """Test SessionStartEvent.create() with empty strings."""
        event = SessionStartEvent.create(
            trace_id="test-trace-123",
            span_id="test-span-456",
            agent_id="test-agent",
            session_id="test-session-789",
            vendor="",
            model="",
            prompt=""
        )
        
        # Empty strings should not create attributes (falsy values)
        assert "llm.vendor" not in event.attributes
        assert "llm.model" not in event.attributes
        assert "prompt" not in event.attributes
    
    def test_session_start_event_with_empty_tools_list(self):
        """Test SessionStartEvent.create() with empty tools list."""
        event = SessionStartEvent.create(
            trace_id="test-trace-123",
            span_id="test-span-456",
            agent_id="test-agent",
            session_id="test-session-789",
            tools=[]
        )
        
        # Empty list should not create attribute (falsy value)
        assert "tools" not in event.attributes
    
    def test_anthropic_complex_system_prompt(self):
        """Test Anthropic provider with complex system prompt structure."""
        body = {
            "model": "claude-3-haiku-20240307",
            "system": {
                "type": "text",
                "text": "You are a complex assistant with structured instructions."
            },
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="claude-3-haiku-20240307",
            conversation_id="test-complex-system"
        )
        
        events, _ = self.anthropic_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-complex-system",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        # Should convert complex system prompt to string
        expected_prompt = str(body["system"])
        assert session_start_event.attributes["prompt"] == expected_prompt
    
    def test_openai_complex_system_message_content(self):
        """Test OpenAI provider with complex system message content."""
        body = {
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system", 
                    "content": [
                        {"type": "text", "text": "You are a helpful assistant."}
                    ]
                },
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            model="gpt-4",
            conversation_id="test-complex-content"
        )
        
        events, _ = self.openai_provider.extract_request_events(
            body=body,
            session_info=session_info,
            session_id="test-complex-content",
            is_new_session=True
        )
        
        # Find session start event
        session_start_event = None
        for event in events:
            if hasattr(event, 'name') and event.name == "session.start":
                session_start_event = event
                break
        
        assert session_start_event is not None
        # Should convert complex content to string
        expected_prompt = str(body["messages"][0]["content"])
        assert session_start_event.attributes["prompt"] == expected_prompt
