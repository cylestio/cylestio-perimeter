"""SQLite-based data store for live tracing."""
import json
import sqlite3
from collections import defaultdict, deque
from datetime import datetime, timezone
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
    behavioral_features TEXT
);

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
    file_path TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    finding_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    owasp_mapping TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_findings_session_id ON findings(session_id);
CREATE INDEX IF NOT EXISTS idx_findings_agent_workflow_id ON findings(agent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);

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

CREATE TABLE IF NOT EXISTS ide_connections (
    connection_id TEXT PRIMARY KEY,
    ide_type TEXT NOT NULL,
    agent_workflow_id TEXT,
    mcp_session_id TEXT,
    host TEXT,
    user TEXT,
    workspace_path TEXT,
    model TEXT,
    connected_at REAL NOT NULL,
    last_heartbeat REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_developing INTEGER NOT NULL DEFAULT 0,
    disconnected_at REAL,
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_ide_connections_agent_workflow_id ON ide_connections(agent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_ide_connections_is_active ON ide_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_ide_connections_mcp_session_id ON ide_connections(mcp_session_id);
CREATE INDEX IF NOT EXISTS idx_ide_connections_last_heartbeat ON ide_connections(last_heartbeat);
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

        # Migration: add model column to ide_connections if missing
        cursor = self.db.execute("PRAGMA table_info(ide_connections)")
        columns = {row[1] for row in cursor.fetchall()}
        if 'model' not in columns:
            self.db.execute(
                "ALTER TABLE ide_connections ADD COLUMN model TEXT"
            )
            self.db.commit()
            logger.info("Migration: Added model column to ide_connections table")

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
                :behavioral_signature, :behavioral_features
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
                agent_workflow_id = event.attributes.get('workflow.id')

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
    ) -> Tuple[str, List[Any]]:
        """Build WHERE clause for session filtering.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".

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

        return where_clause, params

    def count_sessions_filtered(
        self,
        agent_workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> int:
        """Count sessions with optional filtering.

        More efficient than get_sessions_filtered when only count is needed.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".

        Returns:
            Count of matching sessions.
        """
        with self._lock:
            where_clause, params = self._build_sessions_filter_query(
                agent_workflow_id=agent_workflow_id,
                agent_id=agent_id,
                status=status,
            )
            query = f"SELECT COUNT(*) FROM sessions{where_clause}"  # nosec B608 - parameterized
            cursor = self.db.execute(query, params)
            return cursor.fetchone()[0]

    def get_sessions_filtered(
        self,
        agent_workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get sessions with optional filtering by agent_workflow_id, agent_id, and status.

        Args:
            agent_workflow_id: Filter by agent workflow ID. Use "unassigned" for sessions without agent workflow.
            agent_id: Filter by agent ID.
            status: Filter by status - "ACTIVE", "INACTIVE", or "COMPLETED".
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

                sessions.append({
                    "id": row['session_id'],
                    "id_short": row['session_id'][:12],
                    "agent_id": row['agent_id'],
                    "agent_id_short": row['agent_id'][:12] if row['agent_id'] else None,
                    "agent_workflow_id": row['agent_workflow_id'],
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
                })

            return sessions

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
            List of workflow dicts with id, name, agent_count, and session_count.
            Includes workflows from agents and sessions tables.
            Includes "Unassigned" for agents without an agent workflow.
        """
        with self._lock:
            workflows = []

            # Get workflows with agent counts and session counts
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

                    -- Agent workflows from analysis_sessions (for workflow names)
                    SELECT agent_workflow_id, agent_workflow_name, 0 as agent_count, 0 as session_count
                    FROM analysis_sessions
                    WHERE agent_workflow_id IS NOT NULL
                    GROUP BY agent_workflow_id
                )
                GROUP BY agent_workflow_id
                ORDER BY agent_workflow_id
            """)

            for row in cursor.fetchall():
                workflows.append({
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
                workflows.append({
                    "id": None,
                    "name": "Unassigned",
                    "agent_count": unassigned_count
                })

            return workflows

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
        }

    def _deserialize_finding(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert SQLite row to finding dict."""
        return {
            'finding_id': row['finding_id'],
            'session_id': row['session_id'],
            'agent_workflow_id': row['agent_workflow_id'],
            'file_path': row['file_path'],
            'line_start': row['line_start'],
            'line_end': row['line_end'],
            'finding_type': row['finding_type'],
            'severity': row['severity'],
            'title': row['title'],
            'description': row['description'],
            'evidence': json.loads(row['evidence']) if row['evidence'] else None,
            'owasp_mapping': json.loads(row['owasp_mapping']) if row['owasp_mapping'] else [],
            'status': row['status'],
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
    ) -> Optional[Dict[str, Any]]:
        """Mark an analysis session as completed."""
        with self._lock:
            now = datetime.now(timezone.utc)
            completed_at = now.timestamp()

            self.db.execute("""
                UPDATE analysis_sessions
                SET status = ?, completed_at = ?, findings_count = COALESCE(?, findings_count), risk_score = ?
                WHERE session_id = ?
            """, ('COMPLETED', completed_at, findings_count, risk_score, session_id))
            self.db.commit()

            # Return the updated session
            return self.get_analysis_session(session_id)

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
    ) -> Dict[str, Any]:
        """Store a security finding for an agent workflow."""
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()
            updated_at = created_at

            # Serialize JSON fields
            evidence_json = json.dumps(evidence) if evidence else None
            owasp_mapping_json = json.dumps(owasp_mapping) if owasp_mapping else None

            self.db.execute("""
                INSERT INTO findings (
                    finding_id, session_id, agent_workflow_id, file_path, line_start, line_end,
                    finding_type, severity, title, description, evidence, owasp_mapping,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                finding_id, session_id, agent_workflow_id, file_path, line_start, line_end,
                finding_type, severity, title, description, evidence_json, owasp_mapping_json,
                'OPEN', created_at, updated_at
            ))

            # Increment session's findings_count
            self.db.execute("""
                UPDATE analysis_sessions
                SET findings_count = findings_count + 1
                WHERE session_id = ?
            """, (session_id,))

            self.db.commit()

            return {
                'finding_id': finding_id,
                'session_id': session_id,
                'agent_workflow_id': agent_workflow_id,
                'file_path': file_path,
                'line_start': line_start,
                'line_end': line_end,
                'finding_type': finding_type,
                'severity': severity,
                'title': title,
                'description': description,
                'evidence': evidence,
                'owasp_mapping': owasp_mapping or [],
                'status': 'OPEN',
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
            }

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

    def get_agent_workflow_findings_summary(self, agent_workflow_id: str) -> Dict[str, Any]:
        """Get a summary of findings for an agent workflow."""
        with self._lock:
            # Count by severity
            cursor = self.db.execute("""
                SELECT severity, COUNT(*) as count
                FROM findings
                WHERE agent_workflow_id = ? AND status = 'OPEN'
                GROUP BY severity
            """, (agent_workflow_id,))

            severity_counts = {row['severity']: row['count'] for row in cursor.fetchall()}

            # Count by status
            cursor = self.db.execute("""
                SELECT status, COUNT(*) as count
                FROM findings
                WHERE agent_workflow_id = ?
                GROUP BY status
            """, (agent_workflow_id,))

            status_counts = {row['status']: row['count'] for row in cursor.fetchall()}

            # Get total count
            cursor = self.db.execute("""
                SELECT COUNT(*) as total
                FROM findings
                WHERE agent_workflow_id = ?
            """, (agent_workflow_id,))

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

    def get_agents_needing_analysis(self, min_sessions: int = 5) -> List[str]:
        """Get agent IDs that need analysis.

        Finds agents where:
        - Completed session count >= min_sessions
        - Completed session count > last_analyzed_session_count

        Used for startup check to trigger analysis for agents missed during downtime.
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

    # ==================== IDE Connection Methods ====================

    def register_ide_connection(
        self,
        connection_id: str,
        ide_type: str,
        mcp_session_id: Optional[str] = None,
        agent_workflow_id: Optional[str] = None,
        host: Optional[str] = None,
        user: Optional[str] = None,
        workspace_path: Optional[str] = None,
        model: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Register a new IDE connection.

        Args:
            connection_id: Unique connection identifier
            ide_type: Type of IDE (cursor, claude-code, vscode)
            mcp_session_id: MCP session ID for this connection
            agent_workflow_id: Optional agent workflow/agent being developed
            host: Hostname of the connected machine
            user: Username on the connected machine
            workspace_path: Path to the workspace being edited
            model: AI model being used (e.g., claude-sonnet-4, gpt-4o)
            metadata: Additional connection metadata

        Returns:
            Dict with connection details
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            connected_at = now.timestamp()

            self.db.execute("""
                INSERT OR REPLACE INTO ide_connections (
                    connection_id, ide_type, agent_workflow_id, mcp_session_id,
                    host, user, workspace_path, model, connected_at, last_heartbeat,
                    is_active, is_developing, disconnected_at, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                connection_id,
                ide_type,
                agent_workflow_id,
                mcp_session_id,
                host,
                user,
                workspace_path,
                model,
                connected_at,
                connected_at,  # last_heartbeat = connected_at initially
                1,  # is_active
                0,  # is_developing
                None,  # disconnected_at
                json.dumps(metadata) if metadata else None,
            ))
            self.db.commit()
            logger.info(f"IDE connection registered: {ide_type} ({connection_id[:12]})")

            return self.get_ide_connection(connection_id)

    def get_ide_connection(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get an IDE connection by ID."""
        with self._lock:
            cursor = self.db.execute(
                "SELECT * FROM ide_connections WHERE connection_id = ?",
                (connection_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._deserialize_ide_connection(row)
            return None

    def get_ide_connections(
        self,
        agent_workflow_id: Optional[str] = None,
        ide_type: Optional[str] = None,
        active_only: bool = True,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get IDE connections with optional filtering.

        Args:
            agent_workflow_id: Filter by agent agent workflow/agent being developed
            ide_type: Filter by IDE type (cursor, claude-code, vscode)
            active_only: Only return active connections
            limit: Maximum number of connections to return

        Returns:
            List of connection dicts
        """
        with self._lock:
            query = "SELECT * FROM ide_connections WHERE 1=1"
            params = []

            if agent_workflow_id:
                query += " AND agent_workflow_id = ?"
                params.append(agent_workflow_id)

            if ide_type:
                query += " AND ide_type = ?"
                params.append(ide_type)

            if active_only:
                query += " AND is_active = 1"

            query += " ORDER BY last_heartbeat DESC LIMIT ?"
            params.append(limit)

            cursor = self.db.execute(query, params)
            return [self._deserialize_ide_connection(row) for row in cursor.fetchall()]

    def update_ide_heartbeat(
        self,
        connection_id: str,
        is_developing: bool = False,
        agent_workflow_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update heartbeat timestamp for an IDE connection.

        Args:
            connection_id: The connection ID
            is_developing: Whether active development is happening
            agent_workflow_id: Update the workflow being developed

        Returns:
            Updated connection dict or None if not found
        """
        with self._lock:
            now = datetime.now(timezone.utc)

            # Build update query dynamically
            updates = ["last_heartbeat = ?", "is_developing = ?"]
            params = [now.timestamp(), 1 if is_developing else 0]

            if agent_workflow_id is not None:
                updates.append("agent_workflow_id = ?")
                params.append(agent_workflow_id)

            params.append(connection_id)

            self.db.execute(
                f"UPDATE ide_connections SET {', '.join(updates)} WHERE connection_id = ?",  # nosec B608 - parameterized
                params
            )
            self.db.commit()

            return self.get_ide_connection(connection_id)

    def disconnect_ide(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Mark an IDE connection as disconnected.

        Args:
            connection_id: The connection ID to disconnect

        Returns:
            Updated connection dict or None if not found
        """
        with self._lock:
            now = datetime.now(timezone.utc)

            self.db.execute("""
                UPDATE ide_connections
                SET is_active = 0, is_developing = 0, disconnected_at = ?
                WHERE connection_id = ?
            """, (now.timestamp(), connection_id))
            self.db.commit()
            logger.info(f"IDE disconnected: {connection_id[:12]}")

            return self.get_ide_connection(connection_id)

    def get_ide_connection_status(self, agent_workflow_id: Optional[str] = None) -> Dict[str, Any]:
        """Get overall IDE connection status for an agent workflow.

        Args:
            agent_workflow_id: Optional workflow to check status for

        Returns:
            Dict with connection status summary including:
            - is_connected: Currently has active heartbeat
            - has_ever_connected: Has ever successfully connected (for green state)
            - is_developing: Currently actively developing
            - connected_ide: Current or most recent IDE info
        """
        with self._lock:
            # First, mark stale connections as inactive (no heartbeat for 60 seconds)
            cutoff_time = datetime.now(timezone.utc).timestamp() - 60
            self.db.execute("""
                UPDATE ide_connections
                SET is_active = 0, is_developing = 0
                WHERE is_active = 1 AND last_heartbeat < ?
            """, (cutoff_time,))
            self.db.commit()

            # Get active connections (currently connected with recent heartbeat)
            query = "SELECT * FROM ide_connections WHERE is_active = 1"
            params = []
            if agent_workflow_id:
                query += " AND agent_workflow_id = ?"
                params.append(agent_workflow_id)
            query += " ORDER BY last_heartbeat DESC"

            cursor = self.db.execute(query, params)
            active_connections = [self._deserialize_ide_connection(row) for row in cursor.fetchall()]

            # Get the most recent connection for this workflow (even if inactive)
            # This is used to show "was connected" state
            most_recent_query = "SELECT * FROM ide_connections WHERE 1=1"
            most_recent_params = []
            if agent_workflow_id:
                most_recent_query += " AND agent_workflow_id = ?"
                most_recent_params.append(agent_workflow_id)
            most_recent_query += " ORDER BY last_heartbeat DESC LIMIT 1"

            cursor = self.db.execute(most_recent_query, most_recent_params)
            most_recent_row = cursor.fetchone()
            most_recent_connection = self._deserialize_ide_connection(most_recent_row) if most_recent_row else None

            # Get recent connections (last 24 hours) for history
            history_cutoff = datetime.now(timezone.utc).timestamp() - (24 * 60 * 60)
            history_query = "SELECT * FROM ide_connections WHERE connected_at > ?"
            history_params = [history_cutoff]
            if agent_workflow_id:
                history_query += " AND agent_workflow_id = ?"
                history_params.append(agent_workflow_id)
            history_query += " ORDER BY connected_at DESC LIMIT 10"

            cursor = self.db.execute(history_query, history_params)
            recent_connections = [self._deserialize_ide_connection(row) for row in cursor.fetchall()]

            # Determine status
            is_connected = len(active_connections) > 0
            is_developing = any(c.get('is_developing') for c in active_connections)
            has_ever_connected = most_recent_connection is not None
            
            # Use active connection if available, otherwise most recent for display
            connected_ide = active_connections[0] if active_connections else most_recent_connection

            return {
                'is_connected': is_connected,
                'is_developing': is_developing,
                'has_ever_connected': has_ever_connected,
                'connected_ide': connected_ide,
                'active_connections': active_connections,
                'recent_connections': recent_connections,
                'connection_count': len(active_connections),
            }

    def _deserialize_ide_connection(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Deserialize an ide_connections row."""
        connected_at = datetime.fromtimestamp(row['connected_at'], tz=timezone.utc)
        last_heartbeat = datetime.fromtimestamp(row['last_heartbeat'], tz=timezone.utc)
        now = datetime.now(timezone.utc)

        # Calculate relative time for last heartbeat
        delta = now - last_heartbeat
        if delta.total_seconds() < 60:
            last_seen_relative = "just now"
        elif delta.total_seconds() < 3600:
            mins = int(delta.total_seconds() / 60)
            last_seen_relative = f"{mins}m ago"
        elif delta.total_seconds() < 86400:
            hours = int(delta.total_seconds() / 3600)
            last_seen_relative = f"{hours}h ago"
        else:
            days = int(delta.total_seconds() / 86400)
            last_seen_relative = f"{days}d ago"

        return {
            'connection_id': row['connection_id'],
            'ide_type': row['ide_type'],
            'agent_workflow_id': row['agent_workflow_id'],
            'mcp_session_id': row['mcp_session_id'],
            'host': row['host'],
            'user': row['user'],
            'workspace_path': row['workspace_path'],
            'model': row['model'] if 'model' in row.keys() else None,
            'connected_at': connected_at.isoformat(),
            'last_heartbeat': last_heartbeat.isoformat(),
            'last_seen_relative': last_seen_relative,
            'is_active': bool(row['is_active']),
            'is_developing': bool(row['is_developing']),
            'disconnected_at': datetime.fromtimestamp(row['disconnected_at'], tz=timezone.utc).isoformat() if row['disconnected_at'] else None,
            'metadata': json.loads(row['metadata']) if row['metadata'] else None,
        }
