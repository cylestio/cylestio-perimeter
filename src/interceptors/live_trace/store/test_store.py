"""Tests for storage layer extension (analysis sessions, findings, and security checks)."""
import json
import pytest
from datetime import datetime, timezone

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
            # Use unique file paths to avoid fingerprint deduplication
            store.store_finding(f"find{i}", "sess_findings", "agent_test", f"/f{i}.py", "LLM01", "HIGH", f"F{i}")

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

        # Create findings concurrently with unique file paths to avoid fingerprint deduplication
        def create_finding(i):
            store.store_finding(
                f"find{i}", "sess1", "agent1", f"/file{i}.py", "LLM01", "HIGH", f"Finding {i}"
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


class TestAgentIdMethods:
    """Tests for agent_id functionality."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def _create_agent(self, store, system_prompt_id: str, agent_id: str = None):
        """Helper to create an agent directly in the database."""
        from .store import AgentData
        agent = AgentData(system_prompt_id, agent_id)
        store._save_agent(agent)

    # --- get_agents_list() tests ---

    def test_get_agents_list_empty(self, store):
        """Test get_agents_list returns empty list when no system prompts."""
        agents_data = store.get_agents_list()
        assert agents_data == []

    def test_get_agents_list_with_agents(self, store):
        """Test get_agents_list returns distinct agents with counts."""
        # Create system prompts with different agents
        self._create_agent(store, "agent1", "agent-a")
        self._create_agent(store, "agent2", "agent-a")
        self._create_agent(store, "agent3", "agent-b")

        agents_data = store.get_agents_list()

        # Should have 2 agents
        assert len(agents_data) == 2

        # Find agent-a and agent-b
        agent_a = next((a for a in agents_data if a['id'] == 'agent-a'), None)
        agent_b = next((a for a in agents_data if a['id'] == 'agent-b'), None)

        assert agent_a is not None
        assert agent_a['system_prompt_count'] == 2

        assert agent_b is not None
        assert agent_b['system_prompt_count'] == 1

    def test_get_agents_list_includes_unassigned(self, store):
        """Test get_agents_list includes 'Unassigned' for NULL agent_id."""
        # Create system prompts with and without agent
        self._create_agent(store, "agent1", "agent-a")
        self._create_agent(store, "agent2", None)  # Unassigned
        self._create_agent(store, "agent3", None)  # Unassigned

        agents_data = store.get_agents_list()

        # Should have 2 entries: agent-a and Unassigned
        assert len(agents_data) == 2

        # Find unassigned
        unassigned = next((a for a in agents_data if a['id'] is None), None)
        assert unassigned is not None
        assert unassigned['name'] == "Unassigned"
        assert unassigned['system_prompt_count'] == 2

    # --- get_all_agents() filtering tests ---

    def test_get_all_agents_filter_by_agent(self, store):
        """Test filtering system prompts by specific agent_id."""
        self._create_agent(store, "agent1", "agent-a")
        self._create_agent(store, "agent2", "agent-a")
        self._create_agent(store, "agent3", "agent-b")

        agents = store.get_all_agents(agent_id="agent-a")

        assert len(agents) == 2
        assert all(a.agent_id == "agent-a" for a in agents)

    def test_get_all_agents_filter_unassigned(self, store):
        """Test filtering system prompts with 'unassigned' returns system prompts with no agent."""
        self._create_agent(store, "agent1", "agent-a")
        self._create_agent(store, "agent2", None)
        self._create_agent(store, "agent3", None)

        agents = store.get_all_agents(agent_id="unassigned")

        assert len(agents) == 2
        assert all(a.agent_id is None for a in agents)

    def test_get_all_agents_no_filter(self, store):
        """Test get_all_agents with no filter returns all agents."""
        self._create_agent(store, "agent1", "agent-a")
        self._create_agent(store, "agent2", "agent-b")
        self._create_agent(store, "agent3", None)

        agents = store.get_all_agents()

        assert len(agents) == 3

    # --- create_analysis_session (agent_id is now required) ---

    def test_create_analysis_session_with_agent_name(self, store):
        """Test creating analysis session with agent_name."""
        session = store.create_analysis_session(
            session_id="sess_wf123",
            agent_id="my-agent",
            session_type="STATIC",
            agent_name="My Agent"
        )

        assert session['session_id'] == "sess_wf123"
        assert session['agent_id'] == "my-agent"
        assert session['agent_name'] == "My Agent"

        # Verify it persists
        retrieved = store.get_analysis_session("sess_wf123")
        assert retrieved['agent_id'] == "my-agent"
        assert retrieved['agent_name'] == "My Agent"

    def test_create_analysis_session_without_agent_name(self, store):
        """Test creating analysis session without agent_name."""
        session = store.create_analysis_session(
            session_id="sess_nowfname",
            agent_id="my-agent",
            session_type="STATIC"
        )

        assert session['session_id'] == "sess_nowfname"
        assert session['agent_id'] == "my-agent"
        assert session.get('agent_name') is None

    # --- store_finding (agent_id is now required) ---

    def test_store_finding_with_agent_id(self, store):
        """Test storing finding with agent_id."""
        # Create session with agent
        store.create_analysis_session(
            session_id="sess_wf_find",
            agent_id="finding-agent",
            session_type="STATIC"
        )

        finding = store.store_finding(
            finding_id="find_wf123",
            session_id="sess_wf_find",
            agent_id="finding-agent",
            file_path="/path/to/file.py",
            finding_type="LLM01",
            severity="HIGH",
            title="Test Finding"
        )

        assert finding['finding_id'] == "find_wf123"
        assert finding['agent_id'] == "finding-agent"

        # Verify it persists
        retrieved = store.get_finding("find_wf123")
        assert retrieved['agent_id'] == "finding-agent"

    def test_get_findings_filter_by_agent(self, store):
        """Test filtering findings by agent_id."""
        # Create sessions for different agents
        store.create_analysis_session("sess1", "agent-a", "STATIC")
        store.create_analysis_session("sess2", "agent-b", "STATIC")

        store.store_finding("find1", "sess1", "agent-a", "/f1.py", "LLM01", "HIGH", "F1")
        store.store_finding("find2", "sess1", "agent-a", "/f2.py", "LLM02", "HIGH", "F2")
        store.store_finding("find3", "sess2", "agent-b", "/f3.py", "LLM03", "HIGH", "F3")

        findings = store.get_findings(agent_id="agent-a")
        assert len(findings) == 2
        assert all(f['agent_id'] == "agent-a" for f in findings)


class TestSecurityChecksMethods:
    """Test security checks CRUD operations."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    def _create_analysis_session(self, store, session_id):
        """Helper to create analysis session (required for FK)."""
        store.create_analysis_session(session_id, "test-agent", "DYNAMIC")

    def test_store_security_check(self, store):
        """Test storing a security check."""
        self._create_analysis_session(store, "analysis_001")
        check = store.store_security_check(
            check_id="check_001",
            system_prompt_id="agent-123",
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
        assert check['system_prompt_id'] == "agent-123"
        assert check['category_id'] == "RESOURCE_MANAGEMENT"
        assert check['status'] == "passed"
        assert check['evidence']['tokens_used'] == 1500

    def test_get_security_check(self, store):
        """Test retrieving a security check."""
        self._create_analysis_session(store, "analysis_001")
        store.store_security_check(
            check_id="check_002",
            system_prompt_id="agent-123",
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
        """Test filtering security checks by system_prompt_id."""
        self._create_analysis_session(store, "sess1")
        self._create_analysis_session(store, "sess2")
        store.store_security_check("check_a1", "agent-a", "sess1", "CAT1", "TYPE1", "passed", "C1")
        store.store_security_check("check_a2", "agent-a", "sess1", "CAT2", "TYPE2", "warning", "C2")
        store.store_security_check("check_b1", "agent-b", "sess2", "CAT1", "TYPE1", "passed", "C3")

        checks = store.get_security_checks(system_prompt_id="agent-a")
        assert len(checks) == 2
        assert all(c['system_prompt_id'] == "agent-a" for c in checks)

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

        assert summary['system_prompt_id'] == "agent-123"
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
            system_prompt_id="test-agent",
            security_report=security_report,
            analysis_session_id="analysis_session_123",
            agent_id="test-agent",
        )

        assert count == 2

        # Verify checks were stored
        checks = store.get_security_checks(system_prompt_id="test-agent")
        assert len(checks) == 2
        assert checks[0]['category_id'] == "RESOURCE_MANAGEMENT"
