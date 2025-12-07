"""Tests for storage MCP tools."""
import pytest

from src.interceptors.live_trace.store import TraceStore
from src.mcp.tools.storage import (
    complete_analysis_session,
    create_analysis_session,
    get_findings,
    set_store,
    store_finding,
    update_finding_status,
)


@pytest.fixture
def trace_store():
    """Create an in-memory TraceStore for testing."""
    store = TraceStore(storage_mode="memory")
    set_store(store)
    yield store
    set_store(None)


def test_create_analysis_session_success(trace_store):
    """Test creating an analysis session."""
    result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
        agent_name="Test Agent",
    )

    assert result["success"] is True
    assert "session" in result["data"]
    assert result["data"]["session"]["agent_id"] == "test-agent"
    assert result["data"]["session"]["session_type"] == "STATIC"
    assert result["data"]["session"]["agent_name"] == "Test Agent"
    assert result["data"]["session"]["status"] == "IN_PROGRESS"
    assert "session_id" in result["data"]["session"]


def test_create_analysis_session_invalid_type(trace_store):
    """Test creating session with invalid session type."""
    result = create_analysis_session(
        agent_id="test-agent",
        session_type="INVALID",
    )

    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_SESSION_TYPE"
    assert "STATIC, DYNAMIC, AUTOFIX" in result["error"]["suggestion"]


def test_store_finding_success(trace_store):
    """Test storing a finding."""
    # Create session first
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    # Store finding
    result = store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="HIGH",
        title="Unvalidated user input in prompt",
        description="User input is directly concatenated into prompt without validation",
        line_start=42,
        line_end=45,
        code_snippet='prompt = f"User says: {user_input}"',
        context="This allows arbitrary prompt injection",
        owasp_mapping=["LLM01"],
    )

    assert result["success"] is True
    assert "finding" in result["data"]
    assert result["data"]["finding"]["session_id"] == session_id
    assert result["data"]["finding"]["severity"] == "HIGH"
    assert result["data"]["finding"]["status"] == "OPEN"
    assert result["data"]["finding"]["file_path"] == "src/agent.py"
    assert result["data"]["finding"]["line_start"] == 42
    assert result["data"]["finding"]["evidence"]["code_snippet"] == 'prompt = f"User says: {user_input}"'
    assert "finding_id" in result["data"]["finding"]


def test_store_finding_invalid_severity(trace_store):
    """Test storing finding with invalid severity."""
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    result = store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="SUPER_HIGH",  # Invalid
        title="Test finding",
    )

    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_SEVERITY"
    assert "CRITICAL, HIGH, MEDIUM, LOW" in result["error"]["suggestion"]


def test_store_finding_session_not_found(trace_store):
    """Test storing finding with non-existent session."""
    result = store_finding(
        session_id="sess_nonexistent",
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="HIGH",
        title="Test finding",
    )

    assert result["success"] is False
    assert result["error"]["code"] == "SESSION_NOT_FOUND"


def test_get_findings_no_filter(trace_store):
    """Test getting findings without filters."""
    # Create session and findings
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="HIGH",
        title="Finding 1",
    )

    store_finding(
        session_id=session_id,
        file_path="src/tools.py",
        finding_type="EXCESSIVE_AGENCY",
        severity="MEDIUM",
        title="Finding 2",
    )

    # Get all findings
    result = get_findings()

    assert result["success"] is True
    assert result["data"]["total_count"] == 2
    assert len(result["data"]["findings"]) == 2


def test_get_findings_filter_by_severity(trace_store):
    """Test getting findings filtered by severity."""
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="HIGH",
        title="High severity",
    )

    store_finding(
        session_id=session_id,
        file_path="src/tools.py",
        finding_type="EXCESSIVE_AGENCY",
        severity="MEDIUM",
        title="Medium severity",
    )

    # Filter by HIGH severity
    result = get_findings(severity="HIGH")

    assert result["success"] is True
    assert result["data"]["total_count"] == 1
    assert result["data"]["findings"][0]["severity"] == "HIGH"


