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


# ==================== Workflow Query Tools ====================

@register_handler("get_workflow_agents")
def handle_get_workflow_agents(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """List all agents in a workflow with system prompts and session info."""
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    include_system_prompts = args.get("include_system_prompts", True)

    agents = store.get_all_agents(agent_workflow_id=workflow_id)

    if not agents:
        return {
            "workflow_id": workflow_id,
            "agents": [],
            "total_count": 0,
            "recent_sessions": [],
            "message": "No agents found for this workflow.",
        }

    agent_list = []
    for agent in agents:
        agent_info = {
            "agent_id": agent.agent_id,
            "agent_id_short": agent.agent_id[:12] if len(agent.agent_id) > 12 else agent.agent_id,
            "display_name": agent.display_name,
            "description": agent.description,
            "last_seen": agent.last_seen.isoformat() if hasattr(agent.last_seen, 'isoformat') else str(agent.last_seen),
            "session_count": agent.total_sessions,
        }

        if include_system_prompts:
            agent_info["system_prompt"] = store.get_agent_system_prompt(agent.agent_id)

        agent_list.append(agent_info)

    recent_sessions = store.get_sessions_filtered(
        agent_workflow_id=workflow_id,
        limit=10,
        offset=0,
    )

    return {
        "workflow_id": workflow_id,
        "agents": agent_list,
        "total_count": len(agent_list),
        "recent_sessions": recent_sessions,
    }


@register_handler("get_workflow_sessions")
def handle_get_workflow_sessions(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get paginated sessions for a workflow."""
    workflow_id = args.get("workflow_id") or args.get("agent_workflow_id")
    if not workflow_id:
        return {"error": "workflow_id is required"}

    agent_id = args.get("agent_id")
    status = args.get("status")
    limit = min(args.get("limit", 20), 100)
    offset = args.get("offset", 0)

    sessions = store.get_sessions_filtered(
        agent_workflow_id=workflow_id,
        agent_id=agent_id,
        status=status,
        limit=limit,
        offset=offset,
    )

    total_count = store.count_sessions_filtered(
        agent_workflow_id=workflow_id,
        agent_id=agent_id,
        status=status,
    )

    return {
        "workflow_id": workflow_id,
        "sessions": sessions,
        "count": len(sessions),
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(sessions) < total_count,
    }


def _summarize_event(event) -> Dict[str, Any]:
    """Create a slim summary of an event for list views."""
    timestamp = event.timestamp
    timestamp_str = timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)

    summary = {
        "id": event.span_id,
        "name": event.name.value,
        "timestamp": timestamp_str,
        "level": event.level.value,
    }

    attrs = event.attributes if hasattr(event.attributes, 'get') else {}
    event_name = event.name.value

    # llm.call.start - extract model, message_count, max_tokens, tool_names
    if event_name == "llm.call.start":
        request_data = attrs.get("llm.request.data", {})
        if isinstance(request_data, dict):
            if request_data.get("model"):
                summary["model"] = request_data["model"]
            if request_data.get("max_tokens"):
                summary["max_tokens"] = request_data["max_tokens"]

            # Message count (Anthropic or OpenAI format)
            messages = request_data.get("messages", [])
            if messages:
                summary["message_count"] = len(messages)

            # Tool names only
            tools = request_data.get("tools", [])
            if tools:
                summary["tool_names"] = [t.get("name") for t in tools if t.get("name")]

    # llm.call.finish - extract metrics
    elif event_name == "llm.call.finish":
        if attrs.get("llm.response.duration_ms"):
            summary["duration_ms"] = attrs["llm.response.duration_ms"]
        if attrs.get("llm.usage.total_tokens"):
            summary["total_tokens"] = attrs["llm.usage.total_tokens"]
        if attrs.get("llm.usage.input_tokens"):
            summary["input_tokens"] = attrs["llm.usage.input_tokens"]
        if attrs.get("llm.usage.output_tokens"):
            summary["output_tokens"] = attrs["llm.usage.output_tokens"]

    # tool.execution - extract tool name and time
    elif event_name == "tool.execution":
        if attrs.get("tool.name"):
            summary["tool_name"] = attrs["tool.name"]
        if attrs.get("tool.execution_time_ms"):
            summary["execution_time_ms"] = attrs["tool.execution_time_ms"]

    # error events - include error type and message
    if attrs.get("error.type"):
        summary["error_type"] = attrs["error.type"]
    if attrs.get("error.message"):
        summary["error_message"] = attrs["error.message"]

    return summary


@register_handler("get_session_events")
def handle_get_session_events(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get paginated events for a specific session."""
    session_id = args.get("session_id")
    if not session_id:
        return {"error": "session_id is required"}

    limit = min(args.get("limit", 50), 200)
    offset = args.get("offset", 0)
    event_types = args.get("event_types")

    session = store.get_session(session_id)
    if not session:
        return {"error": f"Session '{session_id}' not found"}

    all_events = list(session.events)

    if event_types:
        all_events = [e for e in all_events if e.name.value in event_types]

    total_count = len(all_events)
    paginated_events = all_events[offset:offset + limit]

    events = []
    for event in paginated_events:
        events.append(_summarize_event(event))

    return {
        "session_id": session_id,
        "agent_id": session.agent_id,
        "agent_workflow_id": session.agent_workflow_id,
        "events": events,
        "count": len(events),
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(events) < total_count,
    }


@register_handler("get_event")
def handle_get_event(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Get complete details for a single event."""
    session_id = args.get("session_id")
    event_id = args.get("event_id")

    if not session_id:
        return {"error": "session_id is required"}
    if not event_id:
        return {"error": "event_id is required"}

    session = store.get_session(session_id)
    if not session:
        return {"error": f"Session '{session_id}' not found"}

    # Find event by span_id
    for event in session.events:
        if event.span_id == event_id:
            timestamp = event.timestamp
            timestamp_str = timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)

            return {
                "event": {
                    "id": event.span_id,
                    "trace_id": event.trace_id,
                    "name": event.name.value,
                    "timestamp": timestamp_str,
                    "level": event.level.value,
                    "agent_id": event.agent_id,
                    "session_id": event.session_id,
                    "attributes": dict(event.attributes) if hasattr(event.attributes, 'items') else event.attributes,
                }
            }

    return {"error": f"Event '{event_id}' not found in session '{session_id}'"}


# ==================== IDE Activity Tools (Simplified) ====================

@register_handler("ide_heartbeat")
def handle_ide_heartbeat(args: Dict[str, Any], store: Any) -> Dict[str, Any]:
    """Optionally provide IDE metadata for richer status display.

    Activity is tracked automatically via MCP tool calls.
    This tool is optional - use it to provide IDE type, workspace path, etc.
    """
    agent_workflow_id = args.get("agent_workflow_id")
    if not agent_workflow_id:
        return {"error": "agent_workflow_id is required"}

    ide_type = args.get("ide_type")
    if ide_type and ide_type not in ["cursor", "claude-code"]:
        return {"error": f"Invalid ide_type: {ide_type}. Must be cursor or claude-code"}

    status = store.upsert_ide_metadata(
        agent_workflow_id=agent_workflow_id,
        ide_type=ide_type,
        workspace_path=args.get("workspace_path"),
        model=args.get("model"),
        host=args.get("host"),
        user=args.get("user"),
    )

    ide_info = f" via {ide_type}" if ide_type else ""
    return {
        **status,
        "message": f"IDE metadata updated{ide_info}. Activity is being tracked automatically.",
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

    readiness = store.get_production_readiness(workflow_id)
    gate = readiness['gate']
    static_critical = readiness['static_analysis']['critical_count']
    dynamic_critical = readiness['dynamic_analysis']['critical_count']

    if gate['is_blocked']:
        message = f"🚫 Attention Required: {gate['blocking_count']} blocking issues ({static_critical} static, {dynamic_critical} dynamic) must be addressed."
    else:
        message = "✅ Production Ready: No blocking security issues."

    # Return in a backwards-compatible format with new structure nested
    return {
        "workflow_id": workflow_id,
        "gate_state": gate['state'],
        "is_blocked": gate['is_blocked'],
        "blocking_count": gate['blocking_count'],
        "blocking_critical": static_critical + dynamic_critical,  # Combined for backwards compat
        "blocking_high": 0,  # Not tracked separately in new format
        "static_analysis": readiness['static_analysis'],
        "dynamic_analysis": readiness['dynamic_analysis'],
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
