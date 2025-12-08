"""MCP tool handlers with registry pattern."""
from typing import Any, Callable, Dict

from src.kb.loader import get_kb_loader

from ..models import (
    Finding,
    FindingEvidence,
    FindingSeverity,
    SessionType,
    calculate_risk_score,
    generate_finding_id,
    generate_session_id,
)

# Type alias for tool handlers
ToolHandler = Callable[[Dict[str, Any], Any], Dict[str, Any]]

# Tool handler registry
_handlers: Dict[str, ToolHandler] = {}


def register_handler(name: str):
    """Decorator to register a tool handler."""
    def decorator(func: ToolHandler) -> ToolHandler:
        _handlers[name] = func
        return func
    return decorator


def call_tool(tool_name: str, arguments: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Execute an MCP tool by name.

    Args:
        tool_name: Name of the tool to execute
        arguments: Tool arguments
        store: TraceStore instance for data access

    Returns:
        Tool result dictionary
    """
    handler = _handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}
    return handler(arguments, store)


# ==================== Knowledge Tools ====================

@register_handler("get_security_patterns")
def handle_get_security_patterns(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get OWASP LLM security patterns."""
    loader = get_kb_loader()
    context = args.get("context", "all")
    min_severity = args.get("min_severity", "LOW")
    patterns = loader.get_security_patterns(context=context, min_severity=min_severity)
    return {"patterns": patterns, "total_count": len(patterns)}


@register_handler("get_owasp_control")
def handle_get_owasp_control(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get specific OWASP control details."""
    loader = get_kb_loader()
    control_id = args.get("control_id")
    control = loader.get_owasp_control(control_id)
    if not control:
        available = loader.get_all_owasp_controls()
        return {"error": f"Control '{control_id}' not found", "available": available}
    return {"control": control}


@register_handler("get_fix_template")
def handle_get_fix_template(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get remediation template for a finding type."""
    loader = get_kb_loader()
    finding_type = args.get("finding_type")
    template = loader.get_fix_template(finding_type)
    if not template:
        available = loader.get_all_fix_types()
        return {"error": f"Template for '{finding_type}' not found", "available": available}
    return {"template": template}


# ==================== Session Tools ====================

@register_handler("create_analysis_session")
def handle_create_analysis_session(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Create a new analysis session for a workflow/codebase."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    session_type = args.get("session_type", "STATIC")
    workflow_name = args.get("workflow_name")

    try:
        session_type_enum = SessionType(session_type.upper())
    except ValueError:
        return {"error": f"Invalid session_type: {session_type}"}

    session_id = generate_session_id()
    session = store.create_analysis_session(
        session_id=session_id,
        workflow_id=workflow_id,
        session_type=session_type_enum.value,
        workflow_name=workflow_name,
    )
    return {"session": session}


@register_handler("complete_analysis_session")
def handle_complete_analysis_session(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Complete an analysis session and calculate risk score."""
    session_id = args.get("session_id")
    calc_risk = args.get("calculate_risk", True)

    session = store.get_analysis_session(session_id)
    if not session:
        return {"error": f"Session '{session_id}' not found"}

    risk_score = None
    if calc_risk:
        findings = store.get_findings(session_id=session_id)
        finding_objects = _convert_findings_to_objects(findings)
        risk_score = calculate_risk_score(finding_objects)

    completed = store.complete_analysis_session(session_id, risk_score)
    return {"session": completed, "risk_score": risk_score}


# ==================== Finding Tools ====================

@register_handler("store_finding")
def handle_store_finding(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Store a security finding."""
    session_id = args.get("session_id")

    session = store.get_analysis_session(session_id)
    if not session:
        return {"error": f"Session '{session_id}' not found"}

    try:
        severity_enum = FindingSeverity(args.get("severity", "").upper())
    except ValueError:
        return {"error": f"Invalid severity: {args.get('severity')}"}

    evidence = {}
    if args.get("code_snippet"):
        evidence["code_snippet"] = args["code_snippet"]

    finding_id = generate_finding_id()
    finding = store.store_finding(
        finding_id=finding_id,
        session_id=session_id,
        workflow_id=session["workflow_id"],
        file_path=args.get("file_path"),
        finding_type=args.get("finding_type"),
        severity=severity_enum.value,
        title=args.get("title"),
        description=args.get("description"),
        line_start=args.get("line_start"),
        line_end=args.get("line_end"),
        evidence=evidence if evidence else None,
        owasp_mapping=args.get("owasp_mapping"),
    )
    return {"finding": finding}


@register_handler("get_findings")
def handle_get_findings(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get stored findings with optional filtering."""
    findings = store.get_findings(
        workflow_id=args.get("workflow_id"),
        session_id=args.get("session_id"),
        severity=args.get("severity", "").upper() if args.get("severity") else None,
        status=args.get("status", "").upper() if args.get("status") else None,
        limit=args.get("limit", 100),
    )
    return {"findings": findings, "total_count": len(findings)}


@register_handler("update_finding_status")
def handle_update_finding_status(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Update a finding's status."""
    finding_id = args.get("finding_id")
    status = args.get("status", "").upper()
    notes = args.get("notes")

    finding = store.update_finding_status(finding_id, status, notes)
    if not finding:
        return {"error": f"Finding '{finding_id}' not found"}
    return {"finding": finding}


# ==================== Helpers ====================

def _convert_findings_to_objects(findings: list) -> list:
    """Convert finding dicts to Finding objects for risk calculation."""
    finding_objects = []
    for f in findings:
        try:
            evidence_data = f.get("evidence")
            if isinstance(evidence_data, dict):
                f["evidence"] = FindingEvidence(**evidence_data)
            elif evidence_data is None:
                f["evidence"] = FindingEvidence()
            finding_objects.append(Finding(**f))
        except Exception:
            pass  # Skip invalid findings
    return finding_objects
