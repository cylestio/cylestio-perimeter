"""End-to-end tests for error tracking."""
import pytest
from src.interceptors.live_trace.store.store import TraceStore
from src.events.types import LLMCallErrorEvent, LLMCallStartEvent, LLMCallFinishEvent


class TestErrorTrackingEndToEnd:
    """End-to-end tests for error tracking flow."""

    @pytest.fixture
    def store(self):
        """Create in-memory store for testing."""
        return TraceStore(max_events=100, retention_minutes=30, storage_mode="memory")

    def test_error_event_tracked_in_session(self, store):
        """Error event should increment session.errors and calculate error_rate."""
        session_id = "test-session-001"
        agent_id = "test-agent"

        # Add a start event (counts as message)
        start_event = LLMCallStartEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id=agent_id,
            vendor="openai",
            model="gpt-4",
            request_data={"messages": [{"role": "user", "content": "Hello"}]},
            session_id=session_id
        )
        store.add_event(start_event, session_id, agent_id)

        # Add an error event
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id=agent_id,
            vendor="openai",
            model="gpt-4",
            error_message="Quota exceeded",
            error_type="insufficient_quota",
            session_id=session_id
        )
        store.add_event(error_event, session_id, agent_id)

        # Verify session has error tracked
        session = store.get_session(session_id)
        assert session is not None
        assert session.errors == 1
        assert session.message_count == 1
        assert session.error_rate == 100.0  # 1 error / 1 message

    def test_multiple_errors_in_session(self, store):
        """Multiple errors should all be tracked."""
        session_id = "test-session-002"
        agent_id = "test-agent"

        # Add 3 messages and 2 errors
        for i in range(3):
            start_event = LLMCallStartEvent.create(
                trace_id=f"trace-{i}",
                span_id=f"span-{i}",
                agent_id=agent_id,
                vendor="openai",
                model="gpt-4",
                request_data={},
                session_id=session_id
            )
            store.add_event(start_event, session_id, agent_id)

        for i in range(2):
            error_event = LLMCallErrorEvent.create(
                trace_id=f"trace-err-{i}",
                span_id=f"span-err-{i}",
                agent_id=agent_id,
                vendor="openai",
                model="gpt-4",
                error_message=f"Error {i}",
                session_id=session_id
            )
            store.add_event(error_event, session_id, agent_id)

        session = store.get_session(session_id)
        assert session.errors == 2
        assert session.message_count == 3
        # 2/3 * 100 = 66.67%
        assert abs(session.error_rate - 66.67) < 0.1

    def test_errors_aggregated_to_agent(self, store):
        """Agent should have aggregated error count from all sessions."""
        agent_id = "test-agent-agg"

        # Create 2 sessions with errors
        for s in range(2):
            session_id = f"session-agg-{s}"

            # Add start event
            start_event = LLMCallStartEvent.create(
                trace_id=f"trace-{s}",
                span_id=f"span-{s}",
                agent_id=agent_id,
                vendor="openai",
                model="gpt-4",
                request_data={},
                session_id=session_id
            )
            store.add_event(start_event, session_id, agent_id)

            # Add error event
            error_event = LLMCallErrorEvent.create(
                trace_id=f"trace-err-{s}",
                span_id=f"span-err-{s}",
                agent_id=agent_id,
                vendor="openai",
                model="gpt-4",
                error_message="Error",
                session_id=session_id
            )
            store.add_event(error_event, session_id, agent_id)

        agent = store.get_agent(agent_id)
        assert agent is not None
        assert agent.total_errors == 2

    def test_mixed_success_and_errors_tracked(self, store):
        """Mix of successful and error responses should be tracked correctly."""
        session_id = "test-session-mixed"
        agent_id = "test-agent"

        # 3 messages
        for i in range(3):
            start_event = LLMCallStartEvent.create(
                trace_id=f"trace-{i}",
                span_id=f"span-{i}",
                agent_id=agent_id,
                vendor="anthropic",
                model="claude-3-opus",
                request_data={},
                session_id=session_id
            )
            store.add_event(start_event, session_id, agent_id)

        # 2 successful finishes
        for i in range(2):
            finish_event = LLMCallFinishEvent.create(
                trace_id=f"trace-fin-{i}",
                span_id=f"span-fin-{i}",
                agent_id=agent_id,
                vendor="anthropic",
                model="claude-3-opus",
                duration_ms=100.0,
                session_id=session_id
            )
            store.add_event(finish_event, session_id, agent_id)

        # 1 error
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-err",
            span_id="span-err",
            agent_id=agent_id,
            vendor="anthropic",
            model="claude-3-opus",
            error_message="Overloaded",
            error_type="overloaded_error",
            session_id=session_id
        )
        store.add_event(error_event, session_id, agent_id)

        session = store.get_session(session_id)
        assert session.message_count == 3
        assert session.response_count == 2  # Only finish events
        assert session.errors == 1
        # 1/3 * 100 = 33.33%
        assert abs(session.error_rate - 33.33) < 0.1

    def test_error_event_attributes_preserved(self, store):
        """Error event attributes should be preserved in store."""
        session_id = "test-session-attrs"
        agent_id = "test-agent"

        error_event = LLMCallErrorEvent.create(
            trace_id="trace-attr",
            span_id="span-attr",
            agent_id=agent_id,
            vendor="openai",
            model="gpt-4-turbo",
            error_message="Rate limit exceeded",
            error_type="rate_limit_error",
            session_id=session_id
        )
        # Add extra attributes
        error_event.attributes["http.status_code"] = 429
        error_event.attributes["llm.response.duration_ms"] = 50.0

        store.add_event(error_event, session_id, agent_id)

        session = store.get_session(session_id)
        assert len(session.events) == 1

        stored_event = session.events[0]
        assert stored_event.attributes["error.message"] == "Rate limit exceeded"
        assert stored_event.attributes["error.type"] == "rate_limit_error"
        assert stored_event.attributes["http.status_code"] == 429
        assert stored_event.attributes["llm.vendor"] == "openai"
        assert stored_event.attributes["llm.model"] == "gpt-4-turbo"

    def test_different_error_types_tracked(self, store):
        """Different error types should all be tracked."""
        session_id = "test-session-types"
        agent_id = "test-agent"

        error_types = [
            ("insufficient_quota", "Quota exceeded"),
            ("rate_limit_error", "Rate limit reached"),
            ("authentication_error", "Invalid API key"),
            ("server_error", "Internal server error"),
            ("overloaded_error", "Service overloaded"),
        ]

        for error_type, message in error_types:
            error_event = LLMCallErrorEvent.create(
                trace_id=f"trace-{error_type}",
                span_id=f"span-{error_type}",
                agent_id=agent_id,
                vendor="openai",
                model="gpt-4",
                error_message=message,
                error_type=error_type,
                session_id=session_id
            )
            store.add_event(error_event, session_id, agent_id)

        session = store.get_session(session_id)
        assert session.errors == 5

    def test_session_reactivation_preserves_errors(self, store):
        """Session reactivation should preserve error count."""
        session_id = "test-session-reactivate"
        agent_id = "test-agent"

        # Add initial error
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-1",
            span_id="span-1",
            agent_id=agent_id,
            vendor="openai",
            model="gpt-4",
            error_message="Error 1",
            session_id=session_id
        )
        store.add_event(error_event, session_id, agent_id)

        session = store.get_session(session_id)
        assert session.errors == 1

        # Mark completed
        session.mark_completed()
        assert session.is_completed

        # Add new error (reactivates session)
        error_event2 = LLMCallErrorEvent.create(
            trace_id="trace-2",
            span_id="span-2",
            agent_id=agent_id,
            vendor="openai",
            model="gpt-4",
            error_message="Error 2",
            session_id=session_id
        )
        store.add_event(error_event2, session_id, agent_id)

        session = store.get_session(session_id)
        assert not session.is_completed  # Reactivated
        assert session.errors == 2  # Both errors counted
