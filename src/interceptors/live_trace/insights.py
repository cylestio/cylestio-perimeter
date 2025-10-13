"""Analytics and insights computation for trace data."""
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Dict, List

from .store import TraceStore, AgentData


def _with_store_lock(func):
    """Ensure the wrapped method executes with the trace store lock held."""

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        with self.store.lock:
            return func(self, *args, **kwargs)

    return wrapper


class InsightsEngine:
    """Computes various insights from trace data."""

    def __init__(self, store: TraceStore, proxy_config: Dict[str, Any] = None):
        self.store = store
        self.proxy_config = proxy_config or {}

    @_with_store_lock
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get all data needed for the main dashboard."""
        stats = self.store.get_global_stats()
        agents = self._get_agent_summary()
        sessions = self._get_recent_sessions()
        latest_session = self._get_latest_active_session()

        return {
            "stats": stats,
            "agents": agents,
            "sessions": sessions,
            "latest_session": latest_session,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    @_with_store_lock
    def get_agent_data(self, agent_id: str) -> Dict[str, Any]:
        """Get detailed data for a specific agent."""
        agent = self.store.agents.get(agent_id)
        if not agent:
            return {"error": "Agent not found"}

        # Update agent metrics first
        self.store.update_agent_metrics()

        # Get agent's sessions
        agent_sessions = []
        for session_id in agent.sessions:
            session = self.store.sessions.get(session_id)
            if session:
                agent_sessions.append({
                    "id": session_id,
                    "created_at": session.created_at.isoformat(),
                    "last_activity": session.last_activity.isoformat(),
                    "duration_minutes": session.duration_minutes,
                    "message_count": session.message_count,
                    "tool_uses": session.tool_uses,
                    "errors": session.errors,
                    "total_tokens": session.total_tokens,
                    "is_active": session.is_active,
                    "error_rate": session.error_rate
                })

        # Sort sessions by last activity
        agent_sessions.sort(key=lambda x: x["last_activity"], reverse=True)

        # Calculate tools utilization percentage
        tools_utilization = 0.0
        if len(agent.available_tools) > 0:
            tools_utilization = (len(agent.used_tools) / len(agent.available_tools)) * 100

        return {
            "agent": {
                "id": agent_id,
                "first_seen": agent.first_seen.isoformat(),
                "last_seen": agent.last_seen.isoformat(),
                "total_sessions": agent.total_sessions,
                "total_messages": agent.total_messages,
                "total_tokens": agent.total_tokens,
                "total_tools": agent.total_tools,
                "total_errors": agent.total_errors,
                "avg_response_time_ms": agent.avg_response_time_ms,
                "avg_messages_per_session": agent.avg_messages_per_session,
                "tool_usage_details": dict(agent.tool_usage_details),
                "available_tools": list(agent.available_tools),
                "used_tools": list(agent.used_tools),
                "tools_utilization_percent": round(tools_utilization, 1)
            },
            "sessions": agent_sessions,
            "patterns": self._analyze_agent_patterns(agent),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    @_with_store_lock
    def get_session_data(self, session_id: str) -> Dict[str, Any]:
        """Get detailed data for a specific session."""
        session = self.store.sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        # Convert events to serializable format
        events = []
        for event in session.events:
            # Handle timestamp - it might be a string or datetime object
            timestamp = event.timestamp
            if hasattr(timestamp, 'isoformat'):
                timestamp_str = timestamp.isoformat()
            else:
                timestamp_str = str(timestamp)

            events.append({
                "id": event.span_id,
                "name": event.name.value,
                "timestamp": timestamp_str,
                "level": event.level.value,
                "attributes": dict(event.attributes),
                "session_id": event.session_id
            })

        # Sort events by timestamp
        events.sort(key=lambda x: x["timestamp"])

        return {
            "session": {
                "id": session_id,
                "agent_id": session.agent_id,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "duration_minutes": session.duration_minutes,
                "is_active": session.is_active,
                "total_events": session.total_events,
                "message_count": session.message_count,
                "tool_uses": session.tool_uses,
                "errors": session.errors,
                "total_tokens": session.total_tokens,
                "avg_response_time_ms": session.avg_response_time_ms,
                "error_rate": session.error_rate,
                "tool_usage_details": dict(session.tool_usage_details),
                "available_tools": list(session.available_tools)
            },
            "events": events,
            "timeline": self._create_session_timeline(events),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    @_with_store_lock
    def _get_agent_summary(self) -> List[Dict[str, Any]]:
        """Get summary data for all agents."""
        self.store.update_agent_metrics()

        agents = []
        for agent in self.store.agents.values():
            active_sessions = len([
                session_id for session_id in agent.sessions
                if session_id in self.store.sessions and self.store.sessions[session_id].is_active
            ])

            agents.append({
                "id": agent.agent_id,
                "id_short": agent.agent_id[:8] + "..." if len(agent.agent_id) > 8 else agent.agent_id,
                "total_sessions": agent.total_sessions,
                "active_sessions": active_sessions,
                "total_messages": agent.total_messages,
                "total_tokens": agent.total_tokens,
                "total_tools": agent.total_tools,
                "total_errors": agent.total_errors,
                "avg_response_time_ms": agent.avg_response_time_ms,
                "last_seen": agent.last_seen.isoformat(),
                "last_seen_relative": self._time_ago(agent.last_seen)
            })

        # Sort by last seen
        agents.sort(key=lambda x: x["last_seen"], reverse=True)
        return agents

    @_with_store_lock
    def _get_recent_sessions(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent sessions with summary data."""
        sessions = []
        for session in self.store.sessions.values():
            sessions.append({
                "id": session.session_id,
                "id_short": session.session_id[:8] + "..." if len(session.session_id) > 8 else session.session_id,
                "agent_id": session.agent_id,
                "agent_id_short": session.agent_id[:8] + "..." if len(session.agent_id) > 8 else session.agent_id,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "last_activity_relative": self._time_ago(session.last_activity),
                "duration_minutes": session.duration_minutes,
                "is_active": session.is_active,
                "message_count": session.message_count,
                "tool_uses": session.tool_uses,
                "errors": session.errors,
                "total_tokens": session.total_tokens,
                "error_rate": session.error_rate
            })

        # Sort by last activity
        sessions.sort(key=lambda x: x["last_activity"], reverse=True)
        return sessions[:limit]

    @_with_store_lock
    def _get_latest_active_session(self) -> Dict[str, Any] | None:
        """Get the most recent active session."""
        active_sessions = [s for s in self.store.sessions.values() if s.is_active]

        if not active_sessions:
            # If no active sessions, return the most recent one
            if self.store.sessions:
                latest = max(self.store.sessions.values(), key=lambda s: s.last_activity)
            else:
                return None
        else:
            # Return the most recently active session
            latest = max(active_sessions, key=lambda s: s.last_activity)

        return {
            "id": latest.session_id,
            "agent_id": latest.agent_id,
            "message_count": latest.message_count,
            "duration_minutes": latest.duration_minutes,
            "is_active": latest.is_active,
            "last_activity": self._time_ago(latest.last_activity)
        }

    @_with_store_lock
    def _analyze_agent_patterns(self, agent: AgentData) -> Dict[str, Any]:
        """Analyze patterns for a specific agent."""
        agent_sessions = [
            self.store.sessions[session_id]
            for session_id in agent.sessions
            if session_id in self.store.sessions
        ]

        if not agent_sessions:
            return {}

        # Session length patterns
        durations = [s.duration_minutes for s in agent_sessions if s.duration_minutes > 0]
        messages = [s.message_count for s in agent_sessions if s.message_count > 0]
        tools = [s.tool_uses for s in agent_sessions]

        return {
            "avg_session_duration": round(sum(durations) / len(durations), 1) if durations else 0,
            "max_session_duration": round(max(durations), 1) if durations else 0,
            "avg_messages_per_session": round(sum(messages) / len(messages), 1) if messages else 0,
            "max_messages_per_session": max(messages) if messages else 0,
            "tool_usage_rate": round(len([t for t in tools if t > 0]) / len(tools) * 100, 1) if tools else 0,
            "avg_tools_per_session": round(sum(tools) / len(tools), 1) if tools else 0,
            "sessions_with_errors": len([s for s in agent_sessions if s.errors > 0]),
            "most_productive_session": max(agent_sessions, key=lambda s: s.message_count).session_id if agent_sessions else None
        }

    def _create_session_timeline(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create a timeline view of session events (chronological order)."""
        timeline = []
        for event in events:
            timeline_item = {
                "timestamp": event["timestamp"],
                "event_type": event["name"],
                "description": self._get_event_description(event),
                "level": event["level"],
                "details": event["attributes"],
                "raw_event": event  # Include full raw event data
            }
            timeline.append(timeline_item)

        return timeline

    def _get_event_description(self, event: Dict[str, Any]) -> str:
        """Generate human-readable description for an event."""
        event_name = event["name"]
        attributes = event["attributes"]

        if event_name == "llm.call.start":
            model = attributes.get("llm.request.model", "unknown")
            return f"Started LLM call to {model}"
        elif event_name == "llm.call.finish":
            duration = attributes.get("llm.response.duration_ms", 0)
            tokens = attributes.get("llm.usage.total_tokens", 0)
            return f"Completed LLM call ({duration:.0f}ms, {tokens} tokens)"
        elif event_name == "tool.execution":
            tool_name = attributes.get("tool.name", "unknown")
            return f"Executed tool: {tool_name}"
        elif event_name == "tool.result":
            tool_name = attributes.get("tool.name", "unknown")
            status = attributes.get("tool.status", "unknown")
            return f"Tool result: {tool_name} ({status})"
        elif event_name == "session.start":
            return "Session started"
        elif event_name == "session.end":
            return "Session ended"
        elif event_name.endswith(".error"):
            error_msg = attributes.get("error.message", "Unknown error")
            return f"Error: {error_msg}"
        else:
            return f"Event: {event_name}"

    def _time_ago(self, timestamp: datetime) -> str:
        """Convert timestamp to human-readable relative time."""
        now = datetime.now(timezone.utc)
        diff = now - timestamp

        if diff.total_seconds() < 60:
            return "just now"
        elif diff.total_seconds() < 3600:
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        else:
            days = int(diff.total_seconds() / 86400)
            return f"{days}d ago"

    def get_proxy_config(self) -> Dict[str, Any]:
        """Get proxy configuration information.
        
        Returns:
            Dictionary containing proxy configuration
        """
        return {
            "provider_type": self.proxy_config.get("provider_type", "unknown"),
            "provider_base_url": self.proxy_config.get("provider_base_url", "unknown"),
            "proxy_host": self.proxy_config.get("proxy_host", "127.0.0.1"),
            "proxy_port": self.proxy_config.get("proxy_port", 8080)
        }
