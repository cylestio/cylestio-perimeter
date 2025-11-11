"""In-memory data store for live tracing."""
from collections import defaultdict, deque
from datetime import datetime, timezone
from threading import RLock
from typing import Any, Dict, List, Optional

from src.events import BaseEvent
from src.utils.logger import get_logger

logger = get_logger(__name__)


class SessionData:
    """Container for session-specific data."""

    def __init__(self, session_id: str, agent_id: str):
        self.session_id = session_id
        self.agent_id = agent_id
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

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
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
    """In-memory store for all trace data."""

    def __init__(self, max_events: int = 10000, retention_minutes: int = 30):
        self.max_events = max_events
        self.retention_minutes = retention_minutes
        self._lock = RLock()

        # Storage
        self.events = deque(maxlen=max_events)  # Global event stream
        self.sessions: Dict[str, SessionData] = {}
        self.agents: Dict[str, AgentData] = {}

        # Global stats
        self.start_time = datetime.now(timezone.utc)
        self.total_events = 0

        # Tool usage tracking
        self.tool_usage = defaultdict(int)
        self.error_types = defaultdict(int)

        # Performance indexes
        self._sessions_by_agent: Dict[str, set] = defaultdict(set)  # {agent_id: {session_ids}}
        self._active_sessions: set = set()  # {session_ids} - sessions with recent activity
        self._completed_sessions: set = set()  # {session_ids} - sessions marked as completed

        # Cleanup optimization
        self._last_cleanup = datetime.now(timezone.utc)
        self._cleanup_interval_seconds = 60  # Only cleanup once per minute

        logger.info(f"TraceStore initialized with max_events={max_events}, retention={retention_minutes}min")

    @property
    def lock(self) -> RLock:
        """Expose the underlying lock for coordinated read access."""
        return self._lock

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

            # Add to global event stream
            self.events.append(event)
            self.total_events += 1

            # Ensure we have session and agent data
            if effective_session_id:
                is_new_session = effective_session_id not in self.sessions

                if is_new_session:
                    self.sessions[effective_session_id] = SessionData(effective_session_id, agent_id)
                    # Add to active sessions index
                    self._active_sessions.add(effective_session_id)

                if agent_id not in self.agents:
                    self.agents[agent_id] = AgentData(agent_id)

                # Add session to agent and update index
                self.agents[agent_id].add_session(effective_session_id)
                self._sessions_by_agent[agent_id].add(effective_session_id)

                # Get session for metrics updates
                session = self.sessions[effective_session_id]
                agent = self.agents[agent_id]

                # Check if session was completed before adding event (for reactivation handling)
                was_completed = session.is_completed

                # Add event to session (may trigger reactivation if session was completed)
                session.add_event(event)

                # If session was reactivated, update indexes
                if was_completed and not session.is_completed:
                    self._completed_sessions.discard(session.session_id)
                    self._active_sessions.add(session.session_id)

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
        """Remove old INCOMPLETE sessions only.

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

        sessions_to_remove = []
        # Optimization: Only iterate active sessions (skip completed)
        for session_id in list(self._active_sessions):
            session = self.sessions.get(session_id)
            if not session:
                continue

            # Only clean up old INCOMPLETE/ABANDONED sessions
            if session.last_activity.timestamp() < cutoff_time:
                sessions_to_remove.append(session_id)
                session.is_active = False

        # Remove old sessions and update indexes
        for session_id in sessions_to_remove:
            if len(self.sessions) > 10:  # Keep at least 10 sessions
                del self.sessions[session_id]
                self._active_sessions.discard(session_id)
                # Also remove from agent's session index
                for agent_sessions in self._sessions_by_agent.values():
                    agent_sessions.discard(session_id)
                logger.debug(f"Cleaned up old incomplete session: {session_id}")

    def get_active_sessions(self) -> List[SessionData]:
        """Get list of currently active sessions (not completed, with activity in last 5 minutes)."""
        with self._lock:
            cutoff_time = datetime.now(timezone.utc).timestamp() - (5 * 60)  # 5 minutes
            # Optimization: Only check active sessions index (skip completed sessions)
            return [
                self.sessions[session_id]
                for session_id in self._active_sessions
                if session_id in self.sessions and
                   self.sessions[session_id].last_activity.timestamp() > cutoff_time
            ]

    def get_recent_events(self, limit: int = 100) -> List[BaseEvent]:
        """Get recent events from the global stream."""
        with self._lock:
            return list(self.events)[-limit:]

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session data by ID."""
        with self._lock:
            return self.sessions.get(session_id)

    def get_agent(self, agent_id: str) -> Optional[AgentData]:
        """Get agent data by ID."""
        with self._lock:
            return self.agents.get(agent_id)

    def get_global_stats(self) -> Dict[str, Any]:
        """Get global statistics."""
        with self._lock:
            active_sessions = self.get_active_sessions()

            # Calculate aggregate metrics
            total_tokens = sum(session.total_tokens for session in self.sessions.values())
            total_response_time = sum(session.total_response_time_ms for session in self.sessions.values())
            total_responses = sum(session.response_count for session in self.sessions.values())
            total_errors = sum(session.errors for session in self.sessions.values())

            avg_response_time = total_response_time / total_responses if total_responses > 0 else 0
            error_rate = (total_errors / self.total_events) * 100 if self.total_events > 0 else 0

            uptime_minutes = (datetime.now(timezone.utc) - self.start_time).total_seconds() / 60

            return {
                "total_events": self.total_events,
                "total_sessions": len(self.sessions),
                "active_sessions": len(active_sessions),
                "total_agents": len(self.agents),
                "total_tokens": total_tokens,
                "avg_response_time_ms": avg_response_time,
                "error_rate": error_rate,
                "uptime_minutes": uptime_minutes,
                "events_per_minute": self.total_events / uptime_minutes if uptime_minutes > 0 else 0,
                "top_tools": dict(sorted(self.tool_usage.items(), key=lambda x: x[1], reverse=True)[:5]),
                "top_errors": dict(sorted(self.error_types.items(), key=lambda x: x[1], reverse=True)[:5])
            }

    def check_and_complete_sessions(self, timeout_seconds: int = 30):
        """Check for inactive sessions and mark them as completed.
        
        Args:
            timeout_seconds: Number of seconds of inactivity before marking complete
            
        Returns:
            Number of sessions newly marked as completed
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            newly_completed = 0
            
            for session in self.sessions.values():
                # Skip sessions that are already completed or inactive
                if session.is_completed:
                    continue

                # Check if session has been inactive for timeout period
                inactive_seconds = (now - session.last_activity).total_seconds()
                if inactive_seconds >= timeout_seconds:
                    session.mark_completed()
                    newly_completed += 1

                    # Update indexes: move from active to completed
                    self._active_sessions.discard(session.session_id)
                    self._completed_sessions.add(session.session_id)
            
            if newly_completed > 0:
                logger.info(f"Marked {newly_completed} sessions as completed after {timeout_seconds}s inactivity")
            
            return newly_completed
