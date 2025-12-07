"""MCP tools for storage operations (sessions and findings)."""
from typing import Any, Dict, List, Optional

from src.mcp.models import (
    FindingSeverity,
    FindingStatus,
    MCPError,
    MCPToolResponse,
    SessionType,
    calculate_risk_score,
    generate_finding_id,
    generate_session_id,
)

# Module-level store reference
_store = None


def set_store(store):
    """Set the TraceStore reference for storage operations."""
    global _store
    _store = store


def _get_store():
    """Get the TraceStore, raising error if not initialized."""
    if _store is None:
        raise RuntimeError("Store not initialized. Call set_store() first.")
    return _store


def create_analysis_session(
    agent_id: str,
    session_type: str = "STATIC",
    agent_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new analysis session.

    Call this at the start of a security analysis to create a session
    that will group all findings together.

    Args:
        agent_id: Identifier for the agent being analyzed
        session_type: Type of analysis - "STATIC", "DYNAMIC", or "AUTOFIX"
        agent_name: Optional human-readable name for the agent

    Returns:
        MCPToolResponse with created session data or error.
    """
    try:
        # Validate session_type enum
        try:
            session_type_enum = SessionType(session_type.upper())
        except ValueError:
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="INVALID_SESSION_TYPE",
                    message=f"Invalid session_type '{session_type}'.",
                    suggestion="Use one of: STATIC, DYNAMIC, AUTOFIX",
                ).model_dump(),
            ).model_dump()

        store = _get_store()
        session_id = generate_session_id()

        session = store.create_analysis_session(
            session_id=session_id,
            agent_id=agent_id,
            session_type=session_type_enum.value,
            agent_name=agent_name,
        )

        return MCPToolResponse(
            success=True,
            data={
                "session": session,
                "instructions": (
                    f"Analysis session '{session_id}' created successfully. "
                    "Use this session_id when storing findings. "
                    "Call complete_analysis_session() when done to finalize and calculate risk score."
                ),
            },
        ).model_dump()

    except RuntimeError as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="STORE_NOT_INITIALIZED",
                message=str(e),
                suggestion="Ensure the store is initialized before calling storage tools.",
            ).model_dump(),
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="SESSION_CREATE_ERROR",
                message=f"Failed to create analysis session: {str(e)}",
                suggestion="Check that all parameters are valid and the database is accessible.",
            ).model_dump(),
        ).model_dump()


def complete_analysis_session(
    session_id: str,
    calculate_risk: bool = True,
) -> Dict[str, Any]:
    """Complete an analysis session.

    Call this when done adding findings to finalize the session
    and calculate the risk score.

    Args:
        session_id: ID of the session to complete
        calculate_risk: Whether to calculate risk score from findings (default: True)

    Returns:
        MCPToolResponse with completed session data or error.
    """
    try:
        store = _get_store()

        # Get session to verify it exists
        session = store.get_analysis_session(session_id)
        if not session:
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="SESSION_NOT_FOUND",
                    message=f"Analysis session '{session_id}' not found.",
                    suggestion="Check that the session_id is correct and the session was created.",
                ).model_dump(),
            ).model_dump()

        # Calculate risk score if requested
        risk_score = None
        if calculate_risk:
            # Get all findings for this session
            findings = store.get_findings(session_id=session_id)

            # Convert findings to Finding objects for risk calculation
            from src.mcp.models import Finding, FindingEvidence
            finding_objects = []
            for f in findings:
                try:
                    # Convert evidence dict to FindingEvidence if needed
                    evidence_data = f.get("evidence")
                    if isinstance(evidence_data, dict):
                        f["evidence"] = FindingEvidence(**evidence_data)
                    elif evidence_data is None:
                        f["evidence"] = FindingEvidence()

                    finding_obj = Finding(**f)
                    finding_objects.append(finding_obj)
                except Exception as e:
                    # Skip invalid findings in risk calculation
                    pass

            risk_score = calculate_risk_score(finding_objects)

        # Mark session as completed
        completed_session = store.complete_analysis_session(
            session_id=session_id,
            risk_score=risk_score,
        )

        return MCPToolResponse(
            success=True,
            data={
                "session": completed_session,
                "risk_score": risk_score,
                "instructions": (
                    f"Session '{session_id}' completed successfully. "
                    f"Risk score: {risk_score}/100. "
                    "Use get_findings() to review all findings for this session."
                ),
            },
        ).model_dump()

    except RuntimeError as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="STORE_NOT_INITIALIZED",
                message=str(e),
                suggestion="Ensure the store is initialized before calling storage tools.",
            ).model_dump(),
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="SESSION_COMPLETE_ERROR",
                message=f"Failed to complete analysis session: {str(e)}",
                suggestion="Check that the session exists and the database is accessible.",
            ).model_dump(),
        ).model_dump()


def store_finding(
    session_id: str,
    file_path: str,
    finding_type: str,
    severity: str,
    title: str,
    description: Optional[str] = None,
    line_start: Optional[int] = None,
    line_end: Optional[int] = None,
    code_snippet: Optional[str] = None,
    context: Optional[str] = None,
    owasp_mapping: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Store a security finding.

    Call this when you discover a security issue during analysis.
    Each finding is linked to an analysis session.

    Args:
        session_id: ID of the analysis session
        file_path: Path to the file where the issue was found
        finding_type: Type of finding (e.g., "LLM01", "PROMPT_INJECTION")
        severity: Severity level - "CRITICAL", "HIGH", "MEDIUM", or "LOW"
        title: Brief title describing the finding
        description: Detailed description of the issue
        line_start: Starting line number (optional)
        line_end: Ending line number (optional)
        code_snippet: Code snippet showing the issue (optional)
        context: Additional context about the finding (optional)
        owasp_mapping: List of OWASP control IDs (e.g., ["LLM01", "LLM08"])

    Returns:
        MCPToolResponse with created finding data or error.
    """
    try:
        # Validate severity enum
        try:
            severity_enum = FindingSeverity(severity.upper())
        except ValueError:
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="INVALID_SEVERITY",
                    message=f"Invalid severity '{severity}'.",
                    suggestion="Use one of: CRITICAL, HIGH, MEDIUM, LOW",
                ).model_dump(),
            ).model_dump()

        store = _get_store()

        # Get session to extract agent_id
        session = store.get_analysis_session(session_id)
        if not session:
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="SESSION_NOT_FOUND",
                    message=f"Analysis session '{session_id}' not found.",
                    suggestion="Create a session first using create_analysis_session().",
                ).model_dump(),
            ).model_dump()

        agent_id = session["agent_id"]

        # Build evidence dict from code_snippet and context
        evidence = {}
        if code_snippet:
            evidence["code_snippet"] = code_snippet
        if context:
            evidence["context"] = context

        # Generate finding ID
        finding_id = generate_finding_id()

        # Store the finding
        finding = store.store_finding(
            finding_id=finding_id,
            session_id=session_id,
            agent_id=agent_id,
            file_path=file_path,
            finding_type=finding_type,
            severity=severity_enum.value,
            title=title,
            description=description,
            line_start=line_start,
            line_end=line_end,
            evidence=evidence if evidence else None,
            owasp_mapping=owasp_mapping,
        )

        return MCPToolResponse(
            success=True,
            data={
                "finding": finding,
                "instructions": (
                    f"Finding '{finding_id}' stored successfully. "
                    "Use update_finding_status() to change status to FIXED or IGNORED."
                ),
            },
        ).model_dump()

    except RuntimeError as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="STORE_NOT_INITIALIZED",
                message=str(e),
                suggestion="Ensure the store is initialized before calling storage tools.",
            ).model_dump(),
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="FINDING_STORE_ERROR",
                message=f"Failed to store finding: {str(e)}",
                suggestion="Check that all parameters are valid and the session exists.",
            ).model_dump(),
        ).model_dump()


