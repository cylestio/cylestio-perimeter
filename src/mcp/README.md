# MCP Models

Pydantic models for MCP (Model Context Protocol) tools supporting static security analysis.

## Overview

This module provides data models for managing security findings and analysis sessions from MCP-based static analysis tools. The models are designed to work with the broader Cylestio security analysis system.

## Structure

```
src/mcp/
├── __init__.py       # Exports all models and utilities
├── models.py         # Core Pydantic models and helpers
├── example.py        # Example usage demonstration
└── README.md         # This file
```

## Models

### Enums

#### FindingSeverity
Security finding severity levels:
- `CRITICAL` - Critical security vulnerability requiring immediate attention
- `HIGH` - High severity issue that should be addressed soon
- `MEDIUM` - Medium severity issue for tracking
- `LOW` - Low severity informational finding

#### FindingStatus
Current status of a security finding:
- `OPEN` - Finding is active and unresolved
- `FIXED` - Finding has been remediated
- `IGNORED` - Finding has been acknowledged but will not be fixed

#### SessionType
Type of analysis session:
- `STATIC` - Static code analysis
- `DYNAMIC` - Dynamic runtime analysis
- `AUTOFIX` - Automated fix generation session

#### SessionStatus
Status of an analysis session:
- `IN_PROGRESS` - Session is currently running
- `COMPLETED` - Session has finished

### Core Models

#### Finding
Complete model for a security finding (storage/retrieval).

**Fields:**
- `finding_id` (str) - Unique identifier (e.g., "find_abc123def456")
- `session_id` (str) - Associated session identifier
- `agent_id` (str) - Agent that detected the finding
- `file_path` (str) - Path to the file containing the issue
- `line_start` (int, optional) - Starting line number
- `line_end` (int, optional) - Ending line number
- `finding_type` (str) - Type identifier (e.g., "LLM01", "PROMPT_INJECTION")
- `severity` (FindingSeverity) - Severity level
- `title` (str) - Human-readable title
- `description` (str, optional) - Detailed description
- `evidence` (FindingEvidence) - Code snippets and context
- `owasp_mapping` (List[str]) - OWASP category mappings
- `status` (FindingStatus) - Current status
- `created_at` (str) - ISO timestamp of creation
- `updated_at` (str) - ISO timestamp of last update

**Note:** Enums serialize as strings due to `use_enum_values = True` in Config.

#### FindingCreate
Input model for creating a new finding.

**Required fields:**
- `session_id`
- `file_path`
- `finding_type`
- `severity`
- `title`

#### FindingUpdate
Input model for updating an existing finding.

**Fields:**
- `status` (FindingStatus) - New status
- `notes` (str, optional) - Update notes

#### FindingEvidence
Evidence supporting a security finding.

**Fields:**
- `code_snippet` (str, optional) - Relevant code excerpt
- `context` (str, optional) - Additional context information

#### AnalysisSession
Complete analysis session model.

**Fields:**
- `session_id` (str) - Unique session identifier
- `agent_id` (str) - Agent performing the analysis
- `agent_name` (str, optional) - Human-readable agent name
- `session_type` (SessionType) - Type of analysis
- `status` (SessionStatus) - Current status
- `created_at` (str) - ISO timestamp of creation
- `completed_at` (str, optional) - ISO timestamp of completion
- `findings_count` (int) - Total number of findings
- `risk_score` (int, optional) - Calculated risk score (0-100)

#### AnalysisSessionCreate
Input model for creating a new analysis session.

**Required fields:**
- `agent_id`

**Optional fields:**
- `agent_name`
- `session_type` (defaults to STATIC)

### Response Models

#### MCPToolResponse
Standard response wrapper for MCP tool operations.

**Fields:**
- `success` (bool) - Whether the operation succeeded
- `data` (Dict, optional) - Response data
- `error` (Dict, optional) - Error information if failed

#### MCPError
Detailed error information.

