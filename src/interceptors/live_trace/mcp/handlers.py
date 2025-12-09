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


# ==================== Workflow Config Tools ====================

@register_handler("get_workflow_config")
def handle_get_workflow_config(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Read workflow configuration from cylestio.yaml."""
    from ..workflow_config import get_workflow_info, find_config_file
    
    project_path = args.get("project_path")
    info = get_workflow_info(project_path)
    
    if not info["config_found"]:
        return {
            "config_found": False,
            "message": "No cylestio.yaml found. Create one to define your workflow_id.",
            "template": """# cylestio.yaml
workflow_id: your-project-name
workflow_name: Your Project Name

# Optional: define agents in this workflow
agents:
  - id: main-agent
    entry_point: src/agent.py
""",
        }
    
    return {
        "config_found": True,
        "workflow_id": info["workflow_id"],
        "workflow_name": info["workflow_name"],
        "agents": info["agents"],
        "config_path": info["config_path"],
    }


# ==================== Lifecycle & Correlation Tools ====================

@register_handler("get_workflow_state")
def handle_get_workflow_state(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get the current lifecycle state of a workflow."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    # Check what exists
    static_sessions = store.get_analysis_sessions(workflow_id=workflow_id)
    dynamic_agents = store.get_all_agents(workflow_id=workflow_id)
    findings = store.get_findings(workflow_id=workflow_id)

    has_static = len(static_sessions) > 0
    has_dynamic = len(dynamic_agents) > 0
    open_findings = [f for f in findings if f.get("status") == "OPEN"]

    # Determine state and recommendation
    if not has_static and not has_dynamic:
        state = "NO_DATA"
        recommendation = "Run static analysis from your IDE or dynamic testing through the proxy to begin."
    elif has_static and not has_dynamic:
        state = "STATIC_ONLY"
        recommendation = f"You have {len(open_findings)} open findings. Run dynamic testing to validate them."
    elif has_dynamic and not has_static:
        state = "DYNAMIC_ONLY"
        recommendation = "Dynamic data captured. Run static analysis from your IDE for full correlation."
    else:
        state = "COMPLETE"
        recommendation = "Both static and dynamic analysis available. Use get_workflow_correlation for insights."

    return {
        "workflow_id": workflow_id,
        "state": state,
        "has_static_analysis": has_static,
        "has_dynamic_sessions": has_dynamic,
        "static_sessions_count": len(static_sessions),
        "dynamic_agents_count": len(dynamic_agents),
        "findings_count": len(findings),
        "open_findings_count": len(open_findings),
        "recommendation": recommendation,
    }


@register_handler("get_tool_usage_summary")
def handle_get_tool_usage_summary(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get tool usage patterns from dynamic sessions."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    agents = store.get_all_agents(workflow_id=workflow_id)
    if not agents:
        return {
            "workflow_id": workflow_id,
            "message": "No dynamic sessions found. Run your agent through the proxy first.",
            "tool_usage": {},
            "total_sessions": 0,
        }

    # Aggregate tool usage across all agents
    tool_usage = {}
    available_tools = set()
    used_tools = set()
    total_sessions = 0

    for agent in agents:
        total_sessions += agent.total_sessions
        available_tools.update(agent.available_tools)
        used_tools.update(agent.used_tools)

        for tool_name, count in agent.tool_usage_details.items():
            if tool_name not in tool_usage:
                tool_usage[tool_name] = {"count": 0}
            tool_usage[tool_name]["count"] += count

    # Sort by count
    sorted_usage = dict(sorted(tool_usage.items(), key=lambda x: x[1]["count"], reverse=True))

    # Calculate coverage
    unused_tools = available_tools - used_tools

    return {
        "workflow_id": workflow_id,
        "total_sessions": total_sessions,
        "tool_usage": sorted_usage,
        "tools_defined": len(available_tools),
        "tools_used": len(used_tools),
        "tools_unused": list(unused_tools),
        "coverage_percent": round(len(used_tools) / len(available_tools) * 100, 1) if available_tools else 0,
    }


@register_handler("get_workflow_correlation")
def handle_get_workflow_correlation(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Correlate static findings with dynamic observations and store results."""
    import uuid

    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    # Get static data
    findings = store.get_findings(workflow_id=workflow_id)
    static_sessions = store.get_analysis_sessions(workflow_id=workflow_id)

    # Get dynamic data
    agents = store.get_all_agents(workflow_id=workflow_id)

    # Aggregate dynamic tool usage
    dynamic_tools_used = set()
    tool_call_counts = {}
    for agent in agents:
        dynamic_tools_used.update(agent.used_tools)
        for tool_name, count in agent.tool_usage_details.items():
            tool_call_counts[tool_name] = tool_call_counts.get(tool_name, 0) + count

    # Correlate findings with dynamic data
    correlations = []
    for finding in findings:
        # Try to extract tool name from finding
        tool_mentioned = _extract_tool_from_finding(finding)

        if tool_mentioned:
            was_exercised = tool_mentioned in dynamic_tools_used
            call_count = tool_call_counts.get(tool_mentioned, 0)
            validation_status = "VALIDATED" if was_exercised else "UNEXERCISED"

            correlation = {
                "finding_id": finding["finding_id"],
                "title": finding["title"],
                "severity": finding["severity"],
                "status": finding["status"],
                "tool_mentioned": tool_mentioned,
                "dynamically_exercised": was_exercised,
                "dynamic_call_count": call_count,
                "validation": validation_status,
            }
            correlations.append(correlation)

            # Store the correlation
            store.store_correlation(
                correlation_id=f"corr_{finding['finding_id']}",
                workflow_id=workflow_id,
                finding_id=finding["finding_id"],
                correlation_type="FINDING_TOOL_USAGE",
                validation_status=validation_status,
                tool_name=tool_mentioned,
                dynamic_call_count=call_count,
                evidence={"tool_calls": call_count, "exercised": was_exercised},
            )
        else:
            correlations.append({
                "finding_id": finding["finding_id"],
                "title": finding["title"],
                "severity": finding["severity"],
                "status": finding["status"],
                "tool_mentioned": None,
                "dynamically_exercised": None,
                "validation": "NO_TOOL_REFERENCE",
            })

    # Summary stats
    validated = len([c for c in correlations if c["validation"] == "VALIDATED"])
    unexercised = len([c for c in correlations if c["validation"] == "UNEXERCISED"])

    recommendations = []
    if unexercised > 0:
        recommendations.append(f"{unexercised} findings reference tools that were not exercised in testing. Consider adding test scenarios.")
    if not agents:
        recommendations.append("No dynamic data available. Run your agent through the proxy to validate findings.")
    if not findings:
        recommendations.append("No static findings. Run static analysis from your IDE first.")

    return {
        "workflow_id": workflow_id,
        "static_findings_count": len(findings),
        "dynamic_sessions_count": sum(a.total_sessions for a in agents),
        "findings_validated": validated,
        "findings_unexercised": unexercised,
        "correlations": correlations,
        "recommendations": recommendations,
        "stored": True,  # Indicates correlations were persisted
    }


@register_handler("update_agent_info")
def handle_update_agent_info(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Update an agent's display name, description, and/or workflow_id."""
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}

    display_name = args.get("display_name")
    description = args.get("description")
    workflow_id = args.get("workflow_id")

    if not display_name and not description and not workflow_id:
        return {"error": "At least one of display_name, description, or workflow_id is required"}

    result = store.update_agent_info(
        agent_id=agent_id,
        display_name=display_name,
        description=description,
        workflow_id=workflow_id,
    )

    if not result:
        return {"error": f"Agent '{agent_id}' not found"}

    return {
        "success": True,
        "agent": result,
        "message": f"Updated agent '{agent_id}' - workflow: {workflow_id or '(unchanged)'}, name: {display_name or '(unchanged)'}",
    }


@register_handler("get_agents")
def handle_get_agents(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """List agents discovered during dynamic sessions."""
    workflow_id = args.get("workflow_id")
    include_stats = args.get("include_stats", True)

    # Special filter for unlinked agents
    if workflow_id == "unlinked":
        all_agents = store.get_all_agents()
        agents = [a for a in all_agents if not a.workflow_id]
    elif workflow_id:
        agents = store.get_all_agents(workflow_id=workflow_id)
    else:
        agents = store.get_all_agents()

    # Format response
    agent_list = []
    unlinked_count = 0
    
    for agent in agents:
        agent_data = {
            "agent_id": agent.agent_id,
            "workflow_id": agent.workflow_id,
            "display_name": agent.display_name,
            "is_linked": agent.workflow_id is not None,
        }
        
        if not agent.workflow_id:
            unlinked_count += 1
        
        if include_stats:
            agent_data.update({
                "total_sessions": agent.total_sessions,
                "total_messages": agent.total_messages,
                "total_tools": agent.total_tools,
                "used_tools": list(agent.used_tools),
                "last_seen": agent.last_seen,
            })
        
        agent_list.append(agent_data)

    return {
        "agents": agent_list,
        "total_count": len(agent_list),
        "unlinked_count": unlinked_count,
        "message": f"Found {len(agent_list)} agents ({unlinked_count} unlinked)" if unlinked_count else f"Found {len(agent_list)} agents",
    }


def _extract_tool_from_finding(finding: Dict[str, Any]) -> str | None:
    """Try to extract a tool name from a finding."""
    # Check common patterns in title and description
    text = f"{finding.get('title', '')} {finding.get('description', '')}".lower()

    # Look for common tool-related patterns
    # This is a simple heuristic - could be improved
    tool_indicators = ["tool", "function", "endpoint", "api", "method"]

    for indicator in tool_indicators:
        if indicator in text:
            # Try to find a word that looks like a tool name (snake_case or camelCase)
            import re
            matches = re.findall(r'\b([a-z]+_[a-z_]+|[a-z]+[A-Z][a-zA-Z]*)\b', text)
            if matches:
                return matches[0]

    return None


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
