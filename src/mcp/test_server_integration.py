"""Integration tests for MCP server module."""
import pytest

from src.mcp.server import call_tool, initialize_mcp


class MockStore:
    """Mock TraceStore for testing."""

    def __init__(self):
        self.sessions = {}
        self.findings = {}

    def create_analysis_session(self, session_id, agent_id, session_type, agent_name=None):
        session = {
            "session_id": session_id,
            "agent_id": agent_id,
            "session_type": session_type,
            "agent_name": agent_name,
            "status": "IN_PROGRESS",
            "created_at": "2025-01-01T00:00:00Z",
        }
        self.sessions[session_id] = session
        return session

    def get_analysis_session(self, session_id):
        return self.sessions.get(session_id)

    def complete_analysis_session(self, session_id, risk_score=None):
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session["status"] = "COMPLETED"
            session["risk_score"] = risk_score
            session["completed_at"] = "2025-01-01T00:00:00Z"
            return session
        return None

    def store_finding(
        self,
        finding_id,
        session_id,
        agent_id,
        file_path,
        finding_type,
        severity,
        title,
        description=None,
        line_start=None,
        line_end=None,
        evidence=None,
        owasp_mapping=None,
    ):
        finding = {
            "finding_id": finding_id,
            "session_id": session_id,
            "agent_id": agent_id,
            "file_path": file_path,
            "finding_type": finding_type,
            "severity": severity,
            "title": title,
            "description": description,
            "line_start": line_start,
            "line_end": line_end,
            "evidence": evidence,
            "owasp_mapping": owasp_mapping,
            "status": "OPEN",
            "created_at": "2025-01-01T00:00:00Z",
        }
        self.findings[finding_id] = finding
        return finding

    def get_findings(
        self, session_id=None, agent_id=None, severity=None, status=None, limit=100
    ):
        results = []
        for finding in self.findings.values():
            if session_id and finding["session_id"] != session_id:
                continue
            if agent_id and finding["agent_id"] != agent_id:
                continue
            if severity and finding["severity"] != severity:
                continue
            if status and finding["status"] != status:
                continue
            results.append(finding)
            if len(results) >= limit:
                break
        return results

    def update_finding_status(self, finding_id, status, notes=None):
        if finding_id in self.findings:
            finding = self.findings[finding_id]
            finding["status"] = status
            finding["updated_at"] = "2025-01-01T00:00:00Z"
            if notes:
                finding["notes"] = notes
            return finding
        return None


def test_initialize_mcp():
    """Test that initialize_mcp sets up storage tools."""
    store = MockStore()
    initialize_mcp(store)

    # Now storage tools should work
    result = call_tool(
        "create_analysis_session",
        {
            "agent_id": "test-agent",
            "session_type": "STATIC",
            "agent_name": "Test Agent",
        },
    )

    assert result["success"] is True
    assert "session" in result["data"]
    assert result["data"]["session"]["agent_id"] == "test-agent"


def test_full_analysis_workflow():
    """Test a complete analysis workflow with store."""
    store = MockStore()
    initialize_mcp(store)

    # Create session
    session_result = call_tool(
        "create_analysis_session",
        {
            "agent_id": "workflow-agent",
            "session_type": "STATIC",
        },
    )
    assert session_result["success"] is True
    session_id = session_result["data"]["session"]["session_id"]

    # Store a finding
    finding_result = call_tool(
        "store_finding",
        {
            "session_id": session_id,
            "file_path": "/test/file.py",
            "finding_type": "PROMPT_INJECTION",
            "severity": "HIGH",
            "title": "Potential prompt injection",
            "description": "User input not validated",
            "line_start": 10,
            "line_end": 15,
            "code_snippet": "prompt = user_input",
            "context": "Direct user input usage",
            "owasp_mapping": ["LLM01"],
        },
    )
    assert finding_result["success"] is True
    finding_id = finding_result["data"]["finding"]["finding_id"]

    # Get findings
    get_result = call_tool("get_findings", {"session_id": session_id})
    assert get_result["success"] is True
    assert get_result["data"]["total_count"] == 1

    # Update finding status
    update_result = call_tool(
        "update_finding_status",
        {
            "finding_id": finding_id,
            "status": "FIXED",
            "notes": "Implemented input validation",
        },
    )
    assert update_result["success"] is True
    assert update_result["data"]["finding"]["status"] == "FIXED"

    # Complete session
    complete_result = call_tool(
        "complete_analysis_session",
        {
            "session_id": session_id,
            "calculate_risk": True,
        },
    )
    assert complete_result["success"] is True
    assert complete_result["data"]["session"]["status"] == "COMPLETED"


def test_storage_tools_without_initialization():
    """Test that storage tools fail without initialization."""
    # Reset store by importing and clearing
    from src.mcp.tools import storage

    storage._store = None

    result = call_tool(
        "create_analysis_session",
        {
            "agent_id": "test-agent",
        },
    )

    assert result["success"] is False
    assert result["error"]["code"] == "STORE_NOT_INITIALIZED"
