"""Analytics and insights computation for trace data."""
import json
import uuid
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.utils.logger import get_logger
from .store import TraceStore, AgentData
from .risk_models import RiskAnalysisResult
from .behavioral_analysis import analyze_agent_behavior
from .security_assessment import generate_security_report

logger = get_logger(__name__)

# Minimum sessions required for risk analysis
MIN_SESSIONS_FOR_RISK_ANALYSIS = 5


def _with_store_lock(func):
    """Ensure the wrapped method executes with the trace store lock held."""

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        with self.store.lock:
            return func(self, *args, **kwargs)

    return wrapper


class InsightsEngine:
    """Computes various insights from trace data."""

    def __init__(self, store: TraceStore, proxy_config: Dict[str, Any] = None, event_logs_dir: Optional[str] = None):
        self.store = store
        self.proxy_config = proxy_config or {}
        self.event_logs_dir = Path(event_logs_dir) if event_logs_dir else Path("./event_logs")
        # Cache for risk analysis results
        self._risk_analysis_cache: Dict[str, tuple] = {}  # {agent_id: (result, timestamp, session_count)}

    @_with_store_lock
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get all data needed for the main dashboard."""
        agents = self._get_agent_summary()
        sessions = self._get_recent_sessions()
        latest_session = self._get_latest_active_session()

        return {
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

        # Compute risk analysis
        risk_analysis = self.compute_risk_analysis(agent_id)

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
            "risk_analysis": risk_analysis.dict() if risk_analysis else None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    def _load_events_from_log_file(self, session_id: str) -> List[Dict[str, Any]]:
        """Try to load events from event_logs file for this session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            List of event dictionaries, or empty list if file not found
        """
        try:
            # Sanitize session ID for filename (same as event_recorder)
            safe_session_id = "".join(c for c in session_id if c.isalnum() or c in ('-', '_'))
            if not safe_session_id:
                return []
            
            # Try to find the log file
            log_file = self.event_logs_dir / f"session_{safe_session_id}.jsonl"
            
            if not log_file.exists():
                return []
            
            # Read and parse JSONL file
            events = []
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        event_data = json.loads(line.strip())
                        # Skip metadata line
                        if "_metadata" in event_data:
                            continue
                        # Convert to format expected by frontend
                        events.append({
                            "id": event_data.get("span_id", "unknown"),
                            "name": event_data.get("name", "unknown"),
                            "timestamp": event_data.get("timestamp", ""),
                            "level": event_data.get("level", "info"),
                            "attributes": event_data.get("attributes", {}),
                            "session_id": event_data.get("session_id", session_id)
                        })
                    except json.JSONDecodeError:
                        continue
            
            logger.info(f"Loaded {len(events)} events from log file for session {session_id}")
            return events
            
        except Exception as e:
            logger.debug(f"Could not load event log file for session {session_id}: {e}")
            return []

    @_with_store_lock
    def get_session_data(self, session_id: str) -> Dict[str, Any]:
        """Get detailed data for a specific session."""
        session = self.store.sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}

        # First, try to get events from memory (for active sessions)
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

        # If no events in memory but session has metrics, try loading from event_logs
        has_event_history = len(events) > 0
        history_message = None
        
        if not has_event_history and session.total_events > 0:
            # Try to load from event_logs file
            logged_events = self._load_events_from_log_file(session_id)
            if logged_events:
                events = logged_events
                has_event_history = True
            else:
                # No event log file found - show informative message
                history_message = (
                    "This session was restored from persistent storage. "
                    "Summary metrics are available, but individual event details "
                    "are only kept in memory for active sessions. "
                    "Enable the event_recorder interceptor to preserve full event history."
                )

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
                "available_tools": list(session.available_tools),
                "has_event_history": has_event_history,
                "history_message": history_message
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

            # Compute lightweight risk status for dashboard display
            risk_status = self._compute_agent_risk_status(agent.agent_id)

            agents.append({
                "id": agent.agent_id,
                "id_short": agent.agent_id[:8] + "..." if len(agent.agent_id) > 8 else agent.agent_id,
                "total_sessions": agent.total_sessions,
                "active_sessions": active_sessions,
                "total_messages": agent.total_messages,
                "total_tokens": agent.total_tokens,
                "total_tools": agent.total_tools,
                "unique_tools": len(agent.used_tools),
                "total_errors": agent.total_errors,
                "avg_response_time_ms": agent.avg_response_time_ms,
                "last_seen": agent.last_seen.isoformat(),
                "last_seen_relative": self._time_ago(agent.last_seen),
                "risk_status": risk_status,  # "ok", "warning", "evaluating", or None
                "current_sessions": agent.total_sessions,
                "min_sessions_required": MIN_SESSIONS_FOR_RISK_ANALYSIS
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

    def compute_risk_analysis(self, agent_id: str) -> Optional[RiskAnalysisResult]:
        """Compute risk analysis for an agent (behavioral + security).
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            RiskAnalysisResult or None if insufficient sessions
        """
        agent = self.store.agents.get(agent_id)
        if not agent:
            return None
        
        # Get all sessions for this agent
        all_agent_sessions = [
            self.store.sessions[sid] for sid in agent.sessions
            if sid in self.store.sessions
        ]
        
        # For historical sessions without events, check if we have cached features
        # If not, try to load from event_logs and extract features
        sessions_with_features = []
        from .behavioral_analysis import extract_session_features
        
        for session in all_agent_sessions:
            # Check if session has cached behavioral features
            if hasattr(session, 'behavioral_features') and session.behavioral_features:
                # Use cached features (much faster!)
                sessions_with_features.append(session)
                logger.debug(f"Using cached behavioral features for session {session.session_id}")
            elif len(session.events) > 0:
                # Session has events in memory - can extract features
                sessions_with_features.append(session)
            else:
                # Try to load events from log file and extract features
                logged_events = self._load_events_from_log_file(session.session_id)
                if logged_events:
                    # Temporarily populate session.events for feature extraction
                    from collections import deque
                    from src.events import BaseEvent, EventName, EventLevel
                    
                    temp_events = deque(maxlen=1000)
                    for event_data in logged_events:
                        try:
                            # Reconstruct minimal event object for feature extraction
                            event = BaseEvent(
                                name=EventName(event_data.get("name", "unknown")),
                                session_id=event_data.get("session_id", session.session_id),
                                trace_id=event_data.get("attributes", {}).get("trace_id", "unknown"),
                                span_id=event_data.get("id", "unknown"),
                                agent_id=session.agent_id,
                                timestamp=event_data.get("timestamp", ""),
                                level=EventLevel(event_data.get("level", "info")),
                                attributes=event_data.get("attributes", {})
                            )
                            temp_events.append(event)
                        except Exception as e:
                            logger.debug(f"Could not reconstruct event for analysis: {e}")
                            continue
                    
                    if temp_events:
                        # Create a temporary copy of session with events
                        import copy
                        session_copy = copy.copy(session)
                        session_copy.events = temp_events
                        
                        # Extract and cache behavioral features + MinHash signature for future use
                        try:
                            from .behavioral_analysis import features_to_shingles, MinHashSignature
                            
                            features = extract_session_features(session_copy)
                            session_copy.behavioral_features = features.dict()
                            
                            # Also compute and cache MinHash signature
                            shingles = features_to_shingles(features)
                            minhash = MinHashSignature(num_hashes=512)
                            signature = minhash.compute_signature(shingles)
                            session_copy.minhash_signature = signature
                            
                            # Cache on the original session for persistence
                            session.behavioral_features = features.dict()
                            session.minhash_signature = signature
                            
                            logger.info(f"Extracted and cached behavioral features + signature for session {session.session_id}")
                        except Exception as e:
                            logger.warning(f"Could not extract features for session {session.session_id}: {e}")
                        
                        sessions_with_features.append(session_copy)
        
        agent_sessions_with_events = sessions_with_features
        
        # Check minimum session requirement
        if len(agent_sessions_with_events) < MIN_SESSIONS_FOR_RISK_ANALYSIS:
            return RiskAnalysisResult(
                evaluation_id=str(uuid.uuid4()),
                agent_id=agent_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                sessions_analyzed=len(agent_sessions_with_events),
                evaluation_status="INSUFFICIENT_DATA",
                error=f"Need at least {MIN_SESSIONS_FOR_RISK_ANALYSIS} sessions with event data for analysis (have {len(agent_sessions_with_events)} of {len(all_agent_sessions)} total sessions)",
                summary={
                    "min_sessions_required": MIN_SESSIONS_FOR_RISK_ANALYSIS,
                    "current_sessions_with_events": len(agent_sessions_with_events),
                    "total_sessions": len(all_agent_sessions),
                    "sessions_needed": MIN_SESSIONS_FOR_RISK_ANALYSIS - len(agent_sessions_with_events),
                    "note": "Historical sessions without in-memory events cannot be analyzed. Enable event_recorder or view active sessions for full analysis."
                }
            )
        
        # Check cache (invalidate if session count changed)
        if agent_id in self._risk_analysis_cache:
            cached_result, cached_time, cached_session_count = self._risk_analysis_cache[agent_id]
            # Cache valid for 30 seconds and same session count
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < 30 and \
               cached_session_count == len(agent_sessions_with_events):
                return cached_result
        
        try:
            # Run behavioral analysis on sessions with events
            behavioral_result = analyze_agent_behavior(agent_sessions_with_events)

            # Run security assessment - generates complete security report
            security_report = generate_security_report(agent_id, agent_sessions_with_events, behavioral_result)

            # Create summary
            summary = {
                "critical_issues": security_report.critical_issues,
                "warnings": security_report.warnings,
                "stability_score": behavioral_result.stability_score,
                "predictability_score": behavioral_result.predictability_score
            }

            result = RiskAnalysisResult(
                evaluation_id=str(uuid.uuid4()),
                agent_id=agent_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                sessions_analyzed=len(agent_sessions_with_events),
                evaluation_status="COMPLETE",
                behavioral_analysis=behavioral_result,
                security_report=security_report,
                summary=summary
            )

            # Cache the result
            self._risk_analysis_cache[agent_id] = (result, datetime.now(timezone.utc), len(agent_sessions_with_events))

            return result
            
        except Exception as e:
            return RiskAnalysisResult(
                evaluation_id=str(uuid.uuid4()),
                agent_id=agent_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                sessions_analyzed=len(agent_sessions_with_events) if 'agent_sessions_with_events' in locals() else 0,
                evaluation_status="ERROR",
                error=f"Risk analysis failed: {str(e)}"
            )

    def _compute_agent_risk_status(self, agent_id: str) -> Optional[str]:
        """Compute lightweight risk status for dashboard display.

        Returns:
            "ok" - Has enough sessions and no critical issues
            "warning" - Has enough sessions and has critical issues
            "evaluating" - Not enough sessions yet
            None - No data or error
        """
        agent = self.store.agents.get(agent_id)
        if not agent:
            return None

        # Get all sessions for this agent
        agent_sessions = [
            self.store.sessions[sid] for sid in agent.sessions
            if sid in self.store.sessions
        ]

        # Check if we have enough sessions for analysis
        if len(agent_sessions) < MIN_SESSIONS_FOR_RISK_ANALYSIS:
            # Only show "evaluating" if we have at least 1 session
            return "evaluating" if len(agent_sessions) > 0 else None

        # Check cache for existing analysis
        if agent_id in self._risk_analysis_cache:
            cached_result, cached_time, cached_session_count = self._risk_analysis_cache[agent_id]
            # Use cache if still valid (30 seconds and same session count)
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < 30 and \
               cached_session_count == len(agent_sessions):
                if cached_result.evaluation_status == 'COMPLETE' and cached_result.security_report:
                    # Check for critical issues
                    has_critical = False
                    if cached_result.security_report.categories:
                        for category in cached_result.security_report.categories.values():
                            if category.critical_checks > 0:
                                has_critical = True
                                break
                    return "warning" if has_critical else "ok"

        # If no cache available, return "ok" as default (full analysis runs lazily)
        return "ok"

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
