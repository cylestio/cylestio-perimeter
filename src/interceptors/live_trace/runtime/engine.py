"""Analytics and insights computation for trace data."""
import asyncio
import logging
import threading
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Dict, List, Optional

from ..store import TraceStore
from ..store.store import AgentData, SessionData
from .models import RiskAnalysisResult
from .behavioral import analyze_agent_behavior
from .security import generate_security_report

logger = logging.getLogger(__name__)

# Minimum sessions required for risk analysis
# Minimum sessions required - per Phase 4 spec, users can analyze with 1+ sessions
# Behavioral analysis may be less meaningful with few sessions, but it's their choice
MIN_SESSIONS_FOR_RISK_ANALYSIS = 1


def _with_store_lock(func):
    """Ensure the wrapped method executes with the trace store lock held."""

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        with self.store.lock:
            return func(self, *args, **kwargs)


    return wrapper


class AnalysisEngine:
    """Computes various insights and analysis from trace data.

    This is the pure computation component. Analysis orchestration (when to run,
    state tracking, persistence) is handled by AnalysisRunner.

    Main computation method:
    - compute_risk_analysis() - Behavioral + Security + PII analysis

    PII Analysis Safety Guarantees:
    -------------------------------
    1. At most one PII analysis runs per agent at any time
    2. Running PII tasks are never cancelled, stopped, or ignored
    3. New sessions trigger fresh analysis only after previous task completes
    4. All task launch decisions are protected by _pii_launch_lock (no race conditions)
    5. Main code path never blocks - PII runs in background threads

    Deadlock Prevention:
    -------------------
    - _pii_launch_lock (threading.Lock) is held only for fast dictionary operations (< 1ms)
    - Lock is synchronous (threading.Lock not asyncio.Lock) to avoid event loop issues
    - No await occurs while holding the lock (helper method is synchronous)
    - No nested locking or lock ordering issues
    - Background tasks use asyncio.to_thread to avoid blocking event loop
    """

    def __init__(self, store: TraceStore, proxy_config: Dict[str, Any] = None):
        self.store = store
        self.proxy_config = proxy_config or {}
        self.enable_presidio = proxy_config.get("enable_presidio", True)
        # Cache for risk analysis results
        self._risk_analysis_cache: Dict[str, tuple] = {}  # {agent_id: (result, timestamp, cache_key)}
        # Background task tracking for PII analysis
        self._pii_analysis_tasks: Dict[str, Any] = {}  # {agent_id: asyncio.Task}
        self._pii_results_cache: Dict[str, tuple] = {}  # {agent_id: (PIIAnalysisResult, cache_key)}
        # Lock to prevent concurrent PII task launches for same agent
        # Use threading.Lock since __init__ runs in synchronous context (no event loop)
        self._pii_launch_lock = threading.Lock()
        # Semaphore to limit concurrent PII analyses (CPU-bound, causes contention)
        # Lazy initialized since we can't create asyncio.Semaphore without event loop
        self._pii_semaphore: Optional[asyncio.Semaphore] = None
        self._pii_max_concurrent = proxy_config.get("pii_max_concurrent", 2)

    async def get_dashboard_data(self, agent_workflow_id: Optional[str] = None) -> Dict[str, Any]:
        """Get all data needed for the main dashboard.

        Args:
            agent_workflow_id: Optional agent workflow ID to filter by.
                        Use "unassigned" to get agents/sessions with no agent workflow.
                        None returns all data.
        """
        # Agent summary runs analysis outside the lock
        agents = await self._get_agent_summary(agent_workflow_id=agent_workflow_id)

        # Get sessions count and latest session (need lock for data access)
        with self.store.lock:
            # Use efficient count query instead of fetching all sessions
            sessions_count = self.store.count_sessions_filtered(
                agent_workflow_id=agent_workflow_id if agent_workflow_id != "unassigned" else "unassigned",
            )
            latest_session = self._get_latest_active_session(agent_workflow_id=agent_workflow_id)

        return {
            "agents": agents,
            "sessions_count": sessions_count,
            "latest_session": latest_session,
            "agent_workflow_id": agent_workflow_id,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    async def get_agent_data(self, agent_id: str) -> Dict[str, Any]:
        """Get detailed data for a specific agent."""
        # Get agent and sessions data while holding lock
        with self.store.lock:
            agent = self.store.get_agent(agent_id)
            if not agent:
                return {"error": "Agent not found"}

            # Get agent's sessions for computing average duration
            sessions = self.store.get_agent_sessions(agent_id)

            # Calculate average duration in minutes
            durations = [s.duration_minutes for s in sessions if s.duration_minutes > 0]
            avg_duration_minutes = round(sum(durations) / len(durations), 2) if durations else 0.0

            # Calculate tools utilization percentage
            tools_utilization = 0.0
            if len(agent.available_tools) > 0:
                tools_utilization = (len(agent.used_tools) / len(agent.available_tools)) * 100

            # Store agent attributes we need
            agent_dict = {
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
                "avg_duration_minutes": avg_duration_minutes,
                "tool_usage_details": dict(agent.tool_usage_details),
                "available_tools": list(agent.available_tools),
                "used_tools": list(agent.used_tools),
                "tools_utilization_percent": round(tools_utilization, 1)
            }

            patterns = self._analyze_agent_patterns(agent)

            # Compute analytics data
            analytics = self._compute_agent_analytics(agent, sessions)

        # Read persisted risk analysis from DB (no longer compute inline)
        risk_analysis = self.get_persisted_risk_analysis(agent_id)
        if not risk_analysis:
            # No persisted analysis - return status based on session count
            risk_analysis = self._get_pending_analysis_status(agent_id)

        return {
            "agent": agent_dict,
            "patterns": patterns,
            "analytics": analytics,
            "risk_analysis": risk_analysis,
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

        # Add computed properties for BehavioralAnalysis
        if hasattr(risk_analysis, 'behavioral_analysis') and risk_analysis.behavioral_analysis:
            # Calculate and add confidence level
            confidence = self._calculate_behavioral_confidence(risk_analysis.behavioral_analysis)
            result['behavioral_analysis']['confidence'] = confidence

        return result

    def get_persisted_risk_analysis(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get latest persisted risk analysis from DB.

        Reads security checks and behavioral analysis from the database
        and reconstructs the API-compatible format.

        Args:
            agent_id: The agent ID to get analysis for

        Returns:
            Dict with analysis data matching _serialize_risk_analysis output,
            or None if no analysis exists
        """
        security_checks = self.store.get_latest_security_checks_for_agent(agent_id)
        if not security_checks:
            return None
        return self._reconstruct_analysis_from_checks(agent_id, security_checks)

    def _reconstruct_analysis_from_checks(
        self,
        agent_id: str,
        checks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Reconstruct analysis from persisted security checks.

        Converts flat DB records back to the nested structure expected by API.
        Also fetches behavioral analysis from DB if available.
        """
        # Group checks by category
        categories = {}
        for check in checks:
            cat_id = check['category_id']
            if cat_id not in categories:
                categories[cat_id] = {
                    'category_id': cat_id,
                    'category_name': cat_id.replace('_', ' ').title(),
                    'checks': [],
                    'critical_checks': 0,
                    'warning_checks': 0,
                    'passed_checks': 0,
                    'total_checks': 0,
                    'highest_severity': 'passed'
                }

            categories[cat_id]['checks'].append({
                'check_id': check['check_id'],
                'check_type': check['check_type'],
                'name': check['title'],
                'description': check['description'],
                'status': check['status'],
                'value': check['value'],
                'evidence': check['evidence'],
                'recommendations': check['recommendations'],
            })
            categories[cat_id]['total_checks'] += 1

            status = check['status']
            if status == 'critical':
                categories[cat_id]['critical_checks'] += 1
                categories[cat_id]['highest_severity'] = 'critical'
            elif status == 'warning':
                categories[cat_id]['warning_checks'] += 1
                if categories[cat_id]['highest_severity'] != 'critical':
                    categories[cat_id]['highest_severity'] = 'warning'
            else:
                categories[cat_id]['passed_checks'] += 1

        # Compute summary totals
        total_critical = sum(c['critical_checks'] for c in categories.values())
        total_warnings = sum(c['warning_checks'] for c in categories.values())
        total_passed = sum(c['passed_checks'] for c in categories.values())
        total_checks = sum(c['total_checks'] for c in categories.values())

        # Determine overall status
        if total_critical > 0:
            overall_status = 'critical'
        elif total_warnings > 0:
            overall_status = 'warning'
        else:
            overall_status = 'passed'

        # Get analysis session metadata from first check
        analysis_session_id = checks[0]['analysis_session_id'] if checks else None
        timestamp = checks[0]['created_at'] if checks else None

        # Get behavioral analysis from DB
        behavioral_dict = self.store.get_latest_behavioral_analysis(agent_id)
        behavioral_analysis = None
        behavioral_status = 'NOT_AVAILABLE'

        if behavioral_dict:
            behavioral_status = 'COMPLETE'
            # Calculate confidence based on cluster maturity
            confidence = 'low'
            if behavioral_dict['num_clusters'] >= 3 and behavioral_dict['total_sessions'] >= 10:
                confidence = 'high'
            elif behavioral_dict['num_clusters'] >= 2 and behavioral_dict['total_sessions'] >= 5:
                confidence = 'medium'

            behavioral_analysis = {
                'total_sessions': behavioral_dict['total_sessions'],
                'num_clusters': behavioral_dict['num_clusters'],
                'num_outliers': behavioral_dict['num_outliers'],
                'stability_score': behavioral_dict['stability_score'],
                'predictability_score': behavioral_dict['predictability_score'],
                'cluster_diversity': behavioral_dict['cluster_diversity'],
                'clusters': behavioral_dict['clusters'],
                'outliers': behavioral_dict['outliers'],
                'centroid_distances': behavioral_dict['centroid_distances'],
                'interpretation': behavioral_dict['interpretation'],
                'confidence': confidence,
            }

        # Get session counts for the agent
        with self.store.lock:
            agent_sessions = self.store.get_agent_sessions(agent_id)
            completed_count = sum(1 for s in agent_sessions if s.is_completed)
            active_count = sum(1 for s in agent_sessions if s.is_active and not s.is_completed)

        return {
            'evaluation_id': analysis_session_id,
            'evaluation_status': 'COMPLETE' if behavioral_analysis else 'PARTIAL',
            'agent_id': agent_id,
            'timestamp': timestamp,
            'sessions_analyzed': len(agent_sessions) if agent_sessions else 0,
            'security_report': {
                'report_id': analysis_session_id,
                'agent_id': agent_id,
                'timestamp': timestamp,
                'sessions_analyzed': len(agent_sessions) if agent_sessions else 0,
                'overall_status': overall_status,
                'total_checks': total_checks,
                'critical_issues': total_critical,
                'warnings': total_warnings,
                'passed_checks': total_passed,
                'categories': categories,
            },
            'behavioral_analysis': behavioral_analysis,
            'pii_analysis': None,  # PII not persisted
            'summary': {
                'critical_issues': total_critical,
                'warnings': total_warnings,
                'stability_score': behavioral_analysis['stability_score'] if behavioral_analysis else None,
                'predictability_score': behavioral_analysis['predictability_score'] if behavioral_analysis else None,
                'total_sessions': len(agent_sessions) if agent_sessions else 0,
                'completed_sessions': completed_count,
                'active_sessions': active_count,
                'behavioral_status': behavioral_status,
                'pii_status': 'NOT_PERSISTED',
            }
        }

    def _get_pending_analysis_status(self, agent_id: str) -> Dict[str, Any]:
        """Get analysis status when no persisted analysis exists.

        Returns appropriate status based on session count.
        """
        with self.store.lock:
            agent_sessions = self.store.get_agent_sessions(agent_id)
            session_count = len(agent_sessions) if agent_sessions else 0
            completed_count = sum(1 for s in agent_sessions if s.is_completed) if agent_sessions else 0

        if session_count < MIN_SESSIONS_FOR_RISK_ANALYSIS:
            return {
                'evaluation_status': 'INSUFFICIENT_DATA',
                'agent_id': agent_id,
                'summary': {
                    'min_sessions_required': MIN_SESSIONS_FOR_RISK_ANALYSIS,
                    'current_sessions': session_count,
                    'completed_sessions': completed_count,
                    'message': f'Analysis requires {MIN_SESSIONS_FOR_RISK_ANALYSIS} sessions. Currently have {session_count}.'
                }
            }
        else:
            return {
                'evaluation_status': 'PENDING',
                'agent_id': agent_id,
                'summary': {
                    'current_sessions': session_count,
                    'completed_sessions': completed_count,
                    'message': 'Analysis will run when sessions complete.'
                }
            }

    def _extract_system_prompt(self, events: List[Any]) -> Optional[str]:
        """Extract system prompt from the first llm.call.start event.

        Supports both OpenAI and Anthropic formats:
        - Anthropic: system prompt in llm.request.data.system
        - OpenAI: system message in llm.request.data.messages with role="system"
        - OpenAI Responses API: llm.request.data.instructions
        """
        for event in events:
            if event.name.value == "llm.call.start":
                request_data = event.attributes.get("llm.request.data", {})
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

    @_with_store_lock
    def get_session_data(self, session_id: str) -> Dict[str, Any]:
        """Get detailed data for a specific session."""
        session = self.store.get_session(session_id)
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

        # Extract model and provider from first llm.call.start event
        model = None
        provider = None
        for event in events:
            if event["name"] == "llm.call.start":
                attrs = event.get("attributes", {})
                model = attrs.get("llm.model")
                provider = attrs.get("llm.vendor")
                break

        return {
            "session": {
                "id": session_id,
                "agent_id": session.agent_id,
                "agent_workflow_id": session.agent_workflow_id,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "duration_minutes": session.duration_minutes,
                "is_active": session.is_active,
                "is_completed": session.is_completed,
                "model": model,
                "provider": provider,
                "total_events": session.total_events,
                "message_count": session.message_count,
                "tool_uses": session.tool_uses,
                "errors": session.errors,
                "total_tokens": session.total_tokens,
                "avg_response_time_ms": session.avg_response_time_ms,
                "error_rate": session.error_rate,
                "tool_usage_details": dict(session.tool_usage_details),
                "available_tools": list(session.available_tools),
                "system_prompt": self._extract_system_prompt(session.events),
                "tags": session.tags,
            },
            "events": events,
            "timeline": self._create_session_timeline(events),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    async def _get_agent_summary(self, agent_workflow_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get summary data for all agents (metrics are maintained incrementally).

        Args:
            agent_workflow_id: Optional workflow ID to filter by.
        """
        agents = []

        # Get all agents while holding the lock
        with self.store.lock:
            all_agents = list(self.store.get_all_agents(agent_workflow_id=agent_workflow_id))

        # Process each agent (analysis runs outside the lock)
        for agent in all_agents:
            # Get session status counts (need lock for this)
            with self.store.lock:
                agent_session_objects = self.store.get_agent_sessions(agent.agent_id)
                active_sessions = len([s for s in agent_session_objects if s.is_active])
                completed_sessions = len([s for s in agent_session_objects if s.is_completed])

            # Compute lightweight risk status for dashboard display
            risk_status = self._compute_agent_risk_status(agent.agent_id)

            # Get analysis summary for agents with enough sessions
            # This runs OUTSIDE the lock and uses background threads for PII
            analysis_summary = None
            if agent.total_sessions >= MIN_SESSIONS_FOR_RISK_ANALYSIS:
                analysis_summary = await self._get_agent_analysis_summary(agent.agent_id)

            agent_data = {
                "id": agent.agent_id,
                "id_short": agent.agent_id[:8] + "..." if len(agent.agent_id) > 8 else agent.agent_id,
                "agent_workflow_id": agent.agent_workflow_id,
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

    async def _get_agent_analysis_summary(self, agent_id: str) -> Dict[str, Any]:
        """Get lightweight analysis summary for dashboard display."""
        # Read persisted analysis from DB (no longer compute inline)
        risk_analysis = self.get_persisted_risk_analysis(agent_id)

        logger.debug(f"[ANALYSIS SUMMARY] Agent {agent_id}: risk_analysis exists={risk_analysis is not None}, "
                   f"status={risk_analysis.get('evaluation_status') if risk_analysis else None}")

        # Accept both COMPLETE and PARTIAL status (PARTIAL = security done, behavioral waiting)
        if not risk_analysis or risk_analysis.get('evaluation_status') not in ["COMPLETE", "PARTIAL"]:
            logger.debug(f"[ANALYSIS SUMMARY] Returning None for agent {agent_id} due to status check")
            return None

        # Count failed checks and warnings from dict structure
        failed_checks = 0
        warnings = 0

        security_report = risk_analysis.get('security_report')
        if security_report and security_report.get('categories'):
            for category in security_report['categories'].values():
                failed_checks += category.get('critical_checks', 0)
                warnings += category.get('warning_checks', 0)

        # Get behavioral scores (only if analysis is COMPLETE)
        behavioral_summary = None
        behavioral_analysis = risk_analysis.get('behavioral_analysis')
        if risk_analysis.get('evaluation_status') == "COMPLETE" and behavioral_analysis:
            # Confidence is already computed in _reconstruct_analysis_from_checks
            confidence = behavioral_analysis.get('confidence', 'low')

            behavioral_summary = {
                "stability": round(behavioral_analysis.get('stability_score', 0), 2),
                "predictability": round(behavioral_analysis.get('predictability_score', 0), 2),
                "confidence": confidence
            }

        # Determine if action is required (any critical issues)
        action_required = failed_checks > 0

        # Add session completion status for UX (always include session counts)
        analysis_summary = risk_analysis.get('summary', {})
        summary = {
            "failed_checks": failed_checks,
            "warnings": warnings,
            "behavioral": behavioral_summary,
            "action_required": action_required,
            "completed_sessions": analysis_summary.get("completed_sessions", 0),
            "active_sessions": analysis_summary.get("active_sessions", 0),
            "total_sessions": analysis_summary.get("total_sessions", 0)
        }

        # Add behavioral waiting indicator if applicable
        if risk_analysis.get('evaluation_status') == "PARTIAL":
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
    def _get_recent_sessions(self, limit: int = 20, agent_workflow_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent sessions with summary data.

        Args:
            limit: Maximum number of sessions to return.
            agent_workflow_id: Optional workflow ID to filter by.
        """
        sessions = []
        all_sessions = self.store.get_all_sessions()

        # Filter by agent_workflow_id if specified
        if agent_workflow_id is not None:
            if agent_workflow_id == "unassigned":
                all_sessions = [s for s in all_sessions if s.agent_workflow_id is None]
            else:
                all_sessions = [s for s in all_sessions if s.agent_workflow_id == agent_workflow_id]

        for session in all_sessions:
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
    def _get_latest_active_session(self, agent_workflow_id: Optional[str] = None) -> Dict[str, Any] | None:
        """Get the most recent active session.

        Args:
            agent_workflow_id: Optional workflow ID to filter by.
        """
        all_sessions = self.store.get_all_sessions()

        # Filter by agent_workflow_id if specified
        if agent_workflow_id is not None:
            if agent_workflow_id == "unassigned":
                all_sessions = [s for s in all_sessions if s.agent_workflow_id is None]
            else:
                all_sessions = [s for s in all_sessions if s.agent_workflow_id == agent_workflow_id]

        active_sessions = [s for s in all_sessions if s.is_active]

        if not active_sessions:
            # If no active sessions, return the most recent one
            if all_sessions:
                latest = max(all_sessions, key=lambda s: s.last_activity)
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
        agent_sessions = self.store.get_agent_sessions(agent.agent_id)

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

    def _compute_agent_analytics(self, agent: AgentData, sessions: List) -> Dict[str, Any]:
        """Compute comprehensive analytics for agent monitoring."""
        from collections import defaultdict
        from datetime import datetime, timezone
        from .model_pricing import get_model_pricing, get_last_updated

        # Aggregated data structures
        model_stats = defaultdict(lambda: {
            "requests": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "response_times": [],
            "errors": 0
        })

        tool_stats = defaultdict(lambda: {
            "executions": 0,
            "execution_times": [],
            "failures": 0,
            "successes": 0,
            "last_start_time": None  # Track last start time for duration calculation
        })

        timeline_data = defaultdict(lambda: {
            "requests": 0,
            "tokens": 0,
            "input_tokens": 0,
            "output_tokens": 0
        })

        tool_timeline_data = defaultdict(lambda: defaultdict(lambda: {
            "executions": 0,
            "total_duration": 0
        }))

        # Process all events from all sessions
        for session in sessions:
            for event in session.events:
                event_name = event.name.value
                attrs = event.attributes

                # Collect model usage data
                if event_name == "llm.call.finish":
                    # Get model name from various possible attributes
                    model = attrs.get("llm.model") or attrs.get("llm.request.model") or attrs.get("model")

                    # If still no model, check in request data
                    if not model:
                        request_data = attrs.get("llm.request.data", {})
                        if isinstance(request_data, dict):
                            model = request_data.get("model")

                    # Use "unknown" only as last resort
                    if not model:
                        model = "unknown"

                    # Normalize model name (remove provider prefixes, trailing version numbers, etc.)
                    model = model.strip()

                    input_tokens = attrs.get("llm.usage.input_tokens", 0)
                    output_tokens = attrs.get("llm.usage.output_tokens", 0)
                    total_tokens = attrs.get("llm.usage.total_tokens", input_tokens + output_tokens)
                    response_time = attrs.get("llm.response.duration_ms", 0)

                    model_stats[model]["requests"] += 1
                    model_stats[model]["input_tokens"] += input_tokens
                    model_stats[model]["output_tokens"] += output_tokens
                    model_stats[model]["total_tokens"] += total_tokens
                    model_stats[model]["response_times"].append(response_time)

                    # Timeline data (aggregate by date)
                    timestamp = event.timestamp
                    date_key = None

                    # Extract date from timestamp (timestamps are ISO format strings)
                    if isinstance(timestamp, str):
                        # String timestamp like "2025-11-13T10:30:45.123456+00:00"
                        # Extract date part before 'T'
                        date_key = timestamp.split('T')[0] if 'T' in timestamp else timestamp.split(' ')[0]
                    elif hasattr(timestamp, 'date'):
                        # datetime object
                        date_key = timestamp.date().isoformat()
                    elif hasattr(timestamp, 'isoformat'):
                        # datetime object, get date part
                        date_key = timestamp.isoformat().split('T')[0]

                    if not date_key or date_key == "unknown" or not date_key.strip():
                        # Fallback: use event's session created_at or current date
                        logger.warning(f"Could not extract date from timestamp: {timestamp}, using fallback")
                        date_key = datetime.now(timezone.utc).date().isoformat()

                    timeline_data[date_key]["requests"] += 1
                    timeline_data[date_key]["tokens"] += total_tokens
                    timeline_data[date_key]["input_tokens"] += input_tokens
                    timeline_data[date_key]["output_tokens"] += output_tokens

                elif event_name.endswith(".error"):
                    model = attrs.get("llm.model") or attrs.get("model") or "unknown"
                    model_stats[model]["errors"] += 1

                # Collect tool usage data
                elif event_name == "tool.execution":
                    tool_name = attrs.get("tool.name", "unknown")
                    duration = attrs.get("tool.duration_ms", 0)

                    tool_stats[tool_name]["executions"] += 1

                    # Store start time for duration calculation
                    tool_stats[tool_name]["last_start_time"] = event.timestamp

                    # If duration is provided, use it
                    if duration > 0:
                        tool_stats[tool_name]["execution_times"].append(duration)

                    # Track tool execution timeline
                    timestamp = event.timestamp
                    date_key = None

                    if isinstance(timestamp, str):
                        date_key = timestamp.split('T')[0] if 'T' in timestamp else timestamp.split(' ')[0]
                    elif hasattr(timestamp, 'date'):
                        date_key = timestamp.date().isoformat()
                    elif hasattr(timestamp, 'isoformat'):
                        date_key = timestamp.isoformat().split('T')[0]

                    if not date_key or date_key == "unknown" or not date_key.strip():
                        date_key = datetime.now(timezone.utc).date().isoformat()

                    tool_timeline_data[date_key][tool_name]["executions"] += 1
                    if duration > 0:
                        tool_timeline_data[date_key][tool_name]["total_duration"] += duration

                elif event_name == "tool.result":
                    tool_name = attrs.get("tool.name", "unknown")
                    status = attrs.get("tool.status", "success")

                    # Calculate duration if we have a start time
                    if tool_stats[tool_name]["last_start_time"] is not None:
                        start_time_str = tool_stats[tool_name]["last_start_time"]
                        end_time_str = event.timestamp

                        try:
                            # Parse timestamps
                            if isinstance(start_time_str, str):
                                start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                            else:
                                start_time = start_time_str

                            if isinstance(end_time_str, str):
                                end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                            else:
                                end_time = end_time_str

                            # Calculate duration in milliseconds
                            duration_ms = (end_time - start_time).total_seconds() * 1000

                            if duration_ms > 0 and duration_ms < 3600000:  # Sanity check: less than 1 hour
                                tool_stats[tool_name]["execution_times"].append(duration_ms)

                                # Update timeline data with calculated duration
                                timestamp = event.timestamp
                                date_key = None

                                if isinstance(timestamp, str):
                                    date_key = timestamp.split('T')[0] if 'T' in timestamp else timestamp.split(' ')[0]
                                elif hasattr(timestamp, 'date'):
                                    date_key = timestamp.date().isoformat()
                                elif hasattr(timestamp, 'isoformat'):
                                    date_key = timestamp.isoformat().split('T')[0]

                                if date_key and date_key != "unknown" and date_key.strip():
                                    tool_timeline_data[date_key][tool_name]["total_duration"] += duration_ms

                            # Clear start time
                            tool_stats[tool_name]["last_start_time"] = None
                        except Exception as e:
                            logger.warning(f"Failed to calculate tool duration for {tool_name}: {e}")

                    if status == "success":
                        tool_stats[tool_name]["successes"] += 1
                    else:
                        tool_stats[tool_name]["failures"] += 1

        # Compute token breakdowns
        total_input_tokens = sum(stats["input_tokens"] for stats in model_stats.values())
        total_output_tokens = sum(stats["output_tokens"] for stats in model_stats.values())
        total_tokens = total_input_tokens + total_output_tokens

        # Compute costs using the pricing module
        total_cost = 0.0
        model_costs = {}
        for model, stats in model_stats.items():
            pricing = get_model_pricing(model)
            input_cost = (stats["input_tokens"] / 1_000_000) * pricing[0]
            output_cost = (stats["output_tokens"] / 1_000_000) * pricing[1]
            model_cost = input_cost + output_cost
            total_cost += model_cost
            model_costs[model] = model_cost

        # Prepare model analytics
        models_data = []
        for model, stats in model_stats.items():
            avg_response_time = sum(stats["response_times"]) / len(stats["response_times"]) if stats["response_times"] else 0
            p95_response_time = sorted(stats["response_times"])[int(len(stats["response_times"]) * 0.95)] if len(stats["response_times"]) > 0 else 0

            models_data.append({
                "model": model,
                "requests": stats["requests"],
                "input_tokens": stats["input_tokens"],
                "output_tokens": stats["output_tokens"],
                "total_tokens": stats["total_tokens"],
                "avg_response_time_ms": round(avg_response_time, 2),
                "p95_response_time_ms": round(p95_response_time, 2),
                "errors": stats["errors"],
                "cost": round(model_costs.get(model, 0), 4)
            })

        # Sort models by total tokens
        models_data.sort(key=lambda x: x["total_tokens"], reverse=True)

        # Prepare tool analytics
        tools_data = []
        for tool_name, stats in tool_stats.items():
            avg_duration = sum(stats["execution_times"]) / len(stats["execution_times"]) if stats["execution_times"] else 0
            max_duration = max(stats["execution_times"]) if stats["execution_times"] else 0
            failure_rate = (stats["failures"] / (stats["successes"] + stats["failures"]) * 100) if (stats["successes"] + stats["failures"]) > 0 else 0

            tools_data.append({
                "tool": tool_name,
                "executions": stats["executions"],
                "avg_duration_ms": round(avg_duration, 2),
                "max_duration_ms": round(max_duration, 2),
                "failures": stats["failures"],
                "successes": stats["successes"],
                "failure_rate": round(failure_rate, 2)
            })

        # Sort tools by executions
        tools_data.sort(key=lambda x: x["executions"], reverse=True)

        # Prepare timeline data
        timeline = []
        for date_key in sorted(timeline_data.keys()):
            data = timeline_data[date_key]
            timeline.append({
                "date": date_key,
                "requests": data["requests"],
                "tokens": data["tokens"],
                "input_tokens": data["input_tokens"],
                "output_tokens": data["output_tokens"]
            })

        # Prepare tool timeline data
        tool_timeline = []
        for date_key in sorted(tool_timeline_data.keys()):
            tools_by_date = tool_timeline_data[date_key]
            tool_timeline.append({
                "date": date_key,
                "tools": {
                    tool_name: {
                        "executions": data["executions"],
                        "avg_duration_ms": round(data["total_duration"] / data["executions"], 2) if data["executions"] > 0 else 0
                    }
                    for tool_name, data in tools_by_date.items()
                }
            })

        return {
            "token_summary": {
                "total_tokens": total_tokens,
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_cost": round(total_cost, 4),
                "models_used": len(model_stats),
                "pricing_last_updated": get_last_updated()
            },
            "models": models_data,
            "tools": tools_data,
            "timeline": timeline,
            "tool_timeline": tool_timeline
        }

    def _create_session_timeline(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create a timeline view of session events (chronological order)."""
        timeline = []
        for event in events:
            timeline_item = {
                "id": event.get("id"),  # Include event ID for replay functionality
                "timestamp": event["timestamp"],
                "event_type": event["name"],
                "description": self._get_event_description(event),
                "level": event["level"],
                "details": event["attributes"],
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

    async def _update_cache_with_pii(self, agent_id: str, pii_result: Any) -> None:
        """Update cached risk analysis with completed PII results.

        Args:
            agent_id: Agent identifier
            pii_result: Completed PII analysis result
        """
        if agent_id not in self._risk_analysis_cache:
            logger.info(f"[CACHE UPDATE] No cached risk analysis found for {agent_id}, skipping PII update")
            return

        cached_result, cached_time, cache_key = self._risk_analysis_cache[agent_id]

        # Update the cached result with PII data (no TTL check - cache only invalidates on session changes)
        logger.info(f"[CACHE UPDATE] Updating cached risk analysis for {agent_id} with PII results")

        # Regenerate security report with PII data included
        # This ensures PRIVACY_COMPLIANCE category is added to the report
        from .security import generate_security_report

        agent_sessions = self.store.get_agent_sessions(agent_id)
        updated_security_report = generate_security_report(
            agent_id,
            agent_sessions,
            cached_result.behavioral_analysis,
            pii_result
        )
        logger.info(f"[CACHE UPDATE] Regenerated security report for {agent_id} with PII data")

        # Create updated summary with PII data
        updated_summary = dict(cached_result.summary)
        if pii_result.disabled:
            updated_summary["pii_status"] = "disabled"
            updated_summary["pii_disabled"] = True
            updated_summary["pii_disabled_reason"] = pii_result.disabled_reason
        else:
            updated_summary["pii_status"] = "complete"
            updated_summary["pii_findings"] = pii_result.total_findings
            updated_summary["pii_sessions_with_pii"] = pii_result.sessions_with_pii
        # Remove pending message if it exists
        updated_summary.pop("pii_message", None)

        # Create new result with PII included
        updated_result = RiskAnalysisResult(
            evaluation_id=cached_result.evaluation_id,
            agent_id=cached_result.agent_id,
            timestamp=cached_result.timestamp,
            sessions_analyzed=cached_result.sessions_analyzed,
            evaluation_status=cached_result.evaluation_status,
            behavioral_analysis=cached_result.behavioral_analysis,
            security_report=updated_security_report,
            pii_analysis=pii_result,
            summary=updated_summary
        )

        # Update cache with new result
        self._risk_analysis_cache[agent_id] = (updated_result, cached_time, cache_key)
        logger.info(f"[CACHE UPDATE] Successfully updated cache for {agent_id} with PII results")

    def _should_run_pii_analysis(self, agent_id: str, cache_key: tuple) -> tuple[bool, Optional[Any], str]:
        """Determine if PII analysis should run and get current PII status.

        This method centralizes all PII execution gating logic:
        1. If PII is already running - do not run another
        2. If PII was completed - check if sessions changed, run if needed
        3. Never run more than one PII analysis at once per agent
        4. Never cancel, stop, or ignore a running PII analysis

        This is a synchronous method that performs fast dictionary lookups only.
        Must be called while holding _pii_launch_lock to ensure atomicity.

        Args:
            agent_id: Agent identifier
            cache_key: Current (session_count, completed_count) tuple

        Returns:
            Tuple of (should_launch: bool, current_pii_result: Optional[PIIAnalysisResult], pii_status: str)
            - should_launch: True if caller should launch new PII analysis
            - current_pii_result: Existing PII result if available (may be stale)
            - pii_status: One of "complete", "pending", "refreshing"
        """
        # Check if PII analysis is disabled by configuration
        if not self.enable_presidio:
            from .models import PIIAnalysisResult
            disabled_result = PIIAnalysisResult(
                total_findings=0,
                sessions_without_pii=0,
                disabled=True,
                disabled_reason="PII analysis disabled by configuration (enable_presidio: false)"
            )
            logger.info(f"[PII GUARD] Agent {agent_id}: PII analysis disabled by configuration")
            return False, disabled_result, "disabled"

        # Get cached PII data (result + the cache_key it was computed for)
        old_pii_data = self._pii_results_cache.get(agent_id)
        if old_pii_data:
            old_pii_result, old_pii_cache_key = old_pii_data
        else:
            old_pii_result, old_pii_cache_key = None, None

        # Check if PII result is fresh (matches current sessions)
        if old_pii_result and old_pii_cache_key == cache_key:
            logger.info(f"[PII GUARD] Agent {agent_id}: Fresh PII result available (key={cache_key})")
            return False, old_pii_result, "complete"

        # Check if analysis is already running
        # IMPORTANT: Never launch a second task if one is running
        if agent_id in self._pii_analysis_tasks:
            task = self._pii_analysis_tasks[agent_id]
            if not task.done():
                # Task is actively running - use old data if available
                pii_status = "refreshing" if old_pii_result else "pending"
                logger.info(f"[PII GUARD] Agent {agent_id}: Analysis already running, status={pii_status}")
                return False, old_pii_result, pii_status
            else:
                # Task completed/failed but wasn't cleaned up - remove it
                logger.info(f"[PII GUARD] Agent {agent_id}: Cleaning up completed task")
                del self._pii_analysis_tasks[agent_id]

        # Need new analysis: either no previous result or sessions changed
        if old_pii_result:
            logger.info(f"[PII GUARD] Agent {agent_id}: Sessions changed {old_pii_cache_key} → {cache_key}, need refresh")
            return True, old_pii_result, "refreshing"
        else:
            logger.info(f"[PII GUARD] Agent {agent_id}: No previous PII data, need initial analysis (key={cache_key})")
            return True, None, "pending"

    async def _run_pii_analysis(self, agent_id: str, agent_sessions: List[Any],
                               expected_cache_key: tuple) -> None:
        """Run PII analysis in background and cache results.

        This method runs in a background task and performs CPU-intensive PII analysis
        without blocking the event loop. It validates that sessions haven't changed
        during analysis before updating caches.

        Uses a semaphore to limit concurrent analyses and prevent CPU contention.

        Args:
            agent_id: Agent identifier
            agent_sessions: List of session data objects
            expected_cache_key: (session_count, completed_count) expected after analysis
        """
        # Lazy initialize semaphore (can't create in __init__ without event loop)
        if self._pii_semaphore is None:
            self._pii_semaphore = asyncio.Semaphore(self._pii_max_concurrent)

        analysis_session_count = len(agent_sessions)
        logger.info(f"[PII BACKGROUND] Queued PII analysis for agent {agent_id} ({analysis_session_count} sessions, key={expected_cache_key})")

        # Acquire semaphore to limit concurrent CPU-bound analyses
        async with self._pii_semaphore:
            start_time = datetime.now(timezone.utc)
            try:
                from .pii import analyze_sessions_for_pii
                logger.info(f"[PII BACKGROUND] Starting PII analysis for agent {agent_id} ({analysis_session_count} sessions, key={expected_cache_key})")

                # Run in background thread to avoid blocking event loop
                # Use asyncio.wait_for to add timeout (60 seconds)
                try:
                    pii_result = await asyncio.wait_for(
                        asyncio.to_thread(analyze_sessions_for_pii, agent_sessions, enable_presidio=self.enable_presidio),
                        timeout=60.0
                    )
                except asyncio.TimeoutError:
                    logger.error(f"[PII BACKGROUND] PII analysis timed out for agent {agent_id} after 60 seconds")
                    raise Exception("PII analysis timed out after 60 seconds")

                duration = (datetime.now(timezone.utc) - start_time).total_seconds()
                logger.info(f"[PII BACKGROUND] Completed PII analysis for agent {agent_id}: {pii_result.total_findings} findings in {duration:.1f}s")

                # Always cache completed results (they're valid for the session count they analyzed)
                self._pii_results_cache[agent_id] = (pii_result, expected_cache_key)
                logger.info(f"[PII BACKGROUND] Cached PII result for {agent_id} with key {expected_cache_key}")

                # Check if sessions changed during analysis
                current_sessions = self.store.get_agent_sessions(agent_id)
                current_cache_key = (len(current_sessions), len([s for s in current_sessions if s.is_completed]))

                if current_cache_key != expected_cache_key:
                    logger.info(f"[PII REFRESH] Sessions changed during analysis for {agent_id}: {expected_cache_key} → {current_cache_key}")
                    logger.info(f"[PII REFRESH] Cached results for {expected_cache_key}, will refresh automatically on next request")
                    # Don't update risk cache with stale data - skip _update_cache_with_pii
                    # Next compute_risk_analysis() will detect the cache_key mismatch and launch fresh analysis
                    # The _should_run_pii_analysis helper will see this task has completed and allow new launch
                else:
                    # Sessions haven't changed - safe to update the cached risk analysis
                    await self._update_cache_with_pii(agent_id, pii_result)

            except Exception as e:
                logger.error(f"[PII BACKGROUND] PII analysis failed for agent {agent_id}: {e}", exc_info=True)
                # Store error result so we don't retry continuously
                from .models import PIIAnalysisResult
                error_result = PIIAnalysisResult(
                    total_findings=0,
                    sessions_without_pii=len(agent_sessions),
                    disabled=True,
                    disabled_reason=f"Analysis failed: {str(e)}"
                )
                self._pii_results_cache[agent_id] = (error_result, expected_cache_key)
            finally:
                # CRITICAL: Always cleanup task tracking to allow future analysis
                # This removal signals to _should_run_pii_analysis that the task completed
                # and new analysis can be launched if sessions changed
                # Without this cleanup, the agent would be permanently stuck
                if agent_id in self._pii_analysis_tasks:
                    del self._pii_analysis_tasks[agent_id]
                    logger.info(f"[PII BACKGROUND] Cleaned up task for agent {agent_id}")

    async def compute_risk_analysis(
        self,
        agent_id: str,
        sessions: Optional[List[SessionData]] = None,
    ) -> Optional[RiskAnalysisResult]:
        """Compute risk analysis for an agent (behavioral + security).

        This is the core computation method called by AnalysisRunner.
        API endpoints should use get_persisted_risk_analysis() to read from DB.

        Args:
            agent_id: Agent identifier
            sessions: Optional list of specific sessions to analyze. If None,
                     analyzes ALL sessions for the agent. For incremental analysis,
                     pass only the new sessions to analyze.

        Returns:
            RiskAnalysisResult or None if insufficient sessions
        """
        agent = self.store.get_agent(agent_id)
        if not agent:
            return None

        # Use provided sessions or get all sessions for this agent
        if sessions is not None:
            agent_sessions = sessions
        else:
            agent_sessions = self.store.get_agent_sessions(agent_id)

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

        # Skip cache when specific sessions are provided (incremental analysis)
        # Cache is only used when analyzing ALL sessions for an agent
        use_cache = sessions is None

        if use_cache:
            # Check cache (invalidate only if session count OR completion count changed)
            cache_key = (len(agent_sessions), completed_count)
            if agent_id in self._risk_analysis_cache:
                cached_result, _cached_time, cached_key = self._risk_analysis_cache[agent_id]
                # Cache valid if session counts match (no TTL check)
                if cached_key == cache_key:
                    return cached_result
                # Cache key changed (sessions added/completed) - invalidate risk cache
                else:
                    logger.info(f"[CACHE INVALIDATION] Session count changed for {agent_id}: {cached_key} → {cache_key}")
                    # NOTE: We do NOT cancel running PII tasks - they will complete naturally
                    # The _should_run_pii_analysis helper will handle stale task detection
                    # and ensure new sessions trigger fresh analysis when appropriate

        # Cache miss or incremental analysis - computing fresh
        cache_key = (len(agent_sessions), completed_count)
        logger.debug(f"[ANALYSIS] Computing risk analysis for {agent_id} (sessions={len(agent_sessions)}, incremental={sessions is not None})")

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

            # Assign cluster_id to sessions based on behavioral clustering results
            # This enables filtering sessions by cluster in the UI
            if behavioral_result.clusters:
                sessions_by_id = {s.session_id: s for s in agent_sessions}
                for cluster in behavioral_result.clusters:
                    for session_id in cluster.session_ids:
                        if session_id in sessions_by_id:
                            session = sessions_by_id[session_id]
                            if session.cluster_id != cluster.cluster_id:
                                session.cluster_id = cluster.cluster_id
                                self.store._save_session(session)
                logger.info(f"[CLUSTER ASSIGNMENT] Assigned cluster_ids to {sum(len(c.session_ids) for c in behavioral_result.clusters)} sessions")

            logger.info(f"[RISK ANALYSIS] Behavioral analysis result: total_sessions={behavioral_result.total_sessions}, "
                       f"num_clusters={behavioral_result.num_clusters}, error={behavioral_result.error}")

            behavioral_status = "COMPLETE" if behavioral_result.total_sessions >= 2 else "WAITING_FOR_COMPLETION"

            # Run PII analysis (works on all sessions - doesn't need completion)
            # Use centralized helper to determine if we should launch PII analysis
            # The lock ensures atomicity: check + task registration happen together
            # This prevents race conditions where multiple coroutines try to launch PII simultaneously
            # Note: Using threading.Lock (not asyncio.Lock) since lock is held for < 1ms
            with self._pii_launch_lock:
                should_launch, pii_result, pii_status = self._should_run_pii_analysis(agent_id, cache_key)

                if should_launch:
                    # Launch new PII analysis task (runs in background, doesn't block)
                    logger.info(f"[PII LAUNCH] Launching analysis for {agent_id} with key {cache_key}")
                    task = asyncio.create_task(self._run_pii_analysis(agent_id, agent_sessions, cache_key))
                    self._pii_analysis_tasks[agent_id] = task

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

            # Add PII summary based on status
            if pii_result:
                if pii_result.disabled:
                    # PII analysis is disabled or failed
                    summary["pii_status"] = "disabled"
                    summary["pii_disabled"] = True
                    summary["pii_disabled_reason"] = pii_result.disabled_reason
                else:
                    # PII analysis data available - use computed status
                    summary["pii_status"] = pii_status  # Use status from validation logic
                    summary["pii_findings"] = pii_result.total_findings
                    summary["pii_sessions_with_pii"] = pii_result.sessions_with_pii

                    # Add message if refreshing
                    if pii_status == "refreshing":
                        summary["pii_message"] = "Analyzing new sessions..."
            else:
                # No old data available
                summary["pii_status"] = "pending"
                summary["pii_message"] = "PII analysis starting..."

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

            # Only cache results when NOT doing incremental analysis
            # Incremental results are for specific sessions and shouldn't pollute the cache
            if use_cache:
                self._risk_analysis_cache[agent_id] = (result, datetime.now(timezone.utc), cache_key)
                if pii_result is not None:
                    logger.info(f"[RISK CACHE] Cached complete result for agent {agent_id}")
                else:
                    logger.info(f"[RISK CACHE] Cached partial result (PII pending) for agent {agent_id}")
            else:
                logger.info(f"[INCREMENTAL] Skipping cache for incremental analysis of agent {agent_id}")

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
        agent = self.store.get_agent(agent_id)
        if not agent:
            return None

        # Get all sessions for this agent
        agent_sessions = self.store.get_agent_sessions(agent_id)

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
            "proxy_port": self.proxy_config.get("proxy_port", 4000),
            "storage_mode": self.proxy_config.get("storage_mode", "memory"),
            "db_path": self.proxy_config.get("db_path"),
        }

# Backward compatibility alias
InsightsEngine = AnalysisEngine
