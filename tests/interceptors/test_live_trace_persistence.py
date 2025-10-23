"""Tests for live_trace interceptor file persistence."""
import json
import tempfile
from pathlib import Path

import pytest

from src.events import BaseEvent, EventName
from src.interceptors.live_trace.store import AgentData, SessionData, TraceStore


class TestSessionDataSerialization:
    """Test SessionData serialization/deserialization."""

    def test_session_to_dict(self):
        """Test converting session to dictionary."""
        session = SessionData("session-1", "agent-1")
        session.total_events = 10
        session.message_count = 5
        session.tool_uses = 3
        session.available_tools.add("calculator")
        session.tool_usage_details["calculator"] = 2

        data = session.to_dict()

        assert data["session_id"] == "session-1"
        assert data["agent_id"] == "agent-1"
        assert data["total_events"] == 10
        assert data["message_count"] == 5
        assert data["tool_uses"] == 3
        assert "calculator" in data["available_tools"]
        assert data["tool_usage_details"]["calculator"] == 2
        assert "created_at" in data
        assert "last_activity" in data

    def test_session_from_dict(self):
        """Test creating session from dictionary."""
        data = {
            "session_id": "session-1",
            "agent_id": "agent-1",
            "created_at": "2025-01-01T00:00:00+00:00",
            "last_activity": "2025-01-01T00:05:00+00:00",
            "is_active": True,
            "total_events": 10,
            "message_count": 5,
            "tool_uses": 3,
            "errors": 0,
            "total_tokens": 100,
            "total_response_time_ms": 1000.0,
            "response_count": 5,
            "tool_usage_details": {"calculator": 2},
            "available_tools": ["calculator"],
        }

        session = SessionData.from_dict(data)

        assert session.session_id == "session-1"
        assert session.agent_id == "agent-1"
        assert session.total_events == 10
        assert session.message_count == 5
        assert session.tool_uses == 3
        assert "calculator" in session.available_tools
        assert session.tool_usage_details["calculator"] == 2

    def test_session_round_trip(self):
        """Test round-trip serialization."""
        session = SessionData("session-1", "agent-1")
        session.total_events = 10
        session.message_count = 5
        session.available_tools.add("calculator")

        data = session.to_dict()
        restored = SessionData.from_dict(data)

        assert restored.session_id == session.session_id
        assert restored.agent_id == session.agent_id
        assert restored.total_events == session.total_events
        assert restored.message_count == session.message_count
        assert restored.available_tools == session.available_tools


class TestAgentDataSerialization:
    """Test AgentData serialization/deserialization."""

    def test_agent_to_dict(self):
        """Test converting agent to dictionary."""
        agent = AgentData("agent-1")
        agent.sessions.add("session-1")
        agent.sessions.add("session-2")
        agent.total_sessions = 2
        agent.total_messages = 10
        agent.available_tools.add("calculator")
        agent.used_tools.add("calculator")
        agent.tool_usage_details["calculator"] = 5

        data = agent.to_dict()

        assert data["agent_id"] == "agent-1"
        assert set(data["sessions"]) == {"session-1", "session-2"}
        assert data["total_sessions"] == 2
        assert data["total_messages"] == 10
        assert "calculator" in data["available_tools"]
        assert "calculator" in data["used_tools"]
        assert data["tool_usage_details"]["calculator"] == 5

    def test_agent_from_dict(self):
        """Test creating agent from dictionary."""
        data = {
            "agent_id": "agent-1",
            "sessions": ["session-1", "session-2"],
            "first_seen": "2025-01-01T00:00:00+00:00",
            "last_seen": "2025-01-01T01:00:00+00:00",
            "total_sessions": 2,
            "total_messages": 10,
            "total_tokens": 200,
            "total_tools": 5,
            "total_errors": 0,
            "total_response_time_ms": 2000.0,
            "response_count": 10,
            "available_tools": ["calculator"],
            "used_tools": ["calculator"],
            "tool_usage_details": {"calculator": 5},
        }

        agent = AgentData.from_dict(data)

        assert agent.agent_id == "agent-1"
        assert agent.sessions == {"session-1", "session-2"}
        assert agent.total_sessions == 2
        assert agent.total_messages == 10
        assert "calculator" in agent.available_tools
        assert "calculator" in agent.used_tools
        assert agent.tool_usage_details["calculator"] == 5


