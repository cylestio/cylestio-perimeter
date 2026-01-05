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
        """Test events have all expected core fields (slim format)."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={"llm.request.data": {"model": "test-model"}}
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        assert result["count"] == 1
        evt = result["events"][0]
        # Core fields always present
        assert "id" in evt
        assert "name" in evt
        assert "timestamp" in evt
        assert "level" in evt
        # Slim format: model extracted, no full attributes
        assert evt.get("model") == "test-model"
        assert "attributes" not in evt

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

    def test_get_session_events_filter_updates_total_count(self, store):
        """Test that total_count reflects filtered results, not all events."""
        events = [
            BaseEvent(trace_id="a"*32, span_id="1"*16, name=EventName.LLM_CALL_START, agent_id="agent1", session_id="sess1"),
            BaseEvent(trace_id="a"*32, span_id="2"*16, name=EventName.TOOL_EXECUTION, agent_id="agent1", session_id="sess1"),
            BaseEvent(trace_id="a"*32, span_id="3"*16, name=EventName.TOOL_EXECUTION, agent_id="agent1", session_id="sess1"),
            BaseEvent(trace_id="a"*32, span_id="4"*16, name=EventName.LLM_CALL_FINISH, agent_id="agent1", session_id="sess1"),
            BaseEvent(trace_id="a"*32, span_id="5"*16, name=EventName.LLM_CALL_START, agent_id="agent1", session_id="sess1"),
        ]
        session = SessionData("sess1", "agent1", "wf1")
        for e in events:
            session.add_event(e)
        store._save_session(session)

        # Without filter - all 5 events
        result_all = call_tool("get_session_events", {"session_id": "sess1"}, store)
        assert result_all["total_count"] == 5
        assert result_all["count"] == 5

        # Filter for tool.execution only - should be 2
        result_tools = call_tool("get_session_events", {
            "session_id": "sess1",
            "event_types": ["tool.execution"]
        }, store)
        assert result_tools["total_count"] == 2
        assert result_tools["count"] == 2

        # Filter for llm events - should be 3
        result_llm = call_tool("get_session_events", {
            "session_id": "sess1",
            "event_types": ["llm.call.start", "llm.call.finish"]
        }, store)
        assert result_llm["total_count"] == 3
        assert result_llm["count"] == 3

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

    def test_get_session_events_error_event_has_error_fields(self, store):
        """Test error events include error_type and error_message."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_FINISH,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "error.type": "RateLimitError",
                "error.message": "Too many requests"
            }
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        evt = result["events"][0]
        assert evt["error_type"] == "RateLimitError"
        assert evt["error_message"] == "Too many requests"

    def test_get_session_events_minimal_event(self, store):
        """Test events without specific attributes still work."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={}
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        evt = result["events"][0]
        # Core fields present
        assert evt["id"] == "b" * 16
        assert evt["name"] == "llm.call.start"
        assert "timestamp" in evt
        assert evt["level"] == "INFO"
        # No extra fields for empty attributes
        assert "model" not in evt
        assert "attributes" not in evt

    def test_get_session_events_mixed_event_types(self, store):
        """Test realistic session with mixed event types."""
        events = [
            BaseEvent(
                trace_id="a" * 32,
                span_id="1" * 16,
                name=EventName.LLM_CALL_START,
                agent_id="agent1",
                session_id="sess1",
                attributes={
                    "llm.request.data": {
                        "model": "claude-3-opus",
                        "max_tokens": 4096,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "tools": [{"name": "read_file"}, {"name": "write_file"}]
                    }
                }
            ),
            BaseEvent(
                trace_id="a" * 32,
                span_id="2" * 16,
                name=EventName.TOOL_EXECUTION,
                agent_id="agent1",
                session_id="sess1",
                attributes={
                    "tool.name": "read_file",
                    "tool.execution_time_ms": 150
                }
            ),
            BaseEvent(
                trace_id="a" * 32,
                span_id="3" * 16,
                name=EventName.LLM_CALL_FINISH,
                agent_id="agent1",
                session_id="sess1",
                attributes={
                    "llm.response.duration_ms": 2500,
                    "llm.usage.total_tokens": 1000,
                    "llm.usage.input_tokens": 200,
                    "llm.usage.output_tokens": 800
                }
            ),
        ]
        session = SessionData("sess1", "agent1", "wf1")
        for e in events:
            session.add_event(e)
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "sess1"}, store)

        assert result["count"] == 3

        # Check llm.call.start event
        start_evt = result["events"][0]
        assert start_evt["name"] == "llm.call.start"
        assert start_evt["model"] == "claude-3-opus"
        assert start_evt["max_tokens"] == 4096
        assert start_evt["message_count"] == 1
        assert start_evt["tool_names"] == ["read_file", "write_file"]

        # Check tool.execution event
        tool_evt = result["events"][1]
        assert tool_evt["name"] == "tool.execution"
        assert tool_evt["tool_name"] == "read_file"
        assert tool_evt["execution_time_ms"] == 150

        # Check llm.call.finish event
        finish_evt = result["events"][2]
        assert finish_evt["name"] == "llm.call.finish"
        assert finish_evt["duration_ms"] == 2500
        assert finish_evt["total_tokens"] == 1000

    def test_get_event_after_get_session_events_workflow(self, store):
        """Test typical workflow: list events, then get full details."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="target123456789",
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "llm.request.data": {
                    "model": "claude-3",
                    "messages": [
                        {"role": "system", "content": "You are helpful"},
                        {"role": "user", "content": "Hello world, this is a long message"}
                    ]
                }
            }
        )
        session = SessionData("sess1", "agent1", "wf1")
        session.add_event(event)
        store._save_session(session)

        # Step 1: Get slim event list
        list_result = call_tool("get_session_events", {"session_id": "sess1"}, store)
        assert list_result["count"] == 1
        slim_evt = list_result["events"][0]
        assert slim_evt["message_count"] == 2
        assert "attributes" not in slim_evt  # No full attributes in list

        # Step 2: Get full details using the event ID from list
        event_id = slim_evt["id"]
        detail_result = call_tool("get_event", {
            "session_id": "sess1",
            "event_id": event_id
        }, store)

        assert "event" in detail_result
        full_evt = detail_result["event"]
        assert full_evt["id"] == event_id
        assert "attributes" in full_evt  # Full attributes available
        assert full_evt["attributes"]["llm.request.data"]["messages"][1]["content"] == "Hello world, this is a long message"

    # ==================== Additional edge case and normal use tests ====================

    def test_get_workflow_agents_multiple_agents(self, store):
        """Test get_workflow_agents returns multiple agents correctly."""
        # Create sessions for different agents in same workflow
        session1 = SessionData("sess1", "agent-alpha", "shared-workflow")
        session2 = SessionData("sess2", "agent-beta", "shared-workflow")
        session3 = SessionData("sess3", "agent-alpha", "shared-workflow")  # Same agent, different session

        agent1 = AgentData("agent-alpha", "shared-workflow")
        agent1.add_session("sess1")
        agent1.add_session("sess3")

        agent2 = AgentData("agent-beta", "shared-workflow")
        agent2.add_session("sess2")

        store._save_session(session1)
        store._save_session(session2)
        store._save_session(session3)
        store._save_agent(agent1)
        store._save_agent(agent2)

        result = call_tool("get_workflow_agents", {"workflow_id": "shared-workflow"}, store)

        assert result["total_count"] == 2
        agent_ids = [a["agent_id"] for a in result["agents"]]
        assert "agent-alpha" in agent_ids
        assert "agent-beta" in agent_ids

    def test_get_workflow_sessions_empty_workflow(self, store):
        """Test get_workflow_sessions with workflow that has no sessions."""
        result = call_tool("get_workflow_sessions", {
            "workflow_id": "nonexistent-workflow"
        }, store)

        assert result["sessions"] == []
        assert result["total_count"] == 0
        assert result["has_more"] == False

    def test_get_session_events_empty_session(self, store):
        """Test get_session_events with session that has no events."""
        session = SessionData("empty-sess", "agent1", "wf1")
        store._save_session(session)

        result = call_tool("get_session_events", {"session_id": "empty-sess"}, store)

        assert result["events"] == []
        assert result["count"] == 0
        assert result["total_count"] == 0
        assert result["has_more"] == False

    def test_get_event_requires_session_id(self, store):
        """Test get_event returns error when session_id is missing."""
        result = call_tool("get_event", {"event_id": "some-event"}, store)

        assert "error" in result
        assert "session_id" in result["error"]

    def test_get_event_requires_event_id(self, store):
        """Test get_event returns error when event_id is missing."""
        result = call_tool("get_event", {"session_id": "some-session"}, store)

        assert "error" in result
        assert "event_id" in result["error"]

    def test_get_workflow_sessions_multiple_sessions_sorted(self, store):
        """Test get_workflow_sessions returns multiple sessions."""
        for i in range(5):
            session = SessionData(f"sess-{i}", "agent1", "multi-sess-wf")
            store._save_session(session)

        result = call_tool("get_workflow_sessions", {
            "workflow_id": "multi-sess-wf",
            "limit": 10
        }, store)

        assert result["total_count"] == 5
        assert len(result["sessions"]) == 5

    def test_get_session_events_large_session(self, store):
        """Test get_session_events with many events and pagination."""
        session = SessionData("large-sess", "agent1", "wf1")
        for i in range(50):
            event = BaseEvent(
                trace_id="a" * 32,
                span_id=f"{i:016x}",
                name=EventName.LLM_CALL_START,
                agent_id="agent1",
                session_id="large-sess",
                attributes={"llm.request.data": {"model": f"model-{i}"}}
            )
            session.add_event(event)
        store._save_session(session)

        # First page
        result1 = call_tool("get_session_events", {
            "session_id": "large-sess",
            "limit": 20,
            "offset": 0
        }, store)

        assert result1["count"] == 20
        assert result1["total_count"] == 50
        assert result1["has_more"] == True

        # Second page
        result2 = call_tool("get_session_events", {
            "session_id": "large-sess",
            "limit": 20,
            "offset": 20
        }, store)

        assert result2["count"] == 20
        assert result2["offset"] == 20
        assert result2["has_more"] == True

        # Last page
        result3 = call_tool("get_session_events", {
            "session_id": "large-sess",
            "limit": 20,
            "offset": 40
        }, store)

        assert result3["count"] == 10  # Only 10 remaining
        assert result3["has_more"] == False


