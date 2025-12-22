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
    """Store a security finding and auto-create a linked recommendation."""
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
    if args.get("context"):
        evidence["context"] = args["context"]

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
        # New Phase 1 parameters
        source_type=args.get("source_type", "STATIC"),
        category=args.get("category"),
        check_id=args.get("check_id"),
        cvss_score=args.get("cvss_score"),
        cwe=args.get("cwe"),
        soc2_controls=args.get("soc2_controls"),
        auto_create_recommendation=args.get("auto_create_recommendation", True),
        fix_hints=args.get("fix_hints"),
        impact=args.get("impact"),
        fix_complexity=args.get("fix_complexity"),
        # Developer insights parameters
        dev_category=args.get("dev_category"),
        health_impact=args.get("health_impact"),
        code_fingerprint=args.get("code_fingerprint"),
    )

    result = {"finding": finding}
    if finding.get("recommendation_id"):
        result["recommendation_id"] = finding["recommendation_id"]
        result["message"] = f"Finding stored with auto-created recommendation {finding['recommendation_id']}"

    return result


@register_handler("get_findings")
def handle_get_findings(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get stored findings with optional filtering."""
    findings = store.get_findings(
        agent_workflow_id=args.get("agent_workflow_id"),
        session_id=args.get("session_id"),
        severity=args.get("severity", "").upper() if args.get("severity") else None,
        status=args.get("status", "").upper() if args.get("status") else None,
        # New developer insights filters
        source=args.get("source"),
        dev_category=args.get("dev_category"),
        correlation_state=args.get("correlation_state"),
        include_resolved=args.get("include_resolved", False),
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


@register_handler("update_finding_correlation")
def handle_update_finding_correlation(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Update a finding's correlation state.
    
    Correlation states:
    - VALIDATED: Static finding confirmed by runtime evidence
    - UNEXERCISED: Static finding, code path never executed at runtime
    - RUNTIME_ONLY: Issue found at runtime, no static counterpart
    - THEORETICAL: Static finding, but safe at runtime
    """
    finding_id = args.get("finding_id")
    if not finding_id:
        return {"error": "finding_id is required"}
    
    correlation_state = args.get("correlation_state", "").upper()
    valid_states = {'VALIDATED', 'UNEXERCISED', 'RUNTIME_ONLY', 'THEORETICAL'}
    if correlation_state not in valid_states:
        return {"error": f"Invalid correlation_state: {correlation_state}. Must be one of {list(valid_states)}"}
    
    correlation_evidence = args.get("correlation_evidence")
    
    finding = store.update_finding_correlation(
        finding_id=finding_id,
        correlation_state=correlation_state,
        correlation_evidence=correlation_evidence,
    )
    
    if not finding:
        return {"error": f"Finding '{finding_id}' not found"}
    
    return {
        "finding": finding,
        "message": f"Finding {finding_id} marked as {correlation_state}",
    }


@register_handler("get_correlation_summary")
def handle_get_correlation_summary(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get correlation summary for an agent workflow.
    
    Returns counts of findings by correlation state.
    """
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id or agent_workflow_id is required"}
    
    summary = store.get_correlation_summary(workflow_id)
    
    # Add helpful message
    if summary['uncorrelated'] > 0:
        message = f"💡 {summary['uncorrelated']} findings not yet correlated. Use /correlate to correlate them with runtime data."
    elif summary['validated'] > 0:
        message = f"⚠️ {summary['validated']} findings are VALIDATED - active risks confirmed at runtime. Prioritize fixing these!"
    elif summary['is_correlated']:
        message = "✅ All findings correlated. No validated active risks."
    else:
        message = "No findings to correlate yet."
    
    return {
        **summary,
        "message": message,
    }


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


# ==================== Recommendation Tools ====================

@register_handler("get_recommendations")
def handle_get_recommendations(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get recommendations for a workflow with optional filtering."""
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id or agent_workflow_id is required"}

    recommendations = store.get_recommendations(
        workflow_id=workflow_id,
        status=args.get("status", "").upper() if args.get("status") else None,
        severity=args.get("severity", "").upper() if args.get("severity") else None,
        category=args.get("category", "").upper() if args.get("category") else None,
        blocking_only=args.get("blocking_only", False),
        limit=args.get("limit", 100),
    )

    return {
        "recommendations": recommendations,
        "total_count": len(recommendations),
        "workflow_id": workflow_id,
    }


@register_handler("get_recommendation_detail")
def handle_get_recommendation_detail(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get detailed information about a specific recommendation."""
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    recommendation = store.get_recommendation(recommendation_id)
    if not recommendation:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    # Get the linked finding
    finding = store.get_finding(recommendation['source_finding_id'])

    # Get audit history
    audit_log = store.get_audit_log(
        entity_type='recommendation',
        entity_id=recommendation_id,
        limit=20,
    )

    return {
        "recommendation": recommendation,
        "finding": finding,
        "audit_log": audit_log,
    }


@register_handler("start_fix")
def handle_start_fix(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Mark a recommendation as being worked on (FIXING status)."""
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    fixed_by = args.get("fixed_by")

    recommendation = store.start_fix(
        recommendation_id=recommendation_id,
        fixed_by=fixed_by,
    )

    if not recommendation:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    return {
        "recommendation": recommendation,
        "message": f"Started fix for {recommendation_id}. Status is now FIXING.",
        "next_step": f"After applying your fix, call complete_fix(recommendation_id='{recommendation_id}', fix_notes='...') to mark it as done.",
    }


@register_handler("complete_fix")
def handle_complete_fix(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Mark a recommendation as fixed."""
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    recommendation = store.complete_fix(
        recommendation_id=recommendation_id,
        fix_notes=args.get("fix_notes"),
        files_modified=args.get("files_modified"),
        fix_commit=args.get("fix_commit"),
        fix_method=args.get("fix_method"),
        fixed_by=args.get("fixed_by"),
    )

    if not recommendation:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    return {
        "recommendation": recommendation,
        "message": f"Fix completed for {recommendation_id}. Status is now FIXED.",
        "next_step": "The fix can be verified with verify_fix() or the recommendation can be dismissed if needed.",
    }


@register_handler("verify_fix")
def handle_verify_fix(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Verify a fix and update status to VERIFIED or reopen if failed."""
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    verification_result = args.get("verification_result")
    if not verification_result:
        return {"error": "verification_result is required"}

    success = args.get("success", True)

    recommendation = store.verify_fix(
        recommendation_id=recommendation_id,
        verification_result=verification_result,
        success=success,
        verified_by=args.get("verified_by"),
    )

    if not recommendation:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    if success:
        message = f"Fix verified for {recommendation_id}. Status is now VERIFIED. ✅"
    else:
        message = f"Verification failed for {recommendation_id}. Status reverted to PENDING. ❌"

    return {
        "recommendation": recommendation,
        "message": message,
        "success": success,
    }


@register_handler("dismiss_recommendation")
def handle_dismiss_recommendation(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Dismiss or ignore a recommendation (accept the risk)."""
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    reason = args.get("reason")
    if not reason:
        return {"error": "reason is required - explain why this is being dismissed"}

    dismiss_type = args.get("dismiss_type", "DISMISSED")

    recommendation = store.dismiss_recommendation(
        recommendation_id=recommendation_id,
        reason=reason,
        dismiss_type=dismiss_type,
        dismissed_by=args.get("dismissed_by"),
    )

    if not recommendation:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    return {
        "recommendation": recommendation,
        "message": f"Recommendation {recommendation_id} has been {dismiss_type.lower()}.",
        "note": "This will be logged in the audit trail for compliance purposes.",
    }


@register_handler("get_gate_status")
def handle_get_gate_status(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get the production gate status for a workflow."""
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id or agent_workflow_id is required"}

    gate_status = store.get_gate_status(workflow_id)

    if gate_status['is_blocked']:
        message = f"🚫 Production BLOCKED: {gate_status['blocking_critical']} critical and {gate_status['blocking_high']} high severity issues must be addressed."
    else:
        message = "✅ Production READY: No blocking security issues."

    return {
        **gate_status,
        "message": message,
    }


@register_handler("get_audit_log")
def handle_get_audit_log(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get audit log entries for compliance reporting."""
    entries = store.get_audit_log(
        entity_type=args.get("entity_type"),
        entity_id=args.get("entity_id"),
        action=args.get("action"),
        limit=args.get("limit", 100),
    )

    return {
        "entries": entries,
        "total_count": len(entries),
    }


# ==================== Dynamic Analysis On-Demand Tools ====================

@register_handler("trigger_dynamic_analysis")
def handle_trigger_dynamic_analysis(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Trigger on-demand dynamic analysis for a workflow.
    
    Analysis processes only new sessions since last analysis.
    Creates findings and recommendations for failed checks.
    Auto-resolves issues not detected in new scans.
    """
    import requests
    
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id or agent_workflow_id is required"}

    # Get current status first
    status = store.get_dynamic_analysis_status(workflow_id)
    
    if status['is_running']:
        return {
            "status": "already_running",
            "message": "Analysis is already in progress. Wait for it to complete.",
            "last_analysis": status.get('last_analysis'),
        }
    
    if status['total_unanalyzed_sessions'] == 0:
        return {
            "status": "no_new_sessions",
            "message": "All sessions have already been analyzed. Run more test sessions first.",
            "last_analysis": status.get('last_analysis'),
            "hint": f"Run your agent through the proxy at http://localhost:4000/agent-workflow/{workflow_id} to capture new sessions.",
        }
    
    # Call the API endpoint to trigger the full analysis
    # This runs security checks, creates findings/recommendations, and auto-resolves old issues
    try:
        response = requests.post(
            f"http://localhost:7100/api/workflow/{workflow_id}/trigger-dynamic-analysis",
            timeout=120  # Analysis can take time
        )
        
        if response.status_code == 200:
            result = response.json()
            result["view_results"] = f"http://localhost:7100/agent-workflow/{workflow_id}/dynamic-analysis"
            return result
        else:
            return {
                "status": "error",
                "message": f"Failed to trigger analysis: {response.text}",
            }
    except requests.exceptions.ConnectionError:
        return {
            "status": "error", 
            "message": "Could not connect to Agent Inspector API. Make sure the server is running on port 7100.",
            "hint": "Start the server with: python -m src.main run --config examples/configs/live-trace.yaml",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error triggering analysis: {str(e)}",
        }


@register_handler("get_dynamic_analysis_status")
def handle_get_dynamic_analysis_status(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get comprehensive dynamic analysis status for a workflow.
    
    Shows:
    - Whether analysis can be triggered
    - Number of unanalyzed sessions
    - Per-agent status
    - Last analysis info
    """
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id or agent_workflow_id is required"}

    status = store.get_dynamic_analysis_status(workflow_id)
    
    # Add helpful message based on status
    if status['is_running']:
        message = "🔵 Analysis in progress..."
    elif status['total_unanalyzed_sessions'] > 0:
        message = f"🟡 {status['total_unanalyzed_sessions']} new sessions ready to analyze. Use trigger_dynamic_analysis to run."
    elif status.get('last_analysis'):
        message = "✅ All sessions analyzed. Dynamic analysis is up to date."
    else:
        message = f"⚪ No sessions yet. Run your agent through http://localhost:4000/agent-workflow/{workflow_id} to capture sessions."
    
    return {
        **status,
        "message": message,
    }


@register_handler("get_analysis_history")
def handle_get_analysis_history(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get analysis history for a workflow.
    
    Shows past analysis runs. Latest analysis impacts gate status,
    historical analyses are view-only records.
    """
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id or agent_workflow_id is required"}

    session_type = args.get("session_type", "DYNAMIC")
    limit = args.get("limit", 20)
    
    sessions = store.get_analysis_sessions(
        agent_workflow_id=workflow_id,
        limit=limit,
    )
    
    # Filter by session_type
    filtered = [s for s in sessions if s.get('session_type') == session_type.upper()]
    
    # Determine latest
    latest_id = None
    if filtered:
        completed = [s for s in filtered if s.get('status') == 'COMPLETED']
        if completed:
            latest_id = completed[0]['session_id']
    
    return {
        "workflow_id": workflow_id,
        "session_type": session_type,
        "analyses": filtered,
        "latest_id": latest_id,
        "total_count": len(filtered),
        "message": f"Found {len(filtered)} {session_type.lower()} analysis sessions." +
                   (f" Latest: {latest_id}" if latest_id else ""),
    }


# ==================== Developer Insights Tools ====================

@register_handler("get_health_score")
def handle_get_health_score(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get comprehensive health score with dimension breakdown."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    health = store.get_health_score(workflow_id)
    return {
        "health_score": health,
        "message": f"Overall health: {health['overall_health']}% ({health['total_issues']} issues)",
    }


@register_handler("get_code_analysis")
def handle_get_code_analysis(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get developer findings grouped by category for the Code page."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    analysis = store.get_code_analysis(workflow_id)
    return {
        "code_analysis": analysis,
        "message": f"Code health: {analysis['code_health']}% ({analysis['total_issues']} issues)",
    }


@register_handler("get_health_trend")
def handle_get_health_trend(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get health score history for trend visualization."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    days = args.get("days", 30)
    source = args.get("source")

    trend = store.get_health_trend(workflow_id, days=days, source=source)
    return {
        "trend": trend,
        "message": f"Health trend ({trend['data_points']} data points): {trend['trend']}",
    }


@register_handler("get_scan_comparison")
def handle_get_scan_comparison(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Compare findings between two scans."""
    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    comparison = store.get_scan_comparison(
        workflow_id=workflow_id,
        current_session_id=args.get("current_session_id"),
        previous_session_id=args.get("previous_session_id"),
    )

    if not comparison.get("has_comparison"):
        return {"comparison": comparison, "message": comparison.get("message", "No comparison available")}

    return {
        "comparison": comparison,
        "message": f"Comparison: {comparison['new_count']} new, {comparison['resolved_count']} resolved, "
                   f"{comparison['unchanged_count']} unchanged",
    }


@register_handler("record_health_snapshot")
def handle_record_health_snapshot(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Record a health score snapshot for trend tracking."""
    workflow_id = args.get("workflow_id")
    source = args.get("source")
    overall_health = args.get("overall_health")

    if not workflow_id:
        return {"error": "workflow_id is required"}
    if not source:
        return {"error": "source is required"}
    if overall_health is None:
        return {"error": "overall_health is required"}

    snapshot = store.record_health_snapshot(
        workflow_id=workflow_id,
        source=source,
        overall_health=overall_health,
        security_score=args.get("security_score"),
        availability_score=args.get("availability_score"),
        reliability_score=args.get("reliability_score"),
        efficiency_score=args.get("efficiency_score"),
        security_issues=args.get("security_issues", 0),
        availability_issues=args.get("availability_issues", 0),
        reliability_issues=args.get("reliability_issues", 0),
        efficiency_issues=args.get("efficiency_issues", 0),
        total_findings=args.get("total_findings", 0),
        new_findings=args.get("new_findings", 0),
        resolved_findings=args.get("resolved_findings", 0),
        analysis_session_id=args.get("analysis_session_id"),
    )

    return {
        "snapshot": snapshot,
        "message": f"Health snapshot recorded: {overall_health}%",
    }


# ==================== Reporting Tools ====================

@register_handler("generate_report")
def handle_generate_report(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Generate a comprehensive health report."""
    from datetime import datetime

    workflow_id = args.get("workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    report_format = args.get("format", "markdown")
    include = args.get("include", {})
    severity_threshold = args.get("severity_threshold", "LOW")
    max_findings = args.get("max_findings_per_section", 10)

    # Default include options
    include_sections = {
        "executive_summary": include.get("executive_summary", True),
        "security_findings": include.get("security_findings", True),
        "developer_findings": include.get("developer_findings", True),
        "correlation_summary": include.get("correlation_summary", True),
        "gate_status": include.get("gate_status", True),
        "recommendations": include.get("recommendations", True),
        "trend_analysis": include.get("trend_analysis", True),
    }

    # Gather data
    health_score = store.get_health_score(workflow_id)
    gate_status = store.get_gate_status(workflow_id)
    findings = store.get_findings(agent_workflow_id=workflow_id, status="OPEN", limit=100)
    recommendations = store.get_recommendations(workflow_id=workflow_id, status="PENDING", limit=100)

    # Get correlation summary if available
    correlation = store.get_correlation_summary(workflow_id)

    # Get trend data
    trend = store.get_health_trend(workflow_id, days=30)

    # Separate security and developer findings
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    threshold_level = severity_order.get(severity_threshold, 3)

    security_findings = [f for f in findings
                        if not f.get("dev_category")
                        and severity_order.get(f.get("severity"), 3) <= threshold_level]
    developer_findings = [f for f in findings
                         if f.get("dev_category")
                         and severity_order.get(f.get("severity"), 3) <= threshold_level]

    # Apply max findings limit
    if max_findings > 0:
        security_findings = security_findings[:max_findings]
        developer_findings = developer_findings[:max_findings]

    generated_at = datetime.utcnow().isoformat()

    if report_format == "json":
        report = _generate_json_report(
            workflow_id=workflow_id,
            health_score=health_score,
            gate_status=gate_status,
            security_findings=security_findings,
            developer_findings=developer_findings,
            recommendations=recommendations,
            correlation=correlation,
            trend=trend,
            include_sections=include_sections,
            generated_at=generated_at,
        )
    elif report_format == "html":
        report = _generate_html_report(
            workflow_id=workflow_id,
            health_score=health_score,
            gate_status=gate_status,
            security_findings=security_findings,
            developer_findings=developer_findings,
            recommendations=recommendations,
            correlation=correlation,
            trend=trend,
            include_sections=include_sections,
            generated_at=generated_at,
        )
    else:  # markdown
        report = _generate_markdown_report(
            workflow_id=workflow_id,
            health_score=health_score,
            gate_status=gate_status,
            security_findings=security_findings,
            developer_findings=developer_findings,
            recommendations=recommendations,
            correlation=correlation,
            trend=trend,
            include_sections=include_sections,
            generated_at=generated_at,
        )

    return {
        "report": report,
        "format": report_format,
        "workflow_id": workflow_id,
        "generated_at": generated_at,
        "sections_included": [k for k, v in include_sections.items() if v],
        "message": f"Report generated for {workflow_id} in {report_format} format",
    }


def _generate_markdown_report(
    workflow_id: str,
    health_score: Dict[str, Any],
    gate_status: Dict[str, Any],
    security_findings: list,
    developer_findings: list,
    recommendations: list,
    correlation: Dict[str, Any],
    trend: Dict[str, Any],
    include_sections: Dict[str, bool],
    generated_at: str,
) -> str:
    """Generate a markdown report."""
    lines = []

    lines.append(f"# Agent Health Report: {workflow_id}")
    lines.append(f"\n*Generated: {generated_at}*\n")

    # Executive Summary
    if include_sections["executive_summary"]:
        lines.append("## Executive Summary\n")
        overall = health_score.get("overall_health", 0)
        total_issues = health_score.get("total_issues", 0)

        if overall >= 80:
            status_emoji = "🟢"
            status_text = "Healthy"
        elif overall >= 50:
            status_emoji = "🟡"
            status_text = "Needs Attention"
        else:
            status_emoji = "🔴"
            status_text = "Critical"

        lines.append(f"**Overall Health Score:** {status_emoji} **{overall}%** ({status_text})")
        lines.append(f"**Total Open Issues:** {total_issues}\n")

        # Dimension breakdown
        lines.append("### Dimension Scores\n")
        lines.append("| Dimension | Score | Issues |")
        lines.append("|-----------|-------|--------|")

        dimensions = health_score.get("dimensions", {})
        issue_counts = health_score.get("issue_counts", {})
        lines.append(f"| Security | {dimensions.get('security', 100)}% | {issue_counts.get('security', 0)} |")
        lines.append(f"| Availability | {dimensions.get('availability', 100)}% | {issue_counts.get('availability', 0)} |")
        lines.append(f"| Reliability | {dimensions.get('reliability', 100)}% | {issue_counts.get('reliability', 0)} |")
        lines.append(f"| Efficiency | {dimensions.get('efficiency', 100)}% | {issue_counts.get('efficiency', 0)} |")
        lines.append("")

    # Gate Status
    if include_sections["gate_status"]:
        lines.append("## Production Gate Status\n")
        if gate_status.get("is_blocked"):
            lines.append(f"🚫 **BLOCKED**: {gate_status.get('blocking_critical', 0)} critical and {gate_status.get('blocking_high', 0)} high severity issues")
        else:
            lines.append("✅ **READY**: No blocking issues")
        lines.append("")

    # Trend Analysis
    if include_sections["trend_analysis"] and trend.get("data_points", 0) > 1:
        lines.append("## Health Trend\n")
        trend_direction = trend.get("trend", "stable")
        if trend_direction == "improving":
            lines.append(f"📈 **Improving**: Health score has increased by {trend.get('delta', 0):.1f}% over the last {trend.get('period_days', 30)} days")
        elif trend_direction == "declining":
            lines.append(f"📉 **Declining**: Health score has decreased by {abs(trend.get('delta', 0)):.1f}% over the last {trend.get('period_days', 30)} days")
        else:
            lines.append(f"➡️ **Stable**: Health score is stable over the last {trend.get('period_days', 30)} days")
        lines.append("")

    # Correlation Summary
    if include_sections["correlation_summary"] and correlation.get("has_correlation"):
        lines.append("## Correlation Analysis\n")
        lines.append(f"*Based on {correlation.get('sessions_analyzed', 0)} runtime sessions*\n")
        lines.append(f"- **Validated (confirmed at runtime):** {correlation.get('validated', 0)}")
        lines.append(f"- **Unexercised (never triggered):** {correlation.get('unexercised', 0)}")
        lines.append(f"- **Theoretical (blocked at runtime):** {correlation.get('theoretical', 0)}")
        lines.append("")

    # Security Findings
    if include_sections["security_findings"] and security_findings:
        lines.append("## Security Findings\n")
        lines.append(f"*Showing {len(security_findings)} open security issues*\n")

        for f in security_findings:
            severity = f.get("severity", "MEDIUM")
            severity_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}.get(severity, "⚪")
            lines.append(f"### {severity_emoji} {f.get('title', 'Untitled')}\n")
            lines.append(f"**Severity:** {severity} | **Type:** {f.get('finding_type', 'Unknown')}")
            if f.get("file_path"):
                lines.append(f"**Location:** `{f['file_path']}`" + (f":{f.get('line_start', '')}" if f.get("line_start") else ""))
            if f.get("description"):
                lines.append(f"\n{f['description']}")
            lines.append("")

    # Developer Findings
    if include_sections["developer_findings"] and developer_findings:
        lines.append("## Developer Findings (Code Quality)\n")
        lines.append(f"*Showing {len(developer_findings)} code quality issues*\n")

        for f in developer_findings:
            severity = f.get("severity", "MEDIUM")
            category = f.get("dev_category", "RELIABILITY")
            category_emoji = {"AVAILABILITY": "🔄", "RELIABILITY": "✓", "INEFFICIENCY": "⚡"}.get(category, "📝")
            lines.append(f"### {category_emoji} {f.get('title', 'Untitled')}\n")
            lines.append(f"**Category:** {category} | **Severity:** {severity}")
            if f.get("health_impact"):
                lines.append(f"**Health Impact:** -{f['health_impact']}%")
            if f.get("file_path"):
                lines.append(f"**Location:** `{f['file_path']}`" + (f":{f.get('line_start', '')}" if f.get("line_start") else ""))
            if f.get("description"):
                lines.append(f"\n{f['description']}")
            lines.append("")

    # Recommendations
    if include_sections["recommendations"] and recommendations:
        lines.append("## Recommendations\n")
        lines.append(f"*Top {len(recommendations)} pending recommendations*\n")

        for i, r in enumerate(recommendations[:5], 1):  # Top 5
            lines.append(f"### {i}. {r.get('title', 'Untitled')}")
            lines.append(f"**Priority:** {r.get('severity', 'MEDIUM')} | **Status:** {r.get('status', 'PENDING')}")
            if r.get("fix_guidance"):
                lines.append(f"\n*Guidance:* {r['fix_guidance'][:200]}...")
            lines.append("")

    lines.append("---")
    lines.append(f"*Report generated by Agent Inspector*")

    return "\n".join(lines)


def _generate_json_report(
    workflow_id: str,
    health_score: Dict[str, Any],
    gate_status: Dict[str, Any],
    security_findings: list,
    developer_findings: list,
    recommendations: list,
    correlation: Dict[str, Any],
    trend: Dict[str, Any],
    include_sections: Dict[str, bool],
    generated_at: str,
) -> Dict[str, Any]:
    """Generate a JSON report."""
    report = {
        "workflow_id": workflow_id,
        "generated_at": generated_at,
        "format": "json",
    }

    if include_sections["executive_summary"]:
        report["executive_summary"] = {
            "overall_health": health_score.get("overall_health", 0),
            "total_issues": health_score.get("total_issues", 0),
            "dimensions": health_score.get("dimensions", {}),
            "issue_counts": health_score.get("issue_counts", {}),
        }

    if include_sections["gate_status"]:
        report["gate_status"] = gate_status

    if include_sections["trend_analysis"]:
        report["trend_analysis"] = trend

    if include_sections["correlation_summary"]:
        report["correlation_summary"] = correlation

    if include_sections["security_findings"]:
        report["security_findings"] = security_findings

    if include_sections["developer_findings"]:
        report["developer_findings"] = developer_findings

    if include_sections["recommendations"]:
        report["recommendations"] = recommendations

    return report


def _generate_html_report(
    workflow_id: str,
    health_score: Dict[str, Any],
    gate_status: Dict[str, Any],
    security_findings: list,
    developer_findings: list,
    recommendations: list,
    correlation: Dict[str, Any],
    trend: Dict[str, Any],
    include_sections: Dict[str, bool],
    generated_at: str,
) -> str:
    """Generate an HTML report."""
    overall = health_score.get("overall_health", 0)

    # Determine color based on health score
    if overall >= 80:
        health_color = "#22c55e"  # green
        status_text = "Healthy"
    elif overall >= 50:
        health_color = "#f97316"  # orange
        status_text = "Needs Attention"
    else:
        health_color = "#ef4444"  # red
        status_text = "Critical"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Health Report - {workflow_id}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f; color: #e0e0e0; line-height: 1.6; padding: 2rem;
        }}
        .container {{ max-width: 900px; margin: 0 auto; }}
        h1 {{ color: #00f0ff; margin-bottom: 0.5rem; }}
        h2 {{ color: #00d4aa; margin: 2rem 0 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }}
        h3 {{ color: #e0e0e0; margin: 1rem 0 0.5rem; }}
        .meta {{ color: #888; font-size: 0.9rem; margin-bottom: 2rem; }}
        .score-ring {{
            width: 120px; height: 120px; border-radius: 50%;
            border: 6px solid {health_color}; display: flex;
            align-items: center; justify-content: center; margin: 1rem 0;
        }}
        .score-value {{ font-size: 2rem; font-weight: bold; color: {health_color}; }}
        .status {{ color: {health_color}; font-weight: 600; }}
        .card {{ background: #1a1a2e; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin: 1rem 0; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }}
        .finding {{ border-left: 3px solid; padding-left: 1rem; margin: 1rem 0; }}
        .critical {{ border-color: #ef4444; }}
        .high {{ border-color: #f97316; }}
        .medium {{ border-color: #eab308; }}
        .low {{ border-color: #22c55e; }}
        .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }}
        .badge-critical {{ background: rgba(239,68,68,0.2); color: #ef4444; }}
        .badge-high {{ background: rgba(249,115,22,0.2); color: #f97316; }}
        .badge-medium {{ background: rgba(234,179,8,0.2); color: #eab308; }}
        .badge-low {{ background: rgba(34,197,94,0.2); color: #22c55e; }}
        table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; }}
        th, td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #333; }}
        th {{ color: #888; font-weight: 500; }}
        .blocked {{ color: #ef4444; }}
        .ready {{ color: #22c55e; }}
        @media print {{
            body {{ background: white; color: black; }}
            .card {{ border: 1px solid #ccc; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Agent Health Report</h1>
        <p class="meta">Workflow: {workflow_id} | Generated: {generated_at}</p>
"""

    # Executive Summary
    if include_sections["executive_summary"]:
        dimensions = health_score.get("dimensions", {})
        issue_counts = health_score.get("issue_counts", {})
        html += f"""
        <section>
            <h2>Executive Summary</h2>
            <div class="card">
                <div style="display: flex; align-items: center; gap: 2rem;">
                    <div class="score-ring">
                        <span class="score-value">{overall}%</span>
                    </div>
                    <div>
                        <p style="font-size: 1.25rem;">Overall Health: <span class="status">{status_text}</span></p>
                        <p>Total Open Issues: {health_score.get("total_issues", 0)}</p>
                    </div>
                </div>
            </div>
            <div class="grid">
                <div class="card"><strong>Security</strong><br>{dimensions.get('security', 100)}% ({issue_counts.get('security', 0)} issues)</div>
                <div class="card"><strong>Availability</strong><br>{dimensions.get('availability', 100)}% ({issue_counts.get('availability', 0)} issues)</div>
                <div class="card"><strong>Reliability</strong><br>{dimensions.get('reliability', 100)}% ({issue_counts.get('reliability', 0)} issues)</div>
                <div class="card"><strong>Efficiency</strong><br>{dimensions.get('efficiency', 100)}% ({issue_counts.get('efficiency', 0)} issues)</div>
            </div>
        </section>
"""

    # Gate Status
    if include_sections["gate_status"]:
        is_blocked = gate_status.get("is_blocked", False)
        html += f"""
        <section>
            <h2>Production Gate Status</h2>
            <div class="card">
                <p class="{'blocked' if is_blocked else 'ready'}" style="font-size: 1.25rem;">
                    {'🚫 BLOCKED' if is_blocked else '✅ READY'}
                </p>
                {'<p>' + str(gate_status.get("blocking_critical", 0)) + ' critical, ' + str(gate_status.get("blocking_high", 0)) + ' high severity issues</p>' if is_blocked else '<p>No blocking issues</p>'}
            </div>
        </section>
"""

    # Security Findings
    if include_sections["security_findings"] and security_findings:
        html += """
        <section>
            <h2>Security Findings</h2>
"""
        for f in security_findings:
            severity = f.get("severity", "MEDIUM").lower()
            html += f"""
            <div class="finding {severity}">
                <h3>{f.get("title", "Untitled")} <span class="badge badge-{severity}">{f.get("severity", "MEDIUM")}</span></h3>
                <p><strong>Type:</strong> {f.get("finding_type", "Unknown")}</p>
                {'<p><strong>Location:</strong> <code>' + f.get("file_path", "") + '</code></p>' if f.get("file_path") else ''}
                {'<p>' + f.get("description", "")[:300] + '...</p>' if f.get("description") else ''}
            </div>
"""
        html += "</section>"

    # Developer Findings
    if include_sections["developer_findings"] and developer_findings:
        html += """
        <section>
            <h2>Developer Findings (Code Quality)</h2>
"""
        for f in developer_findings:
            severity = f.get("severity", "MEDIUM").lower()
            html += f"""
            <div class="finding {severity}">
                <h3>{f.get("title", "Untitled")} <span class="badge badge-{severity}">{f.get("severity", "MEDIUM")}</span></h3>
                <p><strong>Category:</strong> {f.get("dev_category", "RELIABILITY")}</p>
                {'<p><strong>Health Impact:</strong> -' + str(f.get("health_impact", 0)) + '%</p>' if f.get("health_impact") else ''}
                {'<p><strong>Location:</strong> <code>' + f.get("file_path", "") + '</code></p>' if f.get("file_path") else ''}
            </div>
"""
        html += "</section>"

    # Recommendations
    if include_sections["recommendations"] and recommendations:
        html += """
        <section>
            <h2>Recommendations</h2>
            <table>
                <thead><tr><th>Priority</th><th>Title</th><th>Status</th></tr></thead>
                <tbody>
"""
        for r in recommendations[:10]:
            html += f"""
                <tr>
                    <td><span class="badge badge-{r.get('severity', 'medium').lower()}">{r.get('severity', 'MEDIUM')}</span></td>
                    <td>{r.get('title', 'Untitled')}</td>
                    <td>{r.get('status', 'PENDING')}</td>
                </tr>
"""
        html += """
                </tbody>
            </table>
        </section>
"""

    html += """
        <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #333; color: #666; font-size: 0.85rem;">
            Report generated by Agent Inspector
        </footer>
    </div>
</body>
</html>
"""
    return html


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
