"""Tests for MCP handlers with agent_workflow_id support."""
import pytest

from src.events import BaseEvent, EventName, EventLevel
from ..store import TraceStore
from ..store.store import SessionData, AgentData
from .handlers import call_tool


class TestMCPAgentWorkflowHandlers:
    """Tests for MCP handlers with agent_workflow_id."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_create_analysis_session_handler_with_agent_workflow(self, store):
        """Test create_analysis_session MCP handler with agent_workflow_id."""
        result = call_tool(
            "create_analysis_session",
            {
                "agent_workflow_id": "my-agent-workflow",
                "session_type": "STATIC",
                "agent_workflow_name": "My Agent Workflow"
            },
            store
        )

        assert "session" in result
        session = result["session"]
        assert session["agent_workflow_id"] == "my-agent-workflow"
        assert session["agent_workflow_name"] == "My Agent Workflow"
        assert session["session_type"] == "STATIC"

    def test_create_analysis_session_handler_without_agent_workflow(self, store):
        """Test create_analysis_session MCP handler without agent_workflow_id returns error."""
        result = call_tool(
            "create_analysis_session",
            {
                "session_type": "STATIC"
            },
            store
        )

        # Should return error since agent_workflow_id is now required
        assert "error" in result
        assert "agent_workflow_id" in result["error"]

    def test_store_finding_handler_inherits_agent_workflow(self, store):
        """Test store_finding inherits agent_workflow_id from session."""
        # First create a session with agent_workflow_id
        session_result = call_tool(
            "create_analysis_session",
            {
                "agent_workflow_id": "finding-agent-workflow",
                "session_type": "STATIC"
            },
            store
        )
        session_id = session_result["session"]["session_id"]

        # Now store a finding
        finding_result = call_tool(
            "store_finding",
            {
                "session_id": session_id,
                "file_path": "/path/to/file.py",
                "finding_type": "LLM01",
                "severity": "HIGH",
                "title": "Test Finding"
            },
            store
        )

        assert "finding" in finding_result
        finding = finding_result["finding"]
        assert finding["agent_workflow_id"] == "finding-agent-workflow"

    def test_get_findings_handler_filters_by_agent_workflow(self, store):
        """Test get_findings MCP handler filters by agent_workflow_id."""
        # Create sessions for different agent workflows
        session1_result = call_tool(
            "create_analysis_session",
            {"agent_workflow_id": "agent-workflow-a", "session_type": "STATIC"},
            store
        )
        session2_result = call_tool(
            "create_analysis_session",
            {"agent_workflow_id": "agent-workflow-b", "session_type": "STATIC"},
            store
        )

        session1_id = session1_result["session"]["session_id"]
        session2_id = session2_result["session"]["session_id"]

        # Store findings in different agent workflows
        call_tool(
            "store_finding",
            {
                "session_id": session1_id,
                "file_path": "/f1.py",
                "finding_type": "LLM01",
                "severity": "HIGH",
                "title": "Finding 1"
            },
            store
        )
        call_tool(
            "store_finding",
            {
                "session_id": session2_id,
                "file_path": "/f2.py",
                "finding_type": "LLM02",
                "severity": "HIGH",
                "title": "Finding 2"
            },
            store
        )

        # Get findings filtered by agent workflow
        result = call_tool(
            "get_findings",
            {"agent_workflow_id": "agent-workflow-a"},
            store
        )

        assert "findings" in result
        assert result["total_count"] == 1
        assert result["findings"][0]["agent_workflow_id"] == "agent-workflow-a"


class TestWorkflowQueryHandlers:
    """Tests for workflow query MCP handlers."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_get_workflow_agents_requires_workflow_id(self, store):
        """Test get_workflow_agents requires workflow_id."""
        result = call_tool("get_workflow_agents", {}, store)
        assert "error" in result
        assert "workflow_id" in result["error"]

    def test_get_workflow_agents_empty_workflow(self, store):
        """Test get_workflow_agents with no agents."""
        result = call_tool("get_workflow_agents", {"workflow_id": "nonexistent"}, store)
        assert result["agents"] == []
        assert result["total_count"] == 0
        assert "message" in result

    def test_get_workflow_sessions_requires_workflow_id(self, store):
        """Test get_workflow_sessions requires workflow_id."""
        result = call_tool("get_workflow_sessions", {"limit": 10}, store)
        assert "error" in result

    def test_get_workflow_sessions_pagination(self, store):
        """Test get_workflow_sessions returns pagination info."""
        result = call_tool("get_workflow_sessions", {
            "workflow_id": "test",
            "limit": 10,
            "offset": 0
        }, store)
        assert "sessions" in result
        assert "total_count" in result
        assert "has_more" in result
        assert result["limit"] == 10

    def test_get_session_events_requires_session_id(self, store):
        """Test get_session_events requires session_id."""
        result = call_tool("get_session_events", {}, store)
        assert "error" in result

    def test_get_session_events_not_found(self, store):
        """Test get_session_events with nonexistent session."""
        result = call_tool("get_session_events", {"session_id": "nonexistent"}, store)
        assert "error" in result
        assert "not found" in result["error"]

    # ==================== get_workflow_agents comprehensive tests ====================

    def test_get_workflow_agents_returns_agent_fields(self, store):
        """Test get_workflow_agents returns all expected agent fields."""
        session = SessionData("sess1", "agent-test-123456789", "test-workflow")
        agent = AgentData("agent-test-123456789", "test-workflow")
        agent.add_session("sess1")
        store._save_session(session)
        store._save_agent(agent)

        result = call_tool("get_workflow_agents", {"workflow_id": "test-workflow"}, store)

        assert result["total_count"] == 1
        agent = result["agents"][0]
        assert "agent_id" in agent
        assert "agent_id_short" in agent
        assert "display_name" in agent
        assert "description" in agent
        assert "last_seen" in agent
        assert "session_count" in agent

    def test_get_workflow_agents_includes_system_prompts(self, store):
        """Test system prompts are included by default."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={"llm.request.data": {"system": "You are a helpful assistant"}}
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        agent = AgentData("agent1", "wf1")
        agent.add_session("sess1")
        store._save_session(session)
        store._save_agent(agent)

        result = call_tool("get_workflow_agents", {"workflow_id": "wf1"}, store)

        assert result["agents"][0]["system_prompt"] == "You are a helpful assistant"

    def test_get_workflow_agents_excludes_system_prompts(self, store):
        """Test system prompts excluded when include_system_prompts=False."""
        session = SessionData("sess1", "agent1", "wf1")
        agent = AgentData("agent1", "wf1")
        agent.add_session("sess1")
        store._save_session(session)
        store._save_agent(agent)

        result = call_tool("get_workflow_agents", {
            "workflow_id": "wf1",
            "include_system_prompts": False
        }, store)

        assert "system_prompt" not in result["agents"][0]

    def test_get_workflow_agents_returns_recent_sessions(self, store):
        """Test recent_sessions returns session data."""
        session = SessionData("sess1", "agent1", "wf1")
        agent = AgentData("agent1", "wf1")
        agent.add_session("sess1")
        store._save_session(session)
        store._save_agent(agent)

        result = call_tool("get_workflow_agents", {"workflow_id": "wf1"}, store)

        assert "recent_sessions" in result
        assert isinstance(result["recent_sessions"], list)

    def test_get_workflow_agents_truncates_long_ids(self, store):
        """Test agent_id_short is truncated for long IDs."""
        long_id = "agent-very-long-identifier-12345"
        session = SessionData("sess1", long_id, "wf1")
        agent = AgentData(long_id, "wf1")
        agent.add_session("sess1")
        store._save_session(session)
        store._save_agent(agent)

        result = call_tool("get_workflow_agents", {"workflow_id": "wf1"}, store)

        assert result["agents"][0]["agent_id"] == long_id
        assert result["agents"][0]["agent_id_short"] == long_id[:12]

    # ==================== get_workflow_sessions comprehensive tests ====================

    def test_get_workflow_sessions_filter_by_agent(self, store):
        """Test filtering sessions by agent_id."""
        session1 = SessionData("sess1", "agent1", "wf1")
        session2 = SessionData("sess2", "agent2", "wf1")
        store._save_session(session1)
        store._save_session(session2)

        result = call_tool("get_workflow_sessions", {
            "workflow_id": "wf1",
            "agent_id": "agent1"
        }, store)

        assert all(s.get("agent_id") == "agent1" for s in result["sessions"])

    def test_get_workflow_sessions_filter_by_status(self, store):
        """Test filtering sessions by status."""
        session1 = SessionData("sess1", "agent1", "wf1")
        session1.is_completed = True
        session2 = SessionData("sess2", "agent1", "wf1")
        session2.is_completed = False
        store._save_session(session1)
        store._save_session(session2)

        result = call_tool("get_workflow_sessions", {
            "workflow_id": "wf1",
            "status": "COMPLETED"
        }, store)

        assert result["total_count"] == 1

    def test_get_workflow_sessions_limit_capped(self, store):
        """Test limit is capped at 100."""
        result = call_tool("get_workflow_sessions", {
            "workflow_id": "wf1",
            "limit": 500
        }, store)

        assert result["limit"] == 100

    def test_get_workflow_sessions_offset(self, store):
        """Test offset pagination."""
        for i in range(5):
            session = SessionData(f"sess{i}", "agent1", "wf1")
            store._save_session(session)

        result = call_tool("get_workflow_sessions", {
            "workflow_id": "wf1",
            "limit": 2,
            "offset": 2
        }, store)

        assert result["offset"] == 2
        assert len(result["sessions"]) <= 2

    def test_get_workflow_sessions_has_more_flag(self, store):
        """Test has_more flag is correct."""
        for i in range(5):
            session = SessionData(f"sess{i}", "agent1", "wf1")
            store._save_session(session)

        result = call_tool("get_workflow_sessions", {
            "workflow_id": "wf1",
            "limit": 2,
            "offset": 0
        }, store)

        assert result["has_more"] == True

        result2 = call_tool("get_workflow_sessions", {
            "workflow_id": "wf1",
            "limit": 10,
            "offset": 0
        }, store)

        assert result2["has_more"] == False

    # ==================== get_session_events comprehensive tests ====================

    def test_get_session_events_returns_event_fields(self, store):
        """Test events have all expected fields."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={"test": "value"}
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        assert result["count"] == 1
        evt = result["events"][0]
        assert "id" in evt
        assert "name" in evt
        assert "timestamp" in evt
        assert "level" in evt
        assert "attributes" in evt

    def test_get_session_events_filter_by_type(self, store):
        """Test filtering by event_types."""
        events = [
            BaseEvent(trace_id="a"*32, span_id="b"*16, name=EventName.LLM_CALL_START, agent_id="agent1", session_id="sess1"),
            BaseEvent(trace_id="a"*32, span_id="c"*16, name=EventName.TOOL_EXECUTION, agent_id="agent1", session_id="sess1"),
            BaseEvent(trace_id="a"*32, span_id="d"*16, name=EventName.LLM_CALL_FINISH, agent_id="agent1", session_id="sess1"),
        ]
        session = SessionData("sess1", "agent1", "wf1")
        for e in events:
            session.add_event(e)
        store._save_session(session)

        result = call_tool("get_session_events", {
            "session_id": "sess1",
            "event_types": ["llm.call.start", "llm.call.finish"]
        }, store)

        assert result["total_count"] == 2
        assert all(e["name"] in ["llm.call.start", "llm.call.finish"] for e in result["events"])

    def test_get_session_events_limit_capped(self, store):
        """Test limit is capped at 200."""
        session = SessionData("sess1", "agent1", "wf1")
        store._save_session(session)

        result = call_tool("get_session_events", {
            "session_id": "sess1",
            "limit": 500
        }, store)

        assert result["limit"] == 200

    def test_get_session_events_offset(self, store):
        """Test offset pagination."""
        session = SessionData("sess1", "agent1", "wf1")
        for i in range(10):
            event = BaseEvent(trace_id="a"*32, span_id=f"{i:016x}", name=EventName.LLM_CALL_START, agent_id="agent1", session_id="sess1")
            session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {
            "session_id": "sess1",
            "limit": 3,
            "offset": 5
        }, store)

        assert result["offset"] == 5
        assert result["count"] == 3

    def test_get_session_events_has_more_flag(self, store):
        """Test has_more flag is correct."""
        session = SessionData("sess1", "agent1", "wf1")
        for i in range(10):
            event = BaseEvent(trace_id="a"*32, span_id=f"{i:016x}", name=EventName.LLM_CALL_START, agent_id="agent1", session_id="sess1")
            session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {
            "session_id": "sess1",
            "limit": 5
        }, store)

        assert result["has_more"] == True

        result2 = call_tool("get_session_events", {
            "session_id": "sess1",
            "limit": 20
        }, store)

        assert result2["has_more"] == False

    # ==================== get_event tests ====================

    def test_get_event_returns_full_details(self, store):
        """Test get_event returns complete event with all attributes."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "llm.request.data": {
                    "model": "claude-3",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "tools": [{"name": "bash", "description": "Run bash"}]
                }
            }
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_event", {
            "session_id": "sess1",
            "event_id": "b" * 16
        }, store)

        assert "event" in result
        assert result["event"]["id"] == "b" * 16
        assert "llm.request.data" in result["event"]["attributes"]
        assert result["event"]["attributes"]["llm.request.data"]["model"] == "claude-3"

    def test_get_event_not_found(self, store):
        """Test get_event returns error for missing event."""
        session = SessionData("sess1", "agent1", "wf1")
        store._save_session(session)

        result = call_tool("get_event", {
            "session_id": "sess1",
            "event_id": "nonexistent"
        }, store)

        assert "error" in result

    def test_get_event_session_not_found(self, store):
        """Test get_event returns error for missing session."""
        result = call_tool("get_event", {
            "session_id": "nonexistent",
            "event_id": "abc123"
        }, store)

        assert "error" in result

    # ==================== get_session_events slim format tests ====================

    def test_get_session_events_returns_slim_format(self, store):
        """Test get_session_events returns condensed event data."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "llm.request.data": {
                    "model": "claude-3",
                    "max_tokens": 1024,
                    "messages": [
                        {"role": "system", "content": "You are helpful"},
                        {"role": "user", "content": "Hello world"}
                    ],
                    "tools": [
                        {"name": "bash", "description": "Run bash commands"},
                        {"name": "read", "description": "Read files"}
                    ]
                }
            }
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        evt = result["events"][0]
        # Should have summary fields
        assert evt["model"] == "claude-3"
        assert evt["max_tokens"] == 1024
        assert evt["message_count"] == 2
        assert evt["tool_names"] == ["bash", "read"]
        # Should NOT have full attributes
        assert "attributes" not in evt

    def test_get_session_events_llm_finish_has_metrics(self, store):
        """Test llm.call.finish events include response metrics."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_FINISH,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "llm.response.duration_ms": 1500,
                "llm.usage.total_tokens": 500,
                "llm.usage.input_tokens": 100,
                "llm.usage.output_tokens": 400
            }
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        evt = result["events"][0]
        assert evt["duration_ms"] == 1500
        assert evt["total_tokens"] == 500
        assert evt["input_tokens"] == 100
        assert evt["output_tokens"] == 400

    def test_get_session_events_tool_execution_has_name(self, store):
        """Test tool.execution events include tool name."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.TOOL_EXECUTION,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "tool.name": "bash",
                "tool.execution_time_ms": 250
            }
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        evt = result["events"][0]
        assert evt["tool_name"] == "bash"
        assert evt["execution_time_ms"] == 250
