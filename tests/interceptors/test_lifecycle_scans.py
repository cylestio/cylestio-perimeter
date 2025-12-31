"""Tests for Lifecycle Scans (Static Analysis, Recommendations, etc.) functionality."""
import tempfile
import os
from unittest.mock import MagicMock

import pytest

from src.interceptors.live_trace.store.store import TraceStore
from src.interceptors.live_trace.mcp.handlers import (
    handle_create_analysis_session,
    handle_store_finding,
    handle_get_findings,
    handle_complete_analysis_session,
    handle_get_recommendations,
    handle_start_fix,
    handle_complete_fix,
    handle_dismiss_recommendation,
    handle_get_gate_status,
)


class TestTraceStoreAnalysisSessions:
    """Test cases for TraceStore analysis session methods."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        # Cleanup temp file
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_create_analysis_session_static(self, store):
        """Test creating a static analysis session."""
        session = store.create_analysis_session(
            session_id="sess_test123",
            agent_workflow_id="test-agent",
            session_type="STATIC",
            agent_workflow_name="Test Agent",
        )
        
        assert session["session_id"] == "sess_test123"
        assert session["agent_workflow_id"] == "test-agent"
        assert session["session_type"] == "STATIC"
        assert session["status"] == "IN_PROGRESS"

    def test_create_analysis_session_dynamic(self, store):
        """Test creating a dynamic analysis session."""
        session = store.create_analysis_session(
            session_id="sess_dyn123",
            agent_workflow_id="test-agent",
            session_type="DYNAMIC",
        )
        
        assert session["session_type"] == "DYNAMIC"

    def test_get_analysis_session(self, store):
        """Test retrieving an analysis session."""
        store.create_analysis_session(
            session_id="sess_get123",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        
        session = store.get_analysis_session("sess_get123")
        
        assert session is not None
        assert session["session_id"] == "sess_get123"

    def test_get_analysis_session_not_found(self, store):
        """Test retrieving a non-existent session."""
        session = store.get_analysis_session("nonexistent")
        assert session is None

    def test_complete_analysis_session(self, store):
        """Test completing an analysis session."""
        store.create_analysis_session(
            session_id="sess_complete123",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        
        session = store.complete_analysis_session("sess_complete123", risk_score=75.5)
        
        assert session["status"] == "COMPLETED"
        assert session["risk_score"] == 75.5
        assert session["completed_at"] is not None

    def test_get_analysis_sessions_by_workflow(self, store):
        """Test getting analysis sessions filtered by workflow."""
        store.create_analysis_session(
            session_id="sess_wf1",
            agent_workflow_id="agent-a",
            session_type="STATIC",
        )
        store.create_analysis_session(
            session_id="sess_wf2",
            agent_workflow_id="agent-b",
            session_type="STATIC",
        )
        
        sessions = store.get_analysis_sessions(agent_workflow_id="agent-a")
        
        assert len(sessions) == 1
        assert sessions[0]["session_id"] == "sess_wf1"

    def test_get_analysis_sessions_includes_both_types(self, store):
        """Test getting analysis sessions includes both types."""
        store.create_analysis_session(
            session_id="sess_type1",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        store.create_analysis_session(
            session_id="sess_type2",
            agent_workflow_id="test-agent",
            session_type="DYNAMIC",
        )
        
        sessions = store.get_analysis_sessions(agent_workflow_id="test-agent")
        
        # Should include both types
        types = [s["session_type"] for s in sessions]
        assert "STATIC" in types
        assert "DYNAMIC" in types


class TestTraceStoreFindings:
    """Test cases for TraceStore finding methods."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def session(self, store):
        """Create a test analysis session."""
        return store.create_analysis_session(
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )

    def test_store_finding_basic(self, store, session):
        """Test storing a basic finding."""
        finding = store.store_finding(
            finding_id="find_test123",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="hardcoded_secret",
            severity="HIGH",
            title="Hardcoded API Key",
            description="API key found in source code",
        )
        
        assert finding["finding_id"] == "find_test123"
        assert finding["severity"] == "HIGH"
        assert finding["status"] == "OPEN"
        assert finding["title"] == "Hardcoded API Key"

    def test_store_finding_with_all_fields(self, store, session):
        """Test storing a finding with all optional fields."""
        finding = store.store_finding(
            finding_id="find_full123",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="prompt_injection",
            severity="CRITICAL",
            title="Prompt Injection",
            description="User input directly in prompt",
            line_start=45,
            line_end=50,
            evidence={"code_snippet": "f'{user_input}'"},
            owasp_mapping="LLM01",
            source_type="STATIC",
            category="PROMPT",
            check_id="CHK-001",
            cvss_score=9.5,
            cwe="CWE-77",
            soc2_controls=["CC6.1"],
            fix_hints="Use structured messages",
            impact="Attacker can control agent behavior",
            fix_complexity="MEDIUM",
        )
        
        assert finding["severity"] == "CRITICAL"
        assert finding["category"] == "PROMPT"
        assert finding["owasp_mapping"] == "LLM01"
        assert finding["line_start"] == 45

    def test_store_finding_auto_creates_recommendation(self, store, session):
        """Test that storing a finding auto-creates a recommendation."""
        finding = store.store_finding(
            finding_id="find_rec123",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="tool_no_constraints",
            severity="HIGH",
            title="Tool without constraints",
            description="Tool lacks input validation",
            auto_create_recommendation=True,
        )
        
        assert "recommendation_id" in finding
        assert finding["recommendation_id"] is not None
        assert finding["recommendation_id"].startswith("REC-")

    def test_get_findings_by_session(self, store, session):
        """Test getting findings by session ID."""
        store.store_finding(
            finding_id="find_sess1",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/a.py",
            finding_type="test",
            severity="HIGH",
            title="Test 1",
            description="Test",
        )
        store.store_finding(
            finding_id="find_sess2",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/b.py",
            finding_type="test",
            severity="MEDIUM",
            title="Test 2",
            description="Test",
        )
        
        findings = store.get_findings(session_id="sess_findings")
        
        assert len(findings) == 2

    def test_get_findings_by_severity(self, store, session):
        """Test filtering findings by severity."""
        store.store_finding(
            finding_id="find_sev1",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/a.py",
            finding_type="test",
            severity="CRITICAL",
            title="Critical Issue",
            description="Test",
        )
        store.store_finding(
            finding_id="find_sev2",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/b.py",
            finding_type="test",
            severity="LOW",
            title="Low Issue",
            description="Test",
        )
        
        findings = store.get_findings(
            session_id="sess_findings",
            severity="CRITICAL"
        )
        
        assert len(findings) == 1
        assert findings[0]["severity"] == "CRITICAL"

    def test_update_finding_status(self, store, session):
        """Test updating finding status."""
        store.store_finding(
            finding_id="find_update1",
            session_id="sess_findings",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Test",
            description="Test",
        )
        
        updated = store.update_finding_status("find_update1", status="FIXED")
        
        assert updated["status"] == "FIXED"


