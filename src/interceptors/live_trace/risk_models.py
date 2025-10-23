"""Data models for risk analysis results."""
from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field


class SessionFeatures(BaseModel):
    """Behavioral features extracted from a session."""
    session_id: str
    agent_id: str
    
    # Tool usage (PRIMARY behavioral signal)
    tools_used: Set[str] = Field(default_factory=set)
    tool_sequences: List[str] = Field(default_factory=list)
    tool_execution_times: List[float] = Field(default_factory=list)
    
    # LLM interaction patterns
    llm_models: Set[str] = Field(default_factory=set)
    llm_request_count: int = 0
    token_in_stats: Dict[str, float] = Field(default_factory=dict)  # {mean, std, max, p95}
    token_out_stats: Dict[str, float] = Field(default_factory=dict)
    
    # Temporal characteristics
    session_duration: float = 0.0  # seconds
    event_count: int = 0
    avg_event_interval: float = 0.0  # seconds between events
    
    # Resource consumption
    total_tokens: int = 0
    total_tool_calls: int = 0

    class Config:
        # Allow sets to be JSON serializable
        json_encoders = {
            set: list
        }


class ClusterCharacteristics(BaseModel):
    """Statistical characteristics of a cluster."""
    typical_duration_sec: float
    typical_duration_range: List[float]  # [min, max]
    typical_tool_calls: int
    typical_tool_calls_range: List[int]
    typical_tokens: int
    typical_tokens_range: List[int]
    common_tools: List[str]
    common_tool_sequence: str
    common_models: List[str]


class ClusterInfo(BaseModel):
    """Information about a behavioral cluster."""
    cluster_id: str
    size: int
    percentage: float
    session_ids: List[str]
    characteristics: ClusterCharacteristics
    insights: str
    confidence: str = "normal"  # "normal" (≥3 sessions) or "low" (2 sessions)


class OutlierInfo(BaseModel):
    """Information about an outlier session."""
    session_id: str
    anomaly_score: float
    severity: str  # low, medium, high, critical
    distance_to_nearest_centroid: float = 0.0  # Jaccard distance to nearest cluster centroid (0-1)
    nearest_cluster_id: str = ""  # ID of the nearest cluster
    primary_causes: List[str]
    tool_analysis: Dict[str, Any] = Field(default_factory=dict)
    resource_analysis: Dict[str, Any] = Field(default_factory=dict)
    temporal_analysis: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[str]


class CentroidDistance(BaseModel):
    """Distance between two cluster centroids."""
    from_cluster: str
    to_cluster: str
    distance: float  # Jaccard distance (0-1, where 0=identical, 1=completely different)
    similarity_score: float  # 1.0 - distance (inverse)


class BehavioralAnalysisResult(BaseModel):
    """Results from behavioral analysis."""
    total_sessions: int
    num_clusters: int
    num_outliers: int
    stability_score: float
    predictability_score: float
    cluster_diversity: float
    clusters: List[ClusterInfo]
    outliers: List[OutlierInfo]
    centroid_distances: List[CentroidDistance] = Field(default_factory=list)
    interpretation: str
    error: Optional[str] = None


class AssessmentCheck(BaseModel):
    """Individual security assessment check."""
    check_id: str  # e.g., "RESOURCE_001_TOKEN_BOUNDS"
    category: str  # e.g., "Resource Management"
    name: str  # e.g., "Token Usage Bounds"
    description: str  # What we're checking
    status: str  # "passed", "warning", "critical"
    value: Optional[str] = None  # Display value: "3 violations", "0.82 score", etc.
    evidence: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)

    @property
    def passed(self) -> bool:
        """Check if this assessment passed."""
        return self.status == "passed"

    @property
    def is_critical(self) -> bool:
        """Check if this is a critical issue."""
        return self.status == "critical"

    @property
    def is_warning(self) -> bool:
        """Check if this is a warning."""
        return self.status == "warning"


class AssessmentCategory(BaseModel):
    """Group of related security checks."""
    category_id: str  # e.g., "RESOURCE_MANAGEMENT"
    category_name: str  # e.g., "Resource Management"
    description: str  # What this category covers
    checks: List[AssessmentCheck] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)  # Category-specific metrics

    @property
    def total_checks(self) -> int:
        """Total number of checks in this category."""
        return len(self.checks)

    @property
    def passed_checks(self) -> int:
        """Number of checks that passed."""
        return sum(1 for check in self.checks if check.passed)

    @property
    def critical_checks(self) -> int:
        """Number of critical issues."""
        return sum(1 for check in self.checks if check.is_critical)

    @property
    def warning_checks(self) -> int:
        """Number of warnings."""
        return sum(1 for check in self.checks if check.is_warning)

    @property
    def highest_severity(self) -> str:
        """Highest severity level in this category."""
        if any(check.is_critical for check in self.checks):
            return "critical"
        elif any(check.is_warning for check in self.checks):
            return "warning"
        return "passed"


class SecurityReport(BaseModel):
    """Complete security assessment report."""
    report_id: str
    agent_id: str
    timestamp: str
    sessions_analyzed: int
    categories: Dict[str, AssessmentCategory] = Field(default_factory=dict)
    summary: Dict[str, Any] = Field(default_factory=dict)

    @property
    def overall_status(self) -> str:
        """Overall status: passed, warning, or critical."""
        if any(cat.highest_severity == "critical" for cat in self.categories.values()):
            return "critical"
        elif any(cat.highest_severity == "warning" for cat in self.categories.values()):
            return "warning"
        return "passed"

    @property
    def total_checks(self) -> int:
        """Total number of checks across all categories."""
        return sum(cat.total_checks for cat in self.categories.values())

    @property
    def passed_checks(self) -> int:
        """Total number of passed checks."""
        return sum(cat.passed_checks for cat in self.categories.values())

    @property
    def critical_issues(self) -> int:
        """Total number of critical issues."""
        return sum(cat.critical_checks for cat in self.categories.values())

    @property
    def warnings(self) -> int:
        """Total number of warnings."""
        return sum(cat.warning_checks for cat in self.categories.values())


class RiskAnalysisResult(BaseModel):
    """Complete risk analysis result combining behavioral and security."""
    evaluation_id: str
    agent_id: str
    timestamp: str
    sessions_analyzed: int
    evaluation_status: str  # COMPLETE, INSUFFICIENT_DATA, ERROR

    behavioral_analysis: Optional[BehavioralAnalysisResult] = None
    security_report: Optional[SecurityReport] = None

    summary: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None

