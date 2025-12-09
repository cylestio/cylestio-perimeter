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
            workflow_id="workflow_test",
            session_type="STATIC",
            workflow_name="Test Workflow"
        )

        assert session['session_id'] == "sess_test123"
        assert session['workflow_id'] == "workflow_test"
        assert session['workflow_name'] == "Test Workflow"
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
            workflow_id="workflow_test",
            session_type="STATIC"
        )

        # Retrieve session
        session = store.get_analysis_session("sess_get123")
        assert session is not None
        assert session['session_id'] == "sess_get123"
        assert session['workflow_id'] == "workflow_test"

    def test_get_nonexistent_session(self, store):
        """Test retrieving a nonexistent session returns None."""
        session = store.get_analysis_session("nonexistent")
        assert session is None

    def test_complete_analysis_session(self, store):
        """Test completing an analysis session."""
        # Create session
        store.create_analysis_session(
            session_id="sess_complete123",
            workflow_id="workflow_test",
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
        store.create_analysis_session("sess1", "workflow1", "STATIC")
        store.create_analysis_session("sess2", "workflow1", "DYNAMIC")
        store.create_analysis_session("sess3", "workflow2", "STATIC")

        sessions = store.get_analysis_sessions()
        assert len(sessions) == 3

    def test_get_analysis_sessions_by_workflow(self, store):
        """Test filtering sessions by workflow_id."""
        store.create_analysis_session("sess1", "workflow1", "STATIC")
        store.create_analysis_session("sess2", "workflow1", "DYNAMIC")
        store.create_analysis_session("sess3", "workflow2", "STATIC")

        sessions = store.get_analysis_sessions(workflow_id="workflow1")
        assert len(sessions) == 2
        assert all(s['workflow_id'] == "workflow1" for s in sessions)

    def test_get_analysis_sessions_by_status(self, store):
        """Test filtering sessions by status."""
        store.create_analysis_session("sess1", "workflow1", "STATIC")
        store.create_analysis_session("sess2", "workflow1", "STATIC")
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
            store.create_analysis_session(f"sess{i}", "workflow1", "STATIC")

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
            workflow_id="workflow_test",
            session_type="STATIC"
        )
        return store

    def test_store_finding(self, store):
        """Test storing a finding."""
        finding = store.store_finding(
            finding_id="find_test123",
            session_id="sess_findings",
            workflow_id="workflow_test",
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
        assert finding['workflow_id'] == "workflow_test"
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
            workflow_id="workflow_test",
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
            workflow_id="workflow_test",
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
            workflow_id="workflow_test",
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
        store.store_finding("find1", "sess_findings", "workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess_findings", "workflow_test", "/f3.py", "LLM03", "LOW", "F3")

        findings = store.get_findings()
        assert len(findings) == 3

    def test_get_findings_by_session(self, store):
        """Test filtering findings by session_id."""
        # Create another session
        store.create_analysis_session("sess2", "workflow_test", "STATIC")

        store.store_finding("find1", "sess_findings", "workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess2", "workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")

        findings = store.get_findings(session_id="sess_findings")
        assert len(findings) == 1
        assert findings[0]['session_id'] == "sess_findings"

    def test_get_findings_by_workflow(self, store):
        """Test filtering findings by workflow_id."""
        # Create another session with different workflow
        store.create_analysis_session("sess2", "workflow2", "STATIC")

        store.store_finding("find1", "sess_findings", "workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess2", "workflow2", "/f2.py", "LLM02", "MEDIUM", "F2")

        findings = store.get_findings(workflow_id="workflow_test")
        assert len(findings) == 1
        assert findings[0]['workflow_id'] == "workflow_test"

    def test_get_findings_by_severity(self, store):
        """Test filtering findings by severity."""
        store.store_finding("find1", "sess_findings", "workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess_findings", "workflow_test", "/f3.py", "LLM03", "HIGH", "F3")

        findings = store.get_findings(severity="HIGH")
        assert len(findings) == 2
        assert all(f['severity'] == "HIGH" for f in findings)

    def test_get_findings_by_status(self, store):
        """Test filtering findings by status."""
        store.store_finding("find1", "sess_findings", "workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")

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
            store.store_finding(f"find{i}", "sess_findings", "workflow_test", "/f.py", "LLM01", "HIGH", f"F{i}")

        findings = store.get_findings(limit=5)
        assert len(findings) == 5

    def test_update_finding_status(self, store):
        """Test updating finding status."""
        store.store_finding(
            finding_id="find_update",
            session_id="sess_findings",
            workflow_id="workflow_test",
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
            workflow_id="workflow_test",
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

    def test_get_workflow_findings_summary(self, store):
        """Test getting findings summary for a workflow."""
        # Create findings with different severities and statuses
        store.store_finding("f1", "sess_findings", "workflow_test", "/f1.py", "LLM01", "CRITICAL", "F1")
        store.store_finding("f2", "sess_findings", "workflow_test", "/f2.py", "LLM02", "HIGH", "F2")
        store.store_finding("f3", "sess_findings", "workflow_test", "/f3.py", "LLM03", "HIGH", "F3")
        store.store_finding("f4", "sess_findings", "workflow_test", "/f4.py", "LLM04", "MEDIUM", "F4")

        # Update one to FIXED
        store.update_finding_status("f4", "FIXED")

        summary = store.get_workflow_findings_summary("workflow_test")
        assert summary['workflow_id'] == "workflow_test"
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
                workflow_id="workflow_test",
                file_path="/file.py",
                finding_type="LLM01",
                severity="HIGH",
                title="Orphan Finding"
            )

    def test_foreign_key_allows_valid_finding(self, store):
        """Test that foreign key allows storing finding with valid session."""
        # Create session first
        store.create_analysis_session("sess_valid", "workflow_test", "STATIC")

        # This should succeed
        finding = store.store_finding(
            finding_id="find_valid",
            session_id="sess_valid",
            workflow_id="workflow_test",
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
        session = store.create_analysis_session("sess1", "workflow1", "STATIC")
        assert session is not None

        # Test create finding
        finding = store.store_finding(
            "find1", "sess1", "workflow1", "/file.py", "LLM01", "HIGH", "Test"
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
        session = store.create_analysis_session("sess1", "workflow1", "STATIC")
        assert session is not None

        # Test create finding
        finding = store.store_finding(
            "find1", "sess1", "workflow1", "/file.py", "LLM01", "HIGH", "Test"
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
        store.create_analysis_session("sess1", "workflow1", "STATIC")

        # Create findings concurrently
        def create_finding(i):
            store.store_finding(
                f"find{i}", "sess1", "workflow1", "/file.py", "LLM01", "HIGH", f"Finding {i}"
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


class TestWorkflowIdMethods:
    """Tests for workflow_id functionality."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def _create_agent(self, store, agent_id: str, workflow_id: str = None):
        """Helper to create an agent directly in the database."""
        from .store import AgentData
        agent = AgentData(agent_id, workflow_id)
        store._save_agent(agent)

    # --- get_workflows() tests ---

    def test_get_workflows_empty(self, store):
        """Test get_workflows returns empty list when no agents."""
        workflows = store.get_workflows()
        assert workflows == []

    def test_get_workflows_with_workflows(self, store):
        """Test get_workflows returns distinct workflows with counts."""
        # Create agents with different workflows
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", "workflow-a")
        self._create_agent(store, "agent3", "workflow-b")

        workflows = store.get_workflows()

        # Should have 2 workflows
        assert len(workflows) == 2

        # Find workflow-a and workflow-b
        workflow_a = next((w for w in workflows if w['id'] == 'workflow-a'), None)
        workflow_b = next((w for w in workflows if w['id'] == 'workflow-b'), None)

        assert workflow_a is not None
        assert workflow_a['agent_count'] == 2

        assert workflow_b is not None
        assert workflow_b['agent_count'] == 1

    def test_get_workflows_includes_unassigned(self, store):
        """Test get_workflows includes 'Unassigned' for NULL workflow_id."""
        # Create agents with and without workflow
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", None)  # Unassigned
        self._create_agent(store, "agent3", None)  # Unassigned

        workflows = store.get_workflows()

        # Should have 2 entries: workflow-a and Unassigned
        assert len(workflows) == 2

        # Find unassigned
        unassigned = next((w for w in workflows if w['id'] is None), None)
        assert unassigned is not None
        assert unassigned['name'] == "Unassigned"
        assert unassigned['agent_count'] == 2

    # --- get_all_agents() filtering tests ---

    def test_get_all_agents_filter_by_workflow(self, store):
        """Test filtering agents by specific workflow_id."""
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", "workflow-a")
        self._create_agent(store, "agent3", "workflow-b")

        agents = store.get_all_agents(workflow_id="workflow-a")

        assert len(agents) == 2
        assert all(a.workflow_id == "workflow-a" for a in agents)

    def test_get_all_agents_filter_unassigned(self, store):
        """Test filtering agents with 'unassigned' returns NULL workflow agents."""
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", None)
        self._create_agent(store, "agent3", None)

        agents = store.get_all_agents(workflow_id="unassigned")

        assert len(agents) == 2
        assert all(a.workflow_id is None for a in agents)

    def test_get_all_agents_no_filter(self, store):
        """Test get_all_agents with no filter returns all agents."""
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", "workflow-b")
        self._create_agent(store, "agent3", None)

        agents = store.get_all_agents()

        assert len(agents) == 3

    # --- create_analysis_session (workflow_id is now required) ---

    def test_create_analysis_session_with_workflow_name(self, store):
        """Test creating analysis session with workflow_name."""
        session = store.create_analysis_session(
            session_id="sess_wf123",
            workflow_id="my-workflow",
            session_type="STATIC",
            workflow_name="My Workflow"
        )

        assert session['session_id'] == "sess_wf123"
        assert session['workflow_id'] == "my-workflow"
        assert session['workflow_name'] == "My Workflow"

        # Verify it persists
        retrieved = store.get_analysis_session("sess_wf123")
        assert retrieved['workflow_id'] == "my-workflow"
        assert retrieved['workflow_name'] == "My Workflow"

    def test_create_analysis_session_without_workflow_name(self, store):
        """Test creating analysis session without workflow_name."""
        session = store.create_analysis_session(
            session_id="sess_nowfname",
            workflow_id="my-workflow",
            session_type="STATIC"
        )

        assert session['session_id'] == "sess_nowfname"
        assert session['workflow_id'] == "my-workflow"
        assert session.get('workflow_name') is None

    # --- store_finding (workflow_id is now required) ---

    def test_store_finding_with_workflow_id(self, store):
        """Test storing finding with workflow_id."""
        # Create session with workflow
        store.create_analysis_session(
            session_id="sess_wf_find",
            workflow_id="finding-workflow",
            session_type="STATIC"
        )

        finding = store.store_finding(
            finding_id="find_wf123",
            session_id="sess_wf_find",
            workflow_id="finding-workflow",
            file_path="/path/to/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding"
        )

        assert finding['finding_id'] == "find_wf123"
        assert finding['workflow_id'] == "finding-workflow"

        # Verify it persists
        retrieved = store.get_finding("find_wf123")
        assert retrieved['workflow_id'] == "finding-workflow"

    def test_get_findings_filter_by_workflow(self, store):
        """Test filtering findings by workflow_id."""
        # Create sessions for different workflows
        store.create_analysis_session("sess1", "workflow-a", "STATIC")
        store.create_analysis_session("sess2", "workflow-b", "STATIC")

        store.store_finding("find1", "sess1", "workflow-a", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess1", "workflow-a", "/f2.py", "LLM02", "HIGH", "F2")
        store.store_finding("find3", "sess2", "workflow-b", "/f3.py", "LLM03", "HIGH", "F3")

        findings = store.get_findings(workflow_id="workflow-a")
        assert len(findings) == 2
        assert all(f['workflow_id'] == "workflow-a" for f in findings)
