"""Tests for the analysis runner."""
import asyncio
import threading
import time
import pytest
from unittest.mock import MagicMock, AsyncMock

from ..analysis_runner import AnalysisRunner, MIN_SESSIONS_FOR_RISK_ANALYSIS


class MockStore:
    """Mock store for testing AnalysisRunner."""

    def __init__(self, completed_counts=None, last_analyzed_counts=None):
        self.completed_counts = completed_counts or {}
        self.last_analyzed_counts = last_analyzed_counts or {}
        self.persisted_counts = {}

    def get_completed_session_count(self, agent_id: str) -> int:
        return self.completed_counts.get(agent_id, 0)

    def get_agent_last_analyzed_count(self, agent_id: str) -> int:
        return self.last_analyzed_counts.get(agent_id, 0)

    def update_agent_last_analyzed(self, agent_id: str, session_count: int) -> None:
        self.last_analyzed_counts[agent_id] = session_count

    def get_agents_needing_analysis(self, min_sessions: int):
        return [
            aid for aid, count in self.completed_counts.items()
            if count >= min_sessions and count > self.last_analyzed_counts.get(aid, 0)
        ]


class TestAnalysisRunner:
    """Test the AnalysisRunner class."""

    def test_should_run_with_sufficient_new_sessions(self):
        """Test that analysis runs when there are enough new completed sessions."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Should run - has enough sessions and none analyzed yet
        assert runner._should_run("agent-1") is True

    def test_should_not_run_with_insufficient_sessions(self):
        """Test that analysis doesn't run with insufficient sessions."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS - 1})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Should NOT run - not enough sessions
        assert runner._should_run("agent-1") is False

    def test_should_not_run_without_new_sessions(self):
        """Test that analysis doesn't run when no new sessions since last analysis."""
        store = MockStore(
            completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS},
            last_analyzed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS}
        )
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Should NOT run - already analyzed all sessions
        assert runner._should_run("agent-1") is False

    def test_should_run_after_new_session_arrives(self):
        """Test that analysis runs when new sessions arrive after previous analysis."""
        store = MockStore(
            completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS},
            last_analyzed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS}
        )
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Currently should not run
        assert runner._should_run("agent-1") is False

        # New session arrives
        store.completed_counts["agent-1"] = MIN_SESSIONS_FOR_RISK_ANALYSIS + 1

        # Should run now
        assert runner._should_run("agent-1") is True

    def test_should_not_run_when_analysis_in_progress(self):
        """Test that concurrent analysis is prevented."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Start analysis (simulating in-progress state)
        runner._mark_started("agent-1")

        # New session arrives
        store.completed_counts["agent-1"] = MIN_SESSIONS_FOR_RISK_ANALYSIS + 1

        # Should NOT run (analysis in progress)
        assert runner._should_run("agent-1") is False

    def test_mark_started_and_completed(self):
        """Test marking analysis as started and completed."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        assert runner.is_running("agent-1") is False

        runner._mark_started("agent-1")
        assert runner.is_running("agent-1") is True

        runner._mark_completed("agent-1", MIN_SESSIONS_FOR_RISK_ANALYSIS)
        assert runner.is_running("agent-1") is False
        assert store.last_analyzed_counts["agent-1"] == MIN_SESSIONS_FOR_RISK_ANALYSIS

    def test_burst_handling(self):
        """Test handling of burst sessions arriving during analysis."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Should run initially
        assert runner._should_run("agent-1") is True
        runner._mark_started("agent-1")

        # During analysis, 10 more sessions arrive
        store.completed_counts["agent-1"] = MIN_SESSIONS_FOR_RISK_ANALYSIS + 10

        # Analysis completes with original count
        runner._mark_completed("agent-1", MIN_SESSIONS_FOR_RISK_ANALYSIS)

        # Should trigger again due to burst
        assert runner._should_run("agent-1") is True

        # Start second analysis
        runner._mark_started("agent-1")
        runner._mark_completed("agent-1", MIN_SESSIONS_FOR_RISK_ANALYSIS + 10)

        # Should not trigger again
        assert runner._should_run("agent-1") is False

    def test_multiple_agents_independent(self):
        """Test that different agents have independent scheduling."""
        store = MockStore(completed_counts={
            "agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS,
            "agent-2": MIN_SESSIONS_FOR_RISK_ANALYSIS
        })
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Start analysis for agent-1
        runner._mark_started("agent-1")

        # agent-2 should still be able to run
        assert runner._should_run("agent-2") is True
        assert runner._should_run("agent-1") is False  # in progress

    def test_get_last_analyzed_count(self):
        """Test get_last_analyzed_count method."""
        store = MockStore(
            completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS},
            last_analyzed_counts={"agent-1": 3}
        )
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        assert runner.get_last_analyzed_count("agent-1") == 3

    def test_reset_agent(self):
        """Test reset_agent clears in-memory state."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        runner._mark_started("agent-1")
        assert runner.is_running("agent-1") is True

        runner.reset_agent("agent-1")
        assert runner.is_running("agent-1") is False

    def test_get_status(self):
        """Test get_status returns correct status."""
        store = MockStore(
            completed_counts={
                "agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS,
                "agent-2": MIN_SESSIONS_FOR_RISK_ANALYSIS
            },
            last_analyzed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS}
        )
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        runner._mark_started("agent-1")
        runner._mark_completed("agent-1", MIN_SESSIONS_FOR_RISK_ANALYSIS)
        runner._mark_started("agent-2")

        status = runner.get_status()

        assert status["agent-1"]["is_running"] is False
        assert status["agent-1"]["last_analyzed_count"] == MIN_SESSIONS_FOR_RISK_ANALYSIS
        assert status["agent-2"]["is_running"] is True

    def test_thread_safety(self):
        """Test that runner is thread-safe."""
        store = MockStore(completed_counts={"agent-1": 0})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)
        started_count = [0]
        lock = threading.Lock()

        def simulate_session_complete():
            """Simulate a session completing and triggering analysis check."""
            for _ in range(50):
                with lock:
                    store.completed_counts["agent-1"] += 1

                if runner._should_run("agent-1"):
                    runner._mark_started("agent-1")
                    with lock:
                        started_count[0] += 1
                    time.sleep(0.001)  # Simulate analysis
                    count = store.completed_counts["agent-1"]
                    runner._mark_completed("agent-1", count)

        # Start multiple threads
        threads = [
            threading.Thread(target=simulate_session_complete)
            for _ in range(5)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Should have completed at least some analyses
        assert started_count[0] > 0


class TestAnalysisRunnerEdgeCases:
    """Test edge cases for the runner."""

    def test_zero_completed_sessions(self):
        """Test with zero completed sessions."""
        store = MockStore(completed_counts={"agent-1": 0})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        assert runner._should_run("agent-1") is False

    def test_unknown_agent(self):
        """Test with unknown agent ID."""
        store = MockStore()
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        assert runner._should_run("unknown-agent") is False
        assert runner.is_running("unknown-agent") is False
        assert runner.get_last_analyzed_count("unknown-agent") == 0

    def test_completed_before_started(self):
        """Test calling _mark_completed before _mark_started."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # This shouldn't crash
        runner._mark_completed("agent-1", MIN_SESSIONS_FOR_RISK_ANALYSIS)
        assert runner.is_running("agent-1") is False
        assert store.last_analyzed_counts["agent-1"] == MIN_SESSIONS_FOR_RISK_ANALYSIS

    def test_trigger_calls_run_async_when_should_run(self):
        """Test that trigger() calls _run_async when conditions are met."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Mock _run_async to track if it's called
        runner._run_async = MagicMock()

        runner.trigger("agent-1")

        runner._run_async.assert_called_once_with("agent-1")

    def test_trigger_skips_when_should_not_run(self):
        """Test that trigger() skips when conditions are not met."""
        store = MockStore(completed_counts={"agent-1": MIN_SESSIONS_FOR_RISK_ANALYSIS - 1})
        compute_fn = AsyncMock()
        runner = AnalysisRunner(store, compute_fn)

        # Mock _run_async to track if it's called
        runner._run_async = MagicMock()

        runner.trigger("agent-1")

        runner._run_async.assert_not_called()
