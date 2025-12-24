"""Tests for MCP handlers with agent_workflow_id support."""
import pytest

from ..store import TraceStore
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
