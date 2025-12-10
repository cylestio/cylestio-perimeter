"""Analysis scheduler - manages when analysis should run for agents.

This module implements the trigger logic for running analysis:
- Analysis is triggered when sessions complete (not on-demand)
- Prevents concurrent analysis runs for the same agent
- Handles burst sessions by re-checking after each analysis completes
"""
import logging
import threading
from typing import Callable, Dict, Optional

logger = logging.getLogger(__name__)


class AnalysisScheduler:
    """Manages when analysis should run for each agent.

    The scheduler tracks:
    - Which agents have analysis currently running
    - How many completed sessions each agent had at last analysis

    Trigger points:
    - When a session completes
    - When an analysis completes (to catch burst sessions)
    """

    def __init__(self, get_completed_count: Callable[[str], int]):
        """Initialize the scheduler.

        Args:
            get_completed_count: Function that returns the completed session count
                                 for a given agent_id. Usually store.get_completed_session_count.
        """
        self._get_completed_count = get_completed_count
        self._running: Dict[str, bool] = {}  # agent_id -> is_running
        self._last_analyzed_count: Dict[str, int] = {}  # agent_id -> completed_count
        self._lock = threading.Lock()

    def should_run_analysis(self, agent_id: str) -> bool:
        """Check if analysis should run for an agent.

        Called when:
        1. A session completes
        2. An analysis completes (to catch sessions that arrived during)

        Returns:
            True if analysis should run, False otherwise
        """
        with self._lock:
            # Don't run if analysis is already in progress
            if self._running.get(agent_id, False):
                logger.debug(f"[SCHEDULER] Analysis already running for {agent_id}")
                return False

            # Check if completed count has changed
            current_count = self._get_completed_count(agent_id)
            last_count = self._last_analyzed_count.get(agent_id, 0)

            if current_count > last_count:
                logger.debug(
                    f"[SCHEDULER] Analysis should run for {agent_id}: "
                    f"completed={current_count}, last_analyzed={last_count}"
                )
                return True

            logger.debug(
                f"[SCHEDULER] No new sessions for {agent_id}: "
                f"completed={current_count}, last_analyzed={last_count}"
            )
            return False

    def mark_analysis_started(self, agent_id: str) -> None:
        """Mark that analysis has started for an agent.

        Call this immediately before starting analysis.
        """
        with self._lock:
            self._running[agent_id] = True
            logger.debug(f"[SCHEDULER] Analysis started for {agent_id}")

    def mark_analysis_completed(self, agent_id: str, completed_count: int) -> None:
        """Mark that analysis has completed for an agent.

        Args:
            agent_id: The agent that was analyzed
            completed_count: The completed session count at time of analysis
        """
        with self._lock:
            self._running[agent_id] = False
            self._last_analyzed_count[agent_id] = completed_count
            logger.debug(
                f"[SCHEDULER] Analysis completed for {agent_id}, "
                f"analyzed {completed_count} sessions"
            )

    def is_analysis_running(self, agent_id: str) -> bool:
        """Check if analysis is currently running for an agent."""
        with self._lock:
            return self._running.get(agent_id, False)

    def get_last_analyzed_count(self, agent_id: str) -> int:
        """Get the completed session count at time of last analysis."""
        with self._lock:
            return self._last_analyzed_count.get(agent_id, 0)

    def reset_agent(self, agent_id: str) -> None:
        """Reset scheduler state for an agent (useful for testing)."""
        with self._lock:
            self._running.pop(agent_id, None)
            self._last_analyzed_count.pop(agent_id, None)
            logger.debug(f"[SCHEDULER] Reset state for {agent_id}")

    def get_status(self) -> Dict[str, Dict]:
        """Get current scheduler status for all agents (for debugging)."""
        with self._lock:
            return {
                agent_id: {
                    'is_running': self._running.get(agent_id, False),
                    'last_analyzed_count': self._last_analyzed_count.get(agent_id, 0),
                }
                for agent_id in set(self._running.keys()) | set(self._last_analyzed_count.keys())
            }
