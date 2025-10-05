"""In-memory data store for live tracing."""
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
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


class TraceStore:
    """In-memory store for all trace data."""

    def __init__(self, max_events: int = 10000, retention_minutes: int = 30):
        self.max_events = max_events
        self.retention_minutes = retention_minutes

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

        logger.info(f"TraceStore initialized with max_events={max_events}, retention={retention_minutes}min")

    def add_event(self, event: BaseEvent, session_id: Optional[str] = None, agent_id: Optional[str] = None):
        """Add an event to the store."""
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

    def _cleanup_old_data(self):
        """Remove old inactive sessions."""
        cutoff_time = datetime.now(timezone.utc).timestamp() - (self.retention_minutes * 60)

        sessions_to_remove = []
        for session_id, session in self.sessions.items():
            if session.last_activity.timestamp() < cutoff_time:
                sessions_to_remove.append(session_id)
                session.is_active = False

        for session_id in sessions_to_remove:
            if len(self.sessions) > 10:  # Keep at least 10 sessions
                del self.sessions[session_id]
                logger.debug(f"Cleaned up old session: {session_id}")

    def get_active_sessions(self) -> List[SessionData]:
        """Get list of currently active sessions."""
        cutoff_time = datetime.now(timezone.utc).timestamp() - (5 * 60)  # 5 minutes
        return [
            session for session in self.sessions.values()
            if session.last_activity.timestamp() > cutoff_time
        ]

    def get_recent_events(self, limit: int = 100) -> List[BaseEvent]:
        """Get recent events from the global stream."""
        return list(self.events)[-limit:]

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session data by ID."""
        return self.sessions.get(session_id)

    def get_agent(self, agent_id: str) -> Optional[AgentData]:
        """Get agent data by ID."""
        return self.agents.get(agent_id)

    def get_global_stats(self) -> Dict[str, Any]:
        """Get global statistics."""
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