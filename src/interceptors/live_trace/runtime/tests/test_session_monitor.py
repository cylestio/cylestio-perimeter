"""Tests for the session monitor."""
import time
import pytest
from unittest.mock import MagicMock, AsyncMock

from ..session_monitor import SessionMonitor


class MockStore:
    """Mock store for testing SessionMonitor."""

    def __init__(self):
        self.completed_agent_ids = []
        self.check_count = 0

    def check_and_complete_sessions(self, timeout_seconds: int):
        """Return the configured completed agent IDs and track calls."""
        self.check_count += 1
        return self.completed_agent_ids


class MockAnalysisRunner:
    """Mock analysis runner for testing SessionMonitor."""

    def __init__(self):
        self.triggered_agents = []

    def trigger(self, agent_id: str) -> None:
        self.triggered_agents.append(agent_id)

    async def check_pending_on_startup(self):
        return []


class TestSessionMonitor:
    """Test the SessionMonitor class."""

    def test_start_stop(self):
        """Test that monitor can start and stop."""
        store = MockStore()
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 30, "completion_check_interval": 1}

        monitor = SessionMonitor(store, runner, config)

        assert monitor.is_running is False

        monitor.start()
        assert monitor.is_running is True

        # Let it run a bit
        time.sleep(0.1)

        monitor.stop()
        assert monitor.is_running is False

    def test_does_not_auto_trigger_analysis(self):
        """Test that monitor does NOT auto-trigger analysis (ON-DEMAND only per Phase 4 spec)."""
        store = MockStore()
        store.completed_agent_ids = ["agent-1", "agent-2"]  # Sessions completed
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 30, "completion_check_interval": 0.1}

        monitor = SessionMonitor(store, runner, config)
        monitor.start()

        # Wait for at least one check cycle
        time.sleep(0.2)

        monitor.stop()

        # Analysis is ON-DEMAND only - monitor should NOT auto-trigger
        # Users must use UI button or MCP to trigger analysis
        assert len(runner.triggered_agents) == 0

    def test_does_not_trigger_when_no_completed_sessions(self):
        """Test that monitor doesn't trigger when no sessions completed."""
        store = MockStore()
        store.completed_agent_ids = []  # No completed agents
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 30, "completion_check_interval": 0.1}

        monitor = SessionMonitor(store, runner, config)
        monitor.start()

        # Wait for at least one check cycle
        time.sleep(0.2)

        monitor.stop()

        # Should not have triggered any agents
        assert len(runner.triggered_agents) == 0

    def test_uses_config_values(self):
        """Test that monitor uses configuration values."""
        store = MockStore()
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 60, "completion_check_interval": 5}

        monitor = SessionMonitor(store, runner, config)

        assert monitor._timeout == 60
        assert monitor._interval == 5

    def test_uses_default_config_values(self):
        """Test that monitor uses default values when not configured."""
        store = MockStore()
        runner = MockAnalysisRunner()
        config = {}

        monitor = SessionMonitor(store, runner, config)

        assert monitor._timeout == 30  # Default
        assert monitor._interval == 10  # Default

    def test_multiple_start_calls_are_idempotent(self):
        """Test that calling start() multiple times doesn't create multiple threads."""
        store = MockStore()
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 30, "completion_check_interval": 1}

        monitor = SessionMonitor(store, runner, config)

        monitor.start()
        thread1 = monitor._thread

        monitor.start()  # Second call should be idempotent
        thread2 = monitor._thread

        assert thread1 is thread2

        monitor.stop()

    def test_multiple_stop_calls_are_idempotent(self):
        """Test that calling stop() multiple times doesn't cause errors."""
        store = MockStore()
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 30, "completion_check_interval": 1}

        monitor = SessionMonitor(store, runner, config)

        monitor.start()
        monitor.stop()
        monitor.stop()  # Second call should be safe

        assert monitor.is_running is False


class TestSessionMonitorEdgeCases:
    """Test edge cases for the session monitor."""

    def test_handles_store_exception(self):
        """Test that monitor handles exceptions from store gracefully."""
        store = MagicMock()
        store.check_and_complete_sessions.side_effect = Exception("Store error")
        runner = MockAnalysisRunner()
        config = {"session_completion_timeout": 30, "completion_check_interval": 0.1}

        monitor = SessionMonitor(store, runner, config)
        monitor.start()

        # Wait for at least one check cycle - should not crash
        time.sleep(0.2)

        monitor.stop()

        # Monitor should still be able to stop cleanly
        assert monitor.is_running is False

    def test_handles_runner_exception(self):
        """Test that monitor handles exceptions from runner gracefully."""
        store = MockStore()
        store.completed_agent_ids = ["agent-1"]
        runner = MagicMock()
        runner.trigger.side_effect = Exception("Runner error")
        config = {"session_completion_timeout": 30, "completion_check_interval": 0.1}

        monitor = SessionMonitor(store, runner, config)
        monitor.start()

        # Wait for at least one check cycle - should not crash
        time.sleep(0.2)

        monitor.stop()

        # Monitor should still be able to stop cleanly
        assert monitor.is_running is False
