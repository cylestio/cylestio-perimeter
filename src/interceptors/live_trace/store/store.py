"""SQLite-based data store for live tracing."""
import json
import sqlite3
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from pathlib import Path
from threading import RLock
from typing import Any, Dict, List, Optional, Set, Tuple

from src.events import BaseEvent
from src.utils.logger import get_logger

logger = get_logger(__name__)


# SQLite schema for persistent storage
SQL_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_workflow_id TEXT,
    created_at REAL NOT NULL,
    last_activity REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at REAL,
    total_events INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    tool_uses INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_response_time_ms REAL DEFAULT 0.0,
    response_count INTEGER DEFAULT 0,
    tool_usage_details TEXT,
    available_tools TEXT,
    events_json TEXT,
    behavioral_signature TEXT,
    behavioral_features TEXT,
    cluster_id TEXT,
    last_analysis_session_id TEXT,
    tags_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_cluster_id ON sessions(cluster_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_analysis ON sessions(last_analysis_session_id);

CREATE INDEX IF NOT EXISTS idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_agent_workflow_id ON sessions(agent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_completed ON sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    agent_workflow_id TEXT,
    display_name TEXT,
    description TEXT,
    first_seen REAL NOT NULL,
    last_seen REAL NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_tools INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    total_response_time_ms REAL DEFAULT 0.0,
    response_count INTEGER DEFAULT 0,
    sessions_set TEXT,
    available_tools TEXT,
    used_tools TEXT,
    tool_usage_details TEXT,
    cached_percentiles TEXT,
    percentiles_session_count INTEGER DEFAULT 0,
    last_analyzed_session_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen);
CREATE INDEX IF NOT EXISTS idx_agents_agent_workflow_id ON agents(agent_workflow_id);

CREATE TABLE IF NOT EXISTS analysis_sessions (
    session_id TEXT PRIMARY KEY,
    agent_workflow_id TEXT NOT NULL,
    agent_workflow_name TEXT,
    agent_id TEXT,
    scope TEXT DEFAULT 'WORKFLOW',
    session_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at REAL NOT NULL,
    completed_at REAL,
    findings_count INTEGER DEFAULT 0,
    risk_score INTEGER,
    sessions_analyzed INTEGER,
    completed_sessions_at_analysis INTEGER
);

CREATE INDEX IF NOT EXISTS idx_analysis_sessions_agent_workflow_id ON analysis_sessions(agent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status);

CREATE TABLE IF NOT EXISTS findings (
    finding_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_workflow_id TEXT NOT NULL,
    source_type TEXT DEFAULT 'STATIC',
    category TEXT,
    check_id TEXT,
    file_path TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    finding_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    cvss_score REAL,
    title TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    owasp_mapping TEXT,
    cwe TEXT,
    soc2_controls TEXT,
    recommendation_id TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_findings_session_id ON findings(session_id);
CREATE INDEX IF NOT EXISTS idx_findings_agent_workflow_id ON findings(agent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);
CREATE INDEX IF NOT EXISTS idx_findings_recommendation_id ON findings(recommendation_id);

CREATE TABLE IF NOT EXISTS security_checks (
    check_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_workflow_id TEXT,
    analysis_session_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    check_type TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    value TEXT,
    evidence TEXT,
    recommendations TEXT,
    created_at REAL NOT NULL,
    FOREIGN KEY (analysis_session_id) REFERENCES analysis_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_security_checks_agent_id ON security_checks(agent_id);
CREATE INDEX IF NOT EXISTS idx_security_checks_analysis_session_id ON security_checks(analysis_session_id);
CREATE INDEX IF NOT EXISTS idx_security_checks_status ON security_checks(status);
CREATE INDEX IF NOT EXISTS idx_security_checks_category_id ON security_checks(category_id);

CREATE TABLE IF NOT EXISTS behavioral_analysis (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    analysis_session_id TEXT NOT NULL,
    stability_score REAL NOT NULL,
    predictability_score REAL NOT NULL,
    cluster_diversity REAL NOT NULL,
    num_clusters INTEGER NOT NULL,
    num_outliers INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    interpretation TEXT,
    clusters TEXT,
    outliers TEXT,
    centroid_distances TEXT,
    created_at REAL NOT NULL,
    FOREIGN KEY (analysis_session_id) REFERENCES analysis_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_agent_id ON behavioral_analysis(agent_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_session_id ON behavioral_analysis(analysis_session_id);

-- IDE activity tracking: auto-updated on any MCP tool call with agent_workflow_id
CREATE TABLE IF NOT EXISTS workflow_ide_activity (
    agent_workflow_id TEXT PRIMARY KEY,
    last_seen REAL NOT NULL,
    -- Optional IDE metadata (provided via optional heartbeat)
    ide_type TEXT,
    workspace_path TEXT,
    model TEXT,
    host TEXT,
    user TEXT
);

CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_finding_id TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    cvss_score REAL,
    owasp_llm TEXT,
    cwe TEXT,
    soc2_controls TEXT,
    title TEXT NOT NULL,
    description TEXT,
    impact TEXT,
    fix_hints TEXT,
    fix_complexity TEXT,
    requires_architectural_change INTEGER DEFAULT 0,
    file_path TEXT,
    line_start INTEGER,
    line_end INTEGER,
    code_snippet TEXT,
    related_files TEXT,
    status TEXT DEFAULT 'PENDING',
    fixed_by TEXT,
    fixed_at REAL,
    fix_method TEXT,
    fix_commit TEXT,
    fix_notes TEXT,
    files_modified TEXT,
    verified_at REAL,
    verified_by TEXT,
    verification_result TEXT,
    dismissed_reason TEXT,
    dismissed_by TEXT,
    dismissed_at REAL,
    dismiss_type TEXT,
    correlation_state TEXT,
    correlation_evidence TEXT,
    fingerprint TEXT,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    FOREIGN KEY (source_finding_id) REFERENCES findings(finding_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_workflow_id ON recommendations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_severity ON recommendations(severity);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_source_finding ON recommendations(source_finding_id);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    performed_by TEXT,
    performed_at REAL NOT NULL,
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON audit_log(performed_at);

CREATE TABLE IF NOT EXISTS generated_reports (
    report_id TEXT PRIMARY KEY,
    agent_workflow_id TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_name TEXT,
    generated_at REAL NOT NULL,
    generated_by TEXT,
    risk_score INTEGER,
    gate_status TEXT,
    findings_count INTEGER,
    recommendations_count INTEGER,
    report_data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_agent_workflow_id ON generated_reports(agent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_report_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at);
"""


class SessionData:
    """Container for session-specific data."""

    def __init__(self, session_id: str, agent_id: str, agent_workflow_id: Optional[str] = None):
        self.session_id = session_id
        self.agent_id = agent_id
        self.agent_workflow_id = agent_workflow_id
        self.events = deque(maxlen=1000)  # Last 1000 events per session
        self.created_at = datetime.now(timezone.utc)
        self.last_activity = self.created_at
        self.is_active = True

        # Metrics
        self.total_events = 0
        self.message_count = 0
        self.tool_uses = 0
        self.errors = 0
        self.total_tokens = 0
        self.total_response_time_ms = 0.0
        self.response_count = 0

        # Tool tracking
        self.tool_usage_details = defaultdict(int)  # {"tool_name": count}
        self.available_tools = set()  # All tools seen in this session

        # Session completion tracking
        self.is_completed = False  # True when session is marked as completed
        self.completed_at = None  # Timestamp when session was marked completed
        self.behavioral_signature = None  # MinHash signature (computed when completed)
        self.behavioral_features = None  # SessionFeatures (computed when completed)
        self.cluster_id = None  # Behavioral cluster ID (assigned after analysis)
        self.last_analysis_session_id = None  # ID of last analysis session that analyzed this session

        # Session tags - key-value pairs for filtering and metadata
        # Tags are accumulated over requests (new tags merged with existing)
        # Special tag: "workflowId" populates agent_workflow_id
        self.tags: Dict[str, str] = {}

    def add_event(self, event: BaseEvent):
        """Add an event to this session."""
        self.events.append(event)
        self.total_events += 1
        self.last_activity = datetime.now(timezone.utc)

        # If session was completed and new event arrives, reactivate it
        if self.is_completed:
            self.reactivate()

        # Update metrics based on event type
        event_name = event.name.value

        if event_name == "llm.call.start":
            self.message_count += 1
            # Collect available tools from llm.request.data
            request_data = event.attributes.get("llm.request.data", {})
            if isinstance(request_data, dict):
                tools = request_data.get("tools", [])
                if tools:
                    # Extract tool names from the tools array
                    for tool in tools:
                        if isinstance(tool, dict) and "name" in tool:
                            self.available_tools.add(tool["name"])
        elif event_name == "llm.call.finish":
            self.response_count += 1
            # Extract response time and tokens from event attributes
            duration = event.attributes.get("llm.response.duration_ms", 0)
            self.total_response_time_ms += duration

            tokens = event.attributes.get("llm.usage.total_tokens", 0)
            self.total_tokens += tokens
        elif event_name == "tool.execution":
            self.tool_uses += 1
            # Track specific tool usage
            tool_name = event.attributes.get("tool.name", "unknown")
            self.tool_usage_details[tool_name] += 1
        elif event_name.endswith(".error"):
            self.errors += 1

    def merge_tags(self, new_tags: Dict[str, str]) -> None:
        """Merge new tags into existing tags.

        Args:
            new_tags: Dictionary of tag key-value pairs to merge
        """
        for key, value in new_tags.items():
            self.tags[key] = value

    @property
    def avg_response_time_ms(self) -> float:
        """Calculate average response time."""
        if self.response_count == 0:
            return 0.0
        return self.total_response_time_ms / self.response_count

    @property
    def duration_minutes(self) -> float:
        """Calculate session duration in minutes."""
        delta = self.last_activity - self.created_at
        return delta.total_seconds() / 60

    @property
    def error_rate(self) -> float:
        """Calculate error rate as percentage."""
        if self.message_count == 0:
            return 0.0
        return (self.errors / self.message_count) * 100

    def mark_completed(self):
        """Mark this session as completed (inactive for timeout period).

        Signatures and features are computed immediately upon completion and stored.
        They are never recalculated to ensure clustering stability.
        """
        self.is_completed = True
        self.is_active = False
        self.completed_at = datetime.now(timezone.utc)
        logger.info(f"Session {self.session_id[:8]}... marked as completed after inactivity")

    def reactivate(self):
        """Reactivate a completed session when new events arrive."""
        if self.is_completed:
            logger.info(f"Session {self.session_id[:8]}... reactivated - clearing signature and analysis")
            self.is_completed = False
            self.is_active = True
            self.completed_at = None
            # Clear previous analysis - will be recomputed when session completes again
            self.behavioral_signature = None
            self.behavioral_features = None
            self.cluster_id = None


class AgentData:
    """Container for agent-specific data."""

    def __init__(self, agent_id: str, agent_workflow_id: Optional[str] = None):
        self.agent_id = agent_id
        self.agent_workflow_id = agent_workflow_id
        self.display_name: Optional[str] = None  # Human-friendly name set via MCP
        self.description: Optional[str] = None   # Description of what the agent does
        self.sessions = set()
        self.first_seen = datetime.now(timezone.utc)
        self.last_seen = self.first_seen

        # Aggregated metrics
        self.total_sessions = 0
        self.total_messages = 0
        self.total_tokens = 0
        self.total_tools = 0
        self.total_errors = 0
        self.total_response_time_ms = 0.0
        self.response_count = 0

        # Tool tracking
        self.available_tools = set()  # All tools this agent has access to
        self.used_tools = set()  # Tools this agent has actually used
        self.tool_usage_details = defaultdict(int)  # Total usage count per tool

        # Behavioral analysis - percentiles frozen for stability
        # Once calculated, percentiles NEVER change to ensure clustering stability
        self.cached_percentiles = None  # Frozen percentiles (calculated once from first sessions)
        self.percentiles_session_count = 0  # Number of sessions when percentiles were frozen

        # Analysis tracking - persisted to DB for scheduler state
        self.last_analyzed_session_count = 0  # Completed session count at last analysis

    def add_session(self, session_id: str):
        """Add a session to this agent."""
        if session_id not in self.sessions:
            self.sessions.add(session_id)
            self.total_sessions += 1
            self.last_seen = datetime.now(timezone.utc)

    def update_metrics(self, session: SessionData):
        """Update metrics from a session."""
        self.total_messages += session.message_count
        self.total_tokens += session.total_tokens
        self.total_tools += session.tool_uses
        self.total_errors += session.errors
        self.total_response_time_ms += session.total_response_time_ms
        self.response_count += session.response_count
        self.last_seen = max(self.last_seen, session.last_activity)

    @property
    def avg_response_time_ms(self) -> float:
        """Calculate average response time across all sessions."""
        if self.response_count == 0:
            return 0.0
        return self.total_response_time_ms / self.response_count

    @property
    def avg_messages_per_session(self) -> float:
        """Calculate average messages per session."""
        if self.total_sessions == 0:
            return 0.0
        return self.total_messages / self.total_sessions


class TraceStore:
    """SQLite-based store for all trace data with constant memory usage."""

    def __init__(
        self,
        max_events: int = 10000,
        retention_minutes: int = 30,
        storage_mode: str = "sqlite",
        db_path: Optional[str] = None
    ):
        self.max_events = max_events
        self.retention_minutes = retention_minutes
        self._lock = RLock()

        # Initialize SQLite database
        if storage_mode == "memory":
            self.db = sqlite3.connect(':memory:', check_same_thread=False)
            logger.info("TraceStore initialized with in-memory SQLite")
        else:
            # Default to disk storage
            db_path = db_path or "./trace_data/live_trace.db"
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
            self.db = sqlite3.connect(db_path, check_same_thread=False)
            logger.info(f"TraceStore initialized with SQLite at {db_path}")

        # Configure SQLite for performance
        self.db.row_factory = sqlite3.Row  # Access columns by name
        self.db.execute("PRAGMA foreign_keys=ON")  # Enable foreign key constraints
        self.db.execute("PRAGMA journal_mode=WAL")  # Better concurrency
        self.db.execute("PRAGMA synchronous=NORMAL")  # Balance safety/speed
        self.db.execute("PRAGMA cache_size=-64000")  # 64MB cache

        # Create schema
        self.db.executescript(SQL_SCHEMA)
        self.db.commit()

        # Run migrations for existing databases
        self._run_migrations()

        # Global stats (kept in memory for performance)
        self.start_time = datetime.now(timezone.utc)
        self.total_events = 0
        self.events = deque(maxlen=max_events)  # Global event stream (circular buffer)

        # Tool usage tracking (lightweight, kept in memory)
        self.tool_usage = defaultdict(int)
        self.error_types = defaultdict(int)

        # Cleanup optimization
        self._last_cleanup = datetime.now(timezone.utc)
        self._cleanup_interval_seconds = 60

        # Clean up stale analysis sessions on startup (sessions stuck IN_PROGRESS for >1 hour)
        self.cleanup_stale_analysis_sessions(stale_threshold_minutes=60)

        logger.info(f"TraceStore ready: max_events={max_events}, retention={retention_minutes}min")

    @property
    def lock(self) -> RLock:
        """Expose the underlying lock for coordinated read access."""
        return self._lock

    def _run_migrations(self) -> None:
        """Run database migrations for existing databases."""
        # Migration: add last_analyzed_session_count column if missing
        cursor = self.db.execute("PRAGMA table_info(agents)")
        columns = {row[1] for row in cursor.fetchall()}
        if 'last_analyzed_session_count' not in columns:
            self.db.execute(
                "ALTER TABLE agents ADD COLUMN last_analyzed_session_count INTEGER DEFAULT 0"
            )
            self.db.commit()
            logger.info("Migration: Added last_analyzed_session_count column to agents table")

        # Migration: add cluster_id column to sessions if missing
        cursor = self.db.execute("PRAGMA table_info(sessions)")
        columns = {row[1] for row in cursor.fetchall()}
        if 'cluster_id' not in columns:
            self.db.execute(
                "ALTER TABLE sessions ADD COLUMN cluster_id TEXT"
            )
            self.db.execute(
                "CREATE INDEX IF NOT EXISTS idx_sessions_cluster_id ON sessions(cluster_id)"
            )
            self.db.commit()
            logger.info("Migration: Added cluster_id column to sessions table")

        # Migration: add tags_json column to sessions if missing
        cursor = self.db.execute("PRAGMA table_info(sessions)")
        columns = {row[1] for row in cursor.fetchall()}
        if 'tags_json' not in columns:
            self.db.execute(
                "ALTER TABLE sessions ADD COLUMN tags_json TEXT"
            )
            self.db.commit()
            logger.info("Migration: Added tags_json column to sessions table")

        # Migration: add new columns to findings table for Phase 1
        cursor = self.db.execute("PRAGMA table_info(findings)")
        columns = {row[1] for row in cursor.fetchall()}
        new_finding_columns = [
            ("source_type", "TEXT DEFAULT 'STATIC'"),
            ("category", "TEXT"),
            ("check_id", "TEXT"),
            ("cvss_score", "REAL"),
            ("cwe", "TEXT"),
            ("soc2_controls", "TEXT"),
            ("recommendation_id", "TEXT"),
            # Phase 5: Correlation columns
            ("correlation_state", "TEXT"),  # VALIDATED, UNEXERCISED, RUNTIME_ONLY, THEORETICAL
            ("correlation_evidence", "TEXT"),  # JSON string with correlation details
        ]
        for col_name, col_def in new_finding_columns:
            if col_name not in columns:
                self.db.execute(f"ALTER TABLE findings ADD COLUMN {col_name} {col_def}")
                logger.info(f"Migration: Added {col_name} column to findings table")
        self.db.commit()

        # Migration: create recommendations table if missing
        cursor = self.db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='recommendations'"
        )
        if not cursor.fetchone():
            self.db.executescript("""
                CREATE TABLE IF NOT EXISTS recommendations (
                    recommendation_id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_finding_id TEXT NOT NULL,
                    category TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    cvss_score REAL,
                    owasp_llm TEXT,
                    cwe TEXT,
                    soc2_controls TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    impact TEXT,
                    fix_hints TEXT,
                    fix_complexity TEXT,
                    requires_architectural_change INTEGER DEFAULT 0,
                    file_path TEXT,
                    line_start INTEGER,
                    line_end INTEGER,
                    code_snippet TEXT,
                    related_files TEXT,
                    status TEXT DEFAULT 'PENDING',
                    fixed_by TEXT,
                    fixed_at REAL,
                    fix_method TEXT,
                    fix_commit TEXT,
                    fix_notes TEXT,
                    files_modified TEXT,
                    verified_at REAL,
                    verified_by TEXT,
                    verification_result TEXT,
                    dismissed_reason TEXT,
                    dismissed_by TEXT,
                    dismissed_at REAL,
                    dismiss_type TEXT,
                    correlation_state TEXT,
                    correlation_evidence TEXT,
                    fingerprint TEXT,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL,
                    FOREIGN KEY (source_finding_id) REFERENCES findings(finding_id)
                );
                CREATE INDEX IF NOT EXISTS idx_recommendations_workflow_id ON recommendations(workflow_id);
                CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
                CREATE INDEX IF NOT EXISTS idx_recommendations_severity ON recommendations(severity);
                CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
                CREATE INDEX IF NOT EXISTS idx_recommendations_source_finding ON recommendations(source_finding_id);
            """)
            self.db.commit()
            logger.info("Migration: Created recommendations table")

        # Migration: create audit_log table if missing
        cursor = self.db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log'"
        )
        if not cursor.fetchone():
            self.db.executescript("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    previous_value TEXT,
                    new_value TEXT,
                    reason TEXT,
                    performed_by TEXT,
                    performed_at REAL NOT NULL,
                    metadata TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
                CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON audit_log(performed_at);
            """)
            self.db.commit()
            logger.info("Migration: Created audit_log table")

        # Migration: add last_analysis_session_id column to sessions for incremental analysis tracking
        cursor = self.db.execute("PRAGMA table_info(sessions)")
        columns = {row[1] for row in cursor.fetchall()}
        if 'last_analysis_session_id' not in columns:
            self.db.execute(
                "ALTER TABLE sessions ADD COLUMN last_analysis_session_id TEXT"
            )
            self.db.execute(
                "CREATE INDEX IF NOT EXISTS idx_sessions_last_analysis ON sessions(last_analysis_session_id)"
            )
            self.db.commit()
            logger.info("Migration: Added last_analysis_session_id column to sessions table")

    def _serialize_session(self, session: SessionData) -> Dict[str, Any]:
        """Convert SessionData to dict for SQLite storage."""
        return {
            'session_id': session.session_id,
            'agent_id': session.agent_id,
            'agent_workflow_id': session.agent_workflow_id,
            'created_at': session.created_at.timestamp(),
            'last_activity': session.last_activity.timestamp(),
            'is_active': 1 if session.is_active else 0,
            'is_completed': 1 if session.is_completed else 0,
            'completed_at': session.completed_at.timestamp() if session.completed_at else None,
            'total_events': session.total_events,
            'message_count': session.message_count,
            'tool_uses': session.tool_uses,
            'errors': session.errors,
            'total_tokens': session.total_tokens,
            'total_response_time_ms': session.total_response_time_ms,
            'response_count': session.response_count,
            'tool_usage_details': json.dumps(dict(session.tool_usage_details)),
            'available_tools': json.dumps(list(session.available_tools)),
            'events_json': json.dumps([e.model_dump() for e in session.events]),
            'behavioral_signature': json.dumps(session.behavioral_signature) if session.behavioral_signature else None,
            'behavioral_features': session.behavioral_features.model_dump_json() if session.behavioral_features else None,
            'cluster_id': session.cluster_id,
            'last_analysis_session_id': getattr(session, 'last_analysis_session_id', None),
            'tags_json': json.dumps(session.tags) if session.tags else None,
        }

    def _deserialize_session(self, row: sqlite3.Row) -> SessionData:
        """Convert SQLite row back to SessionData object."""
        session = SessionData(row['session_id'], row['agent_id'], row['agent_workflow_id'])
        session.created_at = datetime.fromtimestamp(row['created_at'], tz=timezone.utc)
        session.last_activity = datetime.fromtimestamp(row['last_activity'], tz=timezone.utc)
        session.is_active = bool(row['is_active'])
        session.is_completed = bool(row['is_completed'])
        session.completed_at = datetime.fromtimestamp(row['completed_at'], tz=timezone.utc) if row['completed_at'] else None
        session.total_events = row['total_events']
        session.message_count = row['message_count']
        session.tool_uses = row['tool_uses']
        session.errors = row['errors']
        session.total_tokens = row['total_tokens']
        session.total_response_time_ms = row['total_response_time_ms']
        session.response_count = row['response_count']
        session.tool_usage_details = defaultdict(int, json.loads(row['tool_usage_details']))
        session.available_tools = set(json.loads(row['available_tools']))
        events_list = json.loads(row['events_json'])
        session.events = deque([BaseEvent(**e) for e in events_list], maxlen=1000)
        if row['behavioral_signature']:
            session.behavioral_signature = json.loads(row['behavioral_signature'])
        if row['behavioral_features']:
            from ..runtime.models import SessionFeatures
            session.behavioral_features = SessionFeatures.model_validate_json(row['behavioral_features'])
        # Handle cluster_id (may not exist in older databases before migration)
        session.cluster_id = row['cluster_id'] if 'cluster_id' in row.keys() else None
        # Handle last_analysis_session_id (may not exist in older databases before migration)
        session.last_analysis_session_id = row['last_analysis_session_id'] if 'last_analysis_session_id' in row.keys() else None
        # Handle tags_json (may not exist in older databases before migration)
        if 'tags_json' in row.keys() and row['tags_json']:
            session.tags = json.loads(row['tags_json'])
        return session

    def _serialize_agent(self, agent: AgentData) -> Dict[str, Any]:
        """Convert AgentData to dict for SQLite storage."""
        return {
            'agent_id': agent.agent_id,
            'agent_workflow_id': agent.agent_workflow_id,
            'display_name': agent.display_name,
            'description': agent.description,
            'first_seen': agent.first_seen.timestamp(),
            'last_seen': agent.last_seen.timestamp(),
            'total_sessions': agent.total_sessions,
            'total_messages': agent.total_messages,
            'total_tokens': agent.total_tokens,
            'total_tools': agent.total_tools,
            'total_errors': agent.total_errors,
            'total_response_time_ms': agent.total_response_time_ms,
            'response_count': agent.response_count,
            'sessions_set': json.dumps(list(agent.sessions)),
            'available_tools': json.dumps(list(agent.available_tools)),
            'used_tools': json.dumps(list(agent.used_tools)),
            'tool_usage_details': json.dumps(dict(agent.tool_usage_details)),
            'cached_percentiles': json.dumps(agent.cached_percentiles) if agent.cached_percentiles else None,
            'percentiles_session_count': agent.percentiles_session_count,
            'last_analyzed_session_count': agent.last_analyzed_session_count,
        }

    def _deserialize_agent(self, row: sqlite3.Row) -> AgentData:
        """Convert SQLite row back to AgentData object."""
        agent = AgentData(row['agent_id'], row['agent_workflow_id'])
        # Handle new columns that may not exist in older databases
        agent.display_name = row['display_name'] if 'display_name' in row.keys() else None
        agent.description = row['description'] if 'description' in row.keys() else None
        agent.first_seen = datetime.fromtimestamp(row['first_seen'], tz=timezone.utc)
        agent.last_seen = datetime.fromtimestamp(row['last_seen'], tz=timezone.utc)
        agent.total_sessions = row['total_sessions']
        agent.total_messages = row['total_messages']
        agent.total_tokens = row['total_tokens']
        agent.total_tools = row['total_tools']
        agent.total_errors = row['total_errors']
        agent.total_response_time_ms = row['total_response_time_ms']
        agent.response_count = row['response_count']
        agent.sessions = set(json.loads(row['sessions_set']))
        agent.available_tools = set(json.loads(row['available_tools']))
        agent.used_tools = set(json.loads(row['used_tools']))
        agent.tool_usage_details = defaultdict(int, json.loads(row['tool_usage_details']))
        if row['cached_percentiles']:
            agent.cached_percentiles = json.loads(row['cached_percentiles'])
        agent.percentiles_session_count = row['percentiles_session_count']
        # Handle new column that may not exist in older databases (before migration runs)
        agent.last_analyzed_session_count = row['last_analyzed_session_count'] if 'last_analyzed_session_count' in row.keys() else 0
        return agent

    def _save_session(self, session: SessionData):
        """Save or update session in SQLite."""
        data = self._serialize_session(session)
        self.db.execute("""
            INSERT OR REPLACE INTO sessions VALUES (
                :session_id, :agent_id, :agent_workflow_id, :created_at, :last_activity,
                :is_active, :is_completed, :completed_at,
                :total_events, :message_count, :tool_uses, :errors,
                :total_tokens, :total_response_time_ms, :response_count,
                :tool_usage_details, :available_tools, :events_json,
                :behavioral_signature, :behavioral_features, :cluster_id, :last_analysis_session_id,
                :tags_json
            )
        """, data)
        self.db.commit()

    def _save_agent(self, agent: AgentData):
        """Save or update agent in SQLite."""
        data = self._serialize_agent(agent)
        self.db.execute("""
            INSERT OR REPLACE INTO agents VALUES (
                :agent_id, :agent_workflow_id, :display_name, :description,
                :first_seen, :last_seen,
                :total_sessions, :total_messages, :total_tokens,
                :total_tools, :total_errors, :total_response_time_ms, :response_count,
                :sessions_set, :available_tools, :used_tools, :tool_usage_details,
                :cached_percentiles, :percentiles_session_count, :last_analyzed_session_count
            )
        """, data)
        self.db.commit()

    def add_event(self, event: BaseEvent, session_id: Optional[str] = None, agent_id: Optional[str] = None):
        """Add an event to the store."""
        with self._lock:
            # Use event's session_id if not provided
            effective_session_id = session_id or event.session_id

            # Extract agent_id from event attributes if not provided
            if not agent_id and hasattr(event, 'attributes'):
                agent_id = event.attributes.get('agent.id', 'unknown')

            if not agent_id:
                agent_id = 'unknown'

            # Extract agent_workflow_id from event attributes
            agent_workflow_id = None
            if hasattr(event, 'attributes'):
                agent_workflow_id = event.attributes.get('agent_workflow.id')

            # Add to global event stream (kept in memory as circular buffer)
            self.events.append(event)
            self.total_events += 1

            # Ensure we have session and agent data
            if effective_session_id:
                # Load existing session or create new one
                session = self.get_session(effective_session_id)
                if not session:
                    session = SessionData(effective_session_id, agent_id, agent_workflow_id)
                elif agent_workflow_id and not session.agent_workflow_id:
                    # Update agent_workflow_id if not set (allows late binding)
                    session.agent_workflow_id = agent_workflow_id

                # Load existing agent or create new one
                agent = self.get_agent(agent_id)
                if not agent:
                    agent = AgentData(agent_id, agent_workflow_id)
                elif agent_workflow_id and not agent.agent_workflow_id:
                    # Update agent_workflow_id if not set (allows late binding)
                    agent.agent_workflow_id = agent_workflow_id

                # Add session to agent if not already tracked
                if effective_session_id not in agent.sessions:
                    agent.add_session(effective_session_id)

                # Add event to session (may trigger reactivation if session was completed)
                session.add_event(event)

                # Incremental metrics update - update agent metrics as events arrive
                event_name = event.name.value
                if event_name == "llm.call.start":
                    agent.total_messages += 1
                elif event_name == "llm.call.finish":
                    # Update response metrics
                    duration = event.attributes.get("llm.response.duration_ms", 0)
                    agent.total_response_time_ms += duration
                    agent.response_count += 1

                    # Update token metrics
                    tokens = event.attributes.get("llm.usage.total_tokens", 0)
                    agent.total_tokens += tokens
                elif event_name == "tool.execution":
                    agent.total_tools += 1
                    # Track specific tool usage
                    tool_name = event.attributes.get("tool.name", "unknown")
                    agent.tool_usage_details[tool_name] += 1
                    agent.used_tools.add(tool_name)
                elif event_name.endswith(".error"):
                    agent.total_errors += 1

                # Update agent's last seen timestamp
                agent.last_seen = max(agent.last_seen, session.last_activity)

                # Update agent's available tools (from llm.call.start events)
                if event_name == "llm.call.start":
                    request_data = event.attributes.get("llm.request.data", {})
                    if isinstance(request_data, dict):
                        tools = request_data.get("tools", [])
                        if tools:
                            for tool in tools:
                                if isinstance(tool, dict) and "name" in tool:
                                    agent.available_tools.add(tool["name"])

                # Save updated session and agent back to SQLite
                self._save_session(session)
                self._save_agent(agent)

            # Track global tool usage and errors
            event_name = event.name.value
            if event_name == "tool.execution":
                tool_name = event.attributes.get("tool.name", "unknown")
                self.tool_usage[tool_name] += 1
            elif event_name.endswith(".error"):
                error_type = event.attributes.get("error.type", "unknown")
                self.error_types[error_type] += 1

            # Cleanup old data periodically
            if self.total_events % 100 == 0:
                self._cleanup_old_data()

    def update_session_tags(
        self,
        session_id: str,
        tags: Dict[str, str],
        agent_id: Optional[str] = None
    ) -> bool:
        """Update tags for a session, merging with existing tags.

        Args:
            session_id: Session ID to update
            tags: Dictionary of tag key-value pairs to merge
            agent_id: Optional agent ID (used if session doesn't exist yet)

        Returns:
            True if session was updated, False if session not found and couldn't create
        """
        if not tags:
            return False

        with self._lock:
            session = self.get_session(session_id)
            if not session:
                # Create session if agent_id is provided
                if agent_id:
                    session = SessionData(session_id, agent_id)
                else:
                    return False

            # Merge tags into session
            session.merge_tags(tags)

            # Save session
            self._save_session(session)
            return True

    def _cleanup_old_data(self):
        """Remove old INCOMPLETE sessions only from SQLite.

        NEVER delete completed sessions - they contain valuable signatures and
        analysis data that should be kept for the lifetime of the gateway.

        Rate limited to run at most once per _cleanup_interval_seconds.
        """
        now = datetime.now(timezone.utc)

        # Rate limiting: only cleanup if enough time has passed
        if (now - self._last_cleanup).total_seconds() < self._cleanup_interval_seconds:
            return

        self._last_cleanup = now
        cutoff_time = now.timestamp() - (self.retention_minutes * 60)

        # Count total sessions
        cursor = self.db.execute("SELECT COUNT(*) FROM sessions")
        total_sessions = cursor.fetchone()[0]

        if total_sessions > 10:  # Keep at least 10 sessions
            # Delete old incomplete sessions
            cursor = self.db.execute("""
                DELETE FROM sessions
                WHERE is_completed = 0
                  AND last_activity < ?
            """, (cutoff_time,))
            deleted_count = cursor.rowcount
            self.db.commit()

            if deleted_count > 0:
                logger.debug(f"Cleaned up {deleted_count} old incomplete sessions")

    def get_active_sessions(self) -> List[SessionData]:
        """Get list of currently active sessions from SQLite (not completed, with activity in last 5 minutes)."""
        with self._lock:
            cutoff_time = datetime.now(timezone.utc).timestamp() - (5 * 60)  # 5 minutes
            cursor = self.db.execute("""
                SELECT * FROM sessions
                WHERE is_active = 1
                  AND is_completed = 0
                  AND last_activity > ?
                ORDER BY last_activity DESC
            """, (cutoff_time,))
            return [self._deserialize_session(row) for row in cursor.fetchall()]

    def get_recent_events(self, limit: int = 100) -> List[BaseEvent]:
        """Get recent events from the global stream."""
        with self._lock:
            return list(self.events)[-limit:]

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session data by ID from SQLite."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM sessions WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_session(row)
            return None

    def get_agent(self, agent_id: str) -> Optional[AgentData]:
        """Get agent data by ID from SQLite."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM agents WHERE agent_id = ?",
                (agent_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_agent(row)
            return None

    def get_agent_sessions(self, agent_id: str) -> List[SessionData]:
        """Get all sessions for a specific agent from SQLite."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM sessions WHERE agent_id = ? ORDER BY created_at DESC",
                (agent_id,)
            )
            return [self._deserialize_session(row) for row in cursor.fetchall()]

    def get_all_sessions(self) -> List[SessionData]:
        """Get all sessions from SQLite."""
        with self._lock:
            cursor = self.db.execute("SELECT * FROM sessions ORDER BY created_at DESC")
            return [self._deserialize_session(row) for row in cursor.fetchall()]

    def _build_sessions_filter_query(
        self,
        agent_workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        cluster_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Tuple[str, List[Any]]:
        """Build WHERE clause for session filtering.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
            cluster_id: Filter by behavioral cluster ID (e.g., "cluster_1").
            tags: List of tags to filter by. Each tag can be "key:value" or just "key".
                  All tags must match (AND logic).

        Returns:
            Tuple of (where_clause, params) - where_clause starts with " WHERE 1=1"
        """
        where_clause = " WHERE 1=1"
        params: List[Any] = []

        if agent_workflow_id is not None:
            if agent_workflow_id == "unassigned":
                where_clause += " AND agent_workflow_id IS NULL"
            else:
                where_clause += " AND agent_workflow_id = ?"
                params.append(agent_workflow_id)

        if agent_id is not None:
            where_clause += " AND agent_id = ?"
            params.append(agent_id)

        if status is not None:
            status_upper = status.upper()
            if status_upper == "ACTIVE":
                where_clause += " AND is_active = 1 AND is_completed = 0"
            elif status_upper == "INACTIVE":
                where_clause += " AND is_active = 0 AND is_completed = 0"
            elif status_upper == "COMPLETED":
                where_clause += " AND is_completed = 1"

        if cluster_id is not None:
            where_clause += " AND cluster_id = ?"
            params.append(cluster_id)

        if tags is not None:
            # Process each tag - all must match (AND logic)
            for tag in tags:
                # Parse tag filter - can be "key:value" or just "key"
                if ":" in tag:
                    tag_key, tag_value = tag.split(":", 1)
                    # Use JSON extraction to filter by tag key and value
                    # SQLite JSON functions: json_extract for exact match
                    where_clause += " AND json_extract(tags_json, ?) = ?"
                    params.append(f"$.{tag_key}")
                    params.append(tag_value)
                else:
                    # Filter by tag key existence (any value)
                    where_clause += " AND json_extract(tags_json, ?) IS NOT NULL"
                    params.append(f"$.{tag}")

        return where_clause, params

    def count_sessions_filtered(
        self,
        agent_workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        cluster_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> int:
        """Count sessions with optional filtering.

        More efficient than get_sessions_filtered when only count is needed.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
            cluster_id: Filter by behavioral cluster ID (e.g., "cluster_1").
            tags: List of tags to filter by. Each tag can be "key:value" or just "key".
                  All tags must match (AND logic).

        Returns:
            Count of matching sessions.
        """
        with self._lock:
            where_clause, params = self._build_sessions_filter_query(
                agent_workflow_id=agent_workflow_id,
                agent_id=agent_id,
                status=status,
                cluster_id=cluster_id,
                tags=tags,
            )
            query = f"SELECT COUNT(*) FROM sessions{where_clause}"  # nosec B608 - parameterized
            cursor = self.db.execute(query, params)
            return cursor.fetchone()[0]

    def get_sessions_filtered(
        self,
        agent_workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        cluster_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get sessions with optional filtering by agent_workflow_id, agent_id, status, cluster_id, and tags.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
            cluster_id: Filter by behavioral cluster ID (e.g., "cluster_1").
            tags: List of tags to filter by. Each tag can be "key:value" or just "key".
                  All tags must match (AND logic).
            limit: Maximum number of sessions to return.
            offset: Number of sessions to skip (for pagination).

        Returns:
            List of session dicts with formatted fields for API response.
        """
        with self._lock:
            where_clause, params = self._build_sessions_filter_query(
                agent_workflow_id=agent_workflow_id,
                agent_id=agent_id,
                status=status,
                cluster_id=cluster_id,
                tags=tags,
            )
            query = f"SELECT * FROM sessions{where_clause} ORDER BY last_activity DESC LIMIT ? OFFSET ?"  # nosec B608 - parameterized
            params.append(limit)
            params.append(offset)

            cursor = self.db.execute(query, params)
            sessions = []

            for row in cursor.fetchall():
                # Convert row to API-friendly dict format
                created_at = datetime.fromtimestamp(row['created_at'], tz=timezone.utc)
                last_activity = datetime.fromtimestamp(row['last_activity'], tz=timezone.utc)
                now = datetime.now(timezone.utc)

                # Calculate relative time
                delta = now - last_activity
                if delta.total_seconds() < 60:
                    last_activity_relative = "just now"
                elif delta.total_seconds() < 3600:
                    mins = int(delta.total_seconds() / 60)
                    last_activity_relative = f"{mins}m ago"
                elif delta.total_seconds() < 86400:
                    hours = int(delta.total_seconds() / 3600)
                    last_activity_relative = f"{hours}h ago"
                else:
                    days = int(delta.total_seconds() / 86400)
                    last_activity_relative = f"{days}d ago"

                # Determine status string
                if row['is_completed']:
                    status_str = "COMPLETED"
                elif row['is_active']:
                    status_str = "ACTIVE"
                else:
                    status_str = "INACTIVE"

                # Calculate duration
                duration_seconds = last_activity.timestamp() - created_at.timestamp()
                duration_minutes = duration_seconds / 60

                # Calculate error rate
                message_count = row['message_count'] or 0
                errors = row['errors'] or 0
                error_rate = (errors / message_count * 100) if message_count > 0 else 0.0

                # Parse tags from JSON
                tags = {}
                if 'tags_json' in row.keys() and row['tags_json']:
                    try:
                        tags = json.loads(row['tags_json'])
                    except json.JSONDecodeError:
                        pass

                sessions.append({
                    "id": row['session_id'],
                    "id_short": row['session_id'][:12],
                    "agent_id": row['agent_id'],
                    "agent_id_short": row['agent_id'][:12] if row['agent_id'] else None,
                    "agent_workflow_id": row['agent_workflow_id'],
                    "cluster_id": row['cluster_id'] if 'cluster_id' in row.keys() else None,
                    "created_at": created_at.isoformat(),
                    "last_activity": last_activity.isoformat(),
                    "last_activity_relative": last_activity_relative,
                    "duration_minutes": round(duration_minutes, 1),
                    "is_active": bool(row['is_active']),
                    "is_completed": bool(row['is_completed']),
                    "status": status_str,
                    "message_count": message_count,
                    "tool_uses": row['tool_uses'] or 0,
                    "errors": errors,
                    "total_tokens": row['total_tokens'] or 0,
                    "error_rate": round(error_rate, 1),
                    "tags": tags,
                })

            return sessions

    def get_session_tags(
        self,
        agent_workflow_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get all unique tag keys and values with counts from sessions for a workflow.

        Uses SQLite's json_each() for efficient SQL-level aggregation.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.

        Returns:
            List of dicts with 'key' and 'values' (list of {value, count} dicts).
        """
        with self._lock:
            # Build WHERE clause
            where_parts = ["tags_json IS NOT NULL", "tags_json != '{}'"]
            params: List[Any] = []

            if agent_workflow_id is not None:
                if agent_workflow_id == "unassigned":
                    where_parts.append("agent_workflow_id IS NULL")
                else:
                    where_parts.append("agent_workflow_id = ?")
                    params.append(agent_workflow_id)

            where_clause = " WHERE " + " AND ".join(where_parts)

            # Use json_each() for SQL-level aggregation - no Python JSON parsing loops
            query = f"""
                SELECT json_each.key, json_each.value, COUNT(*) as count
                FROM sessions, json_each(sessions.tags_json)
                {where_clause}
                GROUP BY json_each.key, json_each.value
                ORDER BY json_each.key, count DESC
            """  # nosec B608 - parameterized
            cursor = self.db.execute(query, params)

            # Group results by key (single pass through aggregated results)
            tag_data: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
            for row in cursor.fetchall():
                tag_data[row["key"]].append({
                    "value": row["value"],
                    "count": row["count"],
                })

            return [
                {"key": key, "values": values}
                for key, values in sorted(tag_data.items())
            ]

    def get_all_agents(self, agent_workflow_id: Optional[str] = None) -> List[AgentData]:
        """Get all agents from SQLite, optionally filtered by agent workflow.

        Args:
            agent_workflow_id: Optional workflow ID to filter by.
                        Use "unassigned" to get agents with no agent workflow.
        """
        with self._lock:
            if agent_workflow_id is None:
                cursor = self.db.execute("SELECT * FROM agents ORDER BY first_seen DESC")
            elif agent_workflow_id == "unassigned":
                cursor = self.db.execute(
                    "SELECT * FROM agents WHERE agent_workflow_id IS NULL ORDER BY first_seen DESC"
                )
            else:
                cursor = self.db.execute(
                    "SELECT * FROM agents WHERE agent_workflow_id = ? ORDER BY first_seen DESC",
                    (agent_workflow_id,)
                )
            return [self._deserialize_agent(row) for row in cursor.fetchall()]

    def get_agent_system_prompt(self, agent_id: str) -> Optional[str]:
        """Extract system prompt from the first llm.call.start event in agent's sessions.

        Supports:
        - Anthropic: llm.request.data.system
        - OpenAI: llm.request.data.messages with role="system"
        - OpenAI Responses API: llm.request.data.instructions
        """
        with self._lock:
            cursor = self.db.execute(
                "SELECT events_json FROM sessions WHERE agent_id = ? ORDER BY created_at ASC LIMIT 10",
                (agent_id,)
            )

            for row in cursor.fetchall():
                if not row["events_json"]:
                    continue
                events_list = json.loads(row["events_json"])

                for event_data in events_list:
                    if event_data.get("name") == "llm.call.start":
                        request_data = event_data.get("attributes", {}).get("llm.request.data", {})
                        if not isinstance(request_data, dict):
                            continue

                        # Anthropic: system is top-level field
                        if request_data.get("system"):
                            system = request_data["system"]
                            return system if isinstance(system, str) else str(system)

                        # OpenAI: system message in messages array
                        messages = request_data.get("messages") or request_data.get("input") or []
                        if isinstance(messages, list):
                            for msg in messages:
                                if isinstance(msg, dict) and msg.get("role") == "system":
                                    content = msg.get("content")
                                    return content if isinstance(content, str) else str(content)

                        # OpenAI Responses API: instructions field
                        if request_data.get("instructions"):
                            return str(request_data["instructions"])

            return None

    def update_agent_info(
        self,
        agent_id: str,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
        agent_workflow_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update agent display name, description, and/or agent_workflow_id.

        Args:
            agent_id: The agent ID to update
            display_name: Human-friendly name for the agent
            description: Description of what the agent does
            agent_workflow_id: Link this agent to an agent workflow for correlation

        Returns:
            Updated agent info dict, or None if agent not found
        """
        with self._lock:
            # Check agent exists
            cursor = self.db.execute(
                "SELECT * FROM agents WHERE agent_id = ?", (agent_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None

            # Build dynamic UPDATE query
            updates = []
            params = []
            if display_name is not None:
                updates.append("display_name = ?")
                params.append(display_name)
            if description is not None:
                updates.append("description = ?")
                params.append(description)
            if agent_workflow_id is not None:
                updates.append("agent_workflow_id = ?")
                params.append(agent_workflow_id)

            if updates:
                params.append(agent_id)
                self.db.execute(
                    f"UPDATE agents SET {', '.join(updates)} WHERE agent_id = ?",  # nosec B608 - parameterized
                    params
                )
                self.db.commit()

            # Return updated agent info
            cursor = self.db.execute(
                "SELECT * FROM agents WHERE agent_id = ?", (agent_id,)
            )
            row = cursor.fetchone()
            return {
                'agent_id': row['agent_id'],
                'agent_workflow_id': row['agent_workflow_id'],
                'display_name': row['display_name'] if 'display_name' in row.keys() else None,
                'description': row['description'] if 'description' in row.keys() else None,
            }

    def get_agent_workflows(self) -> List[Dict[str, Any]]:
        """Get all unique agent workflows with their agent counts.

        Returns:
            List of agent workflow dicts with id, name, agent_count, and session_count.
            Includes agent workflows from agents and sessions tables.
            Includes "Unassigned" for agents without an agent workflow.
        """
        with self._lock:
            agent_workflows = []

            # Get agent workflows with agent counts and session counts
            cursor = self.db.execute("""
                SELECT
                    agent_workflow_id,
                    COALESCE(MAX(agent_workflow_name), agent_workflow_id) as name,
                    SUM(agent_count) as agent_count,
                    SUM(session_count) as session_count
                FROM (
                    -- Agent workflows from agents
                    SELECT agent_workflow_id, NULL as agent_workflow_name, COUNT(*) as agent_count, 0 as session_count
                    FROM agents
                    WHERE agent_workflow_id IS NOT NULL
                    GROUP BY agent_workflow_id

                    UNION ALL

                    -- Agent workflows from sessions (actual agent sessions)
                    SELECT agent_workflow_id, NULL as agent_workflow_name, 0 as agent_count, COUNT(*) as session_count
                    FROM sessions
                    WHERE agent_workflow_id IS NOT NULL
                    GROUP BY agent_workflow_id

                    UNION ALL

                    -- Agent workflows from analysis_sessions (for agent workflow names)
                    SELECT agent_workflow_id, agent_workflow_name, 0 as agent_count, 0 as session_count
                    FROM analysis_sessions
                    WHERE agent_workflow_id IS NOT NULL
                    GROUP BY agent_workflow_id
                )
                GROUP BY agent_workflow_id
                ORDER BY agent_workflow_id
            """)

            for row in cursor.fetchall():
                agent_workflows.append({
                    "id": row["agent_workflow_id"],
                    "name": row["name"],
                    "agent_count": row["agent_count"],
                    "session_count": row["session_count"]
                })

            # Get count of unassigned agents
            cursor = self.db.execute(
                "SELECT COUNT(*) as count FROM agents WHERE agent_workflow_id IS NULL"
            )
            unassigned_count = cursor.fetchone()["count"]

            if unassigned_count > 0:
                agent_workflows.append({
                    "id": None,
                    "name": "Unassigned",
                    "agent_count": unassigned_count
                })

            return agent_workflows

    def get_global_stats(self) -> Dict[str, Any]:
        """Get global statistics from SQLite."""
        with self._lock:
            active_sessions = self.get_active_sessions()

            # Calculate aggregate metrics from SQLite
            cursor = self.db.execute("""
                SELECT
                    COUNT(*) as total_sessions,
                    SUM(total_tokens) as total_tokens,
                    SUM(total_response_time_ms) as total_response_time,
                    SUM(response_count) as total_responses,
                    SUM(errors) as total_errors
                FROM sessions
            """)
            row = cursor.fetchone()

            total_sessions = row['total_sessions'] or 0
            total_tokens = row['total_tokens'] or 0
            total_response_time = row['total_response_time'] or 0
            total_responses = row['total_responses'] or 0
            total_errors = row['total_errors'] or 0

            avg_response_time = total_response_time / total_responses if total_responses > 0 else 0
            error_rate = (total_errors / self.total_events) * 100 if self.total_events > 0 else 0

            # Count total agents
            cursor = self.db.execute("SELECT COUNT(*) FROM agents")
            total_agents = cursor.fetchone()[0]

            uptime_minutes = (datetime.now(timezone.utc) - self.start_time).total_seconds() / 60

            return {
                "total_events": self.total_events,
                "total_sessions": total_sessions,
                "active_sessions": len(active_sessions),
                "total_agents": total_agents,
                "total_tokens": total_tokens,
                "avg_response_time_ms": avg_response_time,
                "error_rate": error_rate,
                "uptime_minutes": uptime_minutes,
                "events_per_minute": self.total_events / uptime_minutes if uptime_minutes > 0 else 0,
                "top_tools": dict(sorted(self.tool_usage.items(), key=lambda x: x[1], reverse=True)[:5]),
                "top_errors": dict(sorted(self.error_types.items(), key=lambda x: x[1], reverse=True)[:5])
            }

    def check_and_complete_sessions(self, timeout_seconds: int = 30) -> List[str]:
        """Check for inactive sessions and mark them as completed in SQLite.

        Args:
            timeout_seconds: Number of seconds of inactivity before marking complete

        Returns:
            List of agent IDs that had sessions completed (for triggering analysis)
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            cutoff_time = now.timestamp() - timeout_seconds

            # Find sessions to mark as completed
            cursor = self.db.execute("""
                SELECT * FROM sessions
                WHERE is_completed = 0
                  AND is_active = 1
                  AND last_activity < ?
            """, (cutoff_time,))

            sessions_to_complete = [self._deserialize_session(row) for row in cursor.fetchall()]

            # Track unique agent IDs that had sessions completed
            completed_agent_ids: Set[str] = set()

            # Mark each session as completed and save
            for session in sessions_to_complete:
                session.mark_completed()
                self._save_session(session)
                completed_agent_ids.add(session.agent_id)

            newly_completed = len(sessions_to_complete)
            if newly_completed > 0:
                logger.info(f"Marked {newly_completed} sessions as completed after {timeout_seconds}s inactivity")

            return list(completed_agent_ids)

    # Analysis Session and Finding Methods

    def _deserialize_analysis_session(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert SQLite row to analysis session dict."""
        return {
            'session_id': row['session_id'],
            'agent_workflow_id': row['agent_workflow_id'],
            'agent_workflow_name': row['agent_workflow_name'],
            'session_type': row['session_type'],
            'status': row['status'],
            'created_at': datetime.fromtimestamp(row['created_at'], tz=timezone.utc).isoformat(),
            'completed_at': datetime.fromtimestamp(row['completed_at'], tz=timezone.utc).isoformat() if row['completed_at'] else None,
            'findings_count': row['findings_count'],
            'risk_score': row['risk_score'],
            'sessions_analyzed': row['sessions_analyzed'],  # Number of runtime sessions in this scan
        }

    def _deserialize_finding(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert SQLite row to finding dict."""
        row_keys = row.keys()
        return {
            'finding_id': row['finding_id'],
            'session_id': row['session_id'],
            'agent_workflow_id': row['agent_workflow_id'],
            'source_type': row['source_type'] if 'source_type' in row_keys else 'STATIC',
            'category': row['category'] if 'category' in row_keys else None,
            'check_id': row['check_id'] if 'check_id' in row_keys else None,
            'file_path': row['file_path'],
            'line_start': row['line_start'],
            'line_end': row['line_end'],
            'finding_type': row['finding_type'],
            'severity': row['severity'],
            'cvss_score': row['cvss_score'] if 'cvss_score' in row_keys else None,
            'title': row['title'],
            'description': row['description'],
            'evidence': json.loads(row['evidence']) if row['evidence'] else None,
            'owasp_mapping': json.loads(row['owasp_mapping']) if row['owasp_mapping'] else [],
            'cwe': row['cwe'] if 'cwe' in row_keys else None,
            'soc2_controls': json.loads(row['soc2_controls']) if 'soc2_controls' in row_keys and row['soc2_controls'] else None,
            'recommendation_id': row['recommendation_id'] if 'recommendation_id' in row_keys else None,
            'status': row['status'],
            # Phase 5: Correlation fields
            'correlation_state': row['correlation_state'] if 'correlation_state' in row_keys else None,
            'correlation_evidence': json.loads(row['correlation_evidence']) if 'correlation_evidence' in row_keys and row['correlation_evidence'] else None,
            'created_at': datetime.fromtimestamp(row['created_at'], tz=timezone.utc).isoformat(),
            'updated_at': datetime.fromtimestamp(row['updated_at'], tz=timezone.utc).isoformat(),
        }

    def create_analysis_session(
        self,
        session_id: str,
        agent_workflow_id: str,
        session_type: str,
        agent_workflow_name: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new analysis session for an agent workflow/codebase."""
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()

            self.db.execute("""
                INSERT INTO analysis_sessions (
                    session_id, agent_workflow_id, agent_workflow_name, agent_id, session_type, status,
                    created_at, findings_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (session_id, agent_workflow_id, agent_workflow_name, agent_id, session_type, 'IN_PROGRESS', created_at, 0))
            self.db.commit()

            return {
                'session_id': session_id,
                'agent_workflow_id': agent_workflow_id,
                'agent_workflow_name': agent_workflow_name,
                'agent_id': agent_id,
                'session_type': session_type,
                'status': 'IN_PROGRESS',
                'created_at': now.isoformat(),
                'completed_at': None,
                'findings_count': 0,
                'risk_score': None,
            }

    def complete_analysis_session(
        self,
        session_id: str,
        findings_count: Optional[int] = None,
        risk_score: Optional[int] = None,
        sessions_analyzed: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Mark an analysis session as completed.

        Also auto-resolves any OPEN findings from previous scans that were not
        found in this scan (meaning the issue no longer exists in the codebase).
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            completed_at = now.timestamp()

            # Get session details first
            session = self.get_analysis_session(session_id)
            if not session:
                return None

            agent_workflow_id = session.get('agent_workflow_id')
            session_type = session.get('session_type')

            # Mark session as completed (include sessions_analyzed)
            self.db.execute("""
                UPDATE analysis_sessions
                SET status = ?, completed_at = ?, findings_count = COALESCE(?, findings_count),
                    risk_score = ?, sessions_analyzed = COALESCE(?, sessions_analyzed)
                WHERE session_id = ?
            """, ('COMPLETED', completed_at, findings_count, risk_score, sessions_analyzed, session_id))

            # Auto-resolve old findings that are no longer present (only for STATIC scans)
            if session_type == 'STATIC' and agent_workflow_id:
                resolved_count = self._auto_resolve_old_findings(session_id, agent_workflow_id, completed_at)
                if resolved_count > 0:
                    logger.info(f"Auto-resolved {resolved_count} findings no longer present in latest scan")

            self.db.commit()

            # Return the updated session
            return self.get_analysis_session(session_id)

    def _auto_resolve_old_findings(
        self,
        current_session_id: str,
        agent_workflow_id: str,
        resolved_at: float,
    ) -> int:
        """Auto-resolve OPEN findings from previous scans not found in current scan.

        If a finding (identified by file_path + finding_type) was OPEN in a previous
        scan but not found in the current scan, it means the issue no longer exists
        (either fixed or code was removed). Mark it as RESOLVED.
        """
        # Get findings from the current scan (these are the "still present" issues)
        cursor = self.db.execute("""
            SELECT file_path, finding_type FROM findings WHERE session_id = ?
        """, (current_session_id,))
        current_findings = {(row['file_path'], row['finding_type']) for row in cursor.fetchall()}

        # Find all OPEN findings from previous sessions for this workflow
        cursor = self.db.execute("""
            SELECT finding_id, file_path, finding_type FROM findings
            WHERE agent_workflow_id = ?
            AND session_id != ?
            AND status = 'OPEN'
        """, (agent_workflow_id, current_session_id))

        old_findings = cursor.fetchall()

        # Mark old findings that are NOT in current scan as RESOLVED
        resolved_count = 0
        for row in old_findings:
            finding_key = (row['file_path'], row['finding_type'])
            if finding_key not in current_findings:
                # This finding is no longer present - auto-resolve it
                self.db.execute("""
                    UPDATE findings
                    SET status = 'RESOLVED', updated_at = ?
                    WHERE finding_id = ?
                """, (resolved_at, row['finding_id']))

                # Also update the linked recommendation if any
                self.db.execute("""
                    UPDATE recommendations
                    SET status = 'RESOLVED', fixed_at = ?
                    WHERE source_finding_id = ? AND status NOT IN ('FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED')
                """, (resolved_at, row['finding_id']))

                resolved_count += 1

        return resolved_count

    def cleanup_stale_analysis_sessions(self, stale_threshold_minutes: int = 60) -> int:
        """Auto-complete analysis sessions that have been IN_PROGRESS for too long.

        This cleans up orphaned sessions that were never completed (e.g., due to crashes).

        Args:
            stale_threshold_minutes: Sessions older than this are considered stale (default: 60 min)

        Returns:
            Number of sessions cleaned up
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            threshold_timestamp = (now - timedelta(minutes=stale_threshold_minutes)).timestamp()

            # Find and complete stale sessions
            cursor = self.db.execute("""
                UPDATE analysis_sessions
                SET status = 'COMPLETED',
                    completed_at = ?
                WHERE status = 'IN_PROGRESS'
                AND created_at < ?
            """, (now.timestamp(), threshold_timestamp))

            count = cursor.rowcount
            self.db.commit()

            if count > 0:
                logger.info(f"Auto-completed {count} stale analysis sessions (older than {stale_threshold_minutes} min)")

            return count

    def get_analysis_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get an analysis session by ID."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM analysis_sessions WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_analysis_session(row)
            return None

    def get_analysis_sessions(
        self,
        agent_workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get analysis sessions with optional filtering."""
        with self._lock:
            query = "SELECT * FROM analysis_sessions WHERE 1=1"
            params = []

            if agent_workflow_id:
                query += " AND agent_workflow_id = ?"
                params.append(agent_workflow_id)

            if status:
                query += " AND status = ?"
                params.append(status)

            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)
            return [self._deserialize_analysis_session(row) for row in cursor.fetchall()]

    def store_finding(
        self,
        finding_id: str,
        session_id: str,
        agent_workflow_id: str,
        file_path: str,
        finding_type: str,
        severity: str,
        title: str,
        description: Optional[str] = None,
        line_start: Optional[int] = None,
        line_end: Optional[int] = None,
        evidence: Optional[Dict[str, Any]] = None,
        owasp_mapping: Optional[List[str]] = None,
        source_type: str = 'STATIC',
        category: Optional[str] = None,
        check_id: Optional[str] = None,
        cvss_score: Optional[float] = None,
        cwe: Optional[str] = None,
        soc2_controls: Optional[List[str]] = None,
        auto_create_recommendation: bool = True,
        fix_hints: Optional[str] = None,
        impact: Optional[str] = None,
        fix_complexity: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Store a security finding for an agent workflow.

        Args:
            finding_id: Unique finding ID
            session_id: Analysis session ID
            agent_workflow_id: Agent workflow ID
            file_path: Path to affected file
            finding_type: Type of finding (e.g., PROMPT_INJECTION)
            severity: CRITICAL, HIGH, MEDIUM, LOW
            title: Finding title
            description: Detailed description
            line_start: Starting line number
            line_end: Ending line number
            evidence: Evidence dict (code snippet, context, etc.)
            owasp_mapping: List of OWASP LLM control IDs
            source_type: STATIC or DYNAMIC
            category: Security category (PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY, BEHAVIOR)
            check_id: ID of the check that found this issue
            cvss_score: CVSS score (0-10)
            cwe: CWE ID
            soc2_controls: List of SOC2 control IDs
            auto_create_recommendation: Whether to auto-create a recommendation
            fix_hints: Hints on how to fix (for recommendation)
            impact: Business impact (for recommendation)
            fix_complexity: LOW, MEDIUM, HIGH (for recommendation)

        Returns:
            Dict with finding data (including recommendation_id if created)
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()
            updated_at = created_at

            # Serialize JSON fields
            evidence_json = json.dumps(evidence) if evidence else None
            owasp_mapping_json = json.dumps(owasp_mapping) if owasp_mapping else None
            soc2_controls_json = json.dumps(soc2_controls) if soc2_controls else None

            # Derive category from finding_type if not provided
            if not category:
                category = self._derive_category_from_type(finding_type)

            self.db.execute("""
                INSERT INTO findings (
                    finding_id, session_id, agent_workflow_id, source_type, category, check_id,
                    file_path, line_start, line_end, finding_type, severity, cvss_score,
                    title, description, evidence, owasp_mapping, cwe, soc2_controls,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                finding_id, session_id, agent_workflow_id, source_type, category, check_id,
                file_path, line_start, line_end, finding_type, severity, cvss_score,
                title, description, evidence_json, owasp_mapping_json, cwe, soc2_controls_json,
                'OPEN', created_at, updated_at
            ))

            # Increment session's findings_count
            self.db.execute("""
                UPDATE analysis_sessions
                SET findings_count = findings_count + 1
                WHERE session_id = ?
            """, (session_id,))

            self.db.commit()

            finding_result = {
                'finding_id': finding_id,
                'session_id': session_id,
                'agent_workflow_id': agent_workflow_id,
                'source_type': source_type,
                'category': category,
                'check_id': check_id,
                'file_path': file_path,
                'line_start': line_start,
                'line_end': line_end,
                'finding_type': finding_type,
                'severity': severity,
                'cvss_score': cvss_score,
                'title': title,
                'description': description,
                'evidence': evidence,
                'owasp_mapping': owasp_mapping or [],
                'cwe': cwe,
                'soc2_controls': soc2_controls,
                'status': 'OPEN',
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
                'recommendation_id': None,
            }

            # Auto-create recommendation if enabled
            if auto_create_recommendation:
                code_snippet = None
                if evidence and isinstance(evidence, dict):
                    code_snippet = evidence.get('code_snippet')

                rec = self.create_recommendation(
                    workflow_id=agent_workflow_id,
                    source_type=source_type,
                    source_finding_id=finding_id,
                    category=category or 'UNKNOWN',
                    severity=severity,
                    title=f"Fix: {title}",
                    description=description,
                    impact=impact,
                    fix_hints=fix_hints,
                    fix_complexity=fix_complexity,
                    file_path=file_path,
                    line_start=line_start,
                    line_end=line_end,
                    code_snippet=code_snippet,
                    cvss_score=cvss_score,
                    owasp_llm=owasp_mapping[0] if owasp_mapping else None,
                    cwe=cwe,
                    soc2_controls=soc2_controls,
                )
                finding_result['recommendation_id'] = rec['recommendation_id']

            return finding_result

    def _derive_category_from_type(self, finding_type: str) -> str:
        """Derive a security category from finding type.

        Maps finding types to the 7 security categories:
        PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY, BEHAVIOR
        """
        finding_type_upper = finding_type.upper()

        # Prompt-related
        if any(kw in finding_type_upper for kw in ['PROMPT', 'INJECTION', 'JAILBREAK']):
            return 'PROMPT'

        # Output-related
        if any(kw in finding_type_upper for kw in ['OUTPUT', 'XSS', 'RESPONSE']):
            return 'OUTPUT'

        # Tool-related
        if any(kw in finding_type_upper for kw in ['TOOL', 'PLUGIN', 'FUNCTION', 'PERMISSION']):
            return 'TOOL'

        # Data/Secrets-related
        if any(kw in finding_type_upper for kw in ['SECRET', 'KEY', 'PII', 'DATA', 'CREDENTIAL', 'PASSWORD']):
            return 'DATA'

        # Memory/Context-related
        if any(kw in finding_type_upper for kw in ['MEMORY', 'RAG', 'CONTEXT', 'HISTORY']):
            return 'MEMORY'

        # Supply chain
        if any(kw in finding_type_upper for kw in ['SUPPLY', 'DEPENDENCY', 'MODEL', 'EXTERNAL']):
            return 'SUPPLY'

        # Behavioral
        if any(kw in finding_type_upper for kw in ['BEHAVIOR', 'AGENCY', 'OVERSIGHT', 'LIMIT', 'BOUNDARY']):
            return 'BEHAVIOR'

        return 'PROMPT'  # Default to PROMPT if unknown

    def get_finding(self, finding_id: str) -> Optional[Dict[str, Any]]:
        """Get a finding by ID."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM findings WHERE finding_id = ?",
                (finding_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_finding(row)
            return None

    def get_findings(
        self,
        agent_workflow_id: Optional[str] = None,
        session_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get findings with optional filtering."""
        with self._lock:
            query = "SELECT * FROM findings WHERE 1=1"
            params = []

            if agent_workflow_id:
                query += " AND agent_workflow_id = ?"
                params.append(agent_workflow_id)

            if session_id:
                query += " AND session_id = ?"
                params.append(session_id)

            if severity:
                query += " AND severity = ?"
                params.append(severity)

            if status:
                query += " AND status = ?"
                params.append(status)

            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)
            return [self._deserialize_finding(row) for row in cursor.fetchall()]

    def update_finding_status(
        self,
        finding_id: str,
        status: str,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update the status of a finding."""
        with self._lock:
            now = datetime.now(timezone.utc)
            updated_at = now.timestamp()

            # Update description with notes if provided
            if notes:
                # Append notes to existing description
                cursor = self.db.execute(
                    "SELECT description FROM findings WHERE finding_id = ?",
                    (finding_id,)
                )
                row = cursor.fetchone()
                if row:
                    existing_desc = row['description'] or ''
                    new_desc = f"{existing_desc}\n\nUpdate: {notes}".strip()
                    self.db.execute("""
                        UPDATE findings
                        SET status = ?, updated_at = ?, description = ?
                        WHERE finding_id = ?
                    """, (status, updated_at, new_desc, finding_id))
                else:
                    return None
            else:
                self.db.execute("""
                    UPDATE findings
                    SET status = ?, updated_at = ?
                    WHERE finding_id = ?
                """, (status, updated_at, finding_id))

            self.db.commit()

            # Return the updated finding
            return self.get_finding(finding_id)

    def update_finding_correlation(
        self,
        finding_id: str,
        correlation_state: str,
        correlation_evidence: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update the correlation state of a finding.

        Correlation states:
        - VALIDATED: Static finding confirmed by runtime evidence
        - UNEXERCISED: Static finding, code path never executed at runtime
        - RUNTIME_ONLY: Issue found at runtime, no static counterpart
        - THEORETICAL: Static finding, but safe at runtime (other safeguards)

        Args:
            finding_id: The finding to update
            correlation_state: One of VALIDATED, UNEXERCISED, RUNTIME_ONLY, THEORETICAL
            correlation_evidence: Optional dict with evidence details (tool calls, session count, etc.)

        Returns:
            Updated finding dict or None if not found
        """
        valid_states = {'VALIDATED', 'UNEXERCISED', 'RUNTIME_ONLY', 'THEORETICAL'}
        if correlation_state.upper() not in valid_states:
            logger.warning(f"Invalid correlation state: {correlation_state}. Must be one of {valid_states}")
            return None

        with self._lock:
            now = datetime.now(timezone.utc)
            updated_at = now.timestamp()

            evidence_json = json.dumps(correlation_evidence) if correlation_evidence else None

            self.db.execute("""
                UPDATE findings
                SET correlation_state = ?, correlation_evidence = ?, updated_at = ?
                WHERE finding_id = ?
            """, (correlation_state.upper(), evidence_json, updated_at, finding_id))

            self.db.commit()

            # Return the updated finding
            return self.get_finding(finding_id)

    def get_correlation_summary(
        self,
        agent_workflow_id: str,
    ) -> Dict[str, Any]:
        """Get correlation summary for an agent workflow.

        Returns counts of findings by correlation state and overall correlation status.
        """
        with self._lock:
            cursor = self.db.execute("""
                SELECT correlation_state, COUNT(*) as count
                FROM findings
                WHERE agent_workflow_id = ? AND status = 'OPEN'
                GROUP BY correlation_state
            """, (agent_workflow_id,))

            counts = {row['correlation_state']: row['count'] for row in cursor.fetchall()}

            # Count uncorrelated (NULL correlation_state)
            uncorrelated = counts.pop(None, 0)

            # Get total sessions for context
            cursor = self.db.execute("""
                SELECT COUNT(DISTINCT session_id) as session_count
                FROM sessions
                WHERE agent_workflow_id = ? AND is_completed = 1
            """, (agent_workflow_id,))
            row = cursor.fetchone()
            sessions_count = row['session_count'] if row else 0

            return {
                'agent_workflow_id': agent_workflow_id,
                'validated': counts.get('VALIDATED', 0),
                'unexercised': counts.get('UNEXERCISED', 0),
                'runtime_only': counts.get('RUNTIME_ONLY', 0),
                'theoretical': counts.get('THEORETICAL', 0),
                'uncorrelated': uncorrelated,
                'sessions_count': sessions_count,
                'is_correlated': uncorrelated == 0 and (counts.get('VALIDATED', 0) + counts.get('UNEXERCISED', 0) + counts.get('THEORETICAL', 0)) > 0,
            }

    def get_agent_workflow_findings_summary(
        self,
        agent_workflow_id: str,
        source_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get a summary of findings for an agent workflow.

        Args:
            agent_workflow_id: The workflow ID
            source_type: Optional filter by source type ('STATIC' or 'DYNAMIC').
                        If None, returns all findings.
        """
        with self._lock:
            # Build WHERE clause with optional source_type filter
            base_where = "WHERE agent_workflow_id = ?"
            params = [agent_workflow_id]
            if source_type:
                base_where += " AND source_type = ?"
                params.append(source_type)

            # Count by severity (only OPEN findings for severity breakdown)
            cursor = self.db.execute(f"""
                SELECT severity, COUNT(*) as count
                FROM findings
                {base_where} AND status = 'OPEN'
                GROUP BY severity
            """, params)  # nosec B608 - safe: base_where contains only SQL syntax with ? placeholders

            severity_counts = {row['severity']: row['count'] for row in cursor.fetchall()}

            # Count by status
            cursor = self.db.execute(f"""
                SELECT status, COUNT(*) as count
                FROM findings
                {base_where}
                GROUP BY status
            """, params)  # nosec B608 - safe: base_where contains only SQL syntax with ? placeholders

            status_counts = {row['status']: row['count'] for row in cursor.fetchall()}

            # Get total count
            cursor = self.db.execute(f"""
                SELECT COUNT(*) as total
                FROM findings
                {base_where}
            """, params)  # nosec B608 - safe: base_where contains only SQL syntax with ? placeholders

            total = cursor.fetchone()['total']

            return {
                'agent_workflow_id': agent_workflow_id,
                'total_findings': total,
                'by_severity': severity_counts,
                'by_status': status_counts,
            }

    # =========================================================================
    # Security Checks Methods (persisted security assessment results)
    # =========================================================================

    def get_completed_session_count(self, agent_id: str) -> int:
        """Get the count of completed sessions for an agent.

        Used by the scheduler to determine if analysis should run.
        """
        with self._lock:
            cursor = self.db.execute(
                "SELECT COUNT(*) as count FROM sessions WHERE agent_id = ? AND is_completed = 1",
                (agent_id,)
            )
            row = cursor.fetchone()
            return row['count'] if row else 0

    def get_agent_last_analyzed_count(self, agent_id: str) -> int:
        """Get the completed session count at time of last analysis.

        Used by the scheduler to determine if new analysis should run.
        """
        with self._lock:
            cursor = self.db.execute(
                "SELECT last_analyzed_session_count FROM agents WHERE agent_id = ?",
                (agent_id,)
            )
            row = cursor.fetchone()
            return row['last_analyzed_session_count'] if row else 0

    def update_agent_last_analyzed(self, agent_id: str, session_count: int) -> None:
        """Update the last analyzed session count for an agent.

        Called by the scheduler after analysis completes.
        """
        with self._lock:
            self.db.execute(
                "UPDATE agents SET last_analyzed_session_count = ? WHERE agent_id = ?",
                (session_count, agent_id)
            )
            self.db.commit()
            logger.debug(f"Updated last_analyzed_session_count for {agent_id}: {session_count}")

    def get_agents_needing_analysis(self, min_sessions: int = 1) -> List[str]:
        """Get agent IDs that need analysis.

        Finds agents where:
        - Completed session count >= min_sessions
        - Completed session count > last_analyzed_session_count

        Used for startup check to trigger analysis for agents missed during downtime.

        Note: min_sessions default is 1 (per Phase 4 spec). Some checks like variance
        analysis require 2+ sessions for meaningful results, but analysis can still
        run with 1 session.
        """
        with self._lock:
            cursor = self.db.execute("""
                SELECT a.agent_id
                FROM agents a
                WHERE (
                    SELECT COUNT(*) FROM sessions s
                    WHERE s.agent_id = a.agent_id AND s.is_completed = 1
                ) >= ?
                AND (
                    SELECT COUNT(*) FROM sessions s
                    WHERE s.agent_id = a.agent_id AND s.is_completed = 1
                ) > COALESCE(a.last_analyzed_session_count, 0)
            """, (min_sessions,))
            return [row[0] for row in cursor.fetchall()]

    # =========================================================================
    # Dynamic Analysis Session Tracking (Incremental Analysis)
    # =========================================================================

    def _has_last_analysis_column(self) -> bool:
        """Check if sessions table has last_analysis_session_id column."""
        cursor = self.db.execute("PRAGMA table_info(sessions)")
        columns = {row[1] for row in cursor.fetchall()}
        return 'last_analysis_session_id' in columns

    def get_unanalyzed_sessions(self, workflow_id: str) -> List[Dict[str, Any]]:
        """Get sessions not yet analyzed for a workflow.

        Returns completed sessions where last_analysis_session_id is NULL.
        Used for incremental dynamic analysis.
        """
        with self._lock:
            # Check if column exists (for backwards compatibility)
            if not self._has_last_analysis_column():
                # Fallback: return all completed sessions
                cursor = self.db.execute("""
                    SELECT * FROM sessions
                    WHERE agent_workflow_id = ?
                    AND is_completed = 1
                    ORDER BY completed_at ASC
                """, (workflow_id,))
            else:
                cursor = self.db.execute("""
                    SELECT * FROM sessions
                    WHERE agent_workflow_id = ?
                    AND is_completed = 1
                    AND last_analysis_session_id IS NULL
                    ORDER BY completed_at ASC
                """, (workflow_id,))
            rows = cursor.fetchall()
            return [self._deserialize_session_to_dict(row) for row in rows]

    def get_unanalyzed_session_count(self, workflow_id: str) -> int:
        """Efficient count of unanalyzed sessions for a workflow."""
        with self._lock:
            # Check if column exists (for backwards compatibility)
            if not self._has_last_analysis_column():
                # Fallback: return all completed sessions count
                cursor = self.db.execute("""
                    SELECT COUNT(*) as count FROM sessions
                    WHERE agent_workflow_id = ?
                    AND is_completed = 1
                """, (workflow_id,))
            else:
                cursor = self.db.execute("""
                    SELECT COUNT(*) as count FROM sessions
                    WHERE agent_workflow_id = ?
                    AND is_completed = 1
                    AND last_analysis_session_id IS NULL
                """, (workflow_id,))
            row = cursor.fetchone()
            return row['count'] if row else 0

    def get_unanalyzed_sessions_by_agent(self, workflow_id: str) -> Dict[str, List[str]]:
        """Get unanalyzed session IDs grouped by agent_id.

        Used for per-agent incremental analysis.
        """
        with self._lock:
            # Check if column exists (for backwards compatibility)
            if not self._has_last_analysis_column():
                # Fallback: return all completed sessions
                cursor = self.db.execute("""
                    SELECT agent_id, session_id FROM sessions
                    WHERE agent_workflow_id = ?
                    AND is_completed = 1
                    ORDER BY agent_id, completed_at ASC
                """, (workflow_id,))
            else:
                cursor = self.db.execute("""
                    SELECT agent_id, session_id FROM sessions
                    WHERE agent_workflow_id = ?
                    AND is_completed = 1
                    AND last_analysis_session_id IS NULL
                    ORDER BY agent_id, completed_at ASC
                """, (workflow_id,))
            result: Dict[str, List[str]] = {}
            for row in cursor.fetchall():
                agent_id = row['agent_id']
                if agent_id not in result:
                    result[agent_id] = []
                result[agent_id].append(row['session_id'])
            return result

    def mark_sessions_analyzed(
        self,
        session_ids: List[str],
        analysis_session_id: str
    ) -> int:
        """Mark sessions as analyzed after analysis completes.

        Args:
            session_ids: List of session IDs to mark
            analysis_session_id: The analysis session that analyzed these

        Returns:
            Number of sessions marked
        """
        if not session_ids:
            return 0

        with self._lock:
            placeholders = ','.join(['?' for _ in session_ids])
            self.db.execute(f"""
                UPDATE sessions
                SET last_analysis_session_id = ?
                WHERE session_id IN ({placeholders})
            """, [analysis_session_id] + session_ids)  # nosec B608 - safe: placeholders is only ?,?,? pattern
            self.db.commit()
            logger.info(f"Marked {len(session_ids)} sessions as analyzed (analysis: {analysis_session_id})")
            return len(session_ids)

    def reset_sessions_to_unanalyzed(self, workflow_id: str) -> int:
        """Reset all sessions in a workflow to unanalyzed state.

        Used for force re-running analysis on all sessions.

        Args:
            workflow_id: The workflow ID

        Returns:
            Number of sessions reset
        """
        with self._lock:
            if not self._has_last_analysis_column():
                return 0

            cursor = self.db.execute("""
                UPDATE sessions
                SET last_analysis_session_id = NULL
                WHERE agent_workflow_id = ?
                AND is_completed = 1
            """, (workflow_id,))
            count = cursor.rowcount
            self.db.commit()
            logger.info(f"Reset {count} sessions to unanalyzed state for workflow {workflow_id}")
            return count

    def get_dynamic_analysis_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get comprehensive dynamic analysis status for a workflow.

        Returns status for UI and MCP including:
        - Whether analysis can be triggered
        - Unanalyzed session counts per agent
        - Last analysis info
        - Analysis is running indicator
        """
        with self._lock:
            # Get unanalyzed sessions by agent
            unanalyzed_by_agent = self.get_unanalyzed_sessions_by_agent(workflow_id)
            total_unanalyzed = sum(len(sessions) for sessions in unanalyzed_by_agent.values())

            # Get all agents in workflow with session counts
            # Use backwards-compatible query
            has_column = self._has_last_analysis_column()
            if has_column:
                cursor = self.db.execute("""
                    SELECT a.agent_id, a.display_name, a.total_sessions,
                           (SELECT COUNT(*) FROM sessions s
                            WHERE s.agent_id = a.agent_id
                            AND s.is_completed = 1
                            AND s.last_analysis_session_id IS NULL) as unanalyzed_count
                    FROM agents a
                    WHERE a.agent_workflow_id = ?
                    ORDER BY a.last_seen DESC
                """, (workflow_id,))
            else:
                # Fallback: all completed sessions are "unanalyzed"
                cursor = self.db.execute("""
                    SELECT a.agent_id, a.display_name, a.total_sessions,
                           (SELECT COUNT(*) FROM sessions s
                            WHERE s.agent_id = a.agent_id
                            AND s.is_completed = 1) as unanalyzed_count
                    FROM agents a
                    WHERE a.agent_workflow_id = ?
                    ORDER BY a.last_seen DESC
                """, (workflow_id,))

            agents_status = []
            for row in cursor.fetchall():
                agents_status.append({
                    'agent_id': row['agent_id'],
                    'display_name': row['display_name'],
                    'total_sessions': row['total_sessions'],
                    'unanalyzed_count': row['unanalyzed_count'],
                })

            # Get last DYNAMIC analysis session
            cursor = self.db.execute("""
                SELECT * FROM analysis_sessions
                WHERE agent_workflow_id = ?
                AND session_type = 'DYNAMIC'
                ORDER BY created_at DESC
                LIMIT 1
            """, (workflow_id,))
            last_analysis_row = cursor.fetchone()

            last_analysis = None
            is_running = False
            if last_analysis_row:
                is_running = last_analysis_row['status'] == 'IN_PROGRESS'
                last_analysis = {
                    'session_id': last_analysis_row['session_id'],
                    'status': last_analysis_row['status'],
                    'created_at': last_analysis_row['created_at'],
                    'completed_at': last_analysis_row['completed_at'],
                    'sessions_analyzed': last_analysis_row['sessions_analyzed'],
                    'findings_count': last_analysis_row['findings_count'],
                }

            # Determine if we can trigger analysis
            can_trigger = total_unanalyzed > 0 and not is_running

            # Count agents with new sessions
            agents_with_new_sessions = sum(1 for a in agents_status if a['unanalyzed_count'] > 0)

            return {
                'workflow_id': workflow_id,
                'can_trigger': can_trigger,
                'is_running': is_running,
                'total_unanalyzed_sessions': total_unanalyzed,
                'agents_with_new_sessions': agents_with_new_sessions,
                'agents_status': agents_status,
                'last_analysis': last_analysis,
            }

    def _deserialize_session_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert SQLite row to dict for session (lightweight, no events)."""
        return {
            'session_id': row['session_id'],
            'agent_id': row['agent_id'],
            'agent_workflow_id': row['agent_workflow_id'],
            'created_at': row['created_at'],
            'last_activity': row['last_activity'],
            'is_active': bool(row['is_active']),
            'is_completed': bool(row['is_completed']),
            'completed_at': row['completed_at'],
            'total_events': row['total_events'],
            'message_count': row['message_count'],
            'tool_uses': row['tool_uses'],
            'errors': row['errors'],
            'total_tokens': row['total_tokens'],
            'last_analysis_session_id': row['last_analysis_session_id'] if 'last_analysis_session_id' in row.keys() else None,
        }

    def store_security_check(
        self,
        check_id: str,
        agent_id: str,
        analysis_session_id: str,
        category_id: str,
        check_type: str,
        status: str,
        title: str,
        description: Optional[str] = None,
        value: Optional[str] = None,
        evidence: Optional[Dict[str, Any]] = None,
        recommendations: Optional[List[str]] = None,
        agent_workflow_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Store a security check result."""
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()

            self.db.execute("""
                INSERT INTO security_checks (
                    check_id, agent_id, agent_workflow_id, analysis_session_id,
                    category_id, check_type, status, title, description,
                    value, evidence, recommendations, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                check_id,
                agent_id,
                agent_workflow_id,
                analysis_session_id,
                category_id,
                check_type,
                status,
                title,
                description,
                value,
                json.dumps(evidence) if evidence else None,
                json.dumps(recommendations) if recommendations else None,
                created_at,
            ))
            self.db.commit()

            return self.get_security_check(check_id)

    def get_security_check(self, check_id: str) -> Optional[Dict[str, Any]]:
        """Get a security check by ID."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM security_checks WHERE check_id = ?",
                (check_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_security_check(row)
            return None

    def get_security_checks(
        self,
        agent_id: Optional[str] = None,
        agent_workflow_id: Optional[str] = None,
        analysis_session_id: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get security checks with optional filtering."""
        with self._lock:
            query = "SELECT * FROM security_checks WHERE 1=1"
            params = []

            if agent_id:
                query += " AND agent_id = ?"
                params.append(agent_id)

            if agent_workflow_id:
                query += " AND agent_workflow_id = ?"
                params.append(agent_workflow_id)

            if analysis_session_id:
                query += " AND analysis_session_id = ?"
                params.append(analysis_session_id)

            if category_id:
                query += " AND category_id = ?"
                params.append(category_id)

            if status:
                query += " AND status = ?"
                params.append(status)

            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)
            return [self._deserialize_security_check(row) for row in cursor.fetchall()]

    def get_latest_security_checks_for_agent(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get the most recent security checks for an agent (from latest analysis session)."""
        with self._lock:
            # Find the latest analysis session for this agent
            cursor = self.db.execute("""
                SELECT DISTINCT analysis_session_id
                FROM security_checks
                WHERE agent_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (agent_id,))
            row = cursor.fetchone()
            if not row:
                return []

            analysis_session_id = row['analysis_session_id']
            return self.get_security_checks(
                agent_id=agent_id,
                analysis_session_id=analysis_session_id
            )

    def persist_security_checks(
        self,
        agent_id: str,
        security_report: Any,
        analysis_session_id: str,
        agent_workflow_id: Optional[str] = None,
    ) -> int:
        """Persist all security checks from a security report.

        Args:
            agent_id: The agent being analyzed
            security_report: SecurityReport containing assessment checks
            analysis_session_id: The analysis session ID for grouping
            agent_workflow_id: Optional workflow ID

        Returns:
            Number of checks persisted
        """
        import uuid
        count = 0

        logger.debug(f"[PERSIST] persist_security_checks called for agent {agent_id}")
        logger.debug(f"[PERSIST] security_report type: {type(security_report)}")

        # Handle both SecurityReport object and dict
        categories = getattr(security_report, 'categories', None)
        logger.debug(f"[PERSIST] categories from getattr: {type(categories)}")

        if categories is None and isinstance(security_report, dict):
            categories = security_report.get('categories', [])
            logger.debug(f"[PERSIST] categories from dict.get: {categories}")

        if not categories:
            logger.warning(f"[PERSIST] No categories found for agent {agent_id}, returning 0")
            return 0

        # Handle dict (Dict[str, AssessmentCategory]) vs list
        if isinstance(categories, dict):
            categories_list = list(categories.values())
            logger.debug(f"[PERSIST] Converting dict to list, {len(categories_list)} categories")
        else:
            categories_list = categories
            logger.debug(f"[PERSIST] Using list directly, {len(categories_list)} categories")

        def _get_attr(obj, attr, default=None):
            """Get attribute from object or dict, supporting both."""
            if isinstance(obj, dict):
                return obj.get(attr, default)
            return getattr(obj, attr, default)

        for category in categories_list:
            category_id = _get_attr(category, 'category_id', '')
            checks = _get_attr(category, 'checks', [])
            logger.debug(f"[PERSIST] Category {category_id}: {len(checks)} checks")

            for check in checks:
                check_id = _get_attr(check, 'check_id', str(uuid.uuid4()))
                check_type = _get_attr(check, 'check_type', check_id)
                status = _get_attr(check, 'status', 'passed')
                title = _get_attr(check, 'name', check_type)
                description = _get_attr(check, 'description')
                value = _get_attr(check, 'value')
                evidence = _get_attr(check, 'evidence')
                recommendations = _get_attr(check, 'recommendations')

                self.store_security_check(
                    check_id=f"{analysis_session_id}_{check_id}",
                    agent_id=agent_id,
                    analysis_session_id=analysis_session_id,
                    category_id=category_id,
                    check_type=check_type,
                    status=status,
                    title=title,
                    description=description,
                    value=str(value) if value is not None else None,
                    evidence=evidence if isinstance(evidence, dict) else None,
                    recommendations=recommendations if isinstance(recommendations, list) else None,
                    agent_workflow_id=agent_workflow_id,
                )
                count += 1

        return count

    def _deserialize_security_check(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert a security_checks row to a dictionary."""
        return {
            'check_id': row['check_id'],
            'agent_id': row['agent_id'],
            'agent_workflow_id': row['agent_workflow_id'],
            'analysis_session_id': row['analysis_session_id'],
            'category_id': row['category_id'],
            'check_type': row['check_type'],
            'status': row['status'],
            'title': row['title'],
            'description': row['description'],
            'value': row['value'],
            'evidence': json.loads(row['evidence']) if row['evidence'] else None,
            'recommendations': json.loads(row['recommendations']) if row['recommendations'] else None,
            'created_at': datetime.fromtimestamp(row['created_at'], tz=timezone.utc).isoformat(),
        }

    def get_agent_security_summary(self, agent_id: str) -> Dict[str, Any]:
        """Get a summary of security checks for an agent."""
        with self._lock:
            # Count by status
            cursor = self.db.execute("""
                SELECT status, COUNT(*) as count
                FROM security_checks
                WHERE agent_id = ?
                GROUP BY status
            """, (agent_id,))
            status_counts = {row['status']: row['count'] for row in cursor.fetchall()}

            # Count by category
            cursor = self.db.execute("""
                SELECT category_id, COUNT(*) as count
                FROM security_checks
                WHERE agent_id = ?
                GROUP BY category_id
            """, (agent_id,))
            category_counts = {row['category_id']: row['count'] for row in cursor.fetchall()}

            # Get total count
            cursor = self.db.execute("""
                SELECT COUNT(*) as total
                FROM security_checks
                WHERE agent_id = ?
            """, (agent_id,))
            total = cursor.fetchone()['total']

            return {
                'agent_id': agent_id,
                'total_checks': total,
                'by_status': status_counts,
                'by_category': category_counts,
            }

    # ==================== Behavioral Analysis Methods ====================

    def store_behavioral_analysis(
        self,
        agent_id: str,
        analysis_session_id: str,
        behavioral_result: Any,
    ) -> Dict[str, Any]:
        """Store behavioral analysis results.

        Args:
            agent_id: The agent being analyzed
            analysis_session_id: The analysis session ID
            behavioral_result: BehavioralAnalysisResult object or dict

        Returns:
            Dict with stored behavioral analysis data
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()
            record_id = f"{analysis_session_id}_behavioral"

            # Handle both object and dict
            def _get_attr(obj, attr, default=None):
                if isinstance(obj, dict):
                    return obj.get(attr, default)
                return getattr(obj, attr, default)

            # Extract fields from behavioral_result
            stability_score = _get_attr(behavioral_result, 'stability_score', 0.0)
            predictability_score = _get_attr(behavioral_result, 'predictability_score', 0.0)
            cluster_diversity = _get_attr(behavioral_result, 'cluster_diversity', 0.0)
            num_clusters = _get_attr(behavioral_result, 'num_clusters', 0)
            num_outliers = _get_attr(behavioral_result, 'num_outliers', 0)
            total_sessions = _get_attr(behavioral_result, 'total_sessions', 0)
            interpretation = _get_attr(behavioral_result, 'interpretation', '')

            # Serialize complex fields to JSON
            clusters = _get_attr(behavioral_result, 'clusters', [])
            outliers = _get_attr(behavioral_result, 'outliers', [])
            centroid_distances = _get_attr(behavioral_result, 'centroid_distances', [])

            # Convert to JSON strings (handle Pydantic models)
            def to_json(data):
                if not data:
                    return None
                if isinstance(data, list) and len(data) > 0:
                    # Check if items are Pydantic models
                    if hasattr(data[0], 'model_dump'):
                        return json.dumps([item.model_dump() for item in data])
                    elif hasattr(data[0], 'dict'):
                        return json.dumps([item.dict() for item in data])
                return json.dumps(data)

            clusters_json = to_json(clusters)
            outliers_json = to_json(outliers)
            centroid_distances_json = to_json(centroid_distances)

            self.db.execute("""
                INSERT OR REPLACE INTO behavioral_analysis (
                    id, agent_id, analysis_session_id,
                    stability_score, predictability_score, cluster_diversity,
                    num_clusters, num_outliers, total_sessions,
                    interpretation, clusters, outliers, centroid_distances,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record_id,
                agent_id,
                analysis_session_id,
                stability_score,
                predictability_score,
                cluster_diversity,
                num_clusters,
                num_outliers,
                total_sessions,
                interpretation,
                clusters_json,
                outliers_json,
                centroid_distances_json,
                created_at,
            ))
            self.db.commit()

            return {
                'id': record_id,
                'agent_id': agent_id,
                'analysis_session_id': analysis_session_id,
                'stability_score': stability_score,
                'predictability_score': predictability_score,
                'cluster_diversity': cluster_diversity,
                'num_clusters': num_clusters,
                'num_outliers': num_outliers,
                'total_sessions': total_sessions,
                'interpretation': interpretation,
                'created_at': now.isoformat(),
            }

    def get_latest_behavioral_analysis(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent behavioral analysis for an agent.

        Args:
            agent_id: The agent ID

        Returns:
            Dict with behavioral analysis data or None if not found
        """
        with self._lock:
            cursor = self.db.execute("""
                SELECT * FROM behavioral_analysis
                WHERE agent_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (agent_id,))
            row = cursor.fetchone()

            if not row:
                return None

            return self._deserialize_behavioral_analysis(row)

    def _deserialize_behavioral_analysis(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Deserialize a behavioral_analysis row."""
        return {
            'id': row['id'],
            'agent_id': row['agent_id'],
            'analysis_session_id': row['analysis_session_id'],
            'stability_score': row['stability_score'],
            'predictability_score': row['predictability_score'],
            'cluster_diversity': row['cluster_diversity'],
            'num_clusters': row['num_clusters'],
            'num_outliers': row['num_outliers'],
            'total_sessions': row['total_sessions'],
            'interpretation': row['interpretation'],
            'clusters': json.loads(row['clusters']) if row['clusters'] else [],
            'outliers': json.loads(row['outliers']) if row['outliers'] else [],
            'centroid_distances': json.loads(row['centroid_distances']) if row['centroid_distances'] else [],
            'created_at': datetime.fromtimestamp(row['created_at'], tz=timezone.utc).isoformat(),
        }

    # ==================== IDE Activity Methods ====================

    def update_workflow_last_seen(self, agent_workflow_id: str) -> None:
        """Update last_seen timestamp for a workflow.

        Called automatically by MCP router on any tool call with agent_workflow_id.
        Creates a new record if none exists (with NULL IDE metadata).

        Args:
            agent_workflow_id: The workflow ID
        """
        with self._lock:
            now = datetime.now(timezone.utc).timestamp()
            self.db.execute("""
                INSERT INTO workflow_ide_activity (agent_workflow_id, last_seen)
                VALUES (?, ?)
                ON CONFLICT(agent_workflow_id) DO UPDATE SET last_seen = excluded.last_seen
            """, (agent_workflow_id, now))
            self.db.commit()

    def upsert_ide_metadata(
        self,
        agent_workflow_id: str,
        ide_type: Optional[str] = None,
        workspace_path: Optional[str] = None,
        model: Optional[str] = None,
        host: Optional[str] = None,
        user: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Upsert IDE metadata for a workflow.

        Called by optional ide_heartbeat tool to provide rich IDE information.
        Also updates last_seen timestamp.

        Args:
            agent_workflow_id: The workflow ID (required)
            ide_type: Type of IDE (cursor, claude-code)
            workspace_path: Path to workspace
            model: AI model being used
            host: Hostname
            user: Username

        Returns:
            Dict with updated activity info
        """
        with self._lock:
            now = datetime.now(timezone.utc).timestamp()
            self.db.execute("""
                INSERT INTO workflow_ide_activity
                    (agent_workflow_id, last_seen, ide_type, workspace_path, model, host, user)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(agent_workflow_id) DO UPDATE SET
                    last_seen = excluded.last_seen,
                    ide_type = COALESCE(excluded.ide_type, ide_type),
                    workspace_path = COALESCE(excluded.workspace_path, workspace_path),
                    model = COALESCE(excluded.model, model),
                    host = COALESCE(excluded.host, host),
                    user = COALESCE(excluded.user, user)
            """, (agent_workflow_id, now, ide_type, workspace_path, model, host, user))
            self.db.commit()

            return self.get_workflow_ide_status(agent_workflow_id)

    def get_workflow_ide_status(self, agent_workflow_id: str) -> Dict[str, Any]:
        """Get simplified IDE activity status for a workflow.

        Args:
            agent_workflow_id: The workflow ID

        Returns:
            Dict with:
            - has_activity: Whether any activity has been recorded
            - last_seen: ISO timestamp of last activity
            - ide: IDE metadata dict or None if not provided
        """
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM workflow_ide_activity WHERE agent_workflow_id = ?",
                (agent_workflow_id,)
            )
            row = cursor.fetchone()

            if not row:
                return {
                    'has_activity': False,
                    'last_seen': None,
                    'ide': None,
                }

            last_seen = datetime.fromtimestamp(row['last_seen'], tz=timezone.utc)

            # Build IDE metadata if any field is set
            ide = None
            if row['ide_type']:
                ide = {
                    'ide_type': row['ide_type'],
                    'workspace_path': row['workspace_path'],
                    'model': row['model'],
                    'host': row['host'],
                    'user': row['user'],
                }

            return {
                'has_activity': True,
                'last_seen': last_seen.isoformat(),
                'ide': ide,
            }

    # ==================== Recommendation Methods ====================

    def _generate_recommendation_id(self) -> str:
        """Generate a unique recommendation ID in REC-XXX format."""
        # Get the current max recommendation number
        cursor = self.db.execute(
            "SELECT recommendation_id FROM recommendations ORDER BY created_at DESC LIMIT 1"
        )
        row = cursor.fetchone()
        if row:
            # Extract number from existing ID (e.g., REC-001 -> 1)
            try:
                current_num = int(row['recommendation_id'].replace('REC-', ''))
                next_num = current_num + 1
            except (ValueError, AttributeError):
                next_num = 1
        else:
            next_num = 1
        return f"REC-{next_num:03d}"

    def create_recommendation(
        self,
        workflow_id: str,
        source_type: str,
        source_finding_id: str,
        category: str,
        severity: str,
        title: str,
        description: Optional[str] = None,
        impact: Optional[str] = None,
        fix_hints: Optional[str] = None,
        fix_complexity: Optional[str] = None,
        requires_architectural_change: bool = False,
        file_path: Optional[str] = None,
        line_start: Optional[int] = None,
        line_end: Optional[int] = None,
        code_snippet: Optional[str] = None,
        related_files: Optional[List[str]] = None,
        cvss_score: Optional[float] = None,
        owasp_llm: Optional[str] = None,
        cwe: Optional[str] = None,
        soc2_controls: Optional[List[str]] = None,
        recommendation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new recommendation linked to a finding.

        Args:
            workflow_id: The agent workflow ID
            source_type: STATIC or DYNAMIC
            source_finding_id: The finding ID this recommendation addresses
            category: Security category (PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY, BEHAVIOR)
            severity: CRITICAL, HIGH, MEDIUM, LOW
            title: Recommendation title
            description: Detailed description
            impact: Business impact description
            fix_hints: Hints on how to fix
            fix_complexity: LOW, MEDIUM, HIGH
            requires_architectural_change: Whether fix needs architectural changes
            file_path: Path to affected file
            line_start: Starting line number
            line_end: Ending line number
            code_snippet: Relevant code snippet
            related_files: List of related file paths
            cvss_score: CVSS score (0-10)
            owasp_llm: OWASP LLM control ID (e.g., LLM01)
            cwe: CWE ID
            soc2_controls: List of SOC2 control IDs
            recommendation_id: Optional custom ID (auto-generated if not provided)

        Returns:
            Dict with recommendation data
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()
            updated_at = created_at

            # Generate ID if not provided
            if not recommendation_id:
                recommendation_id = self._generate_recommendation_id()

            # Serialize JSON fields
            related_files_json = json.dumps(related_files) if related_files else None
            soc2_controls_json = json.dumps(soc2_controls) if soc2_controls else None

            self.db.execute("""
                INSERT INTO recommendations (
                    recommendation_id, workflow_id, source_type, source_finding_id,
                    category, severity, cvss_score, owasp_llm, cwe, soc2_controls,
                    title, description, impact, fix_hints, fix_complexity,
                    requires_architectural_change, file_path, line_start, line_end,
                    code_snippet, related_files, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                recommendation_id, workflow_id, source_type, source_finding_id,
                category, severity, cvss_score, owasp_llm, cwe, soc2_controls_json,
                title, description, impact, fix_hints, fix_complexity,
                1 if requires_architectural_change else 0, file_path, line_start, line_end,
                code_snippet, related_files_json, 'PENDING', created_at, updated_at,
            ))

            # Update the finding with the recommendation_id
            self.db.execute("""
                UPDATE findings SET recommendation_id = ?, updated_at = ?
                WHERE finding_id = ?
            """, (recommendation_id, updated_at, source_finding_id))

            self.db.commit()

            # Log audit event
            self.log_audit_event(
                entity_type='recommendation',
                entity_id=recommendation_id,
                action='CREATED',
                new_value='PENDING',
                performed_by='system',
            )

            return self.get_recommendation(recommendation_id)

    def get_recommendation(self, recommendation_id: str) -> Optional[Dict[str, Any]]:
        """Get a recommendation by ID."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM recommendations WHERE recommendation_id = ?",
                (recommendation_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_recommendation(row)
            return None

    def get_recommendations(
        self,
        workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        blocking_only: bool = False,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get recommendations with optional filtering.

        Args:
            workflow_id: Filter by workflow ID
            status: Filter by status (PENDING, FIXING, FIXED, VERIFIED, DISMISSED, IGNORED)
            severity: Filter by severity
            category: Filter by category
            blocking_only: Only return blocking items (CRITICAL/HIGH that are not fixed)
            limit: Maximum number to return

        Returns:
            List of recommendation dicts
        """
        with self._lock:
            query = "SELECT * FROM recommendations WHERE 1=1"
            params = []

            if workflow_id:
                query += " AND workflow_id = ?"
                params.append(workflow_id)

            if status:
                query += " AND status = ?"
                params.append(status.upper())

            if severity:
                query += " AND severity = ?"
                params.append(severity.upper())

            if category:
                query += " AND category = ?"
                params.append(category.upper())

            if blocking_only:
                query += " AND severity IN ('CRITICAL', 'HIGH') AND status NOT IN ('FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED', 'RESOLVED', 'SUPERSEDED')"

            query += " ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)
            return [self._deserialize_recommendation(row) for row in cursor.fetchall()]

    def start_fix(self, recommendation_id: str, fixed_by: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Set recommendation status to FIXING.

        Args:
            recommendation_id: The recommendation ID
            fixed_by: Who is working on the fix

        Returns:
            Updated recommendation or None if not found
        """
        with self._lock:
            # Get current state
            rec = self.get_recommendation(recommendation_id)
            if not rec:
                return None

            previous_status = rec['status']
            now = datetime.now(timezone.utc)

            self.db.execute("""
                UPDATE recommendations
                SET status = ?, fixed_by = ?, updated_at = ?
                WHERE recommendation_id = ?
            """, ('FIXING', fixed_by, now.timestamp(), recommendation_id))
            self.db.commit()

            # Log audit event
            self.log_audit_event(
                entity_type='recommendation',
                entity_id=recommendation_id,
                action='STATUS_CHANGED',
                previous_value=previous_status,
                new_value='FIXING',
                performed_by=fixed_by,
            )

            return self.get_recommendation(recommendation_id)

    def complete_fix(
        self,
        recommendation_id: str,
        fix_notes: Optional[str] = None,
        files_modified: Optional[List[str]] = None,
        fix_commit: Optional[str] = None,
        fix_method: Optional[str] = None,
        fixed_by: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Mark a recommendation as FIXED.

        Args:
            recommendation_id: The recommendation ID
            fix_notes: Notes about the fix
            files_modified: List of modified file paths
            fix_commit: Git commit hash
            fix_method: Method used to fix (MANUAL, AUTOFIX, etc.)
            fixed_by: Who performed the fix

        Returns:
            Updated recommendation or None if not found
        """
        with self._lock:
            rec = self.get_recommendation(recommendation_id)
            if not rec:
                return None

            previous_status = rec['status']
            now = datetime.now(timezone.utc)
            files_modified_json = json.dumps(files_modified) if files_modified else None

            self.db.execute("""
                UPDATE recommendations
                SET status = ?, fixed_at = ?, fix_notes = ?, files_modified = ?,
                    fix_commit = ?, fix_method = ?, fixed_by = ?, updated_at = ?
                WHERE recommendation_id = ?
            """, (
                'FIXED', now.timestamp(), fix_notes, files_modified_json,
                fix_commit, fix_method, fixed_by, now.timestamp(), recommendation_id,
            ))

            # Also update the underlying finding status to FIXED
            source_finding_id = rec.get('source_finding_id')
            if source_finding_id:
                self.db.execute("""
                    UPDATE findings SET status = 'FIXED', updated_at = ?
                    WHERE finding_id = ?
                """, (now.timestamp(), source_finding_id))

            self.db.commit()

            # Log audit event
            self.log_audit_event(
                entity_type='recommendation',
                entity_id=recommendation_id,
                action='STATUS_CHANGED',
                previous_value=previous_status,
                new_value='FIXED',
                reason=fix_notes,
                performed_by=fixed_by,
                metadata={'files_modified': files_modified, 'fix_commit': fix_commit},
            )

            return self.get_recommendation(recommendation_id)

    def verify_fix(
        self,
        recommendation_id: str,
        verification_result: str,
        success: bool,
        verified_by: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Verify a fix and set status to VERIFIED or reopen if failed.

        Args:
            recommendation_id: The recommendation ID
            verification_result: Description of verification result
            success: Whether verification passed
            verified_by: Who performed verification

        Returns:
            Updated recommendation or None if not found
        """
        with self._lock:
            rec = self.get_recommendation(recommendation_id)
            if not rec:
                return None

            previous_status = rec['status']
            now = datetime.now(timezone.utc)
            new_status = 'VERIFIED' if success else 'PENDING'  # Reopen if failed

            self.db.execute("""
                UPDATE recommendations
                SET status = ?, verified_at = ?, verification_result = ?,
                    verified_by = ?, updated_at = ?
                WHERE recommendation_id = ?
            """, (
                new_status, now.timestamp(), verification_result,
                verified_by, now.timestamp(), recommendation_id,
            ))
            self.db.commit()

            # Log audit event
            action = 'VERIFIED' if success else 'VERIFICATION_FAILED'
            self.log_audit_event(
                entity_type='recommendation',
                entity_id=recommendation_id,
                action=action,
                previous_value=previous_status,
                new_value=new_status,
                reason=verification_result,
                performed_by=verified_by,
            )

            return self.get_recommendation(recommendation_id)

    def dismiss_recommendation(
        self,
        recommendation_id: str,
        reason: str,
        dismiss_type: str = 'DISMISSED',
        dismissed_by: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Dismiss or ignore a recommendation.

        Args:
            recommendation_id: The recommendation ID
            reason: Reason for dismissal
            dismiss_type: DISMISSED (temporary) or IGNORED (permanent)
            dismissed_by: Who dismissed it

        Returns:
            Updated recommendation or None if not found
        """
        with self._lock:
            rec = self.get_recommendation(recommendation_id)
            if not rec:
                return None

            if dismiss_type not in ('DISMISSED', 'IGNORED'):
                dismiss_type = 'DISMISSED'

            previous_status = rec['status']
            now = datetime.now(timezone.utc)

            self.db.execute("""
                UPDATE recommendations
                SET status = ?, dismissed_reason = ?, dismiss_type = ?,
                    dismissed_by = ?, dismissed_at = ?, updated_at = ?
                WHERE recommendation_id = ?
            """, (
                dismiss_type, reason, dismiss_type,
                dismissed_by, now.timestamp(), now.timestamp(), recommendation_id,
            ))

            # Update the underlying finding status to match
            source_finding_id = rec.get('source_finding_id')
            if source_finding_id:
                finding_status = 'IGNORED' if dismiss_type == 'IGNORED' else 'DISMISSED'
            self.db.execute("""
                UPDATE findings SET status = ?, updated_at = ?
                    WHERE finding_id = ?
                """, (finding_status, now.timestamp(), source_finding_id))

            self.db.commit()

            # Log audit event
            self.log_audit_event(
                entity_type='recommendation',
                entity_id=recommendation_id,
                action='DISMISSED',
                previous_value=previous_status,
                new_value=dismiss_type,
                reason=reason,
                performed_by=dismissed_by,
            )

            return self.get_recommendation(recommendation_id)

    def auto_resolve_stale_findings(
        self,
        workflow_id: str,
        analysis_session_id: str,
        current_check_ids: List[str],
    ) -> Dict[str, Any]:
        """Auto-resolve findings/recommendations not detected in the current scan.

        When a new dynamic analysis runs and doesn't find issues that were
        previously detected, those are automatically resolved since the
        underlying issue appears to be fixed.

        Args:
            workflow_id: The workflow being analyzed
            analysis_session_id: Current analysis session ID
            current_check_ids: List of check_ids found in current analysis

        Returns:
            Dict with counts of auto-resolved items
        """
        with self._lock:
            now = datetime.now(timezone.utc)

            # Find open recommendations from DYNAMIC source that are not in current_check_ids
            if current_check_ids:
                placeholders = ','.join(['?' for _ in current_check_ids])

                # Get stale recommendations (those not in the current findings)
                cursor = self.db.execute(f"""
                    SELECT r.recommendation_id, r.source_finding_id, r.title, f.check_id
                    FROM recommendations r
                    JOIN findings f ON r.source_finding_id = f.finding_id
                    WHERE r.workflow_id = ?
                      AND r.source_type = 'DYNAMIC'
                      AND r.status IN ('PENDING', 'FIXING')
                      AND (f.check_id IS NULL OR f.check_id NOT IN ({placeholders}))
                """, [workflow_id] + current_check_ids)  # nosec B608 - safe: placeholders is only ?,?,? pattern
            else:
                # No current checks means all dynamic findings are resolved
                cursor = self.db.execute("""
                    SELECT r.recommendation_id, r.source_finding_id, r.title, f.check_id
                    FROM recommendations r
                    JOIN findings f ON r.source_finding_id = f.finding_id
                    WHERE r.workflow_id = ?
                      AND r.source_type = 'DYNAMIC'
                      AND r.status IN ('PENDING', 'FIXING')
                """, (workflow_id,))

            stale_recs = cursor.fetchall()

            resolved_count = 0
            resolved_items = []

            for row in stale_recs:
                rec_id = row['recommendation_id']
                finding_id = row['source_finding_id']
                title = row['title']

                # Update recommendation status to RESOLVED
                self.db.execute("""
                    UPDATE recommendations
                    SET status = 'RESOLVED',
                        fix_notes = ?,
                        fix_method = 'AUTO_RESOLVED',
                        fixed_at = ?,
                        updated_at = ?
                    WHERE recommendation_id = ?
                """, (
                    f"Auto-resolved: Not detected in analysis {analysis_session_id}",
                    now.timestamp(),
                    now.timestamp(),
                    rec_id,
                ))

                # Update the underlying finding
                if finding_id:
                    self.db.execute("""
                        UPDATE findings
                        SET status = 'RESOLVED',
                            updated_at = ?
                        WHERE finding_id = ?
                    """, (now.timestamp(), finding_id))

                # Log audit event
                self.log_audit_event(
                    entity_type='recommendation',
                    entity_id=rec_id,
                    action='AUTO_RESOLVED',
                    previous_value='PENDING',
                    new_value='RESOLVED',
                    reason=f'Not detected in analysis {analysis_session_id}',
                    performed_by='system',
                )

                resolved_items.append({'id': rec_id, 'title': title})
                resolved_count += 1

            self.db.commit()

            if resolved_count > 0:
                logger.info(f"Auto-resolved {resolved_count} stale dynamic findings for {workflow_id}")

            return {
                'workflow_id': workflow_id,
                'analysis_session_id': analysis_session_id,
                'resolved_count': resolved_count,
                'resolved_items': resolved_items,
            }

    def resolve_all_dynamic_findings(
        self,
        workflow_id: str,
        analysis_session_id: str,
    ) -> Dict[str, Any]:
        """Resolve ALL open dynamic findings before a new scan.

        This ensures each new scan starts fresh - only the current scan's
        findings will be active. Previous findings are marked as superseded.

        Args:
            workflow_id: The workflow being analyzed
            analysis_session_id: New analysis session ID (for audit trail)

        Returns:
            Dict with counts of resolved items
        """
        with self._lock:
            now = datetime.now(timezone.utc)

            # Find all OPEN dynamic recommendations for this workflow
            cursor = self.db.execute("""
                SELECT r.recommendation_id, r.source_finding_id, r.title
                FROM recommendations r
                WHERE r.workflow_id = ?
                  AND r.source_type = 'DYNAMIC'
                  AND r.status IN ('PENDING', 'FIXING')
            """, (workflow_id,))

            open_recs = cursor.fetchall()

            resolved_count = 0

            for row in open_recs:
                rec_id = row['recommendation_id']
                finding_id = row['source_finding_id']

                # Mark as superseded (replaced by new scan)
                self.db.execute("""
                    UPDATE recommendations
                    SET status = 'SUPERSEDED',
                        fix_notes = ?,
                        fix_method = 'SUPERSEDED',
                        fixed_at = ?,
                        updated_at = ?
                    WHERE recommendation_id = ?
                """, (
                    f"Superseded by new analysis {analysis_session_id}",
                    now.timestamp(),
                    now.timestamp(),
                    rec_id,
                ))

                # Update the underlying finding
                if finding_id:
                    self.db.execute("""
                        UPDATE findings
                        SET status = 'SUPERSEDED',
                            updated_at = ?
                        WHERE finding_id = ?
                    """, (now.timestamp(), finding_id))

                resolved_count += 1

            self.db.commit()

            if resolved_count > 0:
                logger.info(f"Superseded {resolved_count} previous dynamic findings for {workflow_id} (new scan: {analysis_session_id})")

            return {
                'workflow_id': workflow_id,
                'superseded_count': resolved_count,
            }

    def get_production_readiness(self, workflow_id: str) -> Dict[str, Any]:
        """Single source of truth for production readiness status.

        Combines analysis session status with recommendation counts to provide
        a unified view of static/dynamic analysis progress and gate status.

        Args:
            workflow_id: The workflow ID

        Returns:
            Dict with production readiness information including:
            - static_analysis: status and critical count
            - dynamic_analysis: status and critical count
            - gate: blocking status
        """
        with self._lock:
            # Get analysis sessions for this workflow
            cursor = self.db.execute("""
                SELECT session_id, session_type, status, created_at
                FROM analysis_sessions
                WHERE agent_workflow_id = ?
                ORDER BY created_at DESC
            """, (workflow_id,))
            sessions = cursor.fetchall()

            # Determine static analysis status
            static_sessions = [s for s in sessions if s['session_type'] == 'STATIC']
            static_in_progress = any(s['status'] == 'IN_PROGRESS' for s in static_sessions)
            static_completed = any(s['status'] == 'COMPLETED' for s in static_sessions)
            latest_static_session_id = static_sessions[0]['session_id'] if static_sessions else None

            if static_in_progress:
                static_status = 'running'
            elif static_completed:
                static_status = 'completed'
            else:
                static_status = 'pending'

            # Determine dynamic analysis status
            dynamic_sessions = [s for s in sessions if s['session_type'] == 'DYNAMIC']
            dynamic_in_progress = any(s['status'] == 'IN_PROGRESS' for s in dynamic_sessions)
            dynamic_completed = any(s['status'] == 'COMPLETED' for s in dynamic_sessions)
            latest_dynamic_session_id = dynamic_sessions[0]['session_id'] if dynamic_sessions else None

            if dynamic_in_progress:
                dynamic_status = 'running'
            elif dynamic_completed:
                dynamic_status = 'completed'
            else:
                dynamic_status = 'pending'

            # Count blocking recommendations by source_type
            # Only count CRITICAL/HIGH that are not in terminal states
            terminal_states = ('FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED', 'RESOLVED', 'SUPERSEDED')

            cursor = self.db.execute("""
                SELECT source_type, COUNT(*) as count
                FROM recommendations
                WHERE workflow_id = ?
                  AND severity IN ('CRITICAL', 'HIGH')
                  AND status NOT IN (?, ?, ?, ?, ?, ?)
                GROUP BY source_type
            """, (workflow_id, *terminal_states))

            blocking_by_source = {row['source_type']: row['count'] for row in cursor.fetchall()}
            static_critical_count = blocking_by_source.get('STATIC', 0)
            dynamic_critical_count = blocking_by_source.get('DYNAMIC', 0)
            total_blocking = static_critical_count + dynamic_critical_count

            return {
                'workflow_id': workflow_id,
                'static_analysis': {
                    'status': static_status,
                    'critical_count': static_critical_count,
                    'session_id': latest_static_session_id,
                },
                'dynamic_analysis': {
                    'status': dynamic_status,
                    'critical_count': dynamic_critical_count,
                    'session_id': latest_dynamic_session_id,
                },
                'gate': {
                    'is_blocked': total_blocking > 0,
                    'blocking_count': total_blocking,
                    'state': 'BLOCKED' if total_blocking > 0 else 'OPEN',
                },
            }

    def _deserialize_recommendation(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Deserialize a recommendations row."""
        return {
            'recommendation_id': row['recommendation_id'],
            'workflow_id': row['workflow_id'],
            'source_type': row['source_type'],
            'source_finding_id': row['source_finding_id'],
            'category': row['category'],
            'severity': row['severity'],
            'cvss_score': row['cvss_score'],
            'owasp_llm': row['owasp_llm'],
            'cwe': row['cwe'],
            'soc2_controls': json.loads(row['soc2_controls']) if row['soc2_controls'] else None,
            'title': row['title'],
            'description': row['description'],
            'impact': row['impact'],
            'fix_hints': row['fix_hints'],
            'fix_complexity': row['fix_complexity'],
            'requires_architectural_change': bool(row['requires_architectural_change']),
            'file_path': row['file_path'],
            'line_start': row['line_start'],
            'line_end': row['line_end'],
            'code_snippet': row['code_snippet'],
            'related_files': json.loads(row['related_files']) if row['related_files'] else None,
            'status': row['status'],
            'fixed_by': row['fixed_by'],
            'fixed_at': datetime.fromtimestamp(row['fixed_at'], tz=timezone.utc).isoformat() if row['fixed_at'] else None,
            'fix_method': row['fix_method'],
            'fix_commit': row['fix_commit'],
            'fix_notes': row['fix_notes'],
            'files_modified': json.loads(row['files_modified']) if row['files_modified'] else None,
            'verified_at': datetime.fromtimestamp(row['verified_at'], tz=timezone.utc).isoformat() if row['verified_at'] else None,
            'verified_by': row['verified_by'],
            'verification_result': row['verification_result'],
            'dismissed_reason': row['dismissed_reason'],
            'dismissed_by': row['dismissed_by'],
            'dismissed_at': datetime.fromtimestamp(row['dismissed_at'], tz=timezone.utc).isoformat() if row['dismissed_at'] else None,
            'dismiss_type': row['dismiss_type'],
            'correlation_state': row['correlation_state'],
            'correlation_evidence': row['correlation_evidence'],
            'fingerprint': row['fingerprint'],
            'created_at': datetime.fromtimestamp(row['created_at'], tz=timezone.utc).isoformat(),
            'updated_at': datetime.fromtimestamp(row['updated_at'], tz=timezone.utc).isoformat(),
        }

    # ==================== Audit Log Methods ====================

    def log_audit_event(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        previous_value: Optional[str] = None,
        new_value: Optional[str] = None,
        reason: Optional[str] = None,
        performed_by: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Log an audit event for any entity.

        Args:
            entity_type: Type of entity (recommendation, finding, etc.)
            entity_id: ID of the entity
            action: Action performed (CREATED, STATUS_CHANGED, DISMISSED, etc.)
            previous_value: Previous value (for status changes)
            new_value: New value
            reason: Reason for the action
            performed_by: Who performed the action
            metadata: Additional metadata as JSON

        Returns:
            Dict with audit log entry
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            metadata_json = json.dumps(metadata) if metadata else None

            cursor = self.db.execute("""
                INSERT INTO audit_log (
                    entity_type, entity_id, action, previous_value, new_value,
                    reason, performed_by, performed_at, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                entity_type, entity_id, action, previous_value, new_value,
                reason, performed_by, now.timestamp(), metadata_json,
            ))
            self.db.commit()

            return {
                'id': cursor.lastrowid,
                'entity_type': entity_type,
                'entity_id': entity_id,
                'action': action,
                'previous_value': previous_value,
                'new_value': new_value,
                'reason': reason,
                'performed_by': performed_by,
                'performed_at': now.isoformat(),
                'metadata': metadata,
            }

    def get_audit_log(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get audit log entries with optional filtering.

        Args:
            entity_type: Filter by entity type
            entity_id: Filter by entity ID
            action: Filter by action
            limit: Maximum entries to return

        Returns:
            List of audit log entries
        """
        with self._lock:
            query = "SELECT * FROM audit_log WHERE 1=1"
            params = []

            if entity_type:
                query += " AND entity_type = ?"
                params.append(entity_type)

            if entity_id:
                query += " AND entity_id = ?"
                params.append(entity_id)

            if action:
                query += " AND action = ?"
                params.append(action)

            query += " ORDER BY performed_at DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)

            return [
                {
                    'id': row['id'],
                    'entity_type': row['entity_type'],
                    'entity_id': row['entity_id'],
                    'action': row['action'],
                    'previous_value': row['previous_value'],
                    'new_value': row['new_value'],
                    'reason': row['reason'],
                    'performed_by': row['performed_by'],
                    'performed_at': datetime.fromtimestamp(row['performed_at'], tz=timezone.utc).isoformat(),
                    'metadata': json.loads(row['metadata']) if row['metadata'] else None,
                }
                for row in cursor.fetchall()
            ]

    # ==================== Compliance Report Methods ====================

    def generate_compliance_report(self, workflow_id: str) -> Dict[str, Any]:
        """Generate a compliance report for CISO/auditors.

        Compiles all security findings, recommendations, audit log, and compliance
        mappings into a comprehensive report structure.

        Args:
            workflow_id: The workflow ID

        Returns:
            Dict containing the full compliance report data
        """
        now = datetime.now(timezone.utc)

        # Get all required data
        findings = self.get_findings(agent_workflow_id=workflow_id, limit=1000)
        recommendations = self.get_recommendations(workflow_id=workflow_id, limit=1000)
        audit_log = self.get_audit_log(limit=50)  # Last 50 entries
        readiness = self.get_production_readiness(workflow_id)
        # Build backwards-compatible gate_status from new format
        static_critical = readiness['static_analysis']['critical_count']
        dynamic_critical = readiness['dynamic_analysis']['critical_count']
        gate_status = {
            "gate_state": readiness['gate']['state'],
            "is_blocked": readiness['gate']['is_blocked'],
            "blocking_count": readiness['gate']['blocking_count'],
            "blocking_critical": static_critical + dynamic_critical,
            "blocking_high": 0,  # Not tracked separately in new format
        }

        # Group findings by OWASP LLM category
        by_owasp = self._group_findings_by_owasp(findings)

        # Group findings by SOC2 controls
        by_soc2 = self._group_findings_by_soc2(findings)

        # Group findings by category (the 7 security checks)
        by_category = self._group_findings_by_category(findings)

        # Calculate statistics
        open_findings = [f for f in findings if f.get('status') == 'OPEN']
        fixed_findings = [f for f in findings if f.get('status') == 'FIXED']
        dismissed_findings = [f for f in findings if f.get('status') in ['DISMISSED', 'IGNORED']]

        # Calculate risk score
        risk_score = self._calculate_risk_score(open_findings)
        risk_breakdown = self._calculate_risk_breakdown(open_findings)

        # Calculate business impact
        business_impact = self._calculate_business_impact(findings, recommendations)

        # Get analysis sessions for scan info
        sessions = self.get_analysis_sessions(agent_workflow_id=workflow_id, limit=10)
        static_sessions = [s for s in sessions if s.get('session_type') == 'STATIC']
        dynamic_sessions = [s for s in sessions if s.get('session_type') == 'DYNAMIC']

        # Get dynamic analysis stats
        dynamic_stats = self._get_dynamic_stats_for_report(workflow_id)

        return {
            "report_type": "compliance",
            "workflow_id": workflow_id,
            "generated_at": now.isoformat(),

            "executive_summary": {
                "gate_status": gate_status["gate_state"],
                "is_blocked": gate_status["is_blocked"],
                "risk_score": risk_score,
                "risk_breakdown": risk_breakdown,
                "decision": "NO-GO" if gate_status["is_blocked"] else "GO",
                "decision_label": "Attention Required" if gate_status["is_blocked"] else "Production Ready",
                "is_advisory": True,
                "advisory_notice": "Advisory only - does not block deployments. This is a pre-production readiness assessment.",
                "decision_message": self._get_decision_message(gate_status),
                "total_findings": len(findings),
                "open_findings": len(open_findings),
                "fixed_findings": len(fixed_findings),
                "dismissed_findings": len(dismissed_findings),
                "blocking_count": gate_status["blocking_count"],
                "blocking_critical": gate_status["blocking_critical"],
                "blocking_high": gate_status["blocking_high"],
            },

            "business_impact": business_impact,

            "owasp_llm_coverage": {
                "LLM01": self._owasp_status("LLM01", by_owasp.get("LLM01", [])),
                "LLM02": self._owasp_status("LLM02", by_owasp.get("LLM02", [])),
                "LLM03": {"status": "N/A", "name": "Training Data Poisoning", "message": "Not evaluated (out of scope)", "findings": []},
                "LLM04": {"status": "N/A", "name": "Model Denial of Service", "message": "Not evaluated (out of scope)", "findings": []},
                "LLM05": self._owasp_status("LLM05", by_owasp.get("LLM05", [])),
                "LLM06": self._owasp_status("LLM06", by_owasp.get("LLM06", [])),
                "LLM07": self._owasp_status("LLM07", by_owasp.get("LLM07", [])),
                "LLM08": self._owasp_status("LLM08", by_owasp.get("LLM08", [])),
                "LLM09": self._owasp_status("LLM09", by_owasp.get("LLM09", [])),
                "LLM10": {"status": "N/A", "name": "Model Theft", "message": "Not evaluated (out of scope)", "findings": []},
            },

            "soc2_compliance": {
                "CC6.1": self._soc2_status("CC6.1", by_soc2.get("CC6.1", []), "Logical Access"),
                "CC6.5": self._soc2_status("CC6.5", by_soc2.get("CC6.5", []), "Data Classification"),
                "CC6.6": self._soc2_status("CC6.6", by_soc2.get("CC6.6", []), "System Boundaries"),
                "CC6.7": self._soc2_status("CC6.7", by_soc2.get("CC6.7", []), "External Access"),
                "CC7.2": self._soc2_status("CC7.2", by_soc2.get("CC7.2", []), "System Monitoring"),
                "PI1.1": self._soc2_status("PI1.1", by_soc2.get("PI1.1", []), "Privacy Controls"),
            },

            "security_checks": {
                "PROMPT": self._category_status("PROMPT", by_category.get("PROMPT", []), "Prompt Security"),
                "OUTPUT": self._category_status("OUTPUT", by_category.get("OUTPUT", []), "Output Security"),
                "TOOL": self._category_status("TOOL", by_category.get("TOOL", []), "Tool Security"),
                "DATA": self._category_status("DATA", by_category.get("DATA", []), "Data & Secrets"),
                "MEMORY": self._category_status("MEMORY", by_category.get("MEMORY", []), "Memory & Context"),
                "SUPPLY": self._category_status("SUPPLY", by_category.get("SUPPLY", []), "Supply Chain"),
                "BEHAVIOR": self._category_status("BEHAVIOR", by_category.get("BEHAVIOR", []), "Behavioral Boundaries"),
            },

            "static_analysis": {
                "sessions_count": len(static_sessions),
                "last_scan": static_sessions[0] if static_sessions else None,
                "findings_count": len([f for f in findings if f.get('source_type') == 'STATIC']),
            },

            "dynamic_analysis": {
                "sessions_count": len(dynamic_sessions),
                "last_analysis": dynamic_sessions[0] if dynamic_sessions else None,
                **dynamic_stats,
            },

            "remediation_summary": {
                "total_recommendations": len(recommendations),
                "pending": len([r for r in recommendations if r.get('status') == 'PENDING']),
                "fixing": len([r for r in recommendations if r.get('status') == 'FIXING']),
                "fixed": len([r for r in recommendations if r.get('status') == 'FIXED']),
                "verified": len([r for r in recommendations if r.get('status') == 'VERIFIED']),
                "dismissed": len([r for r in recommendations if r.get('status') in ['DISMISSED', 'IGNORED']]),
                "resolved": len([r for r in recommendations if r.get('status') in ['RESOLVED', 'SUPERSEDED']]),
            },

            "audit_trail": audit_log,

            "blocking_items": self._get_blocking_items(recommendations),

            "findings_detail": findings[:50],  # Top 50 findings
            "recommendations_detail": recommendations[:50],  # Top 50 recommendations
        }

    def _group_findings_by_owasp(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings by OWASP LLM mapping."""
        result: Dict[str, List[Dict[str, Any]]] = {}
        for f in findings:
            owasp_mapping = f.get('owasp_mapping')
            if owasp_mapping:
                mappings = owasp_mapping if isinstance(owasp_mapping, list) else [owasp_mapping]
                for owasp in mappings:
                    if owasp not in result:
                        result[owasp] = []
                    result[owasp].append(f)
        return result

    def _group_findings_by_soc2(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings by SOC2 controls."""
        result: Dict[str, List[Dict[str, Any]]] = {}
        for f in findings:
            soc2_controls = f.get('soc2_controls')
            if soc2_controls:
                controls = soc2_controls if isinstance(soc2_controls, list) else [soc2_controls]
                for ctrl in controls:
                    if ctrl not in result:
                        result[ctrl] = []
                    result[ctrl].append(f)
        return result

    def _group_findings_by_category(self, findings: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group findings by security category."""
        result: Dict[str, List[Dict[str, Any]]] = {}
        for f in findings:
            category = f.get('category', 'PROMPT')
            if category not in result:
                result[category] = []
            result[category].append(f)
        return result

    def _calculate_risk_score(self, open_findings: List[Dict[str, Any]]) -> int:
        """Calculate risk score from open findings (0-100)."""
        if not open_findings:
            return 0

        # Weight by severity
        severity_weights = {'CRITICAL': 25, 'HIGH': 15, 'MEDIUM': 5, 'LOW': 2}
        total_weight = sum(severity_weights.get(f.get('severity', 'LOW'), 1) for f in open_findings)

        # Cap at 100
        return min(100, total_weight)

    def _calculate_risk_breakdown(self, open_findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate detailed risk score breakdown for reports."""
        severity_weights = {'CRITICAL': 25, 'HIGH': 15, 'MEDIUM': 5, 'LOW': 2}

        by_severity = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        for f in open_findings:
            sev = f.get('severity', 'LOW')
            by_severity[sev] = by_severity.get(sev, 0) + 1

        return {
            "formula": "CRITICAL×25 + HIGH×15 + MEDIUM×5 + LOW×2 (capped at 100)",
            "breakdown": [
                {"severity": "CRITICAL", "count": by_severity['CRITICAL'], "weight": 25, "subtotal": by_severity['CRITICAL'] * 25},
                {"severity": "HIGH", "count": by_severity['HIGH'], "weight": 15, "subtotal": by_severity['HIGH'] * 15},
                {"severity": "MEDIUM", "count": by_severity['MEDIUM'], "weight": 5, "subtotal": by_severity['MEDIUM'] * 5},
                {"severity": "LOW", "count": by_severity['LOW'], "weight": 2, "subtotal": by_severity['LOW'] * 2},
            ],
            "raw_total": sum(severity_weights.get(f.get('severity', 'LOW'), 1) for f in open_findings),
            "final_score": min(100, sum(severity_weights.get(f.get('severity', 'LOW'), 1) for f in open_findings)),
        }

    def _calculate_business_impact(self, findings: List[Dict[str, Any]], recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess business impact for CISO/executive summary."""
        open_findings = [f for f in findings if f.get('status') == 'OPEN']

        # Helper to compare risk levels
        def higher_risk(current: str, new: str) -> str:
            order = {"NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3}
            return new if order.get(new, 0) > order.get(current, 0) else current

        # Categorize by business impact type
        impacts = {
            "remote_code_execution": {
                "risk_level": "NONE",
                "description": "No RCE risk detected",
                "affected_components": [],
            },
            "data_exfiltration": {
                "risk_level": "NONE",
                "description": "No data exfiltration risk detected",
                "affected_components": [],
            },
            "privilege_escalation": {
                "risk_level": "NONE",
                "description": "No privilege escalation risk detected",
                "affected_components": [],
            },
            "supply_chain": {
                "risk_level": "NONE",
                "description": "No supply chain risk detected",
                "affected_components": [],
            },
            "compliance_violation": {
                "risk_level": "NONE",
                "description": "No compliance violations detected",
                "affected_components": [],
            },
        }

        for f in open_findings:
            category = f.get('category', '')
            finding_type = f.get('finding_type', '')
            severity = f.get('severity', 'LOW')
            title = f.get('title', '')
            file_path = f.get('file_path', '')
            owasp_str = str(f.get('owasp_mapping', []))
            title_lower = title.lower()

            # Remote Code Execution risk (TOOL issues, excessive agency)
            if category == 'TOOL' or 'LLM08' in owasp_str or 'agency' in title_lower or 'execution' in title_lower:
                if severity in ['CRITICAL', 'HIGH']:
                    new_level = "HIGH" if severity == 'CRITICAL' else "MEDIUM"
                    impacts["remote_code_execution"]["risk_level"] = higher_risk(impacts["remote_code_execution"]["risk_level"], new_level)
                    impacts["remote_code_execution"]["affected_components"].append(file_path or title)
                    impacts["remote_code_execution"]["description"] = "Agent tools may allow uncontrolled system access or code execution"

            # Data Exfiltration risk (DATA issues, sensitive info disclosure)
            if category == 'DATA' or 'LLM06' in owasp_str or 'secret' in title_lower or 'credential' in title_lower or 'pii' in title_lower:
                if severity in ['CRITICAL', 'HIGH']:
                    new_level = "HIGH" if severity == 'CRITICAL' else "MEDIUM"
                    impacts["data_exfiltration"]["risk_level"] = higher_risk(impacts["data_exfiltration"]["risk_level"], new_level)
                    impacts["data_exfiltration"]["affected_components"].append(file_path or title)
                    impacts["data_exfiltration"]["description"] = "Sensitive data (credentials, PII) may be exposed through agent responses"

            # Privilege Escalation (PROMPT injection, insecure output)
            if category == 'PROMPT' or 'LLM01' in owasp_str or 'injection' in title_lower:
                if severity in ['CRITICAL', 'HIGH']:
                    new_level = "HIGH" if severity == 'CRITICAL' else "MEDIUM"
                    impacts["privilege_escalation"]["risk_level"] = higher_risk(impacts["privilege_escalation"]["risk_level"], new_level)
                    impacts["privilege_escalation"]["affected_components"].append(file_path or title)
                    impacts["privilege_escalation"]["description"] = "Prompt injection may allow attackers to bypass security controls"

            # Supply Chain risk
            if category == 'SUPPLY' or 'LLM05' in owasp_str:
                if severity in ['CRITICAL', 'HIGH', 'MEDIUM']:
                    new_level = "MEDIUM" if severity in ['CRITICAL', 'HIGH'] else "LOW"
                    impacts["supply_chain"]["risk_level"] = higher_risk(impacts["supply_chain"]["risk_level"], new_level)
                    impacts["supply_chain"]["affected_components"].append(file_path or title)
                    impacts["supply_chain"]["description"] = "Third-party dependencies may introduce vulnerabilities"

            # Compliance risk (any critical/high finding)
            if severity in ['CRITICAL', 'HIGH']:
                impacts["compliance_violation"]["risk_level"] = "HIGH"
                impacts["compliance_violation"]["description"] = "Unresolved critical/high issues may violate compliance requirements (SOC2, GDPR)"

        # Dedupe affected components
        for key in impacts:
            impacts[key]["affected_components"] = list(set(impacts[key]["affected_components"]))[:5]

        # Calculate overall business risk
        risk_levels = [impacts[k]["risk_level"] for k in impacts]
        if "HIGH" in risk_levels:
            overall = "HIGH"
            overall_desc = "Critical security gaps that could result in data breach, unauthorized access, or compliance violations"
        elif "MEDIUM" in risk_levels:
            overall = "MEDIUM"
            overall_desc = "Significant security issues that should be addressed before production deployment"
        elif "LOW" in risk_levels:
            overall = "LOW"
            overall_desc = "Minor security concerns that should be tracked and addressed in due course"
        else:
            overall = "NONE"
            overall_desc = "No significant security risks identified"

        return {
            "overall_risk": overall,
            "overall_description": overall_desc,
            "impacts": impacts,
            "executive_bullets": self._generate_executive_bullets(impacts, open_findings),
        }

    def _generate_executive_bullets(self, impacts: Dict[str, Any], open_findings: List[Dict[str, Any]]) -> List[str]:
        """Generate executive summary bullet points."""
        bullets = []

        critical_count = len([f for f in open_findings if f.get('severity') == 'CRITICAL'])
        high_count = len([f for f in open_findings if f.get('severity') == 'HIGH'])

        if critical_count > 0:
            bullets.append(f"🔴 {critical_count} critical security issue(s) require immediate attention")
        if high_count > 0:
            bullets.append(f"🟠 {high_count} high severity issue(s) should be resolved before deployment")

        if impacts["remote_code_execution"]["risk_level"] in ["HIGH", "MEDIUM"]:
            bullets.append("⚠️ RCE Risk: Agent tools may allow uncontrolled system access")
        if impacts["data_exfiltration"]["risk_level"] in ["HIGH", "MEDIUM"]:
            bullets.append("⚠️ Data Risk: Potential exposure of sensitive data through agent responses")
        if impacts["privilege_escalation"]["risk_level"] in ["HIGH", "MEDIUM"]:
            bullets.append("⚠️ Access Risk: Prompt injection vulnerabilities may bypass security controls")
        if impacts["compliance_violation"]["risk_level"] == "HIGH":
            bullets.append("⚠️ Compliance Risk: Unresolved issues may violate SOC2/regulatory requirements")

        if not bullets:
            bullets.append("✅ No critical security risks identified")

        return bullets

    def _owasp_status(self, owasp_id: str, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate status for an OWASP LLM control."""
        owasp_names = {
            "LLM01": "Prompt Injection",
            "LLM02": "Insecure Output Handling",
            "LLM05": "Supply Chain Vulnerabilities",
            "LLM06": "Sensitive Information Disclosure",
            "LLM07": "Insecure Plugin Design",
            "LLM08": "Excessive Agency",
            "LLM09": "Overreliance",
        }

        open_findings = [f for f in findings if f.get('status') == 'OPEN']
        fixed_findings = [f for f in findings if f.get('status') == 'FIXED']

        if not findings:
            return {
                "status": "PASS",
                "message": "No issues found",
                "name": owasp_names.get(owasp_id, owasp_id),
                "findings_count": 0,
                "open_count": 0,
                "fixed_count": 0,
            }

        has_critical = any(f.get('severity') == 'CRITICAL' for f in open_findings)
        has_high = any(f.get('severity') == 'HIGH' for f in open_findings)

        if has_critical or has_high:
            status = "FAIL"
        elif open_findings:
            status = "WARNING"
        else:
            status = "PASS"

        return {
            "status": status,
            "name": owasp_names.get(owasp_id, owasp_id),
            "message": f"{len(open_findings)} open, {len(fixed_findings)} fixed" if findings else "No issues found",
            "findings_count": len(findings),
            "open_count": len(open_findings),
            "fixed_count": len(fixed_findings),
            "findings": findings[:5],  # Include top 5 findings for detail
        }

    def _soc2_status(self, control_id: str, findings: List[Dict[str, Any]], name: str) -> Dict[str, Any]:
        """Calculate status for a SOC2 control."""
        open_findings = [f for f in findings if f.get('status') == 'OPEN']
        fixed_findings = [f for f in findings if f.get('status') == 'FIXED']

        if not findings:
            return {
                "status": "COMPLIANT",
                "name": name,
                "message": "No issues affecting this control",
                "findings_count": 0,
            }

        if open_findings:
            return {
                "status": "NON-COMPLIANT",
                "name": name,
                "message": f"{len(open_findings)} open issues",
                "findings_count": len(findings),
            }

        return {
            "status": "COMPLIANT",
            "name": name,
            "message": f"{len(fixed_findings)} issues resolved",
            "findings_count": len(findings),
        }

    def _category_status(self, category_id: str, findings: List[Dict[str, Any]], name: str) -> Dict[str, Any]:
        """Calculate status for a security category."""
        open_findings = [f for f in findings if f.get('status') == 'OPEN']
        fixed_findings = [f for f in findings if f.get('status') == 'FIXED']

        has_critical = any(f.get('severity') == 'CRITICAL' for f in open_findings)
        has_high = any(f.get('severity') == 'HIGH' for f in open_findings)
        has_medium = any(f.get('severity') == 'MEDIUM' for f in open_findings)

        if has_critical or has_high:
            status = "FAIL"
        elif has_medium:
            status = "WARNING"
        elif open_findings:
            status = "INFO"
        else:
            status = "PASS"

        max_severity = None
        for sev in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
            if any(f.get('severity') == sev for f in open_findings):
                max_severity = sev
                break

        return {
            "status": status,
            "name": name,
            "findings_count": len(findings),
            "open_count": len(open_findings),
            "fixed_count": len(fixed_findings),
            "max_severity": max_severity,
        }

    def _get_decision_message(self, gate_status: Dict[str, Any]) -> str:
        """Generate the decision message for the report."""
        if gate_status["is_blocked"]:
            blocking = gate_status["blocking_count"]
            critical = gate_status["blocking_critical"]
            high = gate_status["blocking_high"]
            parts = []
            if critical > 0:
                parts.append(f"{critical} critical")
            if high > 0:
                parts.append(f"{high} high")
            severity_text = " and ".join(parts) if parts else str(blocking)
            return f"Do not deploy to production. {severity_text} severity issues must be resolved."
        return "Cleared for production deployment. All critical and high security issues have been addressed."

    def _get_blocking_items(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get list of items blocking production."""
        blocking = []
        for r in recommendations:
            if r.get('severity') in ['CRITICAL', 'HIGH'] and r.get('status') not in ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED', 'RESOLVED', 'SUPERSEDED']:
                blocking.append({
                    "recommendation_id": r.get('recommendation_id'),
                    "title": r.get('title'),
                    "description": r.get('description'),
                    "severity": r.get('severity'),
                    "category": r.get('category'),
                    "source_type": r.get('source_type'),
                    "file_path": r.get('file_path'),
                    "line_start": r.get('line_start'),
                    "line_end": r.get('line_end'),
                    "code_snippet": r.get('code_snippet'),
                    "fix_hints": r.get('fix_hints'),
                    "impact": r.get('impact'),
                    "owasp_mapping": r.get('owasp_mapping'),
                    "cvss_score": r.get('cvss_score'),
                })
        return blocking

    def _get_dynamic_stats_for_report(self, workflow_id: str) -> Dict[str, Any]:
        """Get dynamic analysis statistics for the report."""
        # This would be enhanced with actual dynamic analysis data
        # For now, return basic structure
        return {
            "sessions_analyzed": 0,
            "checks_total": 0,
            "checks_passed": 0,
            "behavioral_stability": None,
        }

    # ========================================
    # Report Storage Methods
    # ========================================

    def save_report(
        self,
        workflow_id: str,
        report_type: str,
        report_data: Dict[str, Any],
        report_name: Optional[str] = None,
        generated_by: Optional[str] = None,
    ) -> str:
        """Save a generated report to history.

        Args:
            workflow_id: The workflow ID
            report_type: Type of report (security_assessment)
            report_data: The full report data as a dictionary
            report_name: Optional custom name for the report
            generated_by: Optional user/entity that generated the report

        Returns:
            The report_id of the saved report
        """
        import uuid
        import json

        now = datetime.now(timezone.utc)
        report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"

        # Extract key metrics for indexing
        exec_summary = report_data.get("executive_summary", {})
        risk_score = exec_summary.get("risk_score", 0)
        gate_status = exec_summary.get("gate_status", "UNKNOWN")
        findings_count = exec_summary.get("total_findings", 0)
        recommendations_count = report_data.get("remediation_summary", {}).get("total_recommendations", 0)

        # Default report name
        if not report_name:
            type_names = {
                "security_assessment": "Security Assessment",
            }
            report_name = f"{type_names.get(report_type, report_type)} - {now.strftime('%B %d, %Y')}"

        with self._lock:
            self.db.execute(
                """
                INSERT INTO generated_reports (
                    report_id, agent_workflow_id, report_type, report_name,
                    generated_at, generated_by, risk_score, gate_status,
                    findings_count, recommendations_count, report_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    report_id,
                    workflow_id,
                    report_type,
                    report_name,
                    now.timestamp(),
                    generated_by,
                    risk_score,
                    gate_status,
                    findings_count,
                    recommendations_count,
                    json.dumps(report_data),
                ),
            )
            self.db.commit()
            logger.info(f"Saved report {report_id} for workflow {workflow_id}")
            return report_id

    def get_reports(
        self,
        workflow_id: str,
        report_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get list of generated reports for a workflow.

        Args:
            workflow_id: The workflow ID
            report_type: Optional filter by report type
            limit: Maximum number of reports to return

        Returns:
            List of report metadata (not including full report_data)
        """
        with self._lock:
            query = """
                SELECT report_id, agent_workflow_id, report_type, report_name,
                       generated_at, generated_by, risk_score, gate_status,
                       findings_count, recommendations_count, report_data
                FROM generated_reports
                WHERE agent_workflow_id = ?
            """
            params: List[Any] = [workflow_id]

            if report_type:
                query += " AND report_type = ?"
                params.append(report_type)

            query += " ORDER BY generated_at DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)
            rows = cursor.fetchall()

            reports = []
            for row in rows:
                # Extract severity counts from report_data JSON
                critical_count = 0
                high_count = 0
                medium_count = 0
                if row[10]:
                    try:
                        report_data = json.loads(row[10])
                        breakdown = report_data.get("executive_summary", {}).get("risk_breakdown", {}).get("breakdown", [])
                        for item in breakdown:
                            if item.get("severity") == "CRITICAL":
                                critical_count = item.get("count", 0)
                            elif item.get("severity") == "HIGH":
                                high_count = item.get("count", 0)
                            elif item.get("severity") == "MEDIUM":
                                medium_count = item.get("count", 0)
                    except (json.JSONDecodeError, TypeError):
                        pass

                reports.append({
                    "report_id": row[0],
                    "agent_workflow_id": row[1],
                    "report_type": row[2],
                    "report_name": row[3],
                    "generated_at": datetime.fromtimestamp(row[4], tz=timezone.utc).isoformat() if row[4] else None,
                    "generated_by": row[5],
                    "risk_score": row[6],
                    "gate_status": row[7],
                    "findings_count": row[8],
                    "recommendations_count": row[9],
                    "critical_count": critical_count,
                    "high_count": high_count,
                    "medium_count": medium_count,
                })
            return reports

    def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific report by ID including full report data.

        Args:
            report_id: The report ID

        Returns:
            Full report data or None if not found
        """
        import json

        with self._lock:
            cursor = self.db.execute(
                """
                SELECT report_id, agent_workflow_id, report_type, report_name,
                       generated_at, generated_by, risk_score, gate_status,
                       findings_count, recommendations_count, report_data
                FROM generated_reports
                WHERE report_id = ?
                """,
                (report_id,),
            )
            row = cursor.fetchone()

            if not row:
                return None

            return {
                "report_id": row[0],
                "agent_workflow_id": row[1],
                "report_type": row[2],
                "report_name": row[3],
                "generated_at": datetime.fromtimestamp(row[4], tz=timezone.utc).isoformat() if row[4] else None,
                "generated_by": row[5],
                "risk_score": row[6],
                "gate_status": row[7],
                "findings_count": row[8],
                "recommendations_count": row[9],
                "report_data": json.loads(row[10]) if row[10] else {},
            }

    def delete_report(self, report_id: str) -> bool:
        """Delete a report by ID.

        Args:
            report_id: The report ID

        Returns:
            True if deleted, False if not found
        """
        with self._lock:
            cursor = self.db.execute(
                "DELETE FROM generated_reports WHERE report_id = ?",
                (report_id,),
            )
            self.db.commit()
            return cursor.rowcount > 0
