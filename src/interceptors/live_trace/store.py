"""In-memory data store for live tracing."""
import json
import os
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
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

    def add_event(self, event: BaseEvent):
        """Add an event to this session."""
        self.events.append(event)
        self.total_events += 1
        self.last_activity = datetime.now(timezone.utc)

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

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = {
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "is_active": self.is_active,
            "total_events": self.total_events,
            "message_count": self.message_count,
            "tool_uses": self.tool_uses,
            "errors": self.errors,
            "total_tokens": self.total_tokens,
            "total_response_time_ms": self.total_response_time_ms,
            "response_count": self.response_count,
            "tool_usage_details": dict(self.tool_usage_details),
            "available_tools": list(self.available_tools),
            # Note: events are not persisted due to potential size
        }
        
        # Persist behavioral features and MinHash signature if they exist (for performance optimization)
        if hasattr(self, 'behavioral_features') and self.behavioral_features:
            data["behavioral_features"] = self.behavioral_features
        
        if hasattr(self, 'minhash_signature') and self.minhash_signature:
            data["minhash_signature"] = self.minhash_signature
        
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionData":
        """Create from dictionary."""
        session = cls(data["session_id"], data["agent_id"])
        session.created_at = datetime.fromisoformat(data["created_at"])
        session.last_activity = datetime.fromisoformat(data["last_activity"])
        session.is_active = data["is_active"]
        session.total_events = data["total_events"]
        session.message_count = data["message_count"]
        session.tool_uses = data["tool_uses"]
        session.errors = data["errors"]
        session.total_tokens = data["total_tokens"]
        session.total_response_time_ms = data["total_response_time_ms"]
        session.response_count = data["response_count"]
        session.tool_usage_details = defaultdict(int, data.get("tool_usage_details", {}))
        session.available_tools = set(data.get("available_tools", []))
        
        # Restore cached behavioral features and MinHash signature if available
        if "behavioral_features" in data:
            session.behavioral_features = data["behavioral_features"]
        
        if "minhash_signature" in data:
            session.minhash_signature = data["minhash_signature"]
        
        return session


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

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "agent_id": self.agent_id,
            "sessions": list(self.sessions),
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "total_sessions": self.total_sessions,
            "total_messages": self.total_messages,
            "total_tokens": self.total_tokens,
            "total_tools": self.total_tools,
            "total_errors": self.total_errors,
            "total_response_time_ms": self.total_response_time_ms,
            "response_count": self.response_count,
            "available_tools": list(self.available_tools),
            "used_tools": list(self.used_tools),
            "tool_usage_details": dict(self.tool_usage_details),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentData":
        """Create from dictionary."""
        agent = cls(data["agent_id"])
        agent.sessions = set(data["sessions"])
        agent.first_seen = datetime.fromisoformat(data["first_seen"])
        agent.last_seen = datetime.fromisoformat(data["last_seen"])
        agent.total_sessions = data["total_sessions"]
        agent.total_messages = data["total_messages"]
        agent.total_tokens = data["total_tokens"]
        agent.total_tools = data["total_tools"]
        agent.total_errors = data["total_errors"]
        agent.total_response_time_ms = data["total_response_time_ms"]
        agent.response_count = data["response_count"]
        agent.available_tools = set(data.get("available_tools", []))
        agent.used_tools = set(data.get("used_tools", []))
        agent.tool_usage_details = defaultdict(int, data.get("tool_usage_details", {}))
        return agent