**Fields:**
- `code` (str) - Error code
- `message` (str) - Error message
- `suggestion` (str, optional) - Suggested resolution

## Helper Functions

### ID Generation

```python
from src.mcp import generate_finding_id, generate_session_id

finding_id = generate_finding_id()  # Returns: "find_abc123def456"
session_id = generate_session_id()  # Returns: "sess_abc123def456"
```

### Timestamps

```python
from src.mcp import get_timestamp

timestamp = get_timestamp()  # Returns: "2024-01-15T10:30:45.123456Z"
```

### Risk Score Calculation

```python
from src.mcp import calculate_risk_score, Finding

risk_score = calculate_risk_score(findings)  # Returns: 0-100
```

**Severity Weights:**
- CRITICAL: 25 points
- HIGH: 15 points
- MEDIUM: 5 points
- LOW: 1 point

**Notes:**
- Only `OPEN` findings are counted
- Score is capped at 100
- Empty finding list returns 0

## Usage Example

```python
from src.mcp import (
    Finding,
    FindingSeverity,
    FindingStatus,
    FindingEvidence,
    AnalysisSession,
    SessionType,
    SessionStatus,
    generate_finding_id,
    generate_session_id,
    get_timestamp,
    calculate_risk_score,
)

# Create a session
session = AnalysisSession(
    session_id=generate_session_id(),
    agent_id="agent_001",
    agent_name="Claude Static Analyzer",
    session_type=SessionType.STATIC,
    status=SessionStatus.IN_PROGRESS,
    created_at=get_timestamp()
)

# Create a finding
finding = Finding(
    finding_id=generate_finding_id(),
    session_id=session.session_id,
    agent_id="agent_001",
    file_path="/src/api/handler.py",
    line_start=45,
    line_end=52,
    finding_type="LLM01",
    severity=FindingSeverity.CRITICAL,
    title="Prompt Injection Vulnerability",
    description="User input directly concatenated into prompt",
    evidence=FindingEvidence(
        code_snippet='prompt = f"User: {user_input}"',
        context="Chat endpoint handler"
    ),
    owasp_mapping=["LLM01:2023"],
    status=FindingStatus.OPEN,
    created_at=get_timestamp(),
    updated_at=get_timestamp()
)

# Calculate risk
findings = [finding]
risk_score = calculate_risk_score(findings)  # Returns: 25

# Update session
session.findings_count = len(findings)
session.risk_score = risk_score
session.status = SessionStatus.COMPLETED
session.completed_at = get_timestamp()

# Serialize (enums become strings)
finding_dict = finding.model_dump()
# finding_dict["severity"] == "CRITICAL" (string, not enum)
```

## Enum Serialization

All enum fields use `use_enum_values = True` in their model Config, which means:

1. **Input**: Can accept enum or string
```python
# Both work:
Finding(..., severity=FindingSeverity.CRITICAL)
Finding(..., severity="CRITICAL")
```

2. **Output**: Always serializes to string
```python
finding = Finding(..., severity=FindingSeverity.CRITICAL)
finding.model_dump()["severity"]  # Returns: "CRITICAL" (string)
```

This ensures JSON serialization works correctly and matches frontend TypeScript types.

## Integration with Frontend

The models align with frontend TypeScript types in:
- `src/interceptors/live_trace/frontend/src/api/types/agent.ts`

Field names use snake_case in Python, which is preserved in JSON, and the frontend handles the conversion as needed.

## Verification

Run the verification script to test all models:

```bash
python verify_mcp_models.py
```

Or see examples:

```bash
cd src/mcp
python example.py
```

## Design Patterns

Following existing patterns from `src/interceptors/live_trace/analysis/risk_models.py`:

1. Use `str, Enum` for proper JSON serialization
2. Use `use_enum_values = True` in Config for models with enums
3. Use `Field(default_factory=...)` for mutable defaults
4. Provide clear docstrings for all models
5. Keep helper functions in the same module
