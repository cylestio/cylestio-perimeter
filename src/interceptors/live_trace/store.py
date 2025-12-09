"""SQLite-based data store for live tracing."""
import json
import sqlite3
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Any, Dict, List, Optional

from src.events import BaseEvent
from src.utils.logger import get_logger

logger = get_logger(__name__)


# SQLite schema for persistent storage
SQL_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    workflow_id TEXT,
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
CREATE INDEX IF NOT EXISTS idx_sessions_workflow_id ON sessions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_completed ON sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    workflow_id TEXT,
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
    percentiles_session_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen);
CREATE INDEX IF NOT EXISTS idx_agents_workflow_id ON agents(workflow_id);

CREATE TABLE IF NOT EXISTS analysis_sessions (
    session_id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    workflow_name TEXT,
    session_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at REAL NOT NULL,
    completed_at REAL,
    findings_count INTEGER DEFAULT 0,
    risk_score INTEGER
);

CREATE INDEX IF NOT EXISTS idx_analysis_sessions_workflow_id ON analysis_sessions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status);

CREATE TABLE IF NOT EXISTS findings (
    finding_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_findings_workflow_id ON findings(workflow_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
"""


class SessionData:
    """Container for session-specific data."""

    def __init__(self, session_id: str, agent_id: str, workflow_id: Optional[str] = None):
        self.session_id = session_id
        self.agent_id = agent_id
        self.workflow_id = workflow_id
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

    def __init__(self, agent_id: str, workflow_id: Optional[str] = None):
        self.agent_id = agent_id
        self.workflow_id = workflow_id
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

    def _serialize_session(self, session: SessionData) -> Dict[str, Any]:
        """Convert SessionData to dict for SQLite storage."""
        return {
            'session_id': session.session_id,
            'agent_id': session.agent_id,
            'workflow_id': session.workflow_id,
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
        session = SessionData(row['session_id'], row['agent_id'], row['workflow_id'])
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
            from .analysis.risk_models import SessionFeatures
            session.behavioral_features = SessionFeatures.model_validate_json(row['behavioral_features'])
        return session

    def _serialize_agent(self, agent: AgentData) -> Dict[str, Any]:
        """Convert AgentData to dict for SQLite storage."""
        return {
            'agent_id': agent.agent_id,
            'workflow_id': agent.workflow_id,
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
        }

    def _deserialize_agent(self, row: sqlite3.Row) -> AgentData:
        """Convert SQLite row back to AgentData object."""
        agent = AgentData(row['agent_id'], row['workflow_id'])
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
        return agent

    def _save_session(self, session: SessionData):
        """Save or update session in SQLite."""
        data = self._serialize_session(session)
        self.db.execute("""
            INSERT OR REPLACE INTO sessions VALUES (
                :session_id, :agent_id, :workflow_id, :created_at, :last_activity,
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
                :agent_id, :workflow_id, :first_seen, :last_seen,
                :total_sessions, :total_messages, :total_tokens,
                :total_tools, :total_errors, :total_response_time_ms, :response_count,
                :sessions_set, :available_tools, :used_tools, :tool_usage_details,
                :cached_percentiles, :percentiles_session_count
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

            # Extract workflow_id from event attributes
            workflow_id = None
            if hasattr(event, 'attributes'):
                workflow_id = event.attributes.get('workflow.id')

            # Add to global event stream (kept in memory as circular buffer)
            self.events.append(event)
            self.total_events += 1

            # Ensure we have session and agent data
            if effective_session_id:
                # Load existing session or create new one
                session = self.get_session(effective_session_id)
                if not session:
                    session = SessionData(effective_session_id, agent_id, workflow_id)
                elif workflow_id and not session.workflow_id:
                    # Update workflow_id if not set (allows late binding)
                    session.workflow_id = workflow_id

                # Load existing agent or create new one
                agent = self.get_agent(agent_id)
                if not agent:
                    agent = AgentData(agent_id, workflow_id)
                elif workflow_id and not agent.workflow_id:
                    # Update workflow_id if not set (allows late binding)
                    agent.workflow_id = workflow_id

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

    def get_all_agents(self, workflow_id: Optional[str] = None) -> List[AgentData]:
        """Get all agents from SQLite, optionally filtered by workflow.

        Args:
            workflow_id: Optional workflow ID to filter by.
                        Use "unassigned" to get agents with no workflow.
        """
        with self._lock:
            if workflow_id is None:
                cursor = self.db.execute("SELECT * FROM agents ORDER BY first_seen DESC")
            elif workflow_id == "unassigned":
                cursor = self.db.execute(
                    "SELECT * FROM agents WHERE workflow_id IS NULL ORDER BY first_seen DESC"
                )
            else:
                cursor = self.db.execute(
                    "SELECT * FROM agents WHERE workflow_id = ? ORDER BY first_seen DESC",
                    (workflow_id,)
                )
            return [self._deserialize_agent(row) for row in cursor.fetchall()]

    def get_workflows(self) -> List[Dict[str, Any]]:
        """Get all unique workflows with their agent counts.

        Returns:
            List of workflow dicts with id, name, agent_count, and session_count.
            Includes workflows from both agents and analysis_sessions tables.
            Includes "Unassigned" for agents without a workflow.
        """
        with self._lock:
            workflows = []

            # Get workflows from both agents and analysis_sessions
            cursor = self.db.execute("""
                SELECT
                    workflow_id,
                    COALESCE(MAX(workflow_name), workflow_id) as name,
                    SUM(agent_count) as agent_count,
                    SUM(session_count) as session_count
                FROM (
                    -- Workflows from agents
                    SELECT workflow_id, NULL as workflow_name, COUNT(*) as agent_count, 0 as session_count
                    FROM agents
                    WHERE workflow_id IS NOT NULL
                    GROUP BY workflow_id

                    UNION ALL

                    -- Workflows from analysis_sessions
                    SELECT workflow_id, workflow_name, 0 as agent_count, COUNT(*) as session_count
                    FROM analysis_sessions
                    WHERE workflow_id IS NOT NULL
                    GROUP BY workflow_id
                )
                GROUP BY workflow_id
                ORDER BY workflow_id
            """)

            for row in cursor.fetchall():
                workflows.append({
                    "id": row["workflow_id"],
                    "name": row["name"],
                    "agent_count": row["agent_count"],
                    "session_count": row["session_count"]
                })

            # Get count of unassigned agents
            cursor = self.db.execute(
                "SELECT COUNT(*) as count FROM agents WHERE workflow_id IS NULL"
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

    def check_and_complete_sessions(self, timeout_seconds: int = 30):
        """Check for inactive sessions and mark them as completed in SQLite.

        Args:
            timeout_seconds: Number of seconds of inactivity before marking complete

        Returns:
            Number of sessions newly marked as completed
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

            # Mark each session as completed and save
            for session in sessions_to_complete:
                session.mark_completed()
                self._save_session(session)

            newly_completed = len(sessions_to_complete)
            if newly_completed > 0:
                logger.info(f"Marked {newly_completed} sessions as completed after {timeout_seconds}s inactivity")

            return newly_completed

    # Analysis Session and Finding Methods

    def _deserialize_analysis_session(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert SQLite row to analysis session dict."""
        return {
            'session_id': row['session_id'],
            'workflow_id': row['workflow_id'],
            'workflow_name': row['workflow_name'],
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
            'workflow_id': row['workflow_id'],
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
        workflow_id: str,
        session_type: str,
        workflow_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new analysis session for a workflow/codebase."""
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()

            self.db.execute("""
                INSERT INTO analysis_sessions (
                    session_id, workflow_id, workflow_name, session_type, status,
                    created_at, findings_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (session_id, workflow_id, workflow_name, session_type, 'IN_PROGRESS', created_at, 0))
            self.db.commit()

            return {
                'session_id': session_id,
                'workflow_id': workflow_id,
                'workflow_name': workflow_name,
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
        risk_score: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Mark an analysis session as completed."""
        with self._lock:
            now = datetime.now(timezone.utc)
            completed_at = now.timestamp()

            self.db.execute("""
                UPDATE analysis_sessions
                SET status = ?, completed_at = ?, risk_score = ?
                WHERE session_id = ?
            """, ('COMPLETED', completed_at, risk_score, session_id))
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
        workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get analysis sessions with optional filtering."""
        with self._lock:
            query = "SELECT * FROM analysis_sessions WHERE 1=1"
            params = []

            if workflow_id:
                query += " AND workflow_id = ?"
                params.append(workflow_id)

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
        workflow_id: str,
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
        """Store a security finding for a workflow."""
        with self._lock:
            now = datetime.now(timezone.utc)
            created_at = now.timestamp()
            updated_at = created_at

            # Serialize JSON fields
            evidence_json = json.dumps(evidence) if evidence else None
            owasp_mapping_json = json.dumps(owasp_mapping) if owasp_mapping else None

            self.db.execute("""
                INSERT INTO findings (
                    finding_id, session_id, workflow_id, file_path, line_start, line_end,
                    finding_type, severity, title, description, evidence, owasp_mapping,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                finding_id, session_id, workflow_id, file_path, line_start, line_end,
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
                'workflow_id': workflow_id,
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
        workflow_id: Optional[str] = None,
        session_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get findings with optional filtering."""
        with self._lock:
            query = "SELECT * FROM findings WHERE 1=1"
            params = []

            if workflow_id:
                query += " AND workflow_id = ?"
                params.append(workflow_id)

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

    def get_workflow_findings_summary(self, workflow_id: str) -> Dict[str, Any]:
        """Get a summary of findings for a workflow."""
        with self._lock:
            # Count by severity
            cursor = self.db.execute("""
                SELECT severity, COUNT(*) as count
                FROM findings
                WHERE workflow_id = ? AND status = 'OPEN'
                GROUP BY severity
            """, (workflow_id,))

            severity_counts = {row['severity']: row['count'] for row in cursor.fetchall()}

            # Count by status
            cursor = self.db.execute("""
                SELECT status, COUNT(*) as count
                FROM findings
                WHERE workflow_id = ?
                GROUP BY status
            """, (workflow_id,))

            status_counts = {row['status']: row['count'] for row in cursor.fetchall()}

            # Get total count
            cursor = self.db.execute("""
                SELECT COUNT(*) as total
                FROM findings
                WHERE workflow_id = ?
            """, (workflow_id,))

            total = cursor.fetchone()['total']

            return {
                'workflow_id': workflow_id,
                'total_findings': total,
                'by_severity': severity_counts,
                'by_status': status_counts,
            }
