"""Data models for security findings and analysis sessions."""
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FindingSeverity(str, Enum):
    """Severity levels for security findings."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class FindingStatus(str, Enum):
    """Status of a security finding."""
    OPEN = "OPEN"
    FIXED = "FIXED"
    IGNORED = "IGNORED"


class SessionType(str, Enum):
    """Type of analysis session."""
    STATIC = "STATIC"
    DYNAMIC = "DYNAMIC"
    AUTOFIX = "AUTOFIX"


class SessionStatus(str, Enum):
    """Status of an analysis session."""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class FindingEvidence(BaseModel):
    """Evidence for a security finding."""
    code_snippet: Optional[str] = None
    context: Optional[str] = None


class Finding(BaseModel):
    """Full model for a security finding (storage/retrieval)."""
    finding_id: str
    session_id: str
    agent_id: str
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    finding_type: str  # e.g., "LLM01", "PROMPT_INJECTION"
    severity: FindingSeverity
    title: str
    description: Optional[str] = None
    evidence: FindingEvidence = Field(default_factory=FindingEvidence)
    owasp_mapping: List[str] = Field(default_factory=list)
    status: FindingStatus = FindingStatus.OPEN
    created_at: str  # ISO timestamp
    updated_at: str  # ISO timestamp

    class Config:
        use_enum_values = True


class FindingCreate(BaseModel):
    """Input model for creating a security finding."""
    session_id: str
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    finding_type: str
    severity: FindingSeverity
    title: str
    description: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    owasp_mapping: Optional[List[str]] = None


class FindingUpdate(BaseModel):
    """Input model for updating a security finding."""
    status: FindingStatus
    notes: Optional[str] = None


class AnalysisSession(BaseModel):
    """Analysis session model."""
    session_id: str
    agent_id: str
    agent_name: Optional[str] = None
    session_type: SessionType
    status: SessionStatus
    created_at: str
    completed_at: Optional[str] = None
    findings_count: int = 0
    risk_score: Optional[int] = None  # 0-100

    class Config:
        use_enum_values = True


class AnalysisSessionCreate(BaseModel):
    """Input model for creating an analysis session."""
    agent_id: str
    agent_name: Optional[str] = None
    session_type: SessionType = SessionType.STATIC


# Helper Functions

def generate_finding_id() -> str:
    """Generate a unique finding ID."""
    return f"find_{uuid.uuid4().hex[:12]}"


def generate_session_id() -> str:
    """Generate a unique session ID."""
    return f"sess_{uuid.uuid4().hex[:12]}"


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.utcnow().isoformat() + "Z"


# Risk score calculation
SEVERITY_WEIGHTS = {
    FindingSeverity.CRITICAL: 25,
    FindingSeverity.HIGH: 15,
    FindingSeverity.MEDIUM: 5,
    FindingSeverity.LOW: 1,
}


def calculate_risk_score(findings: List[Finding]) -> int:
    """Calculate risk score 0-100 from findings.

    Args:
        findings: List of Finding objects to calculate score from

    Returns:
        Risk score between 0 and 100
    """
    if not findings:
        return 0

    total = sum(
        SEVERITY_WEIGHTS.get(FindingSeverity(f.severity), 0)
        for f in findings
        if f.status == FindingStatus.OPEN
    )
    return min(total, 100)
