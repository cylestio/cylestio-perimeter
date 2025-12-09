"""Tests for MCP handlers with workflow_id support."""
import pytest

from ..store import TraceStore
from .handlers import call_tool


class TestMCPWorkflowHandlers:
    """Tests for MCP handlers with workflow_id."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_create_analysis_session_handler_with_workflow(self, store):
        """Test create_analysis_session MCP handler with workflow_id."""
        result = call_tool(
            "create_analysis_session",
            {
                "workflow_id": "my-workflow",
                "session_type": "STATIC",
                "workflow_name": "My Workflow"
            },
            store
        )

        assert "session" in result
        session = result["session"]
        assert session["workflow_id"] == "my-workflow"
        assert session["workflow_name"] == "My Workflow"
        assert session["session_type"] == "STATIC"

    def test_create_analysis_session_handler_without_workflow(self, store):
        """Test create_analysis_session MCP handler without workflow_id returns error."""
        result = call_tool(
            "create_analysis_session",
            {
                "session_type": "STATIC"
            },
            store
        )

        # Should return error since workflow_id is now required
        assert "error" in result
        assert "workflow_id" in result["error"]

    def test_store_finding_handler_inherits_workflow(self, store):
        """Test store_finding inherits workflow_id from session."""
        # First create a session with workflow_id
        session_result = call_tool(
            "create_analysis_session",
            {
                "workflow_id": "finding-workflow",
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
        assert finding["workflow_id"] == "finding-workflow"

    def test_get_findings_handler_filters_by_workflow(self, store):
        """Test get_findings MCP handler filters by workflow_id."""
        # Create sessions for different workflows
        session1_result = call_tool(
            "create_analysis_session",
            {"workflow_id": "workflow-a", "session_type": "STATIC"},
            store
        )
        session2_result = call_tool(
            "create_analysis_session",
            {"workflow_id": "workflow-b", "session_type": "STATIC"},
            store
        )

        session1_id = session1_result["session"]["session_id"]
        session2_id = session2_result["session"]["session_id"]

        # Store findings in different workflows
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

        # Get findings filtered by workflow
        result = call_tool(
            "get_findings",
            {"workflow_id": "workflow-a"},
            store
        )

        assert "findings" in result
        assert result["total_count"] == 1
        assert result["findings"][0]["workflow_id"] == "workflow-a"
