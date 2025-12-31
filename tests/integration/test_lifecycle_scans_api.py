"""Integration tests for Lifecycle Scans API endpoints."""
import pytest
import tempfile
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# Skip these tests if FastAPI isn't available or live_trace module has issues
pytest.importorskip("fastapi")


class TestLifecycleScansAPISetup:
    """Setup helper for lifecycle scans API tests."""
    
    @pytest.fixture
    def temp_db(self):
        """Create a temporary database file."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        yield db_path
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def mock_insights(self, temp_db):
        """Mock the insights singleton with a temp database."""
        from src.interceptors.live_trace.store.store import TraceStore
        
        store = TraceStore(db_path=temp_db)
        mock = MagicMock()
        mock.store = store
        return mock


class TestStaticAnalysisAPI(TestLifecycleScansAPISetup):
    """Tests for Static Analysis API endpoints."""
    
    def test_get_findings_empty(self, mock_insights):
        """Test getting findings with no data."""
        findings = mock_insights.store.get_findings(agent_workflow_id="test-workflow")
        
        assert isinstance(findings, list)
        assert len(findings) == 0

    def test_get_findings_with_data(self, mock_insights):
        """Test getting findings with findings."""
        store = mock_insights.store
        
        # Create a session and finding
        store.create_analysis_session(
            session_id="sess_api1",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_api1",
            session_id="sess_api1",
            agent_workflow_id="test-workflow",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Test Finding",
            description="Test",
            category="PROMPT",
        )
        
        findings = store.get_findings(agent_workflow_id="test-workflow")
        
        # Should have at least one finding
        assert len(findings) >= 1


class TestRecommendationsAPI(TestLifecycleScansAPISetup):
    """Tests for Recommendations API endpoints."""
    
    def test_get_recommendations_empty(self, mock_insights):
        """Test getting recommendations with no data."""
        recs = mock_insights.store.get_recommendations(
            workflow_id="test-workflow"
        )
        assert isinstance(recs, list)
        assert len(recs) == 0

    def test_get_recommendations_with_data(self, mock_insights):
        """Test getting recommendations with findings."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_rec_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_rec_api",
            session_id="sess_rec_api",
            agent_workflow_id="test-workflow",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Test Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        
        recs = store.get_recommendations(workflow_id="test-workflow")
        
        assert len(recs) >= 1
        assert recs[0]["status"] == "PENDING"

    def test_filter_recommendations_by_severity(self, mock_insights):
        """Test filtering recommendations by severity."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_filter_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        
        # Create HIGH and LOW findings
        store.store_finding(
            finding_id="find_high_api",
            session_id="sess_filter_api",
            agent_workflow_id="test-workflow",
            file_path="src/high.py",
            finding_type="test",
            severity="HIGH",
            title="High Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        store.store_finding(
            finding_id="find_low_api",
            session_id="sess_filter_api",
            agent_workflow_id="test-workflow",
            file_path="src/low.py",
            finding_type="test",
            severity="LOW",
            title="Low Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        
        high_recs = store.get_recommendations(
            workflow_id="test-workflow",
            severity="HIGH"
        )
        
        assert len(high_recs) >= 1
        assert all(r["severity"] == "HIGH" for r in high_recs)


class TestGateStatusAPI(TestLifecycleScansAPISetup):
    """Tests for Gate Status API endpoints."""

    def test_gate_status_open_no_findings(self, mock_insights):
        """Test gate status is open with no findings."""
        readiness = mock_insights.store.get_production_readiness("test-workflow")

        assert readiness["gate"]["state"] == "OPEN"
        assert readiness["gate"]["is_blocked"] is False

    def test_gate_status_blocked_with_critical(self, mock_insights):
        """Test gate status is blocked with critical findings."""
        store = mock_insights.store

        store.create_analysis_session(
            session_id="sess_gate_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_critical_api",
            session_id="sess_gate_api",
            agent_workflow_id="test-workflow",
            file_path="src/critical.py",
            finding_type="critical",
            severity="CRITICAL",
            title="Critical Issue",
            description="Critical vulnerability",
            auto_create_recommendation=True,
        )

        readiness = store.get_production_readiness("test-workflow")

        assert readiness["gate"]["state"] == "BLOCKED"
        assert readiness["gate"]["is_blocked"] is True
        assert readiness["gate"]["blocking_count"] >= 1


class TestCorrelationAPI(TestLifecycleScansAPISetup):
    """Tests for Correlation API endpoints."""
    
    def test_correlation_summary_no_data(self, mock_insights):
        """Test correlation summary with no data."""
        summary = mock_insights.store.get_correlation_summary("test-workflow")
        
        assert summary["agent_workflow_id"] == "test-workflow"
        assert summary["validated"] == 0
        assert summary["unexercised"] == 0

    def test_correlation_summary_with_findings(self, mock_insights):
        """Test correlation summary with findings."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_corr_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        
        # Create a finding with correlation state
        store.store_finding(
            finding_id="find_corr_api",
            session_id="sess_corr_api",
            agent_workflow_id="test-workflow",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Correlated Finding",
            description="Test",
        )
        
        # Update correlation state
        store.update_finding_correlation(
            finding_id="find_corr_api",
            correlation_state="VALIDATED",
        )
        
        summary = store.get_correlation_summary("test-workflow")
        
        assert summary["validated"] >= 1


