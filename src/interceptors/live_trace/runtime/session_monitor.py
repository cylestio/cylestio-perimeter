"""Session monitor - background thread that monitors session activity.

This module handles:
- Detecting inactive sessions and marking them as completed
- Triggering analysis when sessions complete

The monitor is a simple polling loop that delegates to:
- Store for session completion detection
- AnalysisRunner for triggering analysis
"""
import asyncio
import logging
import threading
from typing import Any, Dict, List, Protocol

logger = logging.getLogger(__name__)


class SessionStore(Protocol):
    """Protocol for store methods used by session monitor."""

    def check_and_complete_sessions(self, timeout_seconds: int) -> List[str]:
        """Check for inactive sessions and mark them as completed.

        Returns:
            List of agent IDs that had sessions completed.
        """
        ...


class AnalysisTrigger(Protocol):
    """Protocol for analysis trigger methods."""

    def trigger(self, agent_id: str) -> None:
        """Trigger analysis for an agent."""
        ...

    async def check_pending_on_startup(self) -> List[str]:
        """Check for agents needing analysis on startup."""
        ...


class SessionMonitor:
    """Background thread that monitors session activity and triggers analysis.

    Responsibilities:
    - Periodically check for inactive sessions
    - Mark inactive sessions as completed
    - Trigger analysis for affected agents

    Does NOT own:
    - Session completion logic (delegated to store)
    - Analysis decision logic (delegated to AnalysisRunner)
    """

    def __init__(
        self,
        store: SessionStore,
        analysis_runner: AnalysisTrigger,
        config: Dict[str, Any],
    ):
        """Initialize the session monitor.

        Args:
            store: Store instance for session operations.
            analysis_runner: Analysis runner for triggering analysis.
            config: Configuration dict with:
                - session_completion_timeout: Seconds of inactivity before marking complete (default: 30)
                - completion_check_interval: Seconds between checks (default: 10)
        """
        self._store = store
        self._analysis_runner = analysis_runner
        self._timeout = config.get("session_completion_timeout", 30)
        self._interval = config.get("completion_check_interval", 10)

        self._thread: threading.Thread = None
        self._running = False
        self._stop_event = threading.Event()

    def start(self) -> None:
        """Start the background monitoring thread."""
        if self._running:
            return

        try:
            self._thread = threading.Thread(
                target=self._run_checker,
                daemon=True,
                name="SessionMonitor"
            )
            self._thread.start()
            self._running = True

            logger.info(
                f"Session monitor started (timeout={self._timeout}s, "
                f"interval={self._interval}s)"
            )
        except Exception as e:
            logger.error(f"Failed to start session monitor: {e}")

    def stop(self) -> None:
        """Stop the monitoring thread gracefully."""
        if not self._running:
            return

        logger.info("Stopping session monitor...")
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        self._running = False
        logger.info("Session monitor stopped")

    def check_pending_on_startup(self) -> None:
        """Check for agents needing analysis on startup.

        This handles the case where sessions completed before server restart
        and analysis was never triggered.
        """
        try:
            def run_check():
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(self._analysis_runner.check_pending_on_startup())
                    finally:
                        loop.close()
                except Exception as e:
                    logger.error(f"Error in startup analysis check: {e}")

            thread = threading.Thread(
                target=run_check,
                daemon=True,
                name="StartupAnalysisCheck"
            )
            thread.start()
            logger.info("Startup analysis check initiated")
        except Exception as e:
            logger.error(f"Failed to start startup analysis check: {e}")

    def _run_checker(self) -> None:
        """Main loop: check for completed sessions (NO auto-trigger).
        
        Note: Per Phase 4 spec, analysis is ON-DEMAND only.
        This monitor ONLY marks sessions as completed - it does NOT trigger analysis.
        Users must explicitly trigger analysis via UI button or MCP tool.
        """
        logger.info("Session monitor thread started (on-demand analysis mode - no auto-trigger)")

        while not self._stop_event.is_set():
            try:
                # Check for sessions that should be marked as completed
                # Returns list of agent IDs that had sessions completed
                completed_agent_ids = self._store.check_and_complete_sessions(self._timeout)

                # Log for visibility but DO NOT auto-trigger analysis
                # Analysis must be triggered manually by user via UI or MCP
                if completed_agent_ids:
                    logger.debug(
                        f"Sessions completed for {len(completed_agent_ids)} agent(s). "
                        f"Analysis available on-demand via UI or MCP trigger_dynamic_analysis."
                    )
            except Exception as e:
                logger.error(f"Error in session monitor: {e}")

            # Wait for the check interval (or until stop event is set)
            self._stop_event.wait(self._interval)

        logger.info("Session monitor thread stopped")

    @property
    def is_running(self) -> bool:
        """Check if monitor is running."""
        return self._running
