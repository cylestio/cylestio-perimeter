"""Runtime module - Dynamic analysis for agents.

This module handles:
- Behavioral analysis (clustering, stability, outliers)
- Security checks (the "Report Checks")
- PII detection
- Analysis triggering and session monitoring
"""

from .engine import AnalysisEngine, InsightsEngine
from .analysis_runner import AnalysisRunner
from .session_monitor import SessionMonitor
from .models import (
    RiskAnalysisResult,
    BehavioralAnalysisResult,
    SecurityReport,
    AssessmentCheck,
    AssessmentCategory,
)

__all__ = [
    "AnalysisEngine",
    "InsightsEngine",  # Backward compatibility
    "AnalysisRunner",
    "SessionMonitor",
    "RiskAnalysisResult",
    "BehavioralAnalysisResult",
    "SecurityReport",
    "AssessmentCheck",
    "AssessmentCategory",
]
