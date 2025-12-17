"""Analysis runner - single entry point for all analysis triggers.

This module consolidates the analysis orchestration logic:
- Decision logic (should_run)
- Running state tracking (mark_started/completed)
- Burst handling (post-analysis recheck)

The actual analysis computation is delegated to the engine.
"""
import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional, Protocol

from .models import RiskAnalysisResult

logger = logging.getLogger(__name__)

# Minimum sessions required for risk analysis
# Minimum sessions - per Phase 4 spec, users can trigger analysis with 1+ sessions
MIN_SESSIONS_FOR_RISK_ANALYSIS = 1


class AnalysisStore(Protocol):
    """Protocol for store methods used by analysis runner."""

    def get_completed_session_count(self, agent_id: str) -> int:
        """Get the count of completed sessions for an agent."""
        ...

    def get_agent_last_analyzed_count(self, agent_id: str) -> int:
        """Get the completed session count at time of last analysis."""
        ...

    def update_agent_last_analyzed(self, agent_id: str, session_count: int) -> None:
        """Update the last analyzed session count for an agent."""
        ...

    def get_agent(self, agent_id: str):
        """Get agent data."""
        ...

    def create_analysis_session(
        self,
        session_id: str,
        agent_workflow_id: str,
        session_type: str,
        agent_workflow_name: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> None:
        """Create an analysis session record."""
        ...

    def persist_security_checks(
        self,
        agent_id: str,
        security_report,
        analysis_session_id: str,
        agent_workflow_id: Optional[str] = None,
    ) -> int:
        """Persist security check results."""
        ...

    def store_behavioral_analysis(
        self,
        agent_id: str,
        analysis_session_id: str,
        behavioral_result,
    ) -> None:
        """Store behavioral analysis results."""
        ...

    def complete_analysis_session(
        self,
        session_id: str,
        findings_count: int,
        risk_score: Optional[float] = None,
    ) -> None:
        """Complete an analysis session."""
        ...

    def get_agents_needing_analysis(self, min_sessions: int) -> list:
        """Get agents that need analysis."""
        ...


class AnalysisComputer(Protocol):
    """Protocol for the computation component (engine)."""

    async def compute_risk_analysis(self, agent_id: str) -> Optional[RiskAnalysisResult]:
        """Compute risk analysis for an agent."""
        ...


class AnalysisRunner:
    """Single entry point for all analysis triggers.

    Owns:
    - Decision logic (_should_run)
    - Running state tracking (_mark_started/_mark_completed)
    - Burst handling (post-analysis recheck)
    - Persistence of results

    Does NOT own:
    - Actual analysis computation (delegates to compute_fn)
    """

    def __init__(
        self,
        store: AnalysisStore,
        compute_fn: Callable[[str], Any],
    ):
        """Initialize the analysis runner.

        Args:
            store: Store instance for persistence and state queries.
            compute_fn: Async function that performs the actual analysis.
                       Should be engine._compute_risk_analysis.
        """
        self._store = store
        self._compute_fn = compute_fn
        self._running: Dict[str, bool] = {}  # agent_id → is_running (always in-memory)
        self._lock = threading.Lock()

    def trigger(self, agent_id: str) -> None:
        """Single entry point for all analysis triggers.

        Called from:
        - Session completion (from SessionMonitor)
        - Post-analysis burst check (from within _run itself)

        Args:
            agent_id: Agent identifier
        """
        if self._should_run(agent_id):
            logger.info(f"[ANALYSIS] Triggering analysis for {agent_id}")
            self._run_async(agent_id)
        else:
            logger.debug(f"[ANALYSIS] Skipping analysis for {agent_id} (running or no new sessions)")

    def _should_run(self, agent_id: str) -> bool:
        """Check if analysis should run for an agent.

        All conditions in one place:
        1. No current analysis running for this agent
        2. Minimum session count met (5)
        3. New sessions exist since last analysis

        Returns:
            True if analysis should run, False otherwise
        """
        with self._lock:
            # Condition 1: Don't run if analysis is already in progress
            if self._running.get(agent_id, False):
                logger.debug(f"[ANALYSIS] Analysis already running for {agent_id}")
                return False

            # Condition 2 & 3: Check counts
            current_count = self._store.get_completed_session_count(agent_id)
            last_count = self._store.get_agent_last_analyzed_count(agent_id)

            # Must have at least 1 session (no minimum - per Phase 4 spec)
            if current_count < 1:
                logger.debug(
                    f"[ANALYSIS] No sessions for {agent_id}: {current_count}"
                )
                return False

            # Must have new sessions since last analysis
            if current_count > last_count:
                logger.debug(
                    f"[ANALYSIS] Analysis should run for {agent_id}: "
                    f"completed={current_count}, last_analyzed={last_count}"
                )
                return True

            logger.debug(
                f"[ANALYSIS] No new sessions for {agent_id}: "
                f"completed={current_count}, last_analyzed={last_count}"
            )
            return False

    def _mark_started(self, agent_id: str) -> None:
        """Mark that analysis has started for an agent."""
        with self._lock:
            self._running[agent_id] = True
            logger.debug(f"[ANALYSIS] Analysis started for {agent_id}")

    def _mark_completed(self, agent_id: str, completed_count: int) -> None:
        """Mark that analysis has completed for an agent.

        Args:
            agent_id: The agent that was analyzed
            completed_count: The completed session count at time of analysis
        """
        with self._lock:
            self._running[agent_id] = False
            # Persist to DB
            self._store.update_agent_last_analyzed(agent_id, completed_count)
            logger.debug(
                f"[ANALYSIS] Analysis completed for {agent_id}, "
                f"analyzed {completed_count} sessions"
            )

    def _run_async(self, agent_id: str) -> None:
        """Schedule analysis to run in the background.

        Works from both asyncio context and regular threads.

        Args:
            agent_id: Agent identifier
        """
        try:
            asyncio.get_running_loop()  # Check if we're in async context
            # Already in async context - create task
            asyncio.create_task(self._run(agent_id))
            logger.debug(f"[ANALYSIS] Scheduled background analysis for {agent_id}")
        except RuntimeError:
            # No running event loop - we're in a thread, run synchronously
            logger.info(f"[ANALYSIS] Running analysis synchronously for {agent_id}")
            try:
                asyncio.run(self._run(agent_id))
            except Exception as e:
                logger.error(f"[ANALYSIS] Error running analysis for {agent_id}: {e}", exc_info=True)

    async def _run(self, agent_id: str) -> Optional[RiskAnalysisResult]:
        """Run full analysis for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            RiskAnalysisResult or None if insufficient sessions
        """
        logger.info(f"[ANALYSIS] run started for {agent_id}")
        self._mark_started(agent_id)
        try:
            # Run the computation (delegates to engine)
            result = await self._compute_fn(agent_id)
            logger.info(
                f"[ANALYSIS] compute returned for {agent_id}: "
                f"result={result is not None}, "
                f"has_security_report={result.security_report is not None if result else False}"
            )

            if result and result.security_report:
                await self._persist_results(agent_id, result)

            return result
        finally:
            completed_count = self._store.get_completed_session_count(agent_id)
            self._mark_completed(agent_id, completed_count)

            # Burst handling: check if more sessions arrived during analysis
            if self._should_run(agent_id):
                logger.info(f"[ANALYSIS] New sessions arrived during analysis for {agent_id}, scheduling re-run")
                asyncio.create_task(self._run(agent_id))

    async def _persist_results(self, agent_id: str, result: RiskAnalysisResult) -> None:
        """Persist analysis results to database.

        Args:
            agent_id: Agent identifier
            result: Analysis results to persist
        """
        # Get agent_workflow_id and agent info
        agent = self._store.get_agent(agent_id)
        agent_workflow_id = agent.agent_workflow_id if agent else None
        agent_workflow_name = agent.agent_workflow_id if agent else None  # Use agent_workflow_id as name

        # Create analysis session in database first (for foreign key constraint)
        analysis_session_id = f"analysis_{agent_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

        self._store.create_analysis_session(
            session_id=analysis_session_id,
            agent_workflow_id=agent_workflow_id or agent_id,
            session_type="DYNAMIC",
            agent_workflow_name=agent_workflow_name,
            agent_id=agent_id,
        )

        # Persist security checks to database
        checks_persisted = self._store.persist_security_checks(
            agent_id=agent_id,
            security_report=result.security_report,
            analysis_session_id=analysis_session_id,
            agent_workflow_id=agent_workflow_id,
        )

        # Persist behavioral analysis to database
        if result.behavioral_analysis:
            self._store.store_behavioral_analysis(
                agent_id=agent_id,
                analysis_session_id=analysis_session_id,
                behavioral_result=result.behavioral_analysis,
            )
            logger.info(f"[ANALYSIS] Persisted behavioral analysis for agent {agent_id}")

        # Complete the analysis session with findings count
        self._store.complete_analysis_session(
            session_id=analysis_session_id,
            findings_count=checks_persisted,
            risk_score=result.security_report.overall_score if hasattr(result.security_report, 'overall_score') else None,
        )

        logger.info(
            f"[ANALYSIS] Persisted {checks_persisted} security checks "
            f"for agent {agent_id} (session: {analysis_session_id})"
        )

    async def check_pending_on_startup(self) -> list:
        """Check for agents needing analysis on startup.

        NOTE: Per Phase 4 spec, analysis is ON-DEMAND only.
        This method logs agents with pending sessions but does NOT auto-trigger.
        Users must trigger analysis via UI button or MCP tool.

        Returns:
            List of agent IDs with pending sessions (for info only).
        """
        agent_ids = self._store.get_agents_needing_analysis(MIN_SESSIONS_FOR_RISK_ANALYSIS)

        if agent_ids:
            logger.info(f"[STARTUP] Found {len(agent_ids)} agents with pending sessions: {agent_ids}")
            logger.info("[STARTUP] Analysis is ON-DEMAND - use UI or MCP to trigger when ready")
        else:
            logger.info("[STARTUP] No agents need analysis at startup")

        return agent_ids

    # Convenience methods for testing/debugging

    def is_running(self, agent_id: str) -> bool:
        """Check if analysis is currently running for an agent."""
        with self._lock:
            return self._running.get(agent_id, False)

    def get_last_analyzed_count(self, agent_id: str) -> int:
        """Get the completed session count at time of last analysis."""
        return self._store.get_agent_last_analyzed_count(agent_id)

    def reset_agent(self, agent_id: str) -> None:
        """Reset runner state for an agent (useful for testing)."""
        with self._lock:
            self._running.pop(agent_id, None)
            logger.debug(f"[ANALYSIS] Reset state for {agent_id}")

    def get_status(self) -> Dict[str, Dict]:
        """Get current runner status for all agents (for debugging)."""
        with self._lock:
            return {
                agent_id: {
                    'is_running': is_running,
                    'last_analyzed_count': self._store.get_agent_last_analyzed_count(agent_id),
                }
                for agent_id, is_running in self._running.items()
            }