class TestIDEHeartbeatHandler:
    """Tests for IDE heartbeat handler."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_ide_heartbeat_requires_agent_workflow_id(self, store):
        """Test ide_heartbeat returns error when agent_workflow_id is missing."""
        result = call_tool("ide_heartbeat", {}, store)

        assert "error" in result
        assert "agent_workflow_id" in result["error"]

    def test_ide_heartbeat_creates_activity_record(self, store):
        """Test ide_heartbeat creates activity record with IDE metadata."""
        result = call_tool("ide_heartbeat", {
            "agent_workflow_id": "test-workflow",
            "ide_type": "cursor",
            "workspace_path": "/path/to/project",
            "model": "claude-sonnet-4"
        }, store)

        assert "error" not in result
        assert result["has_activity"] is True
        assert result["last_seen"] is not None
        assert result["ide"] is not None
        assert result["ide"]["ide_type"] == "cursor"
        assert result["ide"]["workspace_path"] == "/path/to/project"
        assert result["ide"]["model"] == "claude-sonnet-4"
        assert "message" in result

    def test_ide_heartbeat_with_minimal_args(self, store):
        """Test ide_heartbeat works with just agent_workflow_id."""
        result = call_tool("ide_heartbeat", {
            "agent_workflow_id": "test-workflow"
        }, store)

        assert "error" not in result
        assert result["has_activity"] is True
        assert result["last_seen"] is not None
        # No IDE metadata since ide_type not provided
        assert result["ide"] is None
        assert "message" in result

    def test_ide_heartbeat_updates_existing(self, store):
        """Test ide_heartbeat updates existing record."""
        # First heartbeat
        call_tool("ide_heartbeat", {
            "agent_workflow_id": "test-workflow",
            "ide_type": "cursor"
        }, store)

        # Second heartbeat with different IDE type
        result = call_tool("ide_heartbeat", {
            "agent_workflow_id": "test-workflow",
            "ide_type": "claude-code",
            "workspace_path": "/new/path"
        }, store)

        assert result["ide"]["ide_type"] == "claude-code"
        assert result["ide"]["workspace_path"] == "/new/path"