class TraceStore:
    """In-memory store for all trace data."""

    def __init__(
        self,
        max_events: int = 10000,
        retention_minutes: int = 30,
        persist_to_file: bool = False,
        persistence_dir: Optional[str] = None,
        save_interval_events: int = 100
    ):
        self.max_events = max_events
        self.retention_minutes = retention_minutes
        self.persist_to_file = persist_to_file
        self.save_interval_events = save_interval_events
        self._lock = RLock()

        # Persistence configuration
        if self.persist_to_file:
            self.persistence_dir = Path(persistence_dir or "./live_trace_data")
            self.persistence_dir.mkdir(parents=True, exist_ok=True)
            self.persistence_file = self.persistence_dir / "trace_store.json"
        else:
            self.persistence_dir = None
            self.persistence_file = None

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

        # Load persisted data if available
        if self.persist_to_file and self.persistence_file.exists():
            self._load_from_file()

        logger.info(
            f"TraceStore initialized with max_events={max_events}, "
            f"retention={retention_minutes}min, persist_to_file={persist_to_file}"
        )

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
                if effective_session_id not in self.sessions:
                    self.sessions[effective_session_id] = SessionData(effective_session_id, agent_id)

                if agent_id not in self.agents:
                    self.agents[agent_id] = AgentData(agent_id)

                # Add session to agent
                self.agents[agent_id].add_session(effective_session_id)

                # Add event to session
                self.sessions[effective_session_id].add_event(event)

            # Track tool usage and errors
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

            # Auto-save to file if persistence is enabled
            if self.persist_to_file and self.total_events % self.save_interval_events == 0:
                self._save_to_file()

    def _cleanup_old_data(self):
        """Remove old inactive sessions."""
        cutoff_time = datetime.now(timezone.utc).timestamp() - (self.retention_minutes * 60)

        sessions_to_remove = []
        for session_id, session in list(self.sessions.items()):
            if session.last_activity.timestamp() < cutoff_time:
                sessions_to_remove.append(session_id)
                session.is_active = False

        for session_id in sessions_to_remove:
            if len(self.sessions) > 10:  # Keep at least 10 sessions
                del self.sessions[session_id]
                logger.debug(f"Cleaned up old session: {session_id}")

    def get_active_sessions(self) -> List[SessionData]:
        """Get list of currently active sessions."""
        with self._lock:
            cutoff_time = datetime.now(timezone.utc).timestamp() - (5 * 60)  # 5 minutes
            return [
                session for session in self.sessions.values()
                if session.last_activity.timestamp() > cutoff_time
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

    def update_agent_metrics(self):
        """Update agent metrics from their sessions."""
        with self._lock:
            for agent in self.agents.values():
                # Reset metrics
                agent.total_messages = 0
                agent.total_tokens = 0
                agent.total_tools = 0
                agent.total_errors = 0
                agent.total_response_time_ms = 0.0
                agent.response_count = 0
                agent.tool_usage_details.clear()
                agent.used_tools.clear()
                agent.available_tools.clear()

                # Aggregate from sessions
                for session_id in agent.sessions:
                    session = self.sessions.get(session_id)
                    if session:
                        agent.update_metrics(session)
                        # Update tool information
                        agent.available_tools.update(session.available_tools)
                        # Only mark tools as "used" if they were actually executed
                        agent.used_tools.update(session.tool_usage_details.keys())
                        for tool_name, count in session.tool_usage_details.items():
                            agent.tool_usage_details[tool_name] += count

    def _save_to_file(self):
        """Save store state to file."""
        if not self.persist_to_file or not self.persistence_file:
            return

        try:
            # Import constants to ensure consistency with behavioral_analysis
            from .behavioral_analysis import (
                MINHASH_NUM_HASHES,
                MINHASH_SEED_MULTIPLIER,
                MINHASH_HASH_ALGORITHM
            )
            
            # Prepare data for serialization
            data = {
                "version": "1.0",
                "saved_at": datetime.now(timezone.utc).isoformat(),
                "start_time": self.start_time.isoformat(),
                "total_events": self.total_events,
                # MinHash configuration (for signature validation)
                "minhash_config": {
                    "num_hashes": MINHASH_NUM_HASHES,
                    "seed_multiplier": MINHASH_SEED_MULTIPLIER,
                    "hash_algorithm": MINHASH_HASH_ALGORITHM
                },
                "sessions": {
                    session_id: session.to_dict()
                    for session_id, session in self.sessions.items()
                },
                "agents": {
                    agent_id: agent.to_dict()
                    for agent_id, agent in self.agents.items()
                },
                "tool_usage": dict(self.tool_usage),
                "error_types": dict(self.error_types),
            }

            # Write to temp file first, then rename (atomic operation)
            temp_file = self.persistence_file.with_suffix(".tmp")
            with open(temp_file, "w") as f:
                json.dump(data, f, indent=2)

            # Atomic rename
            temp_file.replace(self.persistence_file)

            logger.debug(f"Saved trace store to {self.persistence_file}")

        except Exception as e:
            logger.error(f"Failed to save trace store to file: {e}")

    def _load_from_file(self):
        """Load store state from file."""
        if not self.persist_to_file or not self.persistence_file or not self.persistence_file.exists():
            return

        try:
            # Import constants to validate configuration
            from .behavioral_analysis import (
                MINHASH_NUM_HASHES,
                MINHASH_SEED_MULTIPLIER,
                MINHASH_HASH_ALGORITHM
            )
            
            with open(self.persistence_file, "r") as f:
                data = json.load(f)

            # Check MinHash configuration compatibility
            expected_config = {
                "num_hashes": MINHASH_NUM_HASHES,
                "seed_multiplier": MINHASH_SEED_MULTIPLIER,
                "hash_algorithm": MINHASH_HASH_ALGORITHM
            }
            stored_config = data.get("minhash_config", {})
            
            config_mismatch = False
            if stored_config != expected_config:
                logger.warning(
                    f"MinHash configuration mismatch! "
                    f"Expected: {expected_config}, Got: {stored_config}. "
                    f"Cached signatures will be invalidated."
                )
                config_mismatch = True

            # Restore global stats
            self.start_time = datetime.fromisoformat(data.get("start_time", datetime.now(timezone.utc).isoformat()))
            self.total_events = data.get("total_events", 0)
            self.tool_usage = defaultdict(int, data.get("tool_usage", {}))
            self.error_types = defaultdict(int, data.get("error_types", {}))

            # Restore sessions
            for session_id, session_data in data.get("sessions", {}).items():
                try:
                    session = SessionData.from_dict(session_data)
                    
                    # Invalidate cached signatures if config changed
                    if config_mismatch and hasattr(session, 'minhash_signature'):
                        delattr(session, 'minhash_signature')
                        logger.debug(f"Invalidated signature for session {session_id} due to config change")
                    
                    self.sessions[session_id] = session
                except Exception as e:
                    logger.warning(f"Failed to restore session {session_id}: {e}")

            # Restore agents
            for agent_id, agent_data in data.get("agents", {}).items():
                try:
                    self.agents[agent_id] = AgentData.from_dict(agent_data)
                except Exception as e:
                    logger.warning(f"Failed to restore agent {agent_id}: {e}")

            logger.info(
                f"Loaded trace store from {self.persistence_file}: "
                f"{len(self.sessions)} sessions, {len(self.agents)} agents, "
                f"{self.total_events} total events"
            )

        except Exception as e:
            logger.error(f"Failed to load trace store from file: {e}")

    def save(self):
        """Manually trigger a save to file (for shutdown/cleanup)."""
        if self.persist_to_file:
            with self._lock:
                self._save_to_file()
