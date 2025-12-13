"""MCP tool handlers with registry pattern.

Terminology:
- Agent: Project/grouping level (contains multiple system prompts)
- System Prompt: Individual LLM agent instance (identified by system prompt hash)
"""
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
    """Create a new analysis session for an agent/codebase."""
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}

    session_type = args.get("session_type", "STATIC")
    agent_name = args.get("agent_name")

    try:
        session_type_enum = SessionType(session_type.upper())
    except ValueError:
        return {"error": f"Invalid session_type: {session_type}"}

    session_id = generate_session_id()
    session = store.create_analysis_session(
        session_id=session_id,
        agent_id=agent_id,
        session_type=session_type_enum.value,
        agent_name=agent_name,
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
    """Store a security finding with full classification."""
    session_id = args.get("session_id")

    session = store.get_analysis_session(session_id)
    if not session:
        return {"error": f"Session '{session_id}' not found"}

    try:
        severity_enum = FindingSeverity(args.get("severity", "").upper())
    except ValueError:
        return {"error": f"Invalid severity: {args.get('severity')}"}

    # Build evidence dict
    evidence = {}
    if args.get("code_snippet"):
        evidence["code_snippet"] = args["code_snippet"]
    if args.get("data_flow"):
        evidence["data_flow"] = args["data_flow"]

    finding_id = generate_finding_id()
    finding = store.store_finding(
        finding_id=finding_id,
        session_id=session_id,
        agent_id=session["agent_id"],
        file_path=args.get("file_path"),
        finding_type=args.get("finding_type"),
        severity=severity_enum.value,
        title=args.get("title"),
        description=args.get("description"),
        line_start=args.get("line_start"),
        line_end=args.get("line_end"),
        evidence=evidence if evidence else None,
        owasp_mapping=args.get("owasp_mapping"),
        # Enhanced fields (Phase 1)
        cvss_score=args.get("cvss_score"),
        cvss_vector=args.get("cvss_vector"),
        cwe_mapping=args.get("cwe_mapping"),
        mitre_atlas=args.get("mitre_atlas"),
        soc2_controls=args.get("soc2_controls"),
        nist_csf=args.get("nist_csf"),
        fix_recommendation=args.get("fix_recommendation"),
        ai_fixable=args.get("ai_fixable", True),
        function_name=args.get("function_name"),
        class_name=args.get("class_name"),
        data_flow=args.get("data_flow"),
    )
    return {"finding": finding}


@register_handler("get_findings")
def handle_get_findings(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get stored findings with optional filtering."""
    findings = store.get_findings(
        agent_id=args.get("agent_id"),
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


# ==================== Dynamic Analysis Tools ====================

@register_handler("trigger_dynamic_analysis")
def handle_trigger_dynamic_analysis(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Manually trigger dynamic analysis for an agent.
    
    Note: Dynamic analysis runs automatically when sessions complete.
    Use this to manually re-run if needed.
    """
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}
    
    # Check if there are any completed sessions
    sessions = store.get_sessions(agent_id=agent_id, status="COMPLETED")
    if not sessions:
        return {
            "status": "no_sessions",
            "message": f"No completed sessions found for agent '{agent_id}'. Run some sessions first.",
            "agent_id": agent_id,
        }
    
    return {
        "status": "triggered",
        "message": f"Dynamic analysis will run automatically for agent '{agent_id}' when sessions complete.",
        "agent_id": agent_id,
        "completed_sessions": len(sessions),
    }


@register_handler("get_dynamic_analysis_status")
def handle_get_dynamic_analysis_status(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get the current status of dynamic analysis for an agent."""
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}
    
    # Get session counts
    sessions = store.get_sessions(agent_id=agent_id)
    completed = [s for s in sessions if s.status == "COMPLETED"]
    active = [s for s in sessions if s.status == "ACTIVE"]
    
    # Get security checks
    security_checks = store.get_security_checks_by_agent(agent_id)
    
    return {
        "agent_id": agent_id,
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "active_sessions": len(active),
        "security_checks_count": len(security_checks),
        "status": "ready" if len(completed) > 0 else "waiting_for_sessions",
    }


# ==================== Agent Lifecycle Tools ====================

@register_handler("get_agent_state")
def handle_get_agent_state(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get the current lifecycle state of an agent.
    
    Returns state, available data, and recommended next steps.
    """
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}

    # Get static analysis data
    static_sessions = store.get_analysis_sessions(agent_id=agent_id)
    findings = store.get_findings(agent_id=agent_id)
    
    # Get dynamic data (system prompts running through proxy)
    dynamic_system_prompts = store.get_all_agents(agent_id=agent_id)
    
    has_static = len(static_sessions) > 0
    has_dynamic = len(dynamic_system_prompts) > 0
    open_findings = [f for f in findings if f.get("status") == "OPEN"]
    
    # Determine state and provide context-aware recommendations
    if not has_static and not has_dynamic:
        state = "NO_DATA"
        recommendation = "Start by running a security scan on this codebase. Use get_security_patterns and create_analysis_session to begin static analysis."
    elif has_static and not has_dynamic:
        state = "STATIC_ONLY"
        if open_findings:
            recommendation = f"Static analysis found {len(open_findings)} open findings. To validate these findings with runtime behavior, configure your agent to use base_url='http://localhost:4000/agent/{agent_id}' and run test scenarios."
        else:
            recommendation = "Static analysis complete with no open findings. Run dynamic tests to validate runtime behavior."
    elif has_dynamic and not has_static:
        state = "DYNAMIC_ONLY"
        recommendation = "Dynamic runtime data captured. Run static analysis now to identify code-level security issues and correlate with observed runtime behavior."
    else:
        state = "COMPLETE"
        recommendation = f"Both static and dynamic data available! Use get_agent_correlation to see which of your {len(open_findings)} findings are validated by runtime tests."

    return {
        "agent_id": agent_id,
        "state": state,
        "has_static_analysis": has_static,
        "has_dynamic_sessions": has_dynamic,
        "static_sessions_count": len(static_sessions),
        "dynamic_system_prompts_count": len(dynamic_system_prompts),
        "findings_count": len(findings),
        "open_findings_count": len(open_findings),
        "recommendation": recommendation,
        "dashboard_url": f"http://localhost:7100/agent/{agent_id}",
    }


@register_handler("get_tool_usage_summary")
def handle_get_tool_usage_summary(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get tool usage patterns from dynamic sessions."""
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}

    system_prompts = store.get_all_agents(agent_id=agent_id)
    if not system_prompts:
        return {
            "agent_id": agent_id,
            "message": "No dynamic sessions found. Run your agent through the proxy to capture tool usage.",
            "setup_hint": f"Configure agent: base_url='http://localhost:4000/agent/{agent_id}'",
            "tool_usage": {},
            "total_sessions": 0,
        }

    # Aggregate tool usage across all system prompts
    tool_usage = {}
    available_tools = set()
    used_tools = set()
    total_sessions = 0

    for sp in system_prompts:
        total_sessions += sp.total_sessions
        available_tools.update(sp.available_tools)
        used_tools.update(sp.used_tools)

        for tool_name, count in sp.tool_usage_details.items():
            if tool_name not in tool_usage:
                tool_usage[tool_name] = {"count": 0}
            tool_usage[tool_name]["count"] += count

    # Sort by count descending
    sorted_usage = dict(sorted(tool_usage.items(), key=lambda x: x[1]["count"], reverse=True))

    # Find unused tools (defined but never called)
    unused_tools = list(available_tools - used_tools)

    return {
        "agent_id": agent_id,
        "total_sessions": total_sessions,
        "tool_usage": sorted_usage,
        "tools_defined": len(available_tools),
        "tools_used": len(used_tools),
        "tools_unused": unused_tools,
        "coverage_percent": round(len(used_tools) / len(available_tools) * 100, 1) if available_tools else 0,
    }


@register_handler("get_agent_correlation")
def handle_get_agent_correlation(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Correlate static findings with dynamic runtime observations.
    
    Computed on-the-fly by matching tool references in findings
    with actual tool usage from dynamic sessions.
    """
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}

    # Get static findings
    findings = store.get_findings(agent_id=agent_id)
    static_sessions = store.get_analysis_sessions(agent_id=agent_id)
    
    # Get dynamic data
    system_prompts = store.get_all_agents(agent_id=agent_id)
    
    if not static_sessions:
        return {
            "agent_id": agent_id,
            "error": "No static analysis data. Run a security scan first.",
            "hint": "Use get_security_patterns and create_analysis_session to begin.",
        }
    
    if not system_prompts:
        return {
            "agent_id": agent_id,
            "message": "Static analysis exists but no dynamic data yet.",
            "findings_count": len(findings),
            "hint": f"Run your agent with base_url='http://localhost:4000/agent/{agent_id}' to capture runtime data.",
            "correlations": [],
        }

    # Aggregate dynamic tool usage
    dynamic_tools_used = set()
    tool_call_counts = {}
    total_sessions = 0
    for sp in system_prompts:
        dynamic_tools_used.update(sp.used_tools)
        total_sessions += sp.total_sessions
        for tool_name, count in sp.tool_usage_details.items():
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
        "agent_id": agent_id,
        "has_static_data": len(findings) > 0,
        "has_dynamic_data": len(system_prompts) > 0,
        "static_findings": findings_summary,
        "static_findings_count": len(findings),
        "dynamic_tools_used": list(dynamic_tools_used),
        "dynamic_tool_call_counts": tool_call_counts,
        "dynamic_sessions_count": total_sessions,
        "message": "Use AI to correlate findings with tool usage. Match finding titles/descriptions with tools that were called at runtime.",
    }


