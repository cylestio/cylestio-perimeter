"""Tests for OpenAI provider extract_request_events method."""
import pytest
from src.providers.openai import OpenAIProvider
from src.providers.base import SessionInfo


class TestOpenAIExtractRequestEvents:
    """Test suite for OpenAI provider extract_request_events method."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
    
    def test_extract_request_events_new_session_chat_completions(self):
        """Test extracting request events for new session with Chat Completions API."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            is_session_end=False,
            conversation_id="test-conv-123",
            message_count=2,
            model="gpt-4",
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-123"
        is_new_session = True
        tool_results = []
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should create SessionStartEvent and LLMCallStartEvent
        assert len(events) == 2
        assert events[0].name == "session.start"
        assert events[1].name == "llm.call.start"
        
        # Check SessionStartEvent details
        session_event = events[0]
        assert session_event.session_id == session_id
        assert session_event.client_type == "gateway"
        
        # Check LLMCallStartEvent details
        llm_event = events[1]
        assert llm_event.vendor == "openai"
        assert llm_event.model == "gpt-4"
        assert llm_event.session_id == session_id
    
    def test_extract_request_events_existing_session_no_tools(self):
        """Test extracting request events for existing session without tools."""
        body = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What's the weather?"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=False,
            is_session_end=False,
            conversation_id="test-conv-123",
            message_count=2,
            model="gpt-3.5-turbo",
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-123"
        is_new_session = False
        tool_results = []
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should only create LLMCallStartEvent (no session start)
        assert len(events) == 1
        assert events[0].name == "llm.call.start"
        
        llm_event = events[0]
        assert llm_event.vendor == "openai"
        assert llm_event.model == "gpt-3.5-turbo"
        assert llm_event.session_id == session_id
    
    def test_extract_request_events_with_tool_results_chat_completions(self):
        """Test extracting request events with tool results for Chat Completions API."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What's the weather in NYC?"},
                {"role": "assistant", "tool_calls": [
                    {"id": "call_1", "type": "function", "function": {"name": "get_weather", "arguments": "{\"location\": \"NYC\"}"}}
                ]},
                {"role": "tool", "tool_call_id": "call_1", "content": "Sunny, 75°F"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=False,
            is_session_end=False,
            conversation_id="test-conv-123",
            message_count=4,
            model="gpt-4",
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-123"
        is_new_session = False
        tool_results = [
            {"name": "get_weather", "result": "Sunny, 75°F"}
        ]
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should create ToolResultEvent and LLMCallStartEvent
        assert len(events) == 2
        assert events[0].name == "tool.result"
        assert events[1].name == "llm.call.start"
        
        # Check ToolResultEvent details
        tool_event = events[0]
        assert tool_event.tool_name == "get_weather"
        assert tool_event.result == "Sunny, 75°F"
        assert tool_event.status == "success"
        assert tool_event.session_id == session_id
        
        # Check LLMCallStartEvent details
        llm_event = events[1]
        assert llm_event.vendor == "openai"
        assert llm_event.model == "gpt-4"
        assert llm_event.session_id == session_id
    
    def test_extract_request_events_responses_api_new_session(self):
        """Test extracting request events for Responses API new session."""
        body = {
            "model": "gpt-4",
            "instructions": "You are a helpful assistant.",
            "input": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            is_session_end=False,
            conversation_id="test-conv-456",
            message_count=1,
            model="gpt-4",
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-456"
        is_new_session = True
        tool_results = []
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should create SessionStartEvent and LLMCallStartEvent
        assert len(events) == 2
        assert events[0].name == "session.start"
        assert events[1].name == "llm.call.start"
        
        # Check SessionStartEvent details
        session_event = events[0]
        assert session_event.session_id == session_id
        assert session_event.client_type == "gateway"
        
        # Check LLMCallStartEvent details
        llm_event = events[1]
        assert llm_event.vendor == "openai"
        assert llm_event.model == "gpt-4"
        assert llm_event.session_id == session_id
    
    def test_extract_request_events_responses_api_with_tool_results_issue(self):
        """Test extracting request events for Responses API with tool results (current issue)."""
        body = {
            "model": "gpt-4",
            "instructions": "You are a helpful assistant.",
            "input": [
                {"role": "user", "content": "What's the weather in NYC?"},
                {"role": "assistant", "content": "I'll check the weather for you.", "tool_calls": [
                    {"id": "call_1", "type": "function", "function": {"name": "get_weather", "arguments": "{\"location\": \"NYC\"}"}}
                ]},
                {"role": "tool", "tool_call_id": "call_1", "content": "Sunny, 75°F"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=False,
            is_session_end=False,
            conversation_id="test-conv-456",
            message_count=1,
            model="gpt-4",
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-456"
        is_new_session = False
        # This is the issue: tool_results is empty for Responses API
        tool_results = []
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Currently only creates LLMCallStartEvent, missing ToolResultEvent
        # This test documents the current issue
        assert len(events) == 1
        assert events[0].name == "llm.call.start"
        
        # TODO: This should be 2 events when tool detection is fixed
        # assert len(events) == 2
        # assert events[0].name == "tool.result"
        # assert events[1].name == "llm.call.start"
    
    def test_extract_request_events_no_session_id(self):
        """Test extracting request events when session_id is None."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            is_session_end=False,
            conversation_id="test-conv-123",
            message_count=1,
            model="gpt-4",
            is_streaming=False,
            metadata={}
        )
        
        session_id = None
        is_new_session = True
        tool_results = []
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should return empty list when session_id is None
        assert len(events) == 0
    
    def test_extract_request_events_no_model(self):
        """Test extracting request events when model is missing."""
        body = {
            "messages": [
                {"role": "user", "content": "Hello!"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=True,
            is_session_end=False,
            conversation_id="test-conv-123",
            message_count=1,
            model=None,
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-123"
        is_new_session = True
        tool_results = []
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should only create SessionStartEvent (no LLMCallStartEvent without model)
        assert len(events) == 1
        assert events[0].name == "session.start"
    
    def test_extract_request_events_multiple_tool_results(self):
        """Test extracting request events with multiple tool results."""
        body = {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Get weather and time"}
            ]
        }
        
        session_info = SessionInfo(
            is_session_start=False,
            is_session_end=False,
            conversation_id="test-conv-123",
            message_count=2,
            model="gpt-4",
            is_streaming=False,
            metadata={}
        )
        
        session_id = "test-session-123"
        is_new_session = False
        tool_results = [
            {"name": "get_weather", "result": "Sunny, 75°F"},
            {"name": "get_time", "result": "2:30 PM"}
        ]
        
        events = self.provider.extract_request_events(
            body, session_info, session_id, is_new_session, tool_results
        )
        
        # Should create 2 ToolResultEvents and 1 LLMCallStartEvent
        assert len(events) == 3
        assert events[0].name == "tool.result"
        assert events[1].name == "tool.result"
        assert events[2].name == "llm.call.start"
        
        # Check first tool result
        tool_event_1 = events[0]
        assert tool_event_1.tool_name == "get_weather"
        assert tool_event_1.result == "Sunny, 75°F"
        
        # Check second tool result
        tool_event_2 = events[1]
        assert tool_event_2.tool_name == "get_time"
        assert tool_event_2.result == "2:30 PM"