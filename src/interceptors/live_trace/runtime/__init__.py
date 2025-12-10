"""Runtime module - Dynamic analysis for agents.

This module handles:
- Behavioral analysis (clustering, stability, outliers)
- Security checks (the "Report Checks")
- PII detection
- Analysis scheduling and triggering
"""

from .engine import AnalysisEngine, InsightsEngine
from .scheduler import AnalysisScheduler
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
    "AnalysisScheduler",
    "RiskAnalysisResult",
    "BehavioralAnalysisResult",
    "SecurityReport",
    "AssessmentCheck",
    "AssessmentCategory",
]