# ==================== System Prompt Discovery Tools ====================

@register_handler("get_system_prompts")
def handle_get_system_prompts(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """List all system prompts discovered during dynamic sessions."""
    agent_id = args.get("agent_id")
    include_stats = args.get("include_stats", True)
    
    # Handle special "unlinked" filter
    if agent_id == "unlinked":
        system_prompts = store.get_all_agents(agent_id=None)
        # Filter to only system prompts with no agent_id
        system_prompts = [sp for sp in system_prompts if not sp.agent_id]
    elif agent_id:
        system_prompts = store.get_all_agents(agent_id=agent_id)
    else:
        system_prompts = store.get_all_agents()
    
    result = []
    for sp in system_prompts:
        sp_info = {
            "system_prompt_id": sp.system_prompt_id,
            "system_prompt_id_short": sp.system_prompt_id[:12] if len(sp.system_prompt_id) > 12 else sp.system_prompt_id,
            "agent_id": sp.agent_id,
            "display_name": getattr(sp, 'display_name', None),
            "description": getattr(sp, 'description', None),
        }
        
        if include_stats:
            sp_info.update({
                "total_sessions": sp.total_sessions,
                "total_messages": sp.total_messages,
                "total_tokens": sp.total_tokens,
                "tools_available": len(sp.available_tools),
                "tools_used": len(sp.used_tools),
                "first_seen": sp.first_seen.isoformat(),
                "last_seen": sp.last_seen.isoformat(),
            })
        
        result.append(sp_info)
    
    return {
        "system_prompts": result,
        "total_count": len(result),
        "filter": agent_id if agent_id else "all",
    }


# Legacy handler name for backward compatibility
@register_handler("get_agents")
def handle_get_agents(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Legacy handler - redirects to get_system_prompts."""
    return handle_get_system_prompts(args, store)


@register_handler("update_system_prompt_info")
def handle_update_system_prompt_info(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Update a system prompt's display name, description, or link to agent."""
    system_prompt_id = args.get("system_prompt_id")
    if not system_prompt_id:
        return {"error": "system_prompt_id is required"}
    
    display_name = args.get("display_name")
    description = args.get("description")
    agent_id = args.get("agent_id")
    
    # Check at least one field to update
    if not any([display_name, description, agent_id]):
        return {"error": "Provide at least one of: display_name, description, agent_id"}
    
    result = store.update_agent_info(
        system_prompt_id=system_prompt_id,
        display_name=display_name,
        description=description,
        agent_id=agent_id,
    )
    
    if not result:
        return {"error": f"System prompt '{system_prompt_id}' not found"}
    
    return {"system_prompt": result, "message": "System prompt updated successfully"}


# Legacy handler name for backward compatibility
@register_handler("update_agent_info")
def handle_update_agent_info(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Legacy handler - redirects to update_system_prompt_info."""
    # Map old parameter names to new ones
    if "agent_id" in args and "system_prompt_id" not in args:
        args["system_prompt_id"] = args.pop("agent_id")
    return handle_update_system_prompt_info(args, store)


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
        agent_id=args.get("agent_id"),
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
    agent_id = args.get("agent_id")

    connection = store.update_ide_heartbeat(
        connection_id=connection_id,
        is_developing=is_developing,
        agent_id=agent_id,
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
    agent_id = args.get("agent_id")

    status = store.get_ide_connection_status(agent_id=agent_id)

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

@register_handler("get_recommendation_detail")
def handle_get_recommendation_detail(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get full recommendation details by ID.
    
    Primary entry point for fixing issues. Returns everything needed
    for the coding agent to understand and fix the issue.
    """
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    rec = store.get_recommendation(recommendation_id)
    if not rec:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    # Get source finding if available
    finding = None
    if rec.get("source_finding_id"):
        finding = store.get_finding(rec["source_finding_id"])

    # Get related context
    agent_id = rec.get("agent_id")
    
    # Build comprehensive response for AI
    return {
        "recommendation": rec,
        "finding": finding,
        "context": {
            "agent_id": agent_id,
            "related_files": rec.get("related_files", []),
            "file_path": rec.get("file_path"),
            "line_start": rec.get("line_start"),
            "line_end": rec.get("line_end"),
            "code_snippet": rec.get("code_snippet"),
        },
        "mappings": {
            "owasp_llm": rec.get("owasp_llm"),
            "cwe": rec.get("cwe"),
            "mitre_atlas": rec.get("mitre_atlas"),
            "soc2_controls": rec.get("soc2_controls", []),
            "nist_csf": rec.get("nist_csf"),
        },
        "correlation": {
            "state": rec.get("correlation_state"),
            "evidence": rec.get("correlation_evidence"),
        },
        "fix_guidance": {
            "hints": rec.get("fix_hints"),
            "complexity": rec.get("fix_complexity"),
            "requires_architectural_change": rec.get("requires_architectural_change"),
        },
        "fix_command": f"Fix security issue {recommendation_id}",
    }


@register_handler("get_recommendations")
def handle_get_recommendations(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """List recommendations for an agent with optional filtering."""
    recommendations = store.get_recommendations(
        agent_id=args.get("agent_id"),
        status=args.get("status"),
        severity=args.get("severity"),
        blocking_only=args.get("blocking_only", False),
        source_type=args.get("source_type"),
        limit=args.get("limit", 100),
    )
    
    # Include summary
    by_status = {}
    by_severity = {}
    for rec in recommendations:
        status = rec.get("status", "UNKNOWN")
        severity = rec.get("severity", "UNKNOWN")
        by_status[status] = by_status.get(status, 0) + 1
        by_severity[severity] = by_severity.get(severity, 0) + 1

    return {
        "recommendations": recommendations,
        "total_count": len(recommendations),
        "summary": {
            "by_status": by_status,
            "by_severity": by_severity,
        }
    }


@register_handler("start_fix")
def handle_start_fix(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Mark recommendation as FIXING and return full context."""
    recommendation_id = args.get("recommendation_id")
    if not recommendation_id:
        return {"error": "recommendation_id is required"}

    rec = store.start_fix(recommendation_id)
    if not rec:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    # Return full context for the fix (same as get_recommendation_detail)
    return handle_get_recommendation_detail({"recommendation_id": recommendation_id}, store)


@register_handler("complete_fix")
def handle_complete_fix(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Mark recommendation as FIXED after applying changes."""
    recommendation_id = args.get("recommendation_id")
    fix_notes = args.get("fix_notes")
    files_modified = args.get("files_modified", [])
    fix_commit = args.get("fix_commit")

    if not recommendation_id:
        return {"error": "recommendation_id is required"}
    if not fix_notes:
        return {"error": "fix_notes is required - explain what was fixed"}
    if not files_modified:
        return {"error": "files_modified is required - list the files that were changed"}

    rec = store.complete_fix(
        recommendation_id=recommendation_id,
        fix_notes=fix_notes,
        files_modified=files_modified,
        fix_commit=fix_commit,
    )
    
    if not rec:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    return {
        "recommendation": rec,
        "message": f"✅ Fix completed for {recommendation_id}. Verification will run automatically.",
        "next_step": "The issue will be verified on next scan. Run a verification scan to confirm the fix.",
    }


@register_handler("verify_fix")
def handle_verify_fix(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Verify if a fix resolved the issue."""
    recommendation_id = args.get("recommendation_id")
    verification_result = args.get("verification_result")
    success = args.get("success", True)

    if not recommendation_id:
        return {"error": "recommendation_id is required"}
    if verification_result is None:
        return {"error": "verification_result is required"}

    rec = store.verify_fix(
        recommendation_id=recommendation_id,
        verification_result=verification_result,
        success=success,
    )
    
    if not rec:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    status = "VERIFIED" if success else "REOPENED"
    message = f"✅ Fix verified for {recommendation_id}" if success else f"⚠️ Fix verification failed for {recommendation_id} - issue still present"

    return {
        "recommendation": rec,
        "message": message,
        "status": status,
    }


@register_handler("dismiss_recommendation")
def handle_dismiss_recommendation(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Dismiss or mark recommendation as false positive."""
    recommendation_id = args.get("recommendation_id")
    reason = args.get("reason")
    dismiss_type = args.get("dismiss_type", "DISMISSED")

    if not recommendation_id:
        return {"error": "recommendation_id is required"}
    if not reason:
        return {"error": "reason is REQUIRED for audit trail - explain why this is being dismissed"}

    rec = store.dismiss_recommendation(
        recommendation_id=recommendation_id,
        reason=reason,
        dismiss_type=dismiss_type,
    )
    
    if not rec:
        return {"error": f"Recommendation '{recommendation_id}' not found"}

    type_desc = "Risk accepted" if dismiss_type == "DISMISSED" else "False positive"
    return {
        "recommendation": rec,
        "message": f"📝 {recommendation_id} marked as {dismiss_type}: {type_desc}",
        "audit_note": f"Reason logged for compliance: {reason}",
    }


@register_handler("get_gate_status")
def handle_get_gate_status(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Check if Production deployment is blocked."""
    agent_id = args.get("agent_id")
    if not agent_id:
        return {"error": "agent_id is required"}

    status = store.get_gate_status(agent_id)
    
    if status["gate_status"] == "BLOCKED":
        message = f"🚫 Production BLOCKED - {status['blocking_count']} issue(s) must be resolved"
    else:
        message = "✅ Production UNBLOCKED - all critical/high issues resolved"

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
