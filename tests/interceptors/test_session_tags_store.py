"""Tests for session tags storage and filtering in TraceStore."""
import pytest
import tempfile
import os
import sys
from datetime import datetime, timezone

# Add src to path to avoid importing through __init__.py which has heavy dependencies
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

# Import directly from the store module
from interceptors.live_trace.store.store import TraceStore, SessionData
from events.base import BaseEvent, EventName, EventLevel


class TestSessionDataTags:
    """Test tags functionality on SessionData class."""

    def test_initial_tags_empty(self):
        """Test that new session starts with empty tags."""
        session = SessionData("session-1", "agent-1")
        assert session.tags == {}

    def test_merge_single_tag(self):
        """Test merging a single tag."""
        session = SessionData("session-1", "agent-1")
        session.merge_tags({"user": "test@example.com"})

        assert session.tags == {"user": "test@example.com"}

    def test_merge_multiple_tags(self):
        """Test merging multiple tags at once."""
        session = SessionData("session-1", "agent-1")
        session.merge_tags({
            "user": "alice",
            "env": "production",
            "team": "backend"
        })

        assert session.tags == {
            "user": "alice",
            "env": "production",
            "team": "backend"
        }

    def test_merge_overwrites_existing_key(self):
        """Test that merging updates existing tag values."""
        session = SessionData("session-1", "agent-1")
        session.merge_tags({"user": "alice"})
        session.merge_tags({"user": "bob"})

        assert session.tags == {"user": "bob"}

    def test_merge_accumulates_different_keys(self):
        """Test that merging accumulates tags with different keys."""
        session = SessionData("session-1", "agent-1")
        session.merge_tags({"user": "alice"})
        session.merge_tags({"env": "prod"})
        session.merge_tags({"team": "backend"})

        assert session.tags == {
            "user": "alice",
            "env": "prod",
            "team": "backend"
        }

    def test_merge_empty_tags(self):
        """Test merging empty dict is a no-op."""
        session = SessionData("session-1", "agent-1")
        session.merge_tags({"user": "alice"})
        session.merge_tags({})

        assert session.tags == {"user": "alice"}


