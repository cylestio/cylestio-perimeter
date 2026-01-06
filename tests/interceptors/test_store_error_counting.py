"""Tests for error counting in live_trace store."""
import pytest
from datetime import datetime, timezone
from src.interceptors.live_trace.store.store import SessionData, AgentData
from src.events.types import LLMCallErrorEvent, LLMCallFinishEvent, LLMCallStartEvent


class TestSessionDataErrorCounting:
    """Tests for SessionData error counting."""

    def test_error_event_increments_error_count(self):
        """LLMCallErrorEvent should increment errors counter."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        error_event = LLMCallErrorEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            error_message="Quota exceeded",
            error_type="insufficient_quota",
            session_id="test-session"
        )

        assert session.errors == 0
        session.add_event(error_event)
        assert session.errors == 1

    def test_finish_event_does_not_increment_error_count(self):
        """LLMCallFinishEvent should NOT increment errors counter."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        finish_event = LLMCallFinishEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            duration_ms=100.0,
            session_id="test-session"
        )

        session.add_event(finish_event)
        assert session.errors == 0

    def test_start_event_increments_message_count(self):
        """LLMCallStartEvent should increment message_count."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        start_event = LLMCallStartEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            request_data={},
            session_id="test-session"
        )

        assert session.message_count == 0
        session.add_event(start_event)
        assert session.message_count == 1

    def test_error_rate_calculation(self):
        """Error rate should be (errors / message_count) * 100."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        # Add 2 messages (llm.call.start events)
        for i in range(2):
            start_event = LLMCallStartEvent.create(
                trace_id=f"trace-{i}",
                span_id=f"span-{i}",
                agent_id="agent-1",
                vendor="openai",
                model="gpt-4",
                request_data={},
                session_id="test-session"
            )
            session.add_event(start_event)

        # Add 1 error
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-err",
            span_id="span-err",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            error_message="Error",
            session_id="test-session"
        )
        session.add_event(error_event)

        # Error rate = 1/2 * 100 = 50%
        assert session.error_rate == 50.0

    def test_error_rate_with_no_messages(self):
        """Error rate should be 0 when no messages."""
        session = SessionData(session_id="test-session", agent_id="test-agent")
        assert session.error_rate == 0.0

    def test_error_rate_with_errors_but_no_messages(self):
        """Error rate should handle errors without messages gracefully."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        # Add error without any message start
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-err",
            span_id="span-err",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            error_message="Error",
            session_id="test-session"
        )
        session.add_event(error_event)

        # Should be 0 since no messages (avoid division by zero)
        assert session.error_rate == 0.0

    def test_multiple_errors_counted(self):
        """Multiple error events should all be counted."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        for i in range(3):
            error_event = LLMCallErrorEvent.create(
                trace_id=f"trace-{i}",
                span_id=f"span-{i}",
                agent_id="agent-1",
                vendor="openai",
                model="gpt-4",
                error_message=f"Error {i}",
                session_id="test-session"
            )
            session.add_event(error_event)

        assert session.errors == 3

    def test_error_rate_100_percent(self):
        """All messages failing should be 100% error rate."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        # 3 messages, 3 errors
        for i in range(3):
            start_event = LLMCallStartEvent.create(
                trace_id=f"trace-{i}",
                span_id=f"span-{i}",
                agent_id="agent-1",
                vendor="openai",
                model="gpt-4",
                request_data={},
                session_id="test-session"
            )
            session.add_event(start_event)

            error_event = LLMCallErrorEvent.create(
                trace_id=f"trace-err-{i}",
                span_id=f"span-err-{i}",
                agent_id="agent-1",
                vendor="openai",
                model="gpt-4",
                error_message=f"Error {i}",
                session_id="test-session"
            )
            session.add_event(error_event)

        # 3/3 * 100 = 100%
        assert session.error_rate == 100.0

    def test_mixed_success_and_error(self):
        """Mixed success and error responses should calculate correct rate."""
        session = SessionData(session_id="test-session", agent_id="test-agent")

        # 4 messages: 1 error, 3 success
        for i in range(4):
            start_event = LLMCallStartEvent.create(
                trace_id=f"trace-{i}",
                span_id=f"span-{i}",
                agent_id="agent-1",
                vendor="openai",
                model="gpt-4",
                request_data={},
                session_id="test-session"
            )
            session.add_event(start_event)

        # 1 error
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-err",
            span_id="span-err",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            error_message="Error",
            session_id="test-session"
        )
        session.add_event(error_event)

        # 1/4 * 100 = 25%
        assert session.error_rate == 25.0


class TestAgentDataErrorAggregation:
    """Tests for AgentData error aggregation."""

    def test_session_errors_aggregated_to_agent(self):
        """Session errors should be added to agent total_errors."""
        agent = AgentData(agent_id="test-agent")
        session = SessionData(session_id="session-1", agent_id="test-agent")

        # Add errors to session
        session.errors = 5
        session.message_count = 10

        agent.update_metrics(session)
        assert agent.total_errors == 5

    def test_multiple_sessions_errors_aggregated(self):
        """Errors from multiple sessions should be summed."""
        agent = AgentData(agent_id="test-agent")

        for i in range(3):
            session = SessionData(session_id=f"session-{i}", agent_id="test-agent")
            session.errors = 2
            agent.update_metrics(session)

        assert agent.total_errors == 6

    def test_agent_tracks_total_messages(self):
        """Agent should track total messages from all sessions."""
        agent = AgentData(agent_id="test-agent")

        for i in range(2):
            session = SessionData(session_id=f"session-{i}", agent_id="test-agent")
            session.message_count = 5
            session.errors = 1
            agent.update_metrics(session)

        assert agent.total_messages == 10
        assert agent.total_errors == 2


class TestEventNameMatching:
    """Tests to verify event name pattern matching for error counting."""

    def test_llm_call_error_event_name_ends_with_error(self):
        """LLMCallErrorEvent name should end with '.error' for store detection."""
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            error_message="Test error",
            session_id="test-session"
        )

        # The store checks: event_name.endswith(".error")
        event_name = error_event.name.value
        assert event_name.endswith(".error"), f"Event name '{event_name}' should end with '.error'"

    def test_llm_call_finish_event_name_does_not_end_with_error(self):
        """LLMCallFinishEvent name should NOT end with '.error'."""
        finish_event = LLMCallFinishEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id="agent-1",
            vendor="openai",
            model="gpt-4",
            duration_ms=100.0,
            session_id="test-session"
        )

        event_name = finish_event.name.value
        assert not event_name.endswith(".error"), f"Event name '{event_name}' should NOT end with '.error'"
