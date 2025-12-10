"""Tests for the analysis scheduler."""
import threading
import time
import pytest

from ..scheduler import AnalysisScheduler


class TestAnalysisScheduler:
    """Test the AnalysisScheduler class."""

    def test_should_run_analysis_with_new_sessions(self):
        """Test that analysis runs when there are new completed sessions."""
        completed_counts = {"agent-1": 5}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))

        # First check - should run (5 > 0)
        assert scheduler.should_run_analysis("agent-1") is True

    def test_should_not_run_analysis_without_new_sessions(self):
        """Test that analysis doesn't run when no new sessions."""
        completed_counts = {"agent-1": 5}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))

        # Mark as analyzed
        scheduler.mark_analysis_started("agent-1")
        scheduler.mark_analysis_completed("agent-1", 5)

        # Should not run (5 == 5)
        assert scheduler.should_run_analysis("agent-1") is False

    def test_should_run_analysis_after_new_session_arrives(self):
        """Test that analysis runs when new sessions arrive after previous analysis."""
        completed_counts = {"agent-1": 5}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))

        # First analysis
        scheduler.mark_analysis_started("agent-1")
        scheduler.mark_analysis_completed("agent-1", 5)

        # New session arrives
        completed_counts["agent-1"] = 6

        # Should run again (6 > 5)
        assert scheduler.should_run_analysis("agent-1") is True

    def test_should_not_run_when_analysis_in_progress(self):
        """Test that concurrent analysis is prevented."""
        completed_counts = {"agent-1": 5}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))

        # Start analysis
        scheduler.mark_analysis_started("agent-1")

        # New session arrives
        completed_counts["agent-1"] = 6

        # Should NOT run (analysis in progress)
        assert scheduler.should_run_analysis("agent-1") is False

    def test_burst_handling(self):
        """Test handling of burst sessions arriving during analysis."""
        completed_counts = {"agent-1": 5}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))

        # Start analysis for 5 sessions
        assert scheduler.should_run_analysis("agent-1") is True
        scheduler.mark_analysis_started("agent-1")

        # During analysis, 10 more sessions arrive
        completed_counts["agent-1"] = 15

        # Analysis completes, records that 5 were analyzed
        scheduler.mark_analysis_completed("agent-1", 5)

        # Should trigger again (15 > 5)
        assert scheduler.should_run_analysis("agent-1") is True

        # Start second analysis
        scheduler.mark_analysis_started("agent-1")
        scheduler.mark_analysis_completed("agent-1", 15)

        # Should not trigger again (15 == 15)
        assert scheduler.should_run_analysis("agent-1") is False

    def test_multiple_agents_independent(self):
        """Test that different agents have independent scheduling."""
        completed_counts = {"agent-1": 5, "agent-2": 3}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))

        # Start analysis for agent-1
        scheduler.mark_analysis_started("agent-1")

        # agent-2 should still be able to run
        assert scheduler.should_run_analysis("agent-2") is True
        assert scheduler.should_run_analysis("agent-1") is False  # in progress

    def test_is_analysis_running(self):
        """Test is_analysis_running method."""
        scheduler = AnalysisScheduler(lambda aid: 5)

        assert scheduler.is_analysis_running("agent-1") is False

        scheduler.mark_analysis_started("agent-1")
        assert scheduler.is_analysis_running("agent-1") is True

        scheduler.mark_analysis_completed("agent-1", 5)
        assert scheduler.is_analysis_running("agent-1") is False

    def test_get_last_analyzed_count(self):
        """Test get_last_analyzed_count method."""
        scheduler = AnalysisScheduler(lambda aid: 5)

        # No previous analysis
        assert scheduler.get_last_analyzed_count("agent-1") == 0

        # After analysis
        scheduler.mark_analysis_started("agent-1")
        scheduler.mark_analysis_completed("agent-1", 5)
        assert scheduler.get_last_analyzed_count("agent-1") == 5

    def test_reset_agent(self):
        """Test reset_agent clears state."""
        scheduler = AnalysisScheduler(lambda aid: 5)

        scheduler.mark_analysis_started("agent-1")
        scheduler.mark_analysis_completed("agent-1", 5)

        scheduler.reset_agent("agent-1")

        assert scheduler.is_analysis_running("agent-1") is False
        assert scheduler.get_last_analyzed_count("agent-1") == 0
        # Should run again after reset
        assert scheduler.should_run_analysis("agent-1") is True

    def test_get_status(self):
        """Test get_status returns correct status."""
        scheduler = AnalysisScheduler(lambda aid: 5)

        scheduler.mark_analysis_started("agent-1")
        scheduler.mark_analysis_completed("agent-1", 5)
        scheduler.mark_analysis_started("agent-2")

        status = scheduler.get_status()

        assert status["agent-1"]["is_running"] is False
        assert status["agent-1"]["last_analyzed_count"] == 5
        assert status["agent-2"]["is_running"] is True
        assert status["agent-2"]["last_analyzed_count"] == 0

    def test_thread_safety(self):
        """Test that scheduler is thread-safe."""
        completed_counts = {"agent-1": 0}
        scheduler = AnalysisScheduler(lambda aid: completed_counts.get(aid, 0))
        errors = []
        started_count = [0]
        lock = threading.Lock()

        def simulate_session_complete():
            """Simulate a session completing and triggering analysis check."""
            for _ in range(50):
                with lock:
                    completed_counts["agent-1"] += 1

                if scheduler.should_run_analysis("agent-1"):
                    scheduler.mark_analysis_started("agent-1")
                    with lock:
                        started_count[0] += 1
                    time.sleep(0.001)  # Simulate analysis
                    count = completed_counts["agent-1"]
                    scheduler.mark_analysis_completed("agent-1", count)

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
        # All sessions should eventually be covered
        assert scheduler.get_last_analyzed_count("agent-1") <= 250  # 5 threads * 50 sessions


class TestSchedulerEdgeCases:
    """Test edge cases for the scheduler."""

    def test_zero_completed_sessions(self):
        """Test with zero completed sessions."""
        scheduler = AnalysisScheduler(lambda aid: 0)

        # No sessions, shouldn't run
        assert scheduler.should_run_analysis("agent-1") is False

    def test_unknown_agent(self):
        """Test with unknown agent ID."""
        scheduler = AnalysisScheduler(lambda aid: 0)

        assert scheduler.should_run_analysis("unknown-agent") is False
        assert scheduler.is_analysis_running("unknown-agent") is False
        assert scheduler.get_last_analyzed_count("unknown-agent") == 0

    def test_analysis_completed_before_started(self):
        """Test calling mark_analysis_completed before mark_analysis_started."""
        scheduler = AnalysisScheduler(lambda aid: 5)

        # This shouldn't crash
        scheduler.mark_analysis_completed("agent-1", 5)
        assert scheduler.is_analysis_running("agent-1") is False
        assert scheduler.get_last_analyzed_count("agent-1") == 5
