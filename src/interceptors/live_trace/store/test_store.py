"""Tests for storage layer extension (analysis sessions, findings, and security checks)."""
import json
import pytest
from datetime import datetime, timezone

from src.events import BaseEvent, EventName
from .store import TraceStore, SessionData


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
            agent_workflow_id="agent_workflow_test",
            session_type="STATIC",
            agent_workflow_name="Test Agent Workflow"
        )

        assert session['session_id'] == "sess_test123"
        assert session['agent_workflow_id'] == "agent_workflow_test"
        assert session['agent_workflow_name'] == "Test Agent Workflow"
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
            agent_workflow_id="agent_workflow_test",
            session_type="STATIC"
        )

        # Retrieve session
        session = store.get_analysis_session("sess_get123")
        assert session is not None
        assert session['session_id'] == "sess_get123"
        assert session['agent_workflow_id'] == "agent_workflow_test"

    def test_get_nonexistent_session(self, store):
        """Test retrieving a nonexistent session returns None."""
        session = store.get_analysis_session("nonexistent")
        assert session is None

    def test_complete_analysis_session(self, store):
        """Test completing an analysis session."""
        # Create session
        store.create_analysis_session(
            session_id="sess_complete123",
            agent_workflow_id="agent_workflow_test",
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
        store.create_analysis_session("sess1", "agent_workflow1", "STATIC")
        store.create_analysis_session("sess2", "agent_workflow1", "DYNAMIC")
        store.create_analysis_session("sess3", "agent_workflow2", "STATIC")

        sessions = store.get_analysis_sessions()
        assert len(sessions) == 3

    def test_get_analysis_sessions_by_agent_workflow(self, store):
        """Test filtering sessions by agent_workflow_id."""
        store.create_analysis_session("sess1", "agent_workflow1", "STATIC")
        store.create_analysis_session("sess2", "agent_workflow1", "DYNAMIC")
        store.create_analysis_session("sess3", "agent_workflow2", "STATIC")

        sessions = store.get_analysis_sessions(agent_workflow_id="agent_workflow1")
        assert len(sessions) == 2
        assert all(s['agent_workflow_id'] == "agent_workflow1" for s in sessions)

    def test_get_analysis_sessions_by_status(self, store):
        """Test filtering sessions by status."""
        store.create_analysis_session("sess1", "agent_workflow1", "STATIC")
        store.create_analysis_session("sess2", "agent_workflow1", "STATIC")
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
            store.create_analysis_session(f"sess{i}", "agent_workflow1", "STATIC")

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
            agent_workflow_id="agent_workflow_test",
            session_type="STATIC"
        )
        return store

    def test_store_finding(self, store):
        """Test storing a finding."""
        finding = store.store_finding(
            finding_id="find_test123",
            session_id="sess_findings",
            agent_workflow_id="agent_workflow_test",
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
        assert finding['agent_workflow_id'] == "agent_workflow_test"
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
            agent_workflow_id="agent_workflow_test",
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
            agent_workflow_id="agent_workflow_test",
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
            agent_workflow_id="agent_workflow_test",
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
        store.store_finding("find1", "sess_findings", "agent_workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "agent_workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess_findings", "agent_workflow_test", "/f3.py", "LLM03", "LOW", "F3")

        findings = store.get_findings()
        assert len(findings) == 3

    def test_get_findings_by_session(self, store):
        """Test filtering findings by session_id."""
        # Create another session
        store.create_analysis_session("sess2", "agent_workflow_test", "STATIC")

        store.store_finding("find1", "sess_findings", "agent_workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess2", "agent_workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")

        findings = store.get_findings(session_id="sess_findings")
        assert len(findings) == 1
        assert findings[0]['session_id'] == "sess_findings"

    def test_get_findings_by_agent_workflow(self, store):
        """Test filtering findings by agent_workflow_id."""
        # Create another session with different agent workflow
        store.create_analysis_session("sess2", "agent_workflow2", "STATIC")

        store.store_finding("find1", "sess_findings", "agent_workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess2", "agent_workflow2", "/f2.py", "LLM02", "MEDIUM", "F2")

        findings = store.get_findings(agent_workflow_id="agent_workflow_test")
        assert len(findings) == 1
        assert findings[0]['agent_workflow_id'] == "agent_workflow_test"

    def test_get_findings_by_severity(self, store):
        """Test filtering findings by severity."""
        store.store_finding("find1", "sess_findings", "agent_workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "agent_workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess_findings", "agent_workflow_test", "/f3.py", "LLM03", "HIGH", "F3")

        findings = store.get_findings(severity="HIGH")
        assert len(findings) == 2
        assert all(f['severity'] == "HIGH" for f in findings)

    def test_get_findings_by_status(self, store):
        """Test filtering findings by status."""
        store.store_finding("find1", "sess_findings", "agent_workflow_test", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_findings", "agent_workflow_test", "/f2.py", "LLM02", "MEDIUM", "F2")

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
            store.store_finding(f"find{i}", "sess_findings", "agent_workflow_test", "/f.py", "LLM01", "HIGH", f"F{i}")

        findings = store.get_findings(limit=5)
        assert len(findings) == 5

    def test_update_finding_status(self, store):
        """Test updating finding status."""
        store.store_finding(
            finding_id="find_update",
            session_id="sess_findings",
            agent_workflow_id="agent_workflow_test",
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
            agent_workflow_id="agent_workflow_test",
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

    def test_get_agent_workflow_findings_summary(self, store):
        """Test getting findings summary for an agent workflow."""
        # Create findings with different severities and statuses
        store.store_finding("f1", "sess_findings", "agent_workflow_test", "/f1.py", "LLM01", "CRITICAL", "F1")
        store.store_finding("f2", "sess_findings", "agent_workflow_test", "/f2.py", "LLM02", "HIGH", "F2")
        store.store_finding("f3", "sess_findings", "agent_workflow_test", "/f3.py", "LLM03", "HIGH", "F3")
        store.store_finding("f4", "sess_findings", "agent_workflow_test", "/f4.py", "LLM04", "MEDIUM", "F4")

        # Update one to FIXED
        store.update_finding_status("f4", "FIXED")

        summary = store.get_agent_workflow_findings_summary("agent_workflow_test")
        assert summary['agent_workflow_id'] == "agent_workflow_test"
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
                agent_workflow_id="agent_workflow_test",
                file_path="/file.py",
                finding_type="LLM01",
                severity="HIGH",
                title="Orphan Finding"
            )

    def test_foreign_key_allows_valid_finding(self, store):
        """Test that foreign key allows storing finding with valid session."""
        # Create session first
        store.create_analysis_session("sess_valid", "agent_workflow_test", "STATIC")

        # This should succeed
        finding = store.store_finding(
            finding_id="find_valid",
            session_id="sess_valid",
            agent_workflow_id="agent_workflow_test",
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
        session = store.create_analysis_session("sess1", "agent_workflow1", "STATIC")
        assert session is not None

        # Test create finding
        finding = store.store_finding(
            "find1", "sess1", "agent_workflow1", "/file.py", "LLM01", "HIGH", "Test"
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
        session = store.create_analysis_session("sess1", "agent_workflow1", "STATIC")
        assert session is not None

        # Test create finding
        finding = store.store_finding(
            "find1", "sess1", "agent_workflow1", "/file.py", "LLM01", "HIGH", "Test"
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
        store.create_analysis_session("sess1", "agent_workflow1", "STATIC")

        # Create findings concurrently
        def create_finding(i):
            store.store_finding(
                f"find{i}", "sess1", "agent_workflow1", "/file.py", "LLM01", "HIGH", f"Finding {i}"
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


class TestAgentWorkflowIdMethods:
    """Tests for agent_workflow_id functionality."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def _create_agent(self, store, agent_id: str, agent_workflow_id: str = None):
        """Helper to create an agent directly in the database."""
        from .store import AgentData
        agent = AgentData(agent_id, agent_workflow_id)
        store._save_agent(agent)

    # --- get_agent_workflows() tests ---

    def test_get_agent_workflows_empty(self, store):
        """Test get_agent_workflows returns empty list when no agents."""
        agent_workflows = store.get_agent_workflows()
        assert agent_workflows == []

    def test_get_agent_workflows_with_agent_workflows(self, store):
        """Test get_agent_workflows returns distinct agent workflows with counts."""
        # Create agents with different agent workflows
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", "agent-workflow-a")
        self._create_agent(store, "agent3", "agent-workflow-b")

        agent_workflows = store.get_agent_workflows()

        # Should have 2 agent workflows
        assert len(agent_workflows) == 2

        # Find agent-workflow-a and agent-workflow-b
        agent_workflow_a = next((w for w in agent_workflows if w['id'] == 'agent-workflow-a'), None)
        agent_workflow_b = next((w for w in agent_workflows if w['id'] == 'agent-workflow-b'), None)

        assert agent_workflow_a is not None
        assert agent_workflow_a['agent_count'] == 2

        assert agent_workflow_b is not None
        assert agent_workflow_b['agent_count'] == 1

    def test_get_agent_workflows_includes_unassigned(self, store):
        """Test get_agent_workflows includes 'Unassigned' for NULL agent_workflow_id."""
        # Create agents with and without agent workflow
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", None)  # Unassigned
        self._create_agent(store, "agent3", None)  # Unassigned

        agent_workflows = store.get_agent_workflows()

        # Should have 2 entries: agent-workflow-a and Unassigned
        assert len(agent_workflows) == 2

        # Find unassigned
        unassigned = next((w for w in agent_workflows if w['id'] is None), None)
        assert unassigned is not None
        assert unassigned['name'] == "Unassigned"
        assert unassigned['agent_count'] == 2

    # --- get_all_agents() filtering tests ---

    def test_get_all_agents_filter_by_agent_workflow(self, store):
        """Test filtering agents by specific agent_workflow_id."""
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", "agent-workflow-a")
        self._create_agent(store, "agent3", "agent-workflow-b")

        agents = store.get_all_agents(agent_workflow_id="agent-workflow-a")

        assert len(agents) == 2
        assert all(a.agent_workflow_id == "agent-workflow-a" for a in agents)

    def test_get_all_agents_filter_unassigned(self, store):
        """Test filtering agents with 'unassigned' returns NULL agent_workflow agents."""
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", None)
        self._create_agent(store, "agent3", None)

        agents = store.get_all_agents(agent_workflow_id="unassigned")

        assert len(agents) == 2
        assert all(a.agent_workflow_id is None for a in agents)

    def test_get_all_agents_no_filter(self, store):
        """Test get_all_agents with no filter returns all agents."""
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", "agent-workflow-b")
        self._create_agent(store, "agent3", None)

        agents = store.get_all_agents()

        assert len(agents) == 3

    # --- create_analysis_session (agent_workflow_id is now required) ---

    def test_create_analysis_session_with_agent_workflow_name(self, store):
        """Test creating analysis session with agent_workflow_name."""
        session = store.create_analysis_session(
            session_id="sess_wf123",
            agent_workflow_id="my-agent-workflow",
            session_type="STATIC",
            agent_workflow_name="My Agent Workflow"
        )

        assert session['session_id'] == "sess_wf123"
        assert session['agent_workflow_id'] == "my-agent-workflow"
        assert session['agent_workflow_name'] == "My Agent Workflow"

        # Verify it persists
        retrieved = store.get_analysis_session("sess_wf123")
        assert retrieved['agent_workflow_id'] == "my-agent-workflow"
        assert retrieved['agent_workflow_name'] == "My Agent Workflow"

    def test_create_analysis_session_without_agent_workflow_name(self, store):
        """Test creating analysis session without agent_workflow_name."""
        session = store.create_analysis_session(
            session_id="sess_nowfname",
            agent_workflow_id="my-agent-workflow",
            session_type="STATIC"
        )

        assert session['session_id'] == "sess_nowfname"
        assert session['agent_workflow_id'] == "my-agent-workflow"
        assert session.get('agent_workflow_name') is None

    # --- store_finding (agent_workflow_id is now required) ---

    def test_store_finding_with_agent_workflow_id(self, store):
        """Test storing finding with agent_workflow_id."""
        # Create session with agent workflow
        store.create_analysis_session(
            session_id="sess_wf_find",
            agent_workflow_id="finding-agent-workflow",
            session_type="STATIC"
        )

        finding = store.store_finding(
            finding_id="find_wf123",
            session_id="sess_wf_find",
            agent_workflow_id="finding-agent-workflow",
            file_path="/path/to/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding"
        )

        assert finding['finding_id'] == "find_wf123"
        assert finding['agent_workflow_id'] == "finding-agent-workflow"

        # Verify it persists
        retrieved = store.get_finding("find_wf123")
        assert retrieved['agent_workflow_id'] == "finding-agent-workflow"

    def test_get_findings_filter_by_agent_workflow_id(self, store):
        """Test filtering findings by agent_workflow_id."""
        # Create sessions for different agent workflows
        store.create_analysis_session("sess1", "agent-workflow-a", "STATIC")
        store.create_analysis_session("sess2", "agent-workflow-b", "STATIC")

        store.store_finding("find1", "sess1", "agent-workflow-a", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess1", "agent-workflow-a", "/f2.py", "LLM02", "HIGH", "F2")
        store.store_finding("find3", "sess2", "agent-workflow-b", "/f3.py", "LLM03", "HIGH", "F3")

        findings = store.get_findings(agent_workflow_id="agent-workflow-a")
        assert len(findings) == 2
        assert all(f['agent_workflow_id'] == "agent-workflow-a" for f in findings)


class TestSecurityChecksMethods:
    """Test security checks CRUD operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def _create_analysis_session(self, store, session_id):
        """Helper to create analysis session (required for FK)."""
        store.create_analysis_session(session_id, "test-agent-workflow", "DYNAMIC")

    def test_store_security_check(self, store):
        """Test storing a security check."""
        self._create_analysis_session(store, "analysis_001")
        check = store.store_security_check(
            check_id="check_001",
            agent_id="agent-123",
            analysis_session_id="analysis_001",
            category_id="RESOURCE_MANAGEMENT",
            check_type="RESOURCE_001_TOKEN_BOUNDS",
            status="passed",
            title="Token Bounds Check",
            description="Check token limits",
            value="1500 tokens",
            evidence={"tokens_used": 1500, "limit": 50000},
            recommendations=["Monitor token usage"],
        )

        assert check['check_id'] == "check_001"
        assert check['agent_id'] == "agent-123"
        assert check['category_id'] == "RESOURCE_MANAGEMENT"
        assert check['status'] == "passed"
        assert check['evidence']['tokens_used'] == 1500

    def test_get_security_check(self, store):
        """Test retrieving a security check."""
        self._create_analysis_session(store, "analysis_001")
        store.store_security_check(
            check_id="check_002",
            agent_id="agent-123",
            analysis_session_id="analysis_001",
            category_id="BEHAVIORAL",
            check_type="BEHAV_001",
            status="warning",
            title="Behavioral Check",
        )

        check = store.get_security_check("check_002")
        assert check is not None
        assert check['status'] == "warning"

    def test_get_nonexistent_security_check(self, store):
        """Test retrieving non-existent security check."""
        check = store.get_security_check("nonexistent")
        assert check is None

    def test_get_security_checks_by_agent(self, store):
        """Test filtering security checks by agent_id."""
        self._create_analysis_session(store, "sess1")
        self._create_analysis_session(store, "sess2")
        store.store_security_check("check_a1", "agent-a", "sess1", "CAT1", "TYPE1", "passed", "C1")
        store.store_security_check("check_a2", "agent-a", "sess1", "CAT2", "TYPE2", "warning", "C2")
        store.store_security_check("check_b1", "agent-b", "sess2", "CAT1", "TYPE1", "passed", "C3")

        checks = store.get_security_checks(agent_id="agent-a")
        assert len(checks) == 2
        assert all(c['agent_id'] == "agent-a" for c in checks)

    def test_get_security_checks_by_status(self, store):
        """Test filtering security checks by status."""
        self._create_analysis_session(store, "sess")
        store.store_security_check("check_1", "agent", "sess", "CAT1", "TYPE1", "passed", "C1")
        store.store_security_check("check_2", "agent", "sess", "CAT2", "TYPE2", "warning", "C2")
        store.store_security_check("check_3", "agent", "sess", "CAT3", "TYPE3", "critical", "C3")

        warning_checks = store.get_security_checks(status="warning")
        assert len(warning_checks) == 1
        assert warning_checks[0]['status'] == "warning"

    def test_get_security_checks_by_category(self, store):
        """Test filtering security checks by category_id."""
        self._create_analysis_session(store, "sess")
        store.store_security_check("check_1", "agent", "sess", "RESOURCE_MANAGEMENT", "TYPE1", "passed", "C1")
        store.store_security_check("check_2", "agent", "sess", "RESOURCE_MANAGEMENT", "TYPE2", "passed", "C2")
        store.store_security_check("check_3", "agent", "sess", "BEHAVIORAL", "TYPE3", "passed", "C3")

        resource_checks = store.get_security_checks(category_id="RESOURCE_MANAGEMENT")
        assert len(resource_checks) == 2

    def test_get_latest_security_checks_for_agent(self, store):
        """Test getting only latest analysis session's checks."""
        import time
        self._create_analysis_session(store, "old_session")
        self._create_analysis_session(store, "new_session")
        # Create checks in first analysis session
        store.store_security_check("check_old_1", "agent-x", "old_session", "CAT1", "TYPE1", "passed", "Old1")
        store.store_security_check("check_old_2", "agent-x", "old_session", "CAT2", "TYPE2", "warning", "Old2")

        time.sleep(0.1)  # Ensure different timestamps

        # Create checks in second (latest) analysis session
        store.store_security_check("check_new_1", "agent-x", "new_session", "CAT1", "TYPE1", "passed", "New1")

        # Should only get checks from new_session
        latest = store.get_latest_security_checks_for_agent("agent-x")
        assert len(latest) == 1
        assert latest[0]['analysis_session_id'] == "new_session"

    def test_get_agent_security_summary(self, store):
        """Test getting security summary for an agent."""
        self._create_analysis_session(store, "sess")
        store.store_security_check("c1", "agent-123", "sess", "CAT1", "T1", "passed", "C1")
        store.store_security_check("c2", "agent-123", "sess", "CAT1", "T2", "warning", "C2")
        store.store_security_check("c3", "agent-123", "sess", "CAT2", "T3", "critical", "C3")

        summary = store.get_agent_security_summary("agent-123")

        assert summary['agent_id'] == "agent-123"
        assert summary['total_checks'] == 3
        assert summary['by_status']['passed'] == 1
        assert summary['by_status']['warning'] == 1
        assert summary['by_status']['critical'] == 1
        assert summary['by_category']['CAT1'] == 2
        assert summary['by_category']['CAT2'] == 1

    def test_get_completed_session_count(self, store):
        """Test getting completed session count for an agent."""
        # Create some sessions
        session1 = SessionData("sess1", "agent-xyz")
        session2 = SessionData("sess2", "agent-xyz")
        session3 = SessionData("sess3", "agent-other")

        # Mark some as completed
        session1.is_completed = True
        session2.is_completed = False
        session3.is_completed = True

        store._save_session(session1)
        store._save_session(session2)
        store._save_session(session3)

        # Should only count completed sessions for agent-xyz
        count = store.get_completed_session_count("agent-xyz")
        assert count == 1

    def test_persist_security_checks(self, store):
        """Test persisting security checks from a security report."""
        from dataclasses import dataclass, field
        from typing import Optional, List, Dict, Any

        # Create proper data classes to avoid Mock serialization issues
        @dataclass
        class MockCheck:
            check_id: str
            check_type: str
            status: str
            name: str
            description: Optional[str] = None
            value: Optional[str] = None
            evidence: Optional[Dict[str, Any]] = None
            recommendations: Optional[List[str]] = None

        @dataclass
        class MockCategory:
            category_id: str
            checks: List[MockCheck] = field(default_factory=list)

        @dataclass
        class MockSecurityReport:
            categories: List[MockCategory] = field(default_factory=list)

        # Create analysis session first (foreign key constraint)
        self._create_analysis_session(store, "analysis_session_123")

        category1 = MockCategory(
            category_id="RESOURCE_MANAGEMENT",
            checks=[
                MockCheck(
                    check_id="RES_001",
                    check_type="TOKEN_CHECK",
                    status="passed",
                    name="Token Bounds",
                    description="Check token limits",
                    value="1500",
                    evidence={"tokens": 1500},
                    recommendations=["Monitor"]
                ),
                MockCheck(
                    check_id="RES_002",
                    check_type="RATE_CHECK",
                    status="warning",
                    name="Rate Limit",
                    description=None,
                    value="high",
                    evidence=None,
                    recommendations=None
                ),
            ]
        )

        security_report = MockSecurityReport(categories=[category1])

        count = store.persist_security_checks(
            agent_id="test-agent",
            security_report=security_report,
            analysis_session_id="analysis_session_123",
            agent_workflow_id="test-agent-workflow",
        )

        assert count == 2

        # Verify checks were stored
        checks = store.get_security_checks(agent_id="test-agent")
        assert len(checks) == 2
        assert checks[0]['category_id'] == "RESOURCE_MANAGEMENT"


class TestRecommendationMethods:
    """Test recommendation CRUD and lifecycle operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store with a session and finding for recommendations."""
        store = TraceStore(storage_mode="memory")
        # Create a session for findings
        store.create_analysis_session(
            session_id="sess_recs",
            agent_workflow_id="test_workflow",
            session_type="STATIC"
        )
        return store

    def test_create_recommendation(self, store):
        """Test creating a recommendation manually."""
        # First create a finding (without auto-creating recommendation)
        store.store_finding(
            finding_id="find_manual_rec",
            session_id="sess_recs",
            agent_workflow_id="test_workflow",
            file_path="/path/to/file.py",
            finding_type="PROMPT_INJECTION",
            severity="HIGH",
            title="Prompt Injection Vulnerability",
            auto_create_recommendation=False
        )

        # Create recommendation manually
        rec = store.create_recommendation(
            workflow_id="test_workflow",
            source_type="STATIC",
            source_finding_id="find_manual_rec",
            category="PROMPT",
            severity="HIGH",
            title="Fix prompt injection",
            description="Sanitize user input before interpolation",
            fix_hints="Use parameterized prompts",
            fix_complexity="MEDIUM",
        )

        assert rec['recommendation_id'].startswith("REC-")
        assert rec['workflow_id'] == "test_workflow"
        assert rec['source_type'] == "STATIC"
        assert rec['source_finding_id'] == "find_manual_rec"
        assert rec['category'] == "PROMPT"
        assert rec['severity'] == "HIGH"
        assert rec['status'] == "PENDING"
        assert rec['title'] == "Fix prompt injection"

    def test_store_finding_auto_creates_recommendation(self, store):
        """Test that storing a finding auto-creates a linked recommendation."""
        finding = store.store_finding(
            finding_id="find_auto_rec",
            session_id="sess_recs",
            agent_workflow_id="test_workflow",
            file_path="/path/to/file.py",
            finding_type="PROMPT_INJECTION",
            severity="HIGH",
            title="SQL Injection Found",
            auto_create_recommendation=True  # Default
        )

        # Should have a recommendation_id
        assert finding['recommendation_id'] is not None
        assert finding['recommendation_id'].startswith("REC-")

        # Get the recommendation
        rec = store.get_recommendation(finding['recommendation_id'])
        assert rec is not None
        assert rec['source_finding_id'] == "find_auto_rec"
        assert rec['status'] == "PENDING"

    def test_get_recommendations_by_workflow(self, store):
        """Test filtering recommendations by workflow."""
        # Create findings in different workflows
        store.create_analysis_session("sess2", "other_workflow", "STATIC")

        store.store_finding("find1", "sess_recs", "test_workflow", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess_recs", "test_workflow", "/f2.py", "LLM02", "MEDIUM", "F2")
        store.store_finding("find3", "sess2", "other_workflow", "/f3.py", "LLM03", "HIGH", "F3")

        recs = store.get_recommendations(workflow_id="test_workflow")
        assert len(recs) == 2
        assert all(r['workflow_id'] == "test_workflow" for r in recs)

    def test_get_recommendations_blocking_only(self, store):
        """Test filtering for only blocking recommendations."""
        store.store_finding("find1", "sess_recs", "test_workflow", "/f1.py", "LLM01", "CRITICAL", "Critical")
        store.store_finding("find2", "sess_recs", "test_workflow", "/f2.py", "LLM02", "HIGH", "High")
        store.store_finding("find3", "sess_recs", "test_workflow", "/f3.py", "LLM03", "MEDIUM", "Medium")
        store.store_finding("find4", "sess_recs", "test_workflow", "/f4.py", "LLM04", "LOW", "Low")

        blocking = store.get_recommendations(workflow_id="test_workflow", blocking_only=True)
        assert len(blocking) == 2  # Only CRITICAL and HIGH

    def test_start_fix(self, store):
        """Test starting a fix changes status to FIXING."""
        finding = store.store_finding(
            "find_start_fix", "sess_recs", "test_workflow", "/f.py", "LLM01", "HIGH", "F"
        )
        rec_id = finding['recommendation_id']

        rec = store.start_fix(rec_id, fixed_by="developer@example.com")

        assert rec['status'] == "FIXING"
        assert rec['fixed_by'] == "developer@example.com"

    def test_complete_fix(self, store):
        """Test completing a fix changes status to FIXED."""
        finding = store.store_finding(
            "find_complete_fix", "sess_recs", "test_workflow", "/f.py", "LLM01", "HIGH", "F"
        )
        rec_id = finding['recommendation_id']

        store.start_fix(rec_id)
        rec = store.complete_fix(
            rec_id,
            fix_notes="Applied input sanitization",
            files_modified=["/f.py", "/utils.py"],
            fix_commit="abc123",
            fixed_by="developer@example.com"
        )

        assert rec['status'] == "FIXED"
        assert rec['fix_notes'] == "Applied input sanitization"
        assert rec['files_modified'] == ["/f.py", "/utils.py"]
        assert rec['fix_commit'] == "abc123"
        assert rec['fixed_at'] is not None

        # Finding should also be updated
        finding = store.get_finding("find_complete_fix")
        assert finding['status'] == "FIXED"

    def test_verify_fix_success(self, store):
        """Test successful verification changes status to VERIFIED."""
        finding = store.store_finding(
            "find_verify_ok", "sess_recs", "test_workflow", "/f.py", "LLM01", "HIGH", "F"
        )
        rec_id = finding['recommendation_id']

        store.start_fix(rec_id)
        store.complete_fix(rec_id, fix_notes="Fixed")
        rec = store.verify_fix(
            rec_id,
            verification_result="Tested with malicious inputs, no injection possible",
            success=True
        )

        assert rec['status'] == "VERIFIED"
        assert rec['verification_result'] == "Tested with malicious inputs, no injection possible"
        assert rec['verified_at'] is not None

    def test_verify_fix_failure(self, store):
        """Test failed verification reverts status to PENDING."""
        finding = store.store_finding(
            "find_verify_fail", "sess_recs", "test_workflow", "/f.py", "LLM01", "HIGH", "F"
        )
        rec_id = finding['recommendation_id']

        store.start_fix(rec_id)
        store.complete_fix(rec_id, fix_notes="Fixed")
        rec = store.verify_fix(
            rec_id,
            verification_result="Still vulnerable to injection",
            success=False
        )

        assert rec['status'] == "PENDING"  # Reopened

    def test_dismiss_recommendation(self, store):
        """Test dismissing a recommendation."""
        finding = store.store_finding(
            "find_dismiss", "sess_recs", "test_workflow", "/f.py", "LLM01", "MEDIUM", "F"
        )
        rec_id = finding['recommendation_id']

        rec = store.dismiss_recommendation(
            rec_id,
            reason="False positive - input is already validated upstream",
            dismiss_type="DISMISSED",
            dismissed_by="security@example.com"
        )

        assert rec['status'] == "DISMISSED"
        assert rec['dismissed_reason'] == "False positive - input is already validated upstream"
        assert rec['dismissed_at'] is not None

        # Finding should also be dismissed
        finding = store.get_finding("find_dismiss")
        assert finding['status'] == "DISMISSED"

    def test_get_production_readiness_blocked(self, store):
        """Test production readiness when critical/high issues exist."""
        store.store_finding("f1", "sess_recs", "test_workflow", "/f.py", "LLM01", "CRITICAL", "Critical")
        store.store_finding("f2", "sess_recs", "test_workflow", "/f.py", "LLM02", "HIGH", "High1")
        store.store_finding("f3", "sess_recs", "test_workflow", "/f.py", "LLM03", "HIGH", "High2")
        store.store_finding("f4", "sess_recs", "test_workflow", "/f.py", "LLM04", "MEDIUM", "Medium")

        readiness = store.get_production_readiness("test_workflow")

        assert readiness['gate']['state'] == "BLOCKED"
        assert readiness['gate']['is_blocked'] is True
        assert readiness['gate']['blocking_count'] == 3  # 1 critical + 2 high

    def test_get_production_readiness_open(self, store):
        """Test production readiness when no blocking issues."""
        store.store_finding("f1", "sess_recs", "test_workflow", "/f.py", "LLM01", "MEDIUM", "Medium")
        store.store_finding("f2", "sess_recs", "test_workflow", "/f.py", "LLM02", "LOW", "Low")

        readiness = store.get_production_readiness("test_workflow")

        assert readiness['gate']['state'] == "OPEN"
        assert readiness['gate']['is_blocked'] is False
        assert readiness['gate']['blocking_count'] == 0

    def test_get_production_readiness_open_after_fixes(self, store):
        """Test gate opens after all critical/high issues are fixed."""
        finding = store.store_finding(
            "f1", "sess_recs", "test_workflow", "/f.py", "LLM01", "CRITICAL", "Critical"
        )
        rec_id = finding['recommendation_id']

        # Initially blocked
        readiness = store.get_production_readiness("test_workflow")
        assert readiness['gate']['is_blocked'] is True

        # Fix the issue
        store.start_fix(rec_id)
        store.complete_fix(rec_id, fix_notes="Fixed")

        # Now open
        readiness = store.get_production_readiness("test_workflow")
        assert readiness['gate']['is_blocked'] is False


class TestAuditLogMethods:
    """Test audit log operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_log_audit_event(self, store):
        """Test logging an audit event."""
        entry = store.log_audit_event(
            entity_type="recommendation",
            entity_id="REC-001",
            action="STATUS_CHANGED",
            previous_value="PENDING",
            new_value="FIXING",
            reason="Starting fix",
            performed_by="developer@example.com",
            metadata={"ticket": "JIRA-123"}
        )

        assert entry['id'] is not None
        assert entry['entity_type'] == "recommendation"
        assert entry['entity_id'] == "REC-001"
        assert entry['action'] == "STATUS_CHANGED"
        assert entry['previous_value'] == "PENDING"
        assert entry['new_value'] == "FIXING"
        assert entry['metadata']['ticket'] == "JIRA-123"

    def test_get_audit_log_by_entity(self, store):
        """Test filtering audit log by entity."""
        store.log_audit_event("recommendation", "REC-001", "CREATED")
        store.log_audit_event("recommendation", "REC-001", "STATUS_CHANGED", "PENDING", "FIXING")
        store.log_audit_event("recommendation", "REC-002", "CREATED")
        store.log_audit_event("finding", "FND-001", "CREATED")

        entries = store.get_audit_log(entity_type="recommendation", entity_id="REC-001")

        assert len(entries) == 2
        assert all(e['entity_id'] == "REC-001" for e in entries)

    def test_get_audit_log_by_action(self, store):
        """Test filtering audit log by action."""
        store.log_audit_event("recommendation", "REC-001", "CREATED")
        store.log_audit_event("recommendation", "REC-001", "STATUS_CHANGED")
        store.log_audit_event("recommendation", "REC-002", "STATUS_CHANGED")
        store.log_audit_event("recommendation", "REC-003", "DISMISSED")

        entries = store.get_audit_log(action="STATUS_CHANGED")

        assert len(entries) == 2
        assert all(e['action'] == "STATUS_CHANGED" for e in entries)

    def test_recommendation_lifecycle_creates_audit_trail(self, store):
        """Test that recommendation lifecycle creates audit entries."""
        # Create a session and finding
        store.create_analysis_session("sess_audit", "audit_workflow", "STATIC")
        finding = store.store_finding(
            "find_audit", "sess_audit", "audit_workflow", "/f.py", "LLM01", "HIGH", "Test"
        )
        rec_id = finding['recommendation_id']

        # Go through lifecycle
        store.start_fix(rec_id, fixed_by="dev@example.com")
        store.complete_fix(rec_id, fix_notes="Fixed the issue")
        store.verify_fix(rec_id, "Verified working", success=True)

        # Check audit log
        entries = store.get_audit_log(entity_type="recommendation", entity_id=rec_id)

        # Should have: CREATED, STATUS_CHANGED (FIXING), STATUS_CHANGED (FIXED), VERIFIED
        assert len(entries) >= 4
        actions = [e['action'] for e in entries]
        assert "CREATED" in actions
        assert "STATUS_CHANGED" in actions
        assert "VERIFIED" in actions


class TestComplianceReportMethods:
    """Test compliance report generation and storage."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store with test data for reports."""
        store = TraceStore(storage_mode="memory")
        # Create a session with findings for comprehensive report testing
        store.create_analysis_session(
            session_id="sess_report",
            agent_workflow_id="report_workflow",
            session_type="STATIC"
        )
        return store

    def test_generate_compliance_report_empty(self, store):
        """Test generating report for workflow with no findings."""
        report = store.generate_compliance_report("report_workflow")

        assert report['workflow_id'] == "report_workflow"
        assert report['report_type'] == "compliance"
        assert report['generated_at'] is not None
        assert report['executive_summary']['total_findings'] == 0
        assert report['executive_summary']['is_blocked'] is False
        assert report['executive_summary']['decision'] == "GO"

    def test_generate_compliance_report_with_findings(self, store):
        """Test generating report with various findings."""
        # Create findings with different severities
        store.store_finding("f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "CRITICAL", "Critical Issue",
                          owasp_mapping=["LLM01"])
        store.store_finding("f2", "sess_report", "report_workflow", "/f2.py", "LLM06", "HIGH", "High Issue",
                          owasp_mapping=["LLM06"])
        store.store_finding("f3", "sess_report", "report_workflow", "/f3.py", "LLM08", "MEDIUM", "Medium Issue",
                          owasp_mapping=["LLM08"])

        report = store.generate_compliance_report("report_workflow")

        assert report['executive_summary']['total_findings'] == 3
        assert report['executive_summary']['open_findings'] == 3
        assert report['executive_summary']['is_blocked'] is True
        assert report['executive_summary']['decision'] == "NO-GO"
        assert report['executive_summary']['blocking_count'] == 2  # CRITICAL + HIGH

    def test_generate_compliance_report_owasp_coverage(self, store):
        """Test OWASP LLM coverage in report."""
        store.store_finding("f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "HIGH", "Prompt Injection",
                          owasp_mapping=["LLM01"])

        report = store.generate_compliance_report("report_workflow")

        # LLM01 should show FAIL since there's an open HIGH finding
        assert "LLM01" in report['owasp_llm_coverage']
        assert report['owasp_llm_coverage']['LLM01']['status'] == "FAIL"
        assert report['owasp_llm_coverage']['LLM01']['name'] == "Prompt Injection"

    def test_generate_compliance_report_with_fixed_findings(self, store):
        """Test report with some fixed findings."""
        finding = store.store_finding(
            "f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "CRITICAL", "Critical"
        )
        rec_id = finding['recommendation_id']

        # Fix the finding
        store.start_fix(rec_id)
        store.complete_fix(rec_id, fix_notes="Fixed")

        report = store.generate_compliance_report("report_workflow")

        assert report['executive_summary']['total_findings'] == 1
        assert report['executive_summary']['open_findings'] == 0
        assert report['executive_summary']['fixed_findings'] == 1
        assert report['executive_summary']['is_blocked'] is False  # No longer blocked

    def test_save_report(self, store):
        """Test saving a generated report."""
        # Generate a report
        report_data = store.generate_compliance_report("report_workflow")

        # Save the report
        report_id = store.save_report(
            workflow_id="report_workflow",
            report_type="security_assessment",
            report_data=report_data,
            report_name="Test Security Report",
            generated_by="test@example.com"
        )

        assert report_id is not None
        assert report_id.startswith("RPT-")

    def test_get_reports(self, store):
        """Test retrieving list of saved reports."""
        # Generate and save multiple reports
        report_data = store.generate_compliance_report("report_workflow")

        store.save_report("report_workflow", "security_assessment", report_data)
        store.save_report("report_workflow", "security_assessment", report_data)

        # Get all reports
        reports = store.get_reports("report_workflow")
        assert len(reports) == 2

        # Filter by type
        sec_reports = store.get_reports("report_workflow", report_type="security_assessment")
        assert len(sec_reports) == 2
        assert sec_reports[0]['report_type'] == "security_assessment"

    def test_get_report_by_id(self, store):
        """Test retrieving a specific report with full data."""
        report_data = store.generate_compliance_report("report_workflow")
        report_id = store.save_report("report_workflow", "security_assessment", report_data)

        # Retrieve the full report
        full_report = store.get_report(report_id)

        assert full_report is not None
        assert full_report['report_id'] == report_id
        assert full_report['report_type'] == "security_assessment"
        assert full_report['report_data'] is not None
        assert full_report['report_data']['workflow_id'] == "report_workflow"

    def test_get_nonexistent_report(self, store):
        """Test retrieving a nonexistent report returns None."""
        report = store.get_report("RPT-NONEXISTENT")
        assert report is None

    def test_delete_report(self, store):
        """Test deleting a report."""
        report_data = store.generate_compliance_report("report_workflow")
        report_id = store.save_report("report_workflow", "security_assessment", report_data)

        # Verify it exists
        assert store.get_report(report_id) is not None

        # Delete it
        deleted = store.delete_report(report_id)
        assert deleted is True

        # Verify it's gone
        assert store.get_report(report_id) is None

    def test_delete_nonexistent_report(self, store):
        """Test deleting a nonexistent report returns False."""
        deleted = store.delete_report("RPT-NONEXISTENT")
        assert deleted is False

    def test_report_contains_blocking_items(self, store):
        """Test that report includes blocking items list."""
        store.store_finding("f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "CRITICAL", "Critical Issue")
        store.store_finding("f2", "sess_report", "report_workflow", "/f2.py", "LLM08", "HIGH", "High Issue")

        report = store.generate_compliance_report("report_workflow")

        assert len(report['blocking_items']) == 2
        assert any(item['severity'] == "CRITICAL" for item in report['blocking_items'])
        assert any(item['severity'] == "HIGH" for item in report['blocking_items'])

    def test_report_contains_remediation_summary(self, store):
        """Test that report includes remediation summary."""
        finding = store.store_finding(
            "f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "HIGH", "High Issue"
        )

        report = store.generate_compliance_report("report_workflow")

        assert 'remediation_summary' in report
        assert report['remediation_summary']['total_recommendations'] == 1
        assert report['remediation_summary']['pending'] == 1

    def test_report_stores_with_correct_metadata(self, store):
        """Test that saved report has correct metadata for listing."""
        # Create a finding to have some data
        store.store_finding("f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "CRITICAL", "Critical")

        report_data = store.generate_compliance_report("report_workflow")
        report_id = store.save_report(
            workflow_id="report_workflow",
            report_type="security_assessment",
            report_data=report_data,
            report_name="My Custom Report Name"
        )

        # Get from list
        reports = store.get_reports("report_workflow")
        assert len(reports) == 1

        saved = reports[0]
        assert saved['report_id'] == report_id
        assert saved['report_name'] == "My Custom Report Name"
        assert saved['risk_score'] > 0  # Has a CRITICAL finding
        assert saved['gate_status'] == "BLOCKED"
        assert saved['findings_count'] == 1

    def test_reports_ordered_by_date(self, store):
        """Test that reports are returned in reverse chronological order."""
        import time

        report_data = store.generate_compliance_report("report_workflow")

        id1 = store.save_report("report_workflow", "security_assessment", report_data, report_name="First")
        time.sleep(0.1)  # Small delay to ensure different timestamps
        id2 = store.save_report("report_workflow", "security_assessment", report_data, report_name="Second")
        time.sleep(0.1)
        id3 = store.save_report("report_workflow", "security_assessment", report_data, report_name="Third")

        reports = store.get_reports("report_workflow")

        # Should be in reverse order (newest first)
        assert reports[0]['report_id'] == id3
        assert reports[1]['report_id'] == id2
        assert reports[2]['report_id'] == id1

    def test_report_contains_business_impact(self, store):
        """Test that report includes business impact assessment."""
        # Create findings with various categories to trigger business impacts
        store.store_finding("f1", "sess_report", "report_workflow", "/tools.py", "LLM08", "CRITICAL", "Excessive Agency",
                          category="TOOL", owasp_mapping=["LLM08"])
        store.store_finding("f2", "sess_report", "report_workflow", "/secrets.py", "LLM06", "HIGH", "Credential Exposure",
                          category="DATA", owasp_mapping=["LLM06"])

        report = store.generate_compliance_report("report_workflow")

        # Should have business_impact section
        assert 'business_impact' in report
        assert 'overall_risk' in report['business_impact']
        assert 'impacts' in report['business_impact']
        assert 'executive_bullets' in report['business_impact']

        # Should have HIGH overall risk due to CRITICAL finding
        assert report['business_impact']['overall_risk'] == 'HIGH'

        # Should have executive bullets
        assert len(report['business_impact']['executive_bullets']) > 0

    def test_report_contains_risk_breakdown(self, store):
        """Test that report includes risk score breakdown."""
        # Create findings with different severities
        store.store_finding("f1", "sess_report", "report_workflow", "/f1.py", "LLM01", "CRITICAL", "Critical 1")
        store.store_finding("f2", "sess_report", "report_workflow", "/f2.py", "LLM02", "HIGH", "High 1")
        store.store_finding("f3", "sess_report", "report_workflow", "/f3.py", "LLM03", "MEDIUM", "Medium 1")

        report = store.generate_compliance_report("report_workflow")

        # Should have risk_breakdown in executive_summary
        assert 'risk_breakdown' in report['executive_summary']
        rb = report['executive_summary']['risk_breakdown']

        assert 'formula' in rb
        assert 'breakdown' in rb
        assert 'final_score' in rb

        # Should have 4 breakdown items (one per severity)
        assert len(rb['breakdown']) == 4

        # Verify breakdown calculation
        # CRITICAL(1)*25 + HIGH(1)*15 + MEDIUM(1)*5 = 45
        assert rb['final_score'] == 45

    def test_business_impact_rce_risk(self, store):
        """Test that TOOL category findings trigger RCE risk."""
        store.store_finding("f1", "sess_report", "report_workflow", "/tools.py", "LLM08", "CRITICAL", "Unrestricted Tool Execution",
                          category="TOOL", owasp_mapping=["LLM08"])

        report = store.generate_compliance_report("report_workflow")

        # Should detect RCE risk
        impacts = report['business_impact']['impacts']
        assert impacts['remote_code_execution']['risk_level'] in ['HIGH', 'MEDIUM']

    def test_business_impact_data_exfil_risk(self, store):
        """Test that DATA category findings trigger data exfiltration risk."""
        # The title contains 'secret' which triggers data exfiltration detection
        store.store_finding("f1", "sess_report", "report_workflow", "/secrets.py", "LLM06", "HIGH", "Hardcoded secret in code",
                          category="DATA", owasp_mapping=["LLM06"])

        report = store.generate_compliance_report("report_workflow")

        # Should detect data exfiltration risk (title contains 'secret')
        impacts = report['business_impact']['impacts']
        assert impacts['data_exfiltration']['risk_level'] in ['HIGH', 'MEDIUM']

    def test_business_impact_no_risks(self, store):
        """Test business impact when no significant findings."""
        report = store.generate_compliance_report("report_workflow")

        # Should have NONE overall risk
        assert report['business_impact']['overall_risk'] == 'NONE'
        assert 'No critical security risks' in report['business_impact']['executive_bullets'][0]

    def test_owasp_na_entries_have_names(self, store):
        """N/A OWASP entries should include canonical control names."""
        report = store.generate_compliance_report("report_workflow")

        # Check N/A entries have name field with canonical OWASP names
        assert report['owasp_llm_coverage']['LLM03']['name'] == "Training Data Poisoning"
        assert report['owasp_llm_coverage']['LLM04']['name'] == "Model Denial of Service"
        assert report['owasp_llm_coverage']['LLM10']['name'] == "Model Theft"

    def test_report_includes_advisory_disclaimer(self, store):
        """Report should include advisory disclaimer fields."""
        report = store.generate_compliance_report("report_workflow")

        assert 'is_advisory' in report['executive_summary']
        assert report['executive_summary']['is_advisory'] is True
        assert 'advisory_notice' in report['executive_summary']
        assert 'advisory' in report['executive_summary']['advisory_notice'].lower()


class TestGetAgentSystemPrompt:
    """Tests for get_agent_system_prompt store method."""

    @pytest.fixture
    def store(self):
        return TraceStore(storage_mode="memory")

    def test_get_agent_system_prompt_anthropic(self, store):
        """Test extracting system prompt from Anthropic format."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={"llm.request.data": {"system": "You are a helpful assistant"}}
        )
        session = SessionData("sess1", "agent1")
        session.add_event(event)
        store._save_session(session)

        result = store.get_agent_system_prompt("agent1")
        assert result == "You are a helpful assistant"

    def test_get_agent_system_prompt_openai(self, store):
        """Test extracting system prompt from OpenAI format."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={
                "llm.request.data": {
                    "messages": [{"role": "system", "content": "Be helpful"}]
                }
            }
        )
        session = SessionData("sess1", "agent1")
        session.add_event(event)
        store._save_session(session)

        result = store.get_agent_system_prompt("agent1")
        assert result == "Be helpful"

    def test_get_agent_system_prompt_openai_responses(self, store):
        """Test extracting from OpenAI Responses API format."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={"llm.request.data": {"instructions": "Follow these instructions"}}
        )
        session = SessionData("sess1", "agent1")
        session.add_event(event)
        store._save_session(session)

        result = store.get_agent_system_prompt("agent1")
        assert result == "Follow these instructions"

    def test_get_agent_system_prompt_none(self, store):
        """Test returns None when no system prompt in events."""
        event = BaseEvent(
            trace_id="a" * 32,
            span_id="b" * 16,
            name=EventName.LLM_CALL_START,
            agent_id="agent1",
            session_id="sess1",
            attributes={"llm.request.data": {"messages": [{"role": "user", "content": "Hi"}]}}
        )
        session = SessionData("sess1", "agent1")
        session.add_event(event)
        store._save_session(session)

        result = store.get_agent_system_prompt("agent1")
        assert result is None

    def test_get_agent_system_prompt_no_sessions(self, store):
        """Test returns None when agent has no sessions."""
        result = store.get_agent_system_prompt("nonexistent-agent")
        assert result is None


class TestIDEActivityMethods:
    """Test IDE activity tracking methods."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def test_update_workflow_last_seen_creates_record(self, store):
        """Test that update_workflow_last_seen creates a record if none exists."""
        store.update_workflow_last_seen("test-workflow")

        status = store.get_workflow_ide_status("test-workflow")
        assert status['has_activity'] is True
        assert status['last_seen'] is not None
        assert status['ide'] is None  # No IDE metadata yet

    def test_update_workflow_last_seen_updates_timestamp(self, store):
        """Test that update_workflow_last_seen updates existing record."""
        import time

        store.update_workflow_last_seen("test-workflow")
        status1 = store.get_workflow_ide_status("test-workflow")

        time.sleep(0.01)  # Small delay to ensure different timestamp
        store.update_workflow_last_seen("test-workflow")
        status2 = store.get_workflow_ide_status("test-workflow")

        # Timestamps should be different (updated)
        assert status2['last_seen'] >= status1['last_seen']

    def test_get_workflow_ide_status_no_activity(self, store):
        """Test get_workflow_ide_status returns no activity for unknown workflow."""
        status = store.get_workflow_ide_status("unknown-workflow")

        assert status['has_activity'] is False
        assert status['last_seen'] is None
        assert status['ide'] is None

    def test_upsert_ide_metadata_creates_record(self, store):
        """Test upsert_ide_metadata creates record with IDE info."""
        status = store.upsert_ide_metadata(
            agent_workflow_id="test-workflow",
            ide_type="cursor",
            workspace_path="/path/to/project",
            model="claude-sonnet-4",
            host="laptop",
            user="developer"
        )

        assert status['has_activity'] is True
        assert status['last_seen'] is not None
        assert status['ide'] is not None
        assert status['ide']['ide_type'] == "cursor"
        assert status['ide']['workspace_path'] == "/path/to/project"
        assert status['ide']['model'] == "claude-sonnet-4"
        assert status['ide']['host'] == "laptop"
        assert status['ide']['user'] == "developer"

    def test_upsert_ide_metadata_updates_existing(self, store):
        """Test upsert_ide_metadata updates existing record."""
        # Create initial record
        store.upsert_ide_metadata(
            agent_workflow_id="test-workflow",
            ide_type="cursor",
            workspace_path="/old/path"
        )

        # Update with new metadata
        status = store.upsert_ide_metadata(
            agent_workflow_id="test-workflow",
            ide_type="claude-code",
            workspace_path="/new/path",
            model="claude-opus-4"
        )

        assert status['ide']['ide_type'] == "claude-code"
        assert status['ide']['workspace_path'] == "/new/path"
        assert status['ide']['model'] == "claude-opus-4"

    def test_activity_tracking_preserves_ide_metadata(self, store):
        """Test that update_workflow_last_seen preserves existing IDE metadata."""
        # Set IDE metadata first
        store.upsert_ide_metadata(
            agent_workflow_id="test-workflow",
            ide_type="cursor",
            workspace_path="/path/to/project"
        )

        # Update last_seen without IDE metadata
        store.update_workflow_last_seen("test-workflow")

        # IDE metadata should still be there
        status = store.get_workflow_ide_status("test-workflow")
        assert status['ide'] is not None
        assert status['ide']['ide_type'] == "cursor"
        assert status['ide']['workspace_path'] == "/path/to/project"

    def test_multiple_workflows_isolated(self, store):
        """Test that different workflows have isolated activity tracking."""
        store.update_workflow_last_seen("workflow-1")
        store.upsert_ide_metadata(
            agent_workflow_id="workflow-2",
            ide_type="claude-code"
        )

        status1 = store.get_workflow_ide_status("workflow-1")
        status2 = store.get_workflow_ide_status("workflow-2")

        assert status1['has_activity'] is True
        assert status1['ide'] is None  # No IDE metadata for workflow-1

        assert status2['has_activity'] is True
        assert status2['ide'] is not None
        assert status2['ide']['ide_type'] == "claude-code"