class TestComplianceReportAPI(TestLifecycleScansAPISetup):
    """Tests for Compliance Report API endpoints."""
    
    def test_generate_compliance_report_empty(self, mock_insights):
        """Test generating compliance report with no data."""
        report = mock_insights.store.generate_compliance_report(
            workflow_id="test-workflow",
        )
        
        assert report["workflow_id"] == "test-workflow"
        assert "executive_summary" in report
        assert "owasp_llm_coverage" in report

    def test_generate_compliance_report_with_findings(self, mock_insights):
        """Test generating compliance report with findings."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_report_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        store.store_finding(
            finding_id="find_report_api",
            session_id="sess_report_api",
            agent_workflow_id="test-workflow",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Report Finding",
            description="Test",
            owasp_mapping="LLM01",
            auto_create_recommendation=True,
        )
        
        report = store.generate_compliance_report(
            workflow_id="test-workflow",
        )
        
        assert report["executive_summary"]["total_findings"] >= 1


class TestAuditTrailAPI(TestLifecycleScansAPISetup):
    """Tests for Audit Trail functionality."""
    
    def test_audit_trail_on_fix(self, mock_insights):
        """Test audit trail is created when fixing."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_audit_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        finding = store.store_finding(
            finding_id="find_audit_api",
            session_id="sess_audit_api",
            agent_workflow_id="test-workflow",
            file_path="src/test.py",
            finding_type="test",
            severity="HIGH",
            title="Audit Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        
        rec_id = finding["recommendation_id"]
        
        # Start and complete fix
        store.start_fix(rec_id, fixed_by="test-user")
        store.complete_fix(rec_id, fix_notes="Fixed")
        
        # Get audit logs
        logs = store.get_audit_log(entity_id=rec_id)
        
        # Should have at least 2 entries (start_fix, complete_fix)
        assert len(logs) >= 2
        
        actions = [log["action"] for log in logs]
        assert any("STATUS" in action.upper() for action in actions) if actions else True

    def test_audit_trail_on_dismiss(self, mock_insights):
        """Test audit trail is created when dismissing."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_dismiss_api",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        finding = store.store_finding(
            finding_id="find_dismiss_api",
            session_id="sess_dismiss_api",
            agent_workflow_id="test-workflow",
            file_path="src/test.py",
            finding_type="test",
            severity="MEDIUM",
            title="Dismiss Finding",
            description="Test",
            auto_create_recommendation=True,
        )
        
        rec_id = finding["recommendation_id"]
        
        # Dismiss
        store.dismiss_recommendation(
            rec_id,
            dismiss_type="DISMISSED",
            reason="False positive",
            dismissed_by="test-user",
        )
        
        # Get audit logs
        logs = store.get_audit_log(entity_id=rec_id)
        
        # Should have dismiss entry
        assert len(logs) >= 1


class TestAnalysisSessionsAPI(TestLifecycleScansAPISetup):
    """Tests for Analysis Sessions API endpoints."""
    
    def test_get_analysis_sessions(self, mock_insights):
        """Test getting analysis sessions."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_list1",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        store.create_analysis_session(
            session_id="sess_list2",
            agent_workflow_id="test-workflow",
            session_type="DYNAMIC",
        )
        
        sessions = store.get_analysis_sessions(agent_workflow_id="test-workflow")
        
        assert len(sessions) >= 2

    def test_get_analysis_sessions_with_different_types(self, mock_insights):
        """Test getting analysis sessions includes different types."""
        store = mock_insights.store
        
        store.create_analysis_session(
            session_id="sess_type_api1",
            agent_workflow_id="test-workflow",
            session_type="STATIC",
        )
        store.create_analysis_session(
            session_id="sess_type_api2",
            agent_workflow_id="test-workflow",
            session_type="DYNAMIC",
        )
        
        sessions = store.get_analysis_sessions(agent_workflow_id="test-workflow")
        
        # Should have both types
        types = [s["session_type"] for s in sessions]
        assert "STATIC" in types
        assert "DYNAMIC" in types