def get_findings(
    session_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
) -> Dict[str, Any]:
    """Get stored findings with optional filtering.

    Args:
        session_id: Filter by session ID
        agent_id: Filter by agent ID
        severity: Filter by severity - "CRITICAL", "HIGH", "MEDIUM", or "LOW"
        status: Filter by status - "OPEN", "FIXED", or "IGNORED"
        limit: Maximum number of findings to return (default: 100)

    Returns:
        MCPToolResponse with findings data or error.
    """
    try:
        # Validate severity if provided
        if severity:
            try:
                FindingSeverity(severity.upper())
                severity = severity.upper()
            except ValueError:
                return MCPToolResponse(
                    success=False,
                    error=MCPError(
                        code="INVALID_SEVERITY",
                        message=f"Invalid severity '{severity}'.",
                        suggestion="Use one of: CRITICAL, HIGH, MEDIUM, LOW",
                    ).model_dump(),
                ).model_dump()

        # Validate status if provided
        if status:
            try:
                FindingStatus(status.upper())
                status = status.upper()
            except ValueError:
                return MCPToolResponse(
                    success=False,
                    error=MCPError(
                        code="INVALID_STATUS",
                        message=f"Invalid status '{status}'.",
                        suggestion="Use one of: OPEN, FIXED, IGNORED",
                    ).model_dump(),
                ).model_dump()

        store = _get_store()

        # Get findings with filters
        findings = store.get_findings(
            session_id=session_id,
            agent_id=agent_id,
            severity=severity,
            status=status,
            limit=limit,
        )

        return MCPToolResponse(
            success=True,
            data={
                "findings": findings,
                "total_count": len(findings),
                "filters": {
                    "session_id": session_id,
                    "agent_id": agent_id,
                    "severity": severity,
                    "status": status,
                },
                "instructions": (
                    f"Retrieved {len(findings)} finding(s). "
                    "Review each finding's severity, status, and evidence. "
                    "Use update_finding_status() to mark findings as FIXED or IGNORED."
                ),
            },
        ).model_dump()

    except RuntimeError as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="STORE_NOT_INITIALIZED",
                message=str(e),
                suggestion="Ensure the store is initialized before calling storage tools.",
            ).model_dump(),
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="FINDINGS_GET_ERROR",
                message=f"Failed to get findings: {str(e)}",
                suggestion="Check that the filter parameters are valid.",
            ).model_dump(),
        ).model_dump()