class TestTraceStorePersistence:
    """Test TraceStore file persistence."""

    def test_store_saves_to_file(self):
        """Test that store saves data to file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )

            # Add a session
            session = SessionData("session-1", "agent-1")
            store.sessions["session-1"] = session
            store.agents["agent-1"] = AgentData("agent-1")
            store.total_events = 1

            # Trigger save
            store.save()

            # Verify file exists
            persistence_file = Path(tmpdir) / "trace_store.json"
            assert persistence_file.exists()

            # Verify content
            with open(persistence_file) as f:
                data = json.load(f)

            assert data["version"] == "1.0"
            assert "saved_at" in data
            assert data["total_events"] == 1
            assert "session-1" in data["sessions"]
            assert "agent-1" in data["agents"]

    def test_store_loads_from_file(self):
        """Test that store loads data from file on startup."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create first store and save data
            store1 = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )

            session = SessionData("session-1", "agent-1")
            session.total_events = 10
            session.message_count = 5
            store1.sessions["session-1"] = session

            agent = AgentData("agent-1")
            agent.total_sessions = 1
            store1.agents["agent-1"] = agent

            store1.total_events = 10
            store1.tool_usage["calculator"] = 3

            store1.save()

            # Create second store - should load data
            store2 = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )

            # Verify data was loaded
            assert store2.total_events == 10
            assert "session-1" in store2.sessions
            assert "agent-1" in store2.agents
            assert store2.sessions["session-1"].total_events == 10
            assert store2.sessions["session-1"].message_count == 5
            assert store2.agents["agent-1"].total_sessions == 1
            assert store2.tool_usage["calculator"] == 3

    def test_store_without_persistence(self):
        """Test that store works without persistence enabled."""
        store = TraceStore(persist_to_file=False)

        session = SessionData("session-1", "agent-1")
        store.sessions["session-1"] = session

        # Should not raise any errors
        store.save()

        assert "session-1" in store.sessions

    def test_persistence_file_atomicity(self):
        """Test that saving uses atomic rename."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )

            store.sessions["session-1"] = SessionData("session-1", "agent-1")
            store.save()

            persistence_file = Path(tmpdir) / "trace_store.json"
            temp_file = Path(tmpdir) / "trace_store.tmp"

            # Verify main file exists
            assert persistence_file.exists()

            # Verify temp file doesn't exist after save
            assert not temp_file.exists()

    def test_auto_save_on_events(self):
        """Test that store auto-saves after configured number of events."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=5
            )

            # Create a mock event with all required fields
            event = BaseEvent(
                name=EventName.LLM_CALL_START,
                session_id="session-1",
                trace_id="trace-1",
                span_id="span-1",
                agent_id="agent-1",
                attributes={"agent.id": "agent-1"}
            )

            # Add events - should auto-save on 5th event
            for i in range(5):
                store.add_event(event, "session-1", "agent-1")

            persistence_file = Path(tmpdir) / "trace_store.json"
            assert persistence_file.exists()

            # Verify data was saved
            with open(persistence_file) as f:
                data = json.load(f)

            assert data["total_events"] == 5

    def test_persistence_dir_created_automatically(self):
        """Test that persistence directory is created if it doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            nested_dir = Path(tmpdir) / "nested" / "path"

            store = TraceStore(
                persist_to_file=True,
                persistence_dir=str(nested_dir),
                save_interval_events=1
            )

            assert nested_dir.exists()
            assert store.persistence_file == nested_dir / "trace_store.json"

    def test_handles_corrupt_persistence_file(self):
        """Test that store handles corrupt persistence file gracefully."""
        with tempfile.TemporaryDirectory() as tmpdir:
            persistence_file = Path(tmpdir) / "trace_store.json"

            # Create corrupt file
            with open(persistence_file, "w") as f:
                f.write("not valid json {")

            # Should not crash
            store = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )

            # Should have empty data
            assert len(store.sessions) == 0
            assert len(store.agents) == 0


class TestHistoricalSessionIndicator:
    """Test that historical sessions are properly marked."""

    def test_session_with_events_has_history(self):
        """Test that active session with events has history flag set to True."""
        from src.interceptors.live_trace.insights import InsightsEngine
        from src.events import BaseEvent, EventName

        with tempfile.TemporaryDirectory() as tmpdir:
            store = TraceStore(persist_to_file=False)
            
            # Add a session with events
            event = BaseEvent(
                name=EventName.LLM_CALL_START,
                session_id="test-session",
                trace_id="trace-1",
                span_id="span-1",
                agent_id="test-agent",
                attributes={"agent.id": "test-agent"}
            )
            
            store.add_event(event, "test-session", "test-agent")
            
            # Get session data via insights
            proxy_config = {
                "provider_type": "openai",
                "provider_base_url": "https://api.openai.com",
                "proxy_host": "0.0.0.0",
                "proxy_port": 3000
            }
            insights = InsightsEngine(store, proxy_config)
            session_data = insights.get_session_data("test-session")
            
            assert session_data["session"]["has_event_history"] is True
            assert session_data["session"]["history_message"] is None
            assert len(session_data["events"]) > 0

    def test_restored_session_without_events_marked_as_historical(self):
        """Test that restored session without events is marked as historical."""
        from src.interceptors.live_trace.insights import InsightsEngine

        with tempfile.TemporaryDirectory() as tmpdir:
            # Create first store and save a session
            store1 = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )
            
            session = SessionData("test-session", "test-agent")
            session.total_events = 10  # Has events count but no actual events
            session.message_count = 5
            store1.sessions["test-session"] = session
            store1.agents["test-agent"] = AgentData("test-agent")
            store1.save()
            
            # Create second store and load data
            store2 = TraceStore(
                persist_to_file=True,
                persistence_dir=tmpdir,
                save_interval_events=1
            )
            
            # Get session data via insights
            proxy_config = {
                "provider_type": "openai",
                "provider_base_url": "https://api.openai.com",
                "proxy_host": "0.0.0.0",
                "proxy_port": 3000
            }
            insights = InsightsEngine(store2, proxy_config)
            session_data = insights.get_session_data("test-session")
            
            # Should be marked as historical with no event history
            assert session_data["session"]["has_event_history"] is False
            assert session_data["session"]["history_message"] is not None
            assert "persistent storage" in session_data["session"]["history_message"]
            assert len(session_data["events"]) == 0

    def test_new_session_without_events_no_history_message(self):
        """Test that new session with no events doesn't show history message."""
        from src.interceptors.live_trace.insights import InsightsEngine

        store = TraceStore(persist_to_file=False)
        
        # Add a session without any events
        session = SessionData("test-session", "test-agent")
        session.total_events = 0  # No events at all
        store.sessions["test-session"] = session
        store.agents["test-agent"] = AgentData("test-agent")
        
        # Get session data via insights
        proxy_config = {
            "provider_type": "openai",
            "provider_base_url": "https://api.openai.com",
            "proxy_host": "0.0.0.0",
            "proxy_port": 3000
        }
        insights = InsightsEngine(store, proxy_config)
        session_data = insights.get_session_data("test-session")
        
        # Should not show history message for truly empty session
        assert session_data["session"]["has_event_history"] is False
        assert session_data["session"]["history_message"] is None
        assert len(session_data["events"]) == 0

    def test_loads_events_from_log_file(self):
        """Test that historical sessions load events from event_logs if available."""
        from src.interceptors.live_trace.insights import InsightsEngine

        with tempfile.TemporaryDirectory() as tmpdir:
            event_logs_dir = Path(tmpdir) / "event_logs"
            event_logs_dir.mkdir()
            
            # Create a mock event log file
            log_file = event_logs_dir / "session_test-session.jsonl"
            with open(log_file, 'w') as f:
                # Write metadata line (should be skipped)
                f.write(json.dumps({"_metadata": {"format": "jsonl"}}) + '\n')
                # Write actual events
                f.write(json.dumps({
                    "name": "llm.call.start",
                    "span_id": "span-1",
                    "timestamp": "2025-01-01T00:00:00+00:00",
                    "level": "info",
                    "attributes": {"test": "data"},
                    "session_id": "test-session"
                }) + '\n')
                f.write(json.dumps({
                    "name": "llm.call.finish",
                    "span_id": "span-2",
                    "timestamp": "2025-01-01T00:00:05+00:00",
                    "level": "info",
                    "attributes": {"test": "data2"},
                    "session_id": "test-session"
                }) + '\n')
            
            # Create a session without in-memory events (simulating restored session)
            store = TraceStore(persist_to_file=False)
            session = SessionData("test-session", "test-agent")
            session.total_events = 2  # Has events count but no actual events in memory
            session.message_count = 1
            store.sessions["test-session"] = session
            store.agents["test-agent"] = AgentData("test-agent")
            
            # Get session data via insights with event_logs_dir
            proxy_config = {
                "provider_type": "openai",
                "provider_base_url": "https://api.openai.com",
                "proxy_host": "0.0.0.0",
                "proxy_port": 3000
            }
            insights = InsightsEngine(store, proxy_config, str(event_logs_dir))
            session_data = insights.get_session_data("test-session")
            
            # Should have loaded events from log file
            assert session_data["session"]["has_event_history"] is True
            assert session_data["session"]["history_message"] is None
            assert len(session_data["events"]) == 2
            assert session_data["events"][0]["name"] == "llm.call.start"
            assert session_data["events"][1]["name"] == "llm.call.finish"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

