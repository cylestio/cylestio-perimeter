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
    """Create a new analysis session for an agent workflow/codebase."""
    agent_workflow_id = args.get("agent_workflow_id")
    if not agent_workflow_id:
        return {"error": "agent_workflow_id is required"}

    session_type = args.get("session_type", "STATIC")
    agent_workflow_name = args.get("agent_workflow_name")

    try:
        session_type_enum = SessionType(session_type.upper())
    except ValueError:
        return {"error": f"Invalid session_type: {session_type}"}

    session_id = generate_session_id()
    session = store.create_analysis_session(
        session_id=session_id,
        agent_workflow_id=agent_workflow_id,
        session_type=session_type_enum.value,
        agent_workflow_name=agent_workflow_name,
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
        agent_workflow_id=session["agent_workflow_id"],
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
        agent_workflow_id=args.get("agent_workflow_id"),
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


# ==================== Agent Workflow Lifecycle Tools ====================

@register_handler("get_agent_workflow_state")
def handle_get_agent_workflow_state(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get the current lifecycle state of an agent workflow.
    
    Returns state, available data, and recommended next steps.
    """
    agent_workflow_id = args.get("agent_workflow_id")
    if not agent_workflow_id:
        return {"error": "agent_workflow_id is required"}

    # Get static analysis data
    static_sessions = store.get_analysis_sessions(agent_workflow_id=agent_workflow_id)
    findings = store.get_findings(agent_workflow_id=agent_workflow_id)
    
    # Get dynamic data (agents running through proxy)
    dynamic_agents = store.get_all_agents(agent_workflow_id=agent_workflow_id)
    
    has_static = len(static_sessions) > 0
    has_dynamic = len(dynamic_agents) > 0
    open_findings = [f for f in findings if f.get("status") == "OPEN"]
    
    # Determine state and provide context-aware recommendations
    if not has_static and not has_dynamic:
        state = "NO_DATA"
        recommendation = "Start by running a security scan on this codebase. Use get_security_patterns and create_analysis_session to begin static analysis."
    elif has_static and not has_dynamic:
        state = "STATIC_ONLY"
        if open_findings:
            recommendation = f"Static analysis found {len(open_findings)} open findings. To validate these findings with runtime behavior, configure your agent to use base_url='http://localhost:4000/agent-workflow/{agent_workflow_id}' and run test scenarios."
        else:
            recommendation = "Static analysis complete with no open findings. Run dynamic tests to validate runtime behavior."
    elif has_dynamic and not has_static:
        state = "DYNAMIC_ONLY"
        recommendation = "Dynamic runtime data captured. Run static analysis now to identify code-level security issues and correlate with observed runtime behavior."
    else:
        state = "COMPLETE"
        recommendation = f"Both static and dynamic data available! Use get_agent_workflow_correlation to see which of your {len(open_findings)} findings are validated by runtime tests."

    return {
        "agent_workflow_id": agent_workflow_id,
        "state": state,
        "has_static_analysis": has_static,
        "has_dynamic_sessions": has_dynamic,
        "static_sessions_count": len(static_sessions),
        "dynamic_agents_count": len(dynamic_agents),
        "findings_count": len(findings),
        "open_findings_count": len(open_findings),
        "recommendation": recommendation,
        "dashboard_url": f"http://localhost:7100/agent-workflow/{agent_workflow_id}",
    }


@register_handler("get_tool_usage_summary")
def handle_get_tool_usage_summary(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get tool usage patterns from dynamic sessions."""
    agent_workflow_id = args.get("agent_workflow_id")
    if not agent_workflow_id:
        return {"error": "agent_workflow_id is required"}

    agents = store.get_all_agents(agent_workflow_id=agent_workflow_id)
    if not agents:
        return {
            "agent_workflow_id": agent_workflow_id,
            "message": "No dynamic sessions found. Run your agent through the proxy to capture tool usage.",
            "setup_hint": f"Configure agent: base_url='http://localhost:4000/agent-workflow/{agent_workflow_id}'",
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

    # Sort by count descending
    sorted_usage = dict(sorted(tool_usage.items(), key=lambda x: x[1]["count"], reverse=True))

    # Find unused tools (defined but never called)
    unused_tools = list(available_tools - used_tools)

    return {
        "agent_workflow_id": agent_workflow_id,
        "total_sessions": total_sessions,
        "tool_usage": sorted_usage,
        "tools_defined": len(available_tools),
        "tools_used": len(used_tools),
        "tools_unused": unused_tools,
        "coverage_percent": round(len(used_tools) / len(available_tools) * 100, 1) if available_tools else 0,
    }


@register_handler("get_agent_workflow_correlation")
def handle_get_agent_workflow_correlation(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Correlate static findings with dynamic runtime observations.
    
    Computed on-the-fly by matching tool references in findings
    with actual tool usage from dynamic sessions.
    """
    agent_workflow_id = args.get("agent_workflow_id")
    if not agent_workflow_id:
        return {"error": "agent_workflow_id is required"}

    # Get static findings
    findings = store.get_findings(agent_workflow_id=agent_workflow_id)
    static_sessions = store.get_analysis_sessions(agent_workflow_id=agent_workflow_id)
    
    # Get dynamic data
    agents = store.get_all_agents(agent_workflow_id=agent_workflow_id)
    
    if not static_sessions:
        return {
            "agent_workflow_id": agent_workflow_id,
            "error": "No static analysis data. Run a security scan first.",
            "hint": "Use get_security_patterns and create_analysis_session to begin.",
        }
    
    if not agents:
        return {
            "agent_workflow_id": agent_workflow_id,
            "message": "Static analysis exists but no dynamic data yet.",
            "findings_count": len(findings),
            "hint": f"Run your agent with base_url='http://localhost:4000/agent-workflow/{agent_workflow_id}' to capture runtime data.",
            "correlations": [],
        }

    # Aggregate dynamic tool usage
    dynamic_tools_used = set()
    tool_call_counts = {}
    total_sessions = 0
    for agent in agents:
        dynamic_tools_used.update(agent.used_tools)
        total_sessions += agent.total_sessions
        for tool_name, count in agent.tool_usage_details.items():
            tool_call_counts[tool_name] = tool_call_counts.get(tool_name, 0) + count

    # Return raw data for the coding agent to analyze
    # The LLM can do intelligent matching between findings and tool usage
    findings_summary = [
        {
            "finding_id": f["finding_id"],
            "title": f["title"],
            "severity": f["severity"],
            "status": f["status"],
            "file_path": f.get("file_path"),
            "description": f.get("description"),
        }
        for f in findings
    ]

    return {
        "agent_workflow_id": agent_workflow_id,
        "has_static_data": len(findings) > 0,
        "has_dynamic_data": len(agents) > 0,
        "static_findings": findings_summary,
        "static_findings_count": len(findings),
        "dynamic_tools_used": list(dynamic_tools_used),
        "dynamic_tool_call_counts": tool_call_counts,
        "dynamic_sessions_count": total_sessions,
        "message": "Use AI to correlate findings with tool usage. Match finding titles/descriptions with tools that were called at runtime.",
    }


# ==================== Agent Discovery Tools ====================

@register_handler("get_agents")
def handle_get_agents(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """List all agents discovered during dynamic sessions."""
    agent_workflow_id = args.get("agent_workflow_id")
    include_stats = args.get("include_stats", True)
    
    # Handle special "unlinked" filter
    if agent_workflow_id == "unlinked":
        agents = store.get_all_agents(agent_workflow_id=None)
        # Filter to only agents with no agent_workflow_id
        agents = [a for a in agents if not a.agent_workflow_id]
    elif agent_workflow_id:
        agents = store.get_all_agents(agent_workflow_id=agent_workflow_id)
    else:
        agents = store.get_all_agents()
    
    result = []
    for agent in agents:
        agent_info = {
            "agent_id": agent.agent_id,
            "agent_id_short": agent.agent_id[:12] if len(agent.agent_id) > 12 else agent.agent_id,
            "agent_workflow_id": agent.agent_workflow_id,
            "display_name": getattr(agent, 'display_name', None),
            "description": getattr(agent, 'description', None),
        }
        
        if include_stats:
            agent_info.update({
                "total_sessions": agent.total_sessions,
                "total_messages": agent.total_messages,
                "total_tokens": agent.total_tokens,
                "tools_available": len(agent.available_tools),
                "tools_used": len(agent.used_tools),
                "first_seen": agent.first_seen.isoformat(),
                "last_seen": agent.last_seen.isoformat(),
            })
        
        result.append(agent_info)
    
    return {
        "agents": result,
        "total_count": len(result),
        "filter": agent_workflow_id if agent_workflow_id else "all",
    }


@register_handler("update_agent_info")
def handle_update_agent_info(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Update an agent's display name, description, or link to agent workflow."""
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}
    
    display_name = args.get("display_name")
    description = args.get("description")
    agent_workflow_id = args.get("agent_workflow_id")
    
    # Check at least one field to update
    if not any([display_name, description, agent_workflow_id]):
        return {"error": "Provide at least one of: display_name, description, agent_workflow_id"}
    
    result = store.update_agent_info(
        agent_id=agent_id,
        display_name=display_name,
        description=description,
        agent_workflow_id=agent_workflow_id,
    )
    
    if not result:
        return {"error": f"Agent '{agent_id}' not found"}
    
    return {"agent": result, "message": "Agent updated successfully"}


# ==================== IDE Connection Tools ====================

@register_handler("register_ide_connection")
def handle_register_ide_connection(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Register an IDE connection to Agent Inspector."""
    import uuid

    ide_type = args.get("ide_type")
    if not ide_type:
        return {"error": "ide_type is required (cursor or claude-code)"}

    if ide_type not in ["cursor", "claude-code"]:
        return {"error": f"Invalid ide_type: {ide_type}. Must be cursor or claude-code"}

    connection_id = f"ide_{uuid.uuid4().hex[:12]}"

    connection = store.register_ide_connection(
        connection_id=connection_id,
        ide_type=ide_type,
        agent_workflow_id=args.get("agent_workflow_id"),
        host=args.get("host"),
        user=args.get("user"),
        workspace_path=args.get("workspace_path"),
        model=args.get("model"),
    )

    return {
        "connection": connection,
        "message": f"IDE connected! Your {ide_type} is now linked to Agent Inspector.",
        "dashboard_url": "http://localhost:7100",
        "hint": "Call ide_heartbeat periodically to keep the connection alive, especially when actively developing.",
    }


@register_handler("ide_heartbeat")
def handle_ide_heartbeat(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Send heartbeat to keep IDE connection alive."""
    connection_id = args.get("connection_id")
    if not connection_id:
        return {"error": "connection_id is required"}

    is_developing = args.get("is_developing", False)
    agent_workflow_id = args.get("agent_workflow_id")

    connection = store.update_ide_heartbeat(
        connection_id=connection_id,
        is_developing=is_developing,
        agent_workflow_id=agent_workflow_id,
    )

    if not connection:
        return {"error": f"Connection '{connection_id}' not found. Register a new connection."}

    status_msg = "actively developing" if is_developing else "connected"
    return {
        "connection": connection,
        "status": status_msg,
        "message": f"Heartbeat received. IDE is {status_msg}.",
    }


@register_handler("disconnect_ide")
def handle_disconnect_ide(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Disconnect an IDE from Agent Inspector."""
    connection_id = args.get("connection_id")
    if not connection_id:
        return {"error": "connection_id is required"}

    connection = store.disconnect_ide(connection_id)

    if not connection:
        return {"error": f"Connection '{connection_id}' not found"}

    return {
        "connection": connection,
        "message": "IDE disconnected from Agent Inspector.",
    }


@register_handler("get_ide_connection_status")
def handle_get_ide_connection_status(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get current IDE connection status."""
    agent_workflow_id = args.get("agent_workflow_id")

    status = store.get_ide_connection_status(agent_workflow_id=agent_workflow_id)

    if status["is_connected"]:
        ide = status["connected_ide"]
        if status["is_developing"]:
            message = f"🔥 Actively developing with {ide['ide_type']}!"
        else:
            message = f"✅ Connected via {ide['ide_type']} (last seen: {ide['last_seen_relative']})"
    else:
        message = "❌ No IDE connected. Set up MCP connection in your IDE to enable live development tracking."

    return {
        **status,
        "message": message,
    }


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
