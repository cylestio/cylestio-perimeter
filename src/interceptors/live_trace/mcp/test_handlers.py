"""Tests for MCP handlers with agent_id support."""
import pytest

from ..store import TraceStore
from .handlers import call_tool


class TestMCPAgentHandlers:
    """Tests for MCP handlers with agent_id."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_create_analysis_session_handler_with_agent(self, store):
        """Test create_analysis_session MCP handler with agent_id."""
        result = call_tool(
            "create_analysis_session",
            {
                "agent_id": "my-agent",
                "session_type": "STATIC",
                "agent_name": "My Agent"
            },
            store
        )

        assert "session" in result
        session = result["session"]
        assert session["agent_id"] == "my-agent"
        assert session["agent_name"] == "My Agent"
        assert session["session_type"] == "STATIC"

    def test_create_analysis_session_handler_without_agent(self, store):
        """Test create_analysis_session MCP handler without agent_id returns error."""
        result = call_tool(
            "create_analysis_session",
            {
                "session_type": "STATIC"
            },
            store
        )

        # Should return error since agent_id is required
        assert "error" in result
        assert "agent_id" in result["error"]

    def test_store_finding_handler_inherits_agent(self, store):
        """Test store_finding inherits agent_id from session."""
        # First create a session with agent_id
        session_result = call_tool(
            "create_analysis_session",
            {
                "agent_id": "finding-agent",
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
        assert finding["agent_id"] == "finding-agent"

    def test_get_findings_handler_filters_by_agent(self, store):
        """Test get_findings MCP handler filters by agent_id."""
        # Create sessions for different agents
        session1_result = call_tool(
            "create_analysis_session",
            {"agent_id": "agent-a", "session_type": "STATIC"},
            store
        )
        session2_result = call_tool(
            "create_analysis_session",
            {"agent_id": "agent-b", "session_type": "STATIC"},
            store
        )

        session1_id = session1_result["session"]["session_id"]
        session2_id = session2_result["session"]["session_id"]

        # Store findings in different agents
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

        # Get findings filtered by agent
        result = call_tool(
            "get_findings",
            {"agent_id": "agent-a"},
            store
        )

        assert "findings" in result
        assert result["total_count"] == 1
        assert result["findings"][0]["agent_id"] == "agent-a"

    def test_get_agent_state_no_data(self, store):
        """Test get_agent_state with no data returns NO_DATA state."""
        result = call_tool(
            "get_agent_state",
            {"agent_id": "new-agent"},
            store
        )

        assert "state" in result
        assert result["state"] == "NO_DATA"
        assert result["agent_id"] == "new-agent"

    def test_get_agent_state_with_static_only(self, store):
        """Test get_agent_state returns STATIC_ONLY when only static data exists."""
        # Create an analysis session
        call_tool(
            "create_analysis_session",
            {"agent_id": "static-agent", "session_type": "STATIC"},
            store
        )

        result = call_tool(
            "get_agent_state",
            {"agent_id": "static-agent"},
            store
        )

        assert result["state"] == "STATIC_ONLY"
        assert result["has_static_analysis"] is True
        assert result["has_dynamic_sessions"] is False

    def test_get_recommendations_by_agent(self, store):
        """Test get_recommendations filters by agent_id."""
        result = call_tool(
            "get_recommendations",
            {"agent_id": "test-agent"},
            store
        )

        assert "recommendations" in result
        assert "total_count" in result

    def test_get_gate_status_requires_agent(self, store):
        """Test get_gate_status requires agent_id."""
        result = call_tool(
            "get_gate_status",
            {},
            store
        )

        assert "error" in result
        assert "agent_id" in result["error"]

    def test_get_agent_correlation_no_static(self, store):
        """Test get_agent_correlation when no static data exists."""
        result = call_tool(
            "get_agent_correlation",
            {"agent_id": "empty-agent"},
            store
        )

        assert "error" in result
        assert "No static analysis data" in result["error"]
