"""Tests for storage layer extension (analysis sessions and findings)."""
import json
import pytest
from datetime import datetime, timezone

from .store import TraceStore


class TestAnalysisSessionMethods:
    """Test analysis session CRUD operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_create_analysis_session(self, store):
        """Test creating an analysis session."""
        session = store.create_analysis_session(
            session_id="sess_test123",
            agent_id="agent_test",
            session_type="STATIC",
            agent_name="Test Agent"
        )

        assert session['session_id'] == "sess_test123"
        assert session['agent_id'] == "agent_test"
        assert session['agent_name'] == "Test Agent"
        assert session['session_type'] == "STATIC"
        assert session['status'] == "IN_PROGRESS"
        assert session['findings_count'] == 0
        assert session['risk_score'] is None
        assert session['completed_at'] is None
        assert session['created_at'] is not None

    def test_get_analysis_session(self, store):
        """Test retrieving an analysis session by ID."""
        # Create session
        store.create_analysis_session(
            session_id="sess_get123",
            agent_id="agent_test",
            session_type="STATIC"
        )

        # Retrieve session
        session = store.get_analysis_session("sess_get123")
        assert session is not None
        assert session['session_id'] == "sess_get123"
        assert session['agent_id'] == "agent_test"

    def test_get_nonexistent_session(self, store):
        """Test retrieving a nonexistent session returns None."""
        session = store.get_analysis_session("nonexistent")
        assert session is None

    def test_complete_analysis_session(self, store):
        """Test completing an analysis session."""
        # Create session
        store.create_analysis_session(
            session_id="sess_complete123",
            agent_id="agent_test",
            session_type="STATIC"
        )

        # Complete session with risk score
        completed = store.complete_analysis_session(
            session_id="sess_complete123",
            risk_score=75
        )

        assert completed is not None
        assert completed['status'] == "COMPLETED"
        assert completed['risk_score'] == 75
        assert completed['completed_at'] is not None

    def test_get_analysis_sessions_all(self, store):
        """Test getting all analysis sessions."""
        # Create multiple sessions
        store.create_analysis_session("sess1", "agent1", "STATIC")
        store.create_analysis_session("sess2", "agent1", "DYNAMIC")
        store.create_analysis_session("sess3", "agent2", "STATIC")

        sessions = store.get_analysis_sessions()
        assert len(sessions) == 3

    def test_get_analysis_sessions_by_agent(self, store):
        """Test filtering sessions by agent_id."""
        store.create_analysis_session("sess1", "agent1", "STATIC")
        store.create_analysis_session("sess2", "agent1", "DYNAMIC")
        store.create_analysis_session("sess3", "agent2", "STATIC")

        sessions = store.get_analysis_sessions(agent_id="agent1")
        assert len(sessions) == 2
        assert all(s['agent_id'] == "agent1" for s in sessions)

    def test_get_analysis_sessions_by_status(self, store):
        """Test filtering sessions by status."""
        store.create_analysis_session("sess1", "agent1", "STATIC")
        store.create_analysis_session("sess2", "agent1", "STATIC")
        store.complete_analysis_session("sess2")

        sessions = store.get_analysis_sessions(status="IN_PROGRESS")
        assert len(sessions) == 1
        assert sessions[0]['status'] == "IN_PROGRESS"

        sessions = store.get_analysis_sessions(status="COMPLETED")
        assert len(sessions) == 1
        assert sessions[0]['status'] == "COMPLETED"

    def test_get_analysis_sessions_limit(self, store):
        """Test limiting the number of sessions returned."""
        for i in range(10):
            store.create_analysis_session(f"sess{i}", "agent1", "STATIC")

        sessions = store.get_analysis_sessions(limit=5)
        assert len(sessions) == 5


class TestFindingMethods:
    """Test finding CRUD operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store with a session for findings."""
        store = TraceStore(storage_mode="memory")
        # Create a session for findings
        store.create_analysis_session(
            session_id="sess_findings",
            agent_id="agent_test",
            session_type="STATIC"
        )
        return store

    def test_store_finding(self, store):
        """Test storing a finding."""
        finding = store.store_finding(
            finding_id="find_test123",
            session_id="sess_findings",
            agent_id="agent_test",
            file_path="/path/to/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="SQL Injection Vulnerability",
            description="Found SQL injection vulnerability",
            line_start=10,
            line_end=15,
            evidence={"code": "SELECT * FROM users"},
            owasp_mapping=["A03:2021"]
        )

        assert finding['finding_id'] == "find_test123"
        assert finding['session_id'] == "sess_findings"
        assert finding['agent_id'] == "agent_test"
        assert finding['file_path'] == "/path/to/file.py"
        assert finding['finding_type'] == "LLM01"
        assert finding['severity'] == "HIGH"
        assert finding['title'] == "SQL Injection Vulnerability"
        assert finding['line_start'] == 10
        assert finding['line_end'] == 15
        assert finding['evidence'] == {"code": "SELECT * FROM users"}
        assert finding['owasp_mapping'] == ["A03:2021"]
        assert finding['status'] == "OPEN"

    def test_store_finding_increments_session_count(self, store):
        """Test that storing a finding increments the session's findings_count."""
        # Initial count should be 0
        session = store.get_analysis_session("sess_findings")
        assert session['findings_count'] == 0

        # Store a finding
        store.store_finding(
            finding_id="find1",
            session_id="sess_findings",
            agent_id="agent_test",
            file_path="/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding"
        )

        # Count should be incremented
        session = store.get_analysis_session("sess_findings")
        assert session['findings_count'] == 1

        # Store another finding
        store.store_finding(
            finding_id="find2",
            session_id="sess_findings",
            agent_id="agent_test",
            file_path="/file.py",
            finding_type="LLM02",
            severity="MEDIUM",
            title="Another Finding"
        )

        # Count should be 2
        session = store.get_analysis_session("sess_findings")
        assert session['findings_count'] == 2

    def test_get_finding(self, store):
        """Test retrieving a finding by ID."""
        store.store_finding(
            finding_id="find_get123",
            session_id="sess_findings",
            agent_id="agent_test",
            file_path="/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding"
        )

        finding = store.get_finding("find_get123")
        assert finding is not None
        assert finding['finding_id'] == "find_get123"
        assert finding['title'] == "Test Finding"

    def test_get_nonexistent_finding(self, store):
        """Test retrieving a nonexistent finding returns None."""
        finding = store.get_finding("nonexistent")
        assert finding is None

    def test_get_findings_all(self, store):
        """Test getting all findings."""
        store.store_finding("find1", "sess_findings", "agent_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "agent_test", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess_findings", "agent_test", "/f3.py", "LLM03", "LOW", "F3")

        findings = store.get_findings()
        assert len(findings) == 3

    def test_get_findings_by_session(self, store):
        """Test filtering findings by session_id."""
        # Create another session
        store.create_analysis_session("sess2", "agent_test", "STATIC")

        store.store_finding("find1", "sess_findings", "agent_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess2", "agent_test", "/f2.py", "LLM02", "MEDIUM", "F2")

        findings = store.get_findings(session_id="sess_findings")
        assert len(findings) == 1
        assert findings[0]['session_id'] == "sess_findings"

    def test_get_findings_by_agent(self, store):
        """Test filtering findings by agent_id."""
        # Create another session with different agent
        store.create_analysis_session("sess2", "agent2", "STATIC")

        store.store_finding("find1", "sess_findings", "agent_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess2", "agent2", "/f2.py", "LLM02", "MEDIUM", "F2")

        findings = store.get_findings(agent_id="agent_test")
        assert len(findings) == 1
        assert findings[0]['agent_id'] == "agent_test"

    def test_get_findings_by_severity(self, store):
        """Test filtering findings by severity."""
        store.store_finding("find1", "sess_findings", "agent_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "agent_test", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess_findings", "agent_test", "/f3.py", "LLM03", "HIGH", "F3")

        findings = store.get_findings(severity="HIGH")
        assert len(findings) == 2
        assert all(f['severity'] == "HIGH" for f in findings)

    def test_get_findings_by_status(self, store):
        """Test filtering findings by status."""
        store.store_finding("find1", "sess_findings", "agent_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "agent_test", "/f2.py", "LLM02", "MEDIUM", "F2")

        # Update one finding to FIXED
        store.update_finding_status("find2", "FIXED")

        findings = store.get_findings(status="OPEN")
        assert len(findings) == 1
        assert findings[0]['status'] == "OPEN"

        findings = store.get_findings(status="FIXED")
        assert len(findings) == 1
        assert findings[0]['status'] == "FIXED"

    def test_get_findings_limit(self, store):
        """Test limiting the number of findings returned."""
        for i in range(10):
            store.store_finding(f"find{i}", "sess_findings", "agent_test", "/f.py", "LLM01", "HIGH", f"F{i}")

        findings = store.get_findings(limit=5)
        assert len(findings) == 5

    def test_update_finding_status(self, store):
        """Test updating finding status."""
        store.store_finding(
            finding_id="find_update",
            session_id="sess_findings",
            agent_id="agent_test",
            file_path="/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding"
        )

        updated = store.update_finding_status("find_update", "FIXED")
        assert updated is not None
        assert updated['status'] == "FIXED"
        assert updated['updated_at'] != updated['created_at']

    def test_update_finding_status_with_notes(self, store):
        """Test updating finding status with notes."""
        store.store_finding(
            finding_id="find_notes",
            session_id="sess_findings",
            agent_id="agent_test",
            file_path="/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding",
            description="Original description"
        )

        updated = store.update_finding_status("find_notes", "IGNORED", notes="Not a real issue")
        assert updated is not None
        assert updated['status'] == "IGNORED"
        assert "Original description" in updated['description']
        assert "Update: Not a real issue" in updated['description']

    def test_get_agent_findings_summary(self, store):
        """Test getting findings summary for an agent."""
        # Create findings with different severities and statuses
        store.store_finding("f1", "sess_findings", "agent_test", "/f1.py", "LLM01", "CRITICAL", "F1")
        store.store_finding("f2", "sess_findings", "agent_test", "/f2.py", "LLM02", "HIGH", "F2")
        store.store_finding("f3", "sess_findings", "agent_test", "/f3.py", "LLM03", "HIGH", "F3")
        store.store_finding("f4", "sess_findings", "agent_test", "/f4.py", "LLM04", "MEDIUM", "F4")

        # Update one to FIXED
        store.update_finding_status("f4", "FIXED")

        summary = store.get_agent_findings_summary("agent_test")
        assert summary['agent_id'] == "agent_test"
        assert summary['total_findings'] == 4
        assert summary['by_severity']['CRITICAL'] == 1
        assert summary['by_severity']['HIGH'] == 2
        # MEDIUM has status FIXED, so not counted in open findings
        assert 'MEDIUM' not in summary['by_severity']
        assert summary['by_status']['OPEN'] == 3
        assert summary['by_status']['FIXED'] == 1


class TestForeignKeyConstraints:
    """Test foreign key constraint enforcement."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_foreign_key_constraint_enforced(self, store):
        """Test that foreign key constraint prevents storing finding without session."""
        import sqlite3

        # Try to store a finding without creating the session first
        with pytest.raises(sqlite3.IntegrityError):
            store.store_finding(
                finding_id="find_orphan",
                session_id="nonexistent_session",
                agent_id="agent_test",
                file_path="/file.py",
                finding_type="LLM01",
                severity="HIGH",
                title="Orphan Finding"
            )

    def test_foreign_key_allows_valid_finding(self, store):
        """Test that foreign key allows storing finding with valid session."""
        # Create session first
        store.create_analysis_session("sess_valid", "agent_test", "STATIC")

        # This should succeed
        finding = store.store_finding(
            finding_id="find_valid",
            session_id="sess_valid",
            agent_id="agent_test",
            file_path="/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Valid Finding"
        )

        assert finding is not None
        assert finding['session_id'] == "sess_valid"


class TestStorageModesCompatibility:
    """Test that both SQLite and in-memory modes work correctly."""

    def test_sqlite_mode(self, tmp_path):
        """Test that SQLite mode creates tables correctly."""
        db_path = str(tmp_path / "test.db")
        store = TraceStore(storage_mode="sqlite", db_path=db_path)

        # Test create session
        session = store.create_analysis_session("sess1", "agent1", "STATIC")
        assert session is not None

        # Test create finding
        finding = store.store_finding(
            "find1", "sess1", "agent1", "/file.py", "LLM01", "HIGH", "Test"
        )
        assert finding is not None

        # Test retrieve
        retrieved_session = store.get_analysis_session("sess1")
        assert retrieved_session is not None
        assert retrieved_session['findings_count'] == 1

    def test_memory_mode(self):
        """Test that in-memory mode works correctly."""
        store = TraceStore(storage_mode="memory")

        # Test create session
        session = store.create_analysis_session("sess1", "agent1", "STATIC")
        assert session is not None

        # Test create finding
        finding = store.store_finding(
            "find1", "sess1", "agent1", "/file.py", "LLM01", "HIGH", "Test"
        )
        assert finding is not None

        # Test retrieve
        retrieved_session = store.get_analysis_session("sess1")
        assert retrieved_session is not None
        assert retrieved_session['findings_count'] == 1


class TestThreadSafety:
    """Test thread safety of store operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_concurrent_finding_creation(self, store):
        """Test that concurrent finding creation is thread-safe."""
        import threading

        # Create session first
        store.create_analysis_session("sess1", "agent1", "STATIC")

        # Create findings concurrently
        def create_finding(i):
            store.store_finding(
                f"find{i}", "sess1", "agent1", "/file.py", "LLM01", "HIGH", f"Finding {i}"
            )

        threads = [threading.Thread(target=create_finding, args=(i,)) for i in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Check that all findings were created
        findings = store.get_findings(session_id="sess1")
        assert len(findings) == 10

        # Check that findings_count is correct
        session = store.get_analysis_session("sess1")
        assert session['findings_count'] == 10