class TestTraceStoreTags:
    """Test TraceStore tags storage and retrieval."""

    def setup_method(self):
        """Set up test fixtures with temporary database."""
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test.db")
        self.store = TraceStore(db_path=self.db_path)

    def teardown_method(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_test_event(self, session_id: str) -> BaseEvent:
        """Create a test event."""
        return BaseEvent(
            name=EventName.LLM_CALL_START,
            level=EventLevel.INFO,
            session_id=session_id,
            trace_id=f"trace-{session_id}",
            span_id=f"span-{session_id}",
            agent_id="test-agent",
            attributes={"test": "value"}
        )

    def test_update_session_tags_new_session(self):
        """Test updating tags creates session if it doesn't exist."""
        result = self.store.update_session_tags(
            session_id="session-new",
            tags={"user": "alice"},
            agent_id="agent-1"
        )

        assert result is True

        session = self.store.get_session("session-new")
        assert session is not None
        assert session.tags == {"user": "alice"}

    def test_update_session_tags_existing_session(self):
        """Test updating tags on existing session."""
        # First add an event to create the session
        event = self._create_test_event("session-existing")
        self.store.add_event(event, "session-existing", "agent-1")

        # Then update tags
        result = self.store.update_session_tags(
            session_id="session-existing",
            tags={"env": "production"}
        )

        assert result is True

        session = self.store.get_session("session-existing")
        assert session.tags == {"env": "production"}

    def test_update_session_tags_accumulates(self):
        """Test that multiple tag updates accumulate."""
        event = self._create_test_event("session-accum")
        self.store.add_event(event, "session-accum", "agent-1")

        self.store.update_session_tags("session-accum", {"user": "alice"})
        self.store.update_session_tags("session-accum", {"env": "prod"})
        self.store.update_session_tags("session-accum", {"team": "backend"})

        session = self.store.get_session("session-accum")
        assert session.tags == {
            "user": "alice",
            "env": "prod",
            "team": "backend"
        }

    def test_update_session_tags_empty_returns_false(self):
        """Test updating with empty tags returns False."""
        result = self.store.update_session_tags("session-empty", {})
        assert result is False

    def test_update_session_tags_no_session_no_agent_returns_false(self):
        """Test updating non-existent session without agent_id returns False."""
        result = self.store.update_session_tags("nonexistent", {"user": "test"})
        assert result is False

    def test_tags_persisted_to_sqlite(self):
        """Test that tags are persisted to SQLite."""
        event = self._create_test_event("session-persist")
        self.store.add_event(event, "session-persist", "agent-1")
        self.store.update_session_tags("session-persist", {"user": "alice", "env": "prod"})

        # Create a new store instance to force read from SQLite
        store2 = TraceStore(db_path=self.db_path)
        session = store2.get_session("session-persist")

        assert session is not None
        assert session.tags == {"user": "alice", "env": "prod"}


class TestSessionsFilteringByTag:
    """Test filtering sessions by tags."""

    def setup_method(self):
        """Set up test fixtures with temporary database."""
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test.db")
        self.store = TraceStore(db_path=self.db_path)

    def teardown_method(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_session_with_tags(self, session_id: str, agent_id: str, tags: dict):
        """Helper to create a session with tags."""
        event = BaseEvent(
            name=EventName.LLM_CALL_START,
            level=EventLevel.INFO,
            session_id=session_id,
            trace_id=f"trace-{session_id}",
            span_id=f"span-{session_id}",
            agent_id=agent_id,
            attributes={"test": "value"}
        )
        self.store.add_event(event, session_id, agent_id)
        if tags:
            self.store.update_session_tags(session_id, tags)

    def test_filter_by_tag_key_value(self):
        """Test filtering sessions by tag key:value."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice"})
        self._create_session_with_tags("session-2", "agent-1", {"user": "bob"})
        self._create_session_with_tags("session-3", "agent-1", {"user": "alice"})

        # Filter by user:alice
        sessions = self.store.get_sessions_filtered(tags=["user:alice"])

        assert len(sessions) == 2
        session_ids = {s["id"] for s in sessions}
        assert "session-1" in session_ids
        assert "session-3" in session_ids
        assert "session-2" not in session_ids

    def test_filter_by_tag_key_only(self):
        """Test filtering sessions by tag key existence."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice"})
        self._create_session_with_tags("session-2", "agent-1", {"env": "prod"})
        self._create_session_with_tags("session-3", "agent-1", {"user": "bob", "env": "staging"})

        # Filter by env key (any value)
        sessions = self.store.get_sessions_filtered(tags=["env"])

        assert len(sessions) == 2
        session_ids = {s["id"] for s in sessions}
        assert "session-2" in session_ids
        assert "session-3" in session_ids
        assert "session-1" not in session_ids

    def test_filter_no_match(self):
        """Test filtering with no matching sessions."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice"})
        self._create_session_with_tags("session-2", "agent-1", {"env": "prod"})

        sessions = self.store.get_sessions_filtered(tags=["team:backend"])

        assert len(sessions) == 0

    def test_filter_sessions_without_tags(self):
        """Test that sessions without tags are not matched."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice"})
        self._create_session_with_tags("session-2", "agent-1", {})  # No tags

        sessions = self.store.get_sessions_filtered(tags=["user"])

        assert len(sessions) == 1
        assert sessions[0]["id"] == "session-1"

    def test_filter_combined_with_other_filters(self):
        """Test tag filtering combined with other filters."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice"})
        self._create_session_with_tags("session-2", "agent-2", {"user": "alice"})
        self._create_session_with_tags("session-3", "agent-1", {"user": "bob"})

        # Filter by user:alice AND agent_id=agent-1
        sessions = self.store.get_sessions_filtered(
            tags=["user:alice"],
            agent_id="agent-1"
        )

        assert len(sessions) == 1
        assert sessions[0]["id"] == "session-1"

    def test_count_sessions_with_tag_filter(self):
        """Test counting sessions with tag filter."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice"})
        self._create_session_with_tags("session-2", "agent-1", {"user": "bob"})
        self._create_session_with_tags("session-3", "agent-1", {"user": "alice"})

        count = self.store.count_sessions_filtered(tags=["user:alice"])

        assert count == 2

    def test_tags_included_in_session_response(self):
        """Test that tags are included in session list response."""
        self._create_session_with_tags("session-1", "agent-1", {"user": "alice", "env": "prod"})

        sessions = self.store.get_sessions_filtered()

        assert len(sessions) == 1
        assert sessions[0]["tags"] == {"user": "alice", "env": "prod"}

    def test_filter_special_characters_in_value(self):
        """Test filtering with special characters in tag value."""
        self._create_session_with_tags("session-1", "agent-1", {"email": "alice@test.com"})
        self._create_session_with_tags("session-2", "agent-1", {"email": "bob@test.com"})

        sessions = self.store.get_sessions_filtered(tags=["email:alice@test.com"])

        assert len(sessions) == 1
        assert sessions[0]["id"] == "session-1"