def update_finding_status(
    finding_id: str,
    status: str,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Update the status of a finding.

    Call this when a finding has been fixed or should be ignored.

    Args:
        finding_id: ID of the finding to update
        status: New status - "OPEN", "FIXED", or "IGNORED"
        notes: Optional notes about the status change

    Returns:
        MCPToolResponse with updated finding data or error.
    """
    try:
        # Validate status enum
        try:
            status_enum = FindingStatus(status.upper())
        except ValueError:
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="INVALID_STATUS",
                    message=f"Invalid status '{status}'.",
                    suggestion="Use one of: OPEN, FIXED, IGNORED",
                ).model_dump(),
            ).model_dump()

        store = _get_store()

        # Update the finding
        updated_finding = store.update_finding_status(
            finding_id=finding_id,
            status=status_enum.value,
            notes=notes,
        )

        if not updated_finding:
            return MCPToolResponse(
                success=False,
                error=MCPError(
                    code="FINDING_NOT_FOUND",
                    message=f"Finding '{finding_id}' not found.",
                    suggestion="Check that the finding_id is correct.",
                ).model_dump(),
            ).model_dump()

        return MCPToolResponse(
            success=True,
            data={
                "finding": updated_finding,
                "instructions": (
                    f"Finding '{finding_id}' status updated to {status_enum.value}. "
                    "The updated_at timestamp has been set to now."
                ),
            },
        ).model_dump()

    except RuntimeError as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="STORE_NOT_INITIALIZED",
                message=str(e),
                suggestion="Ensure the store is initialized before calling storage tools.",
            ).model_dump(),
        ).model_dump()
    except Exception as e:
        return MCPToolResponse(
            success=False,
            error=MCPError(
                code="FINDING_UPDATE_ERROR",
                message=f"Failed to update finding status: {str(e)}",
                suggestion="Check that the finding exists and the status is valid.",
            ).model_dump(),
        ).model_dump()