def test_get_findings_filter_by_status(trace_store):
    """Test getting findings filtered by status."""
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    finding1 = store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="HIGH",
        title="Finding 1",
    )
    finding_id = finding1["data"]["finding"]["finding_id"]

    store_finding(
        session_id=session_id,
        file_path="src/tools.py",
        finding_type="EXCESSIVE_AGENCY",
        severity="MEDIUM",
        title="Finding 2",
    )

    # Update one finding to FIXED
    update_finding_status(finding_id, "FIXED", "Issue resolved")

    # Filter by OPEN status
    result = get_findings(status="OPEN")

    assert result["success"] is True
    assert result["data"]["total_count"] == 1
    assert result["data"]["findings"][0]["status"] == "OPEN"


def test_get_findings_invalid_severity(trace_store):
    """Test getting findings with invalid severity filter."""
    result = get_findings(severity="SUPER_HIGH")

    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_SEVERITY"


def test_get_findings_invalid_status(trace_store):
    """Test getting findings with invalid status filter."""
    result = get_findings(status="MAYBE_FIXED")

    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_STATUS"


def test_update_finding_status_success(trace_store):
    """Test updating finding status."""
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    finding_result = store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="HIGH",
        title="Test finding",
    )
    finding_id = finding_result["data"]["finding"]["finding_id"]

    # Update status
    result = update_finding_status(
        finding_id=finding_id,
        status="FIXED",
        notes="Applied input validation",
    )

    assert result["success"] is True
    assert result["data"]["finding"]["status"] == "FIXED"
    assert result["data"]["finding"]["finding_id"] == finding_id
    assert "Applied input validation" in result["data"]["finding"]["description"]


def test_update_finding_status_invalid_status(trace_store):
    """Test updating finding with invalid status."""
    result = update_finding_status(
        finding_id="find_123",
        status="MAYBE_FIXED",
    )

    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_STATUS"


def test_update_finding_status_not_found(trace_store):
    """Test updating non-existent finding."""
    result = update_finding_status(
        finding_id="find_nonexistent",
        status="FIXED",
    )

    assert result["success"] is False
    assert result["error"]["code"] == "FINDING_NOT_FOUND"


def test_complete_analysis_session_success(trace_store):
    """Test completing an analysis session with risk calculation."""
    session_result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )
    session_id = session_result["data"]["session"]["session_id"]

    # Add findings with different severities
    store_finding(
        session_id=session_id,
        file_path="src/agent.py",
        finding_type="PROMPT_INJECTION",
        severity="CRITICAL",
        title="Critical finding",
    )

    store_finding(
        session_id=session_id,
        file_path="src/tools.py",
        finding_type="EXCESSIVE_AGENCY",
        severity="HIGH",
        title="High finding",
    )

    store_finding(
        session_id=session_id,
        file_path="src/utils.py",
        finding_type="DATA_LEAK",
        severity="MEDIUM",
        title="Medium finding",
    )

    # Complete session
    result = complete_analysis_session(session_id=session_id)

    assert result["success"] is True
    assert result["data"]["session"]["status"] == "COMPLETED"
    assert result["data"]["session"]["session_id"] == session_id
    assert result["data"]["risk_score"] is not None
    # Risk score should be: CRITICAL(25) + HIGH(15) + MEDIUM(5) = 45
    assert result["data"]["risk_score"] == 45


def test_complete_analysis_session_not_found(trace_store):
    """Test completing non-existent session."""
    result = complete_analysis_session(session_id="sess_nonexistent")

    assert result["success"] is False
    assert result["error"]["code"] == "SESSION_NOT_FOUND"


def test_store_not_initialized():
    """Test that tools fail gracefully when store is not initialized."""
    # Ensure store is not set
    set_store(None)

    result = create_analysis_session(
        agent_id="test-agent",
        session_type="STATIC",
    )

    assert result["success"] is False
    assert result["error"]["code"] == "STORE_NOT_INITIALIZED"
