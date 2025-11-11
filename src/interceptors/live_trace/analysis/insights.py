"""Analytics and insights computation for trace data."""
import logging
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Dict, List, Optional

from ..store import TraceStore, AgentData
from .risk_models import RiskAnalysisResult
from .behavioral_analysis import analyze_agent_behavior
from .security_assessment import generate_security_report

logger = logging.getLogger(__name__)

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

    def __init__(self, store: TraceStore, proxy_config: Dict[str, Any] = None):
        self.store = store
        self.proxy_config = proxy_config or {}
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
            "risk_analysis": self._serialize_risk_analysis(risk_analysis) if risk_analysis else None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    def _serialize_risk_analysis(self, risk_analysis) -> Dict[str, Any]:
        """Serialize risk analysis with computed properties included."""
        if not risk_analysis:
            return None
        
        # Get the base dict
        result = risk_analysis.dict() if hasattr(risk_analysis, 'dict') else risk_analysis.model_dump()
        
        # Add computed properties for SecurityReport
        if hasattr(risk_analysis, 'security_report') and risk_analysis.security_report:
            result['security_report']['overall_status'] = risk_analysis.security_report.overall_status
            result['security_report']['total_checks'] = risk_analysis.security_report.total_checks
            result['security_report']['critical_issues'] = risk_analysis.security_report.critical_issues
            result['security_report']['warnings'] = risk_analysis.security_report.warnings
            result['security_report']['passed_checks'] = risk_analysis.security_report.passed_checks
            
            # Add computed properties for each category
            if 'categories' in result['security_report']:
                for category_id, category in risk_analysis.security_report.categories.items():
                    if category_id in result['security_report']['categories']:
                        result['security_report']['categories'][category_id]['highest_severity'] = category.highest_severity
                        result['security_report']['categories'][category_id]['total_checks'] = category.total_checks
                        result['security_report']['categories'][category_id]['passed_checks'] = category.passed_checks
                        result['security_report']['categories'][category_id]['critical_checks'] = category.critical_checks
                        result['security_report']['categories'][category_id]['warning_checks'] = category.warning_checks
        
        return result

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
            # Get session status counts
            agent_session_objects = [
                self.store.sessions[sid] for sid in agent.sessions
                if sid in self.store.sessions
            ]
            active_sessions = len([s for s in agent_session_objects if s.is_active])
            completed_sessions = len([s for s in agent_session_objects if s.is_completed])

            # Compute lightweight risk status for dashboard display
            risk_status = self._compute_agent_risk_status(agent.agent_id)
            
            # Get analysis summary for agents with enough sessions
            analysis_summary = None
            if agent.total_sessions >= MIN_SESSIONS_FOR_RISK_ANALYSIS:
                analysis_summary = self._get_agent_analysis_summary(agent.agent_id)

            agent_data = {
                "id": agent.agent_id,
                "id_short": agent.agent_id[:8] + "..." if len(agent.agent_id) > 8 else agent.agent_id,
                "total_sessions": agent.total_sessions,
                "active_sessions": active_sessions,
                "completed_sessions": completed_sessions,
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
            }
            
            # Add analysis summary if available
            if analysis_summary:
                agent_data["analysis_summary"] = analysis_summary
            
            agents.append(agent_data)

        # Sort by last seen
        agents.sort(key=lambda x: x["last_seen"], reverse=True)
        return agents
    
    def _get_agent_analysis_summary(self, agent_id: str) -> Dict[str, Any]:
        """Get lightweight analysis summary for dashboard display."""
        # Try to get cached or compute fresh analysis
        risk_analysis = self.compute_risk_analysis(agent_id)
        
        logger.info(f"[ANALYSIS SUMMARY] Agent {agent_id}: risk_analysis exists={risk_analysis is not None}, "
                   f"status={risk_analysis.evaluation_status if risk_analysis else None}")
        
        # Accept both COMPLETE and PARTIAL status (PARTIAL = security done, behavioral waiting)
        if not risk_analysis or risk_analysis.evaluation_status not in ["COMPLETE", "PARTIAL"]:
            logger.info(f"[ANALYSIS SUMMARY] Returning None for agent {agent_id} due to status check")
            return None
        
        # Count failed checks and warnings
        failed_checks = 0
        warnings = 0
        
        if risk_analysis.security_report and risk_analysis.security_report.categories:
            for category in risk_analysis.security_report.categories.values():
                failed_checks += category.critical_checks
                warnings += category.warning_checks
        
        # Get behavioral scores (only if analysis is COMPLETE)
        behavioral_summary = None
        if risk_analysis.evaluation_status == "COMPLETE" and risk_analysis.behavioral_analysis:
            # Calculate confidence based on cluster maturity and data volume
            confidence = self._calculate_behavioral_confidence(risk_analysis.behavioral_analysis)
            
            behavioral_summary = {
                "stability": round(risk_analysis.behavioral_analysis.stability_score, 2),
                "predictability": round(risk_analysis.behavioral_analysis.predictability_score, 2),
                "confidence": confidence  # high, medium, or low
            }
        
        # Determine if action is required (any critical issues)
        action_required = failed_checks > 0
        
        # Add session completion status for UX (always include session counts)
        summary = {
            "failed_checks": failed_checks,
            "warnings": warnings,
            "behavioral": behavioral_summary,
            "action_required": action_required,
            "completed_sessions": risk_analysis.summary.get("completed_sessions", 0),
            "active_sessions": risk_analysis.summary.get("active_sessions", 0),
            "total_sessions": risk_analysis.summary.get("total_sessions", 0)
        }
        
        # Add behavioral waiting indicator if applicable
        if risk_analysis.evaluation_status == "PARTIAL":
            summary["behavioral_waiting"] = True
        
        return summary
    
    def _calculate_behavioral_confidence(self, behavioral_analysis) -> str:
        """
        Calculate confidence level based on cluster maturity and data volume.
        
        Confidence Criteria:
        - HIGH: Single cluster with 30-40+ sessions, OR
                2 clusters with 80+ total sessions, OR
                3+ clusters with 150+ total sessions
                AND very low outlier rate (≤5% with 200+ sessions)
        
        - MEDIUM: Meaningful patterns emerging but not enough data
                  OR moderate outlier rate (≤10% with 200+ sessions)
        
        - LOW: Insufficient data for confident analysis
               OR high outlier rate (>10%)
        """
        total_sessions = behavioral_analysis.total_sessions
        num_clusters = behavioral_analysis.num_clusters
        num_outliers = behavioral_analysis.num_outliers
        clusters = behavioral_analysis.clusters
        
        # Calculate outlier rate
        outlier_rate = (num_outliers / total_sessions * 100) if total_sessions > 0 else 0
        
        # Get cluster sizes
        cluster_sizes = [cluster.size for cluster in clusters] if clusters else []
        cluster_sizes.sort(reverse=True)  # Largest first
        
        # Check if we have enough sessions to evaluate outlier rate
        evaluate_outliers = total_sessions >= 200
        
        # If high outlier rate with sufficient data, cap at MEDIUM or LOW
        if evaluate_outliers and outlier_rate > 10:
            # Too many outliers = unpredictable behavior
            return "low"
        
        # HIGH CONFIDENCE CRITERIA
        # Requires substantial data AND low outlier rate
        
        # Single dominant cluster with substantial data
        if num_clusters == 1 and cluster_sizes and cluster_sizes[0] >= 30:
            if evaluate_outliers:
                # With 200+ sessions, need very low outlier rate for high confidence
                if outlier_rate <= 5:
                    return "high"
                else:
                    return "medium"  # Good cluster but moderate outliers
            else:
                return "high"  # Not enough sessions to judge outliers yet
        
        # Two clusters with significant data
        if num_clusters == 2 and cluster_sizes and len(cluster_sizes) >= 2:
            total_in_clusters = sum(cluster_sizes[:2])
            if total_in_clusters >= 80:
                if evaluate_outliers:
                    if outlier_rate <= 5:
                        return "high"
                    else:
                        return "medium"  # Good clusters but moderate outliers
                else:
                    return "high"
        
        # Three or more clusters with substantial data
        if num_clusters >= 3 and cluster_sizes and len(cluster_sizes) >= 3:
            total_in_clusters = sum(cluster_sizes[:3])
            if total_in_clusters >= 150:
                if evaluate_outliers:
                    if outlier_rate <= 5:
                        return "high"
                    else:
                        return "medium"  # Good clusters but moderate outliers
                else:
                    return "high"
        
        # MEDIUM CONFIDENCE CRITERIA
        # Patterns emerging but need more data
        # OR good patterns but moderate outlier rate (5-10%)
        
        if num_clusters == 1 and cluster_sizes and cluster_sizes[0] >= 15:
            if evaluate_outliers and outlier_rate > 10:
                return "low"
            return "medium"
        
        if num_clusters == 2 and cluster_sizes and len(cluster_sizes) >= 2:
            total_in_clusters = sum(cluster_sizes[:2])
            if total_in_clusters >= 40:
                if evaluate_outliers and outlier_rate > 10:
                    return "low"
                return "medium"
        
        if num_clusters >= 3 and cluster_sizes and len(cluster_sizes) >= 3:
            total_in_clusters = sum(cluster_sizes[:3])
            if total_in_clusters >= 75:
                if evaluate_outliers and outlier_rate > 10:
                    return "low"
                return "medium"
        
        # LOW CONFIDENCE - insufficient data or unpredictable behavior
        return "low"

    @_with_store_lock
    def _get_recent_sessions(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent sessions with summary data."""
        sessions = []
        for session in self.store.sessions.values():
            # Determine user-friendly status
            if session.is_completed:
                status = "COMPLETE"
            elif session.is_active:
                status = "ACTIVE"
            else:
                status = "INACTIVE"
            
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
                "is_completed": session.is_completed,
                "status": status,  # User-friendly: ACTIVE, COMPLETE, or INACTIVE
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
        agent_sessions = [
            self.store.sessions[sid] for sid in agent.sessions
            if sid in self.store.sessions
        ]
        
        # Check minimum session requirement
        if len(agent_sessions) < MIN_SESSIONS_FOR_RISK_ANALYSIS:
            return RiskAnalysisResult(
                evaluation_id=str(uuid.uuid4()),
                agent_id=agent_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                sessions_analyzed=len(agent_sessions),
                evaluation_status="INSUFFICIENT_DATA",
                error=f"Need at least {MIN_SESSIONS_FOR_RISK_ANALYSIS} sessions for analysis (have {len(agent_sessions)})",
                summary={
                    "min_sessions_required": MIN_SESSIONS_FOR_RISK_ANALYSIS,
                    "current_sessions": len(agent_sessions),
                    "sessions_needed": MIN_SESSIONS_FOR_RISK_ANALYSIS - len(agent_sessions)
                }
            )
        
        # Count completed sessions for cache key
        completed_count = len([s for s in agent_sessions if s.is_completed])
        
        # Check cache (invalidate if session count OR completion count changed)
        cache_key = (len(agent_sessions), completed_count)
        if agent_id in self._risk_analysis_cache:
            cached_result, cached_time, cached_key = self._risk_analysis_cache[agent_id]
            # Cache valid for 30 seconds and same session/completion counts
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < 30 and \
               cached_key == cache_key:
                return cached_result
        
        try:
            # Count completed vs active sessions for status reporting
            completed_sessions = [s for s in agent_sessions if s.is_completed]
            active_sessions_count = len(agent_sessions) - len(completed_sessions)
            
            logger.info(f"[RISK ANALYSIS] Agent {agent_id}: {len(agent_sessions)} total sessions, "
                       f"{len(completed_sessions)} completed, {active_sessions_count} active")
            
            # Run behavioral analysis with frozen percentiles
            # Percentiles are calculated once and never change (stability)
            # Signatures are computed once per session and stored (efficiency)
            behavioral_result, frozen_percentiles = analyze_agent_behavior(
                agent_sessions, 
                cached_percentiles=agent.cached_percentiles
            )
            
            # Store frozen percentiles if this is the first calculation
            if agent.cached_percentiles is None and frozen_percentiles is not None:
                agent.cached_percentiles = frozen_percentiles
                agent.percentiles_session_count = len(completed_sessions)
                logger.info(f"[PERCENTILE FREEZE] Froze percentiles for agent {agent_id} at {len(completed_sessions)} sessions")
            
            logger.info(f"[RISK ANALYSIS] Behavioral analysis result: total_sessions={behavioral_result.total_sessions}, "
                       f"num_clusters={behavioral_result.num_clusters}, error={behavioral_result.error}")
            
            behavioral_status = "COMPLETE" if behavioral_result.total_sessions >= 2 else "WAITING_FOR_COMPLETION"

            # Run PII analysis (works on all sessions - doesn't need completion)
            # Import lazily to avoid slow startup from presidio-analyzer
            pii_result = None
            try:
                from .pii_analysis import analyze_sessions_for_pii
                pii_result = analyze_sessions_for_pii(agent_sessions)
                logger.info(f"PII analysis completed: {pii_result.total_findings} findings")
            except Exception as e:
                logger.warning(f"PII analysis failed (continuing without PII checks): {e}")

            # Run security assessment - generates complete security report
            # Security analysis works on all sessions (doesn't require completion)
            security_report = generate_security_report(
                agent_id,
                agent_sessions,
                behavioral_result,
                pii_result
            )

            # Determine overall evaluation status
            if behavioral_status == "COMPLETE":
                evaluation_status = "COMPLETE"
            else:
                evaluation_status = "PARTIAL"  # Security done, behavioral waiting
            
            # Create summary with session status info
            summary = {
                "critical_issues": security_report.critical_issues,
                "warnings": security_report.warnings,
                "stability_score": behavioral_result.stability_score,
                "predictability_score": behavioral_result.predictability_score,
                # Add session completion status for UX
                "total_sessions": len(agent_sessions),
                "completed_sessions": len(completed_sessions),
                "active_sessions": active_sessions_count,
                "behavioral_status": behavioral_status,
                "behavioral_message": behavioral_result.interpretation if hasattr(behavioral_result, 'interpretation') else None
            }

            # Add PII summary if available
            if pii_result:
                if pii_result.disabled:
                    # PII analysis is disabled
                    summary["pii_disabled"] = True
                    summary["pii_disabled_reason"] = pii_result.disabled_reason
                else:
                    # PII analysis worked normally
                    summary["pii_findings"] = pii_result.total_findings
                    summary["sessions_with_pii"] = pii_result.sessions_with_pii

            result = RiskAnalysisResult(
                evaluation_id=str(uuid.uuid4()),
                agent_id=agent_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                sessions_analyzed=len(agent_sessions),
                evaluation_status=evaluation_status,
                behavioral_analysis=behavioral_result,
                security_report=security_report,
                pii_analysis=pii_result,
                summary=summary
            )

            # Cache the result with session and completion counts
            self._risk_analysis_cache[agent_id] = (result, datetime.now(timezone.utc), cache_key)

            return result
            
        except Exception as e:
            logger.error(f"[RISK ANALYSIS] Exception in risk analysis for agent {agent_id}: {e}", exc_info=True)
            return RiskAnalysisResult(
                evaluation_id=str(uuid.uuid4()),
                agent_id=agent_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                sessions_analyzed=len(agent_sessions),
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