class TestTraceStoreRecommendations:
    """Test cases for TraceStore recommendation methods."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def finding_with_rec(self, store):
        """Create a finding with auto-created recommendation."""
        store.create_analysis_session(
            session_id="sess_rec",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        finding = store.store_finding(
            finding_id="find_rec",
            session_id="sess_rec",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Test Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        return finding

    def test_get_recommendations(self, store, finding_with_rec):
        """Test getting recommendations."""
        recommendations = store.get_recommendations(
            workflow_id="test-agent"
        )
        
        assert len(recommendations) >= 1
        assert recommendations[0]["status"] == "PENDING"

    def test_get_recommendation_by_id(self, store, finding_with_rec):
        """Test getting a recommendation by ID."""
        rec_id = finding_with_rec["recommendation_id"]
        
        recommendation = store.get_recommendation(rec_id)
        
        assert recommendation is not None
        assert recommendation["recommendation_id"] == rec_id
        assert recommendation["source_finding_id"] == "find_rec"

    def test_start_fix(self, store, finding_with_rec):
        """Test starting a fix on a recommendation."""
        rec_id = finding_with_rec["recommendation_id"]
        
        updated = store.start_fix(rec_id, fixed_by="test-user")
        
        assert updated["status"] == "FIXING"

    def test_complete_fix(self, store, finding_with_rec):
        """Test completing a fix on a recommendation."""
        rec_id = finding_with_rec["recommendation_id"]
        
        # First start the fix
        store.start_fix(rec_id)
        
        # Then complete it
        updated = store.complete_fix(
            rec_id,
            fix_notes="Fixed by updating validation",
            files_modified=["src/test.py"],
        )
        
        assert updated["status"] == "FIXED"
        assert updated["fix_notes"] == "Fixed by updating validation"

    def test_dismiss_recommendation(self, store, finding_with_rec):
        """Test dismissing a recommendation."""
        rec_id = finding_with_rec["recommendation_id"]
        
        updated = store.dismiss_recommendation(
            rec_id,
            dismiss_type="DISMISSED",
            reason="False positive - not actually a vulnerability",
            dismissed_by="test-user",
        )
        
        assert updated["status"] == "DISMISSED"
        assert updated["dismissed_reason"] == "False positive - not actually a vulnerability"

    def test_ignore_recommendation(self, store, finding_with_rec):
        """Test ignoring a recommendation (accepted risk)."""
        rec_id = finding_with_rec["recommendation_id"]
        
        updated = store.dismiss_recommendation(
            rec_id,
            dismiss_type="IGNORED",
            reason="Risk accepted per security team review",
            dismissed_by="security-lead",
        )
        
        assert updated["status"] == "IGNORED"

    def test_filter_recommendations_by_status(self, store):
        """Test filtering recommendations by status."""
        # Create multiple findings with recommendations
        store.create_analysis_session(
            session_id="sess_filter",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        
        f1 = store.store_finding(
            finding_id="find_f1",
            session_id="sess_filter",
            agent_workflow_id="test-agent",
            file_path="src/a.py",
            finding_type="test",
            severity="HIGH",
            title="Test 1",
            description="Test",
            auto_create_recommendation=True,
        )
        
        f2 = store.store_finding(
            finding_id="find_f2",
            session_id="sess_filter",
            agent_workflow_id="test-agent",
            file_path="src/b.py",
            finding_type="test",
            severity="MEDIUM",
            title="Test 2",
            description="Test",
            auto_create_recommendation=True,
        )
        
        # Start fix on one
        store.start_fix(f1["recommendation_id"])
        
        # Filter by FIXING status
        recs = store.get_recommendations(
            workflow_id="test-agent",
            status="FIXING"
        )
        
        assert len(recs) == 1
        assert recs[0]["status"] == "FIXING"


class TestMCPHandlers:
    """Test cases for MCP handlers."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_create_analysis_session_handler(self, store):
        """Test create_analysis_session MCP handler."""
        result = handle_create_analysis_session(
            {
                "agent_workflow_id": "test-agent",
                "session_type": "STATIC",
                "agent_workflow_name": "Test Agent",
            },
            store,
        )
        
        assert "session" in result
        assert result["session"]["agent_workflow_id"] == "test-agent"

    def test_create_analysis_session_missing_workflow_id(self, store):
        """Test create_analysis_session without workflow ID."""
        result = handle_create_analysis_session(
            {"session_type": "STATIC"},
            store,
        )
        
        assert "error" in result
        assert "agent_workflow_id is required" in result["error"]

    def test_store_finding_handler(self, store):
        """Test store_finding MCP handler."""
        # First create a session
        store.create_analysis_session(
            session_id="sess_handler",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        
        result = handle_store_finding(
            {
                "session_id": "sess_handler",
                "file_path": "src/test.py",
                "finding_type": "hardcoded_secret",
                "severity": "HIGH",
                "title": "Test Finding",
                "description": "Test description",
            },
            store,
        )
        
        assert "finding" in result
        assert result["finding"]["severity"] == "HIGH"

    def test_store_finding_invalid_session(self, store):
        """Test store_finding with invalid session."""
        result = handle_store_finding(
            {
                "session_id": "nonexistent",
                "severity": "HIGH",
                "title": "Test",
            },
            store,
        )
        
        assert "error" in result
        assert "not found" in result["error"]

    def test_get_findings_handler(self, store):
        """Test get_findings MCP handler."""
        store.create_analysis_session(
            session_id="sess_get",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_get",
            session_id="sess_get",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Test",
            description="Test",
        )
        
        result = handle_get_findings(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        
        assert "findings" in result
        assert result["total_count"] >= 1

    def test_complete_analysis_session_handler(self, store):
        """Test complete_analysis_session MCP handler."""
        store.create_analysis_session(
            session_id="sess_complete",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        
        result = handle_complete_analysis_session(
            {"session_id": "sess_complete", "calculate_risk": True},
            store,
        )
        
        assert "session" in result
        assert result["session"]["status"] == "COMPLETED"


class TestGateStatus:
    """Test cases for production gate status."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_gate_open_no_findings(self, store):
        """Test gate is open when no findings exist."""
        result = handle_get_gate_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        
        assert result["gate_state"] == "OPEN"
        assert result["is_blocked"] is False

    def test_gate_blocked_critical_pending(self, store):
        """Test gate is blocked with pending CRITICAL finding."""
        store.create_analysis_session(
            session_id="sess_gate",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_critical",
            session_id="sess_gate",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="critical_issue",
            severity="CRITICAL",
            title="Critical Issue",
            description="This is critical",
            auto_create_recommendation=True,
        )
        
        result = handle_get_gate_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        
        assert result["gate_state"] == "BLOCKED"
        assert result["is_blocked"] is True
        assert result["blocking_critical"] >= 1

    def test_gate_blocked_high_pending(self, store):
        """Test gate is blocked with pending HIGH finding."""
        store.create_analysis_session(
            session_id="sess_gate2",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_high",
            session_id="sess_gate2",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="high_issue",
            severity="HIGH",
            title="High Issue",
            description="This is high severity",
            auto_create_recommendation=True,
        )

        result = handle_get_gate_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )

        assert result["gate_state"] == "BLOCKED"
        assert result["is_blocked"] is True
        assert result["blocking_count"] >= 1  # HIGH severity blocks the gate

    def test_gate_open_after_fix(self, store):
        """Test gate opens after critical finding is fixed."""
        store.create_analysis_session(
            session_id="sess_gate3",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        finding = store.store_finding(
            finding_id="find_to_fix",
            session_id="sess_gate3",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="critical_issue",
            severity="CRITICAL",
            title="Critical Issue",
            description="To be fixed",
            auto_create_recommendation=True,
        )
        
        # Gate should be blocked
        result1 = handle_get_gate_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        assert result1["is_blocked"] is True
        
        # Fix the issue
        store.start_fix(finding["recommendation_id"])
        store.complete_fix(finding["recommendation_id"])
        
        # Gate should be open now
        result2 = handle_get_gate_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        assert result2["is_blocked"] is False

    def test_gate_open_medium_findings(self, store):
        """Test gate is open with only MEDIUM findings."""
        store.create_analysis_session(
            session_id="sess_gate4",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_medium",
            session_id="sess_gate4",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="medium_issue",
            severity="MEDIUM",
            title="Medium Issue",
            description="Medium severity only",
            auto_create_recommendation=True,
        )
        
        result = handle_get_gate_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        
        # Gate should be open - MEDIUM doesn't block
        assert result["gate_state"] == "OPEN"


class TestRecommendationLifecycle:
    """Integration tests for recommendation lifecycle."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_full_fix_lifecycle(self, store):
        """Test complete fix lifecycle: PENDING → FIXING → FIXED."""
        # Setup
        store.create_analysis_session(
            session_id="sess_lifecycle",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        finding = store.store_finding(
            finding_id="find_lifecycle",
            session_id="sess_lifecycle",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Test Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        rec_id = finding["recommendation_id"]
        
        # 1. Check initial state
        rec = store.get_recommendation(rec_id)
        assert rec["status"] == "PENDING"
        
        # 2. Start fix
        result = handle_start_fix({"recommendation_id": rec_id}, store)
        assert result["recommendation"]["status"] == "FIXING"
        
        # 3. Complete fix
        result = handle_complete_fix(
            {
                "recommendation_id": rec_id,
                "fix_notes": "Added input validation",
                "files_modified": ["src/test.py"],
            },
            store,
        )
        assert result["recommendation"]["status"] == "FIXED"
        
        # 4. Verify finding is also resolved
        updated_finding = store.get_findings(
            agent_workflow_id="test-agent"
        )[0]
        assert updated_finding["status"] == "FIXED"

    def test_dismiss_lifecycle(self, store):
        """Test dismiss lifecycle: PENDING → DISMISSED."""
        # Setup
        store.create_analysis_session(
            session_id="sess_dismiss",
            agent_workflow_id="test-agent",
            session_type="STATIC",
        )
        finding = store.store_finding(
            finding_id="find_dismiss",
            session_id="sess_dismiss",
            agent_workflow_id="test-agent",
            file_path="src/test.py",
            finding_type="test",
            severity="MEDIUM",
            title="False Positive",
            description="Not actually a vulnerability",
            auto_create_recommendation=True,
        )
        rec_id = finding["recommendation_id"]
        
        # Dismiss
        result = handle_dismiss_recommendation(
            {
                "recommendation_id": rec_id,
                "dismiss_type": "DISMISSED",
                "reason": "False positive - variable is sanitized elsewhere",
            },
            store,
        )
        
        assert result["recommendation"]["status"] == "DISMISSED"
        
        # Verify finding status is updated (may be DISMISSED or RESOLVED depending on implementation)
        updated_finding = store.get_findings(
            agent_workflow_id="test-agent"
        )[0]
        assert updated_finding["status"] in ["DISMISSED", "RESOLVED"]
