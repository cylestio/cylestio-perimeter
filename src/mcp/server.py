"""MCP server module for tool registration and dispatch."""
from typing import Any, Dict, List

from .tools.knowledge import get_fix_template, get_owasp_control, get_security_patterns
from .tools.storage import (
    complete_analysis_session,
    create_analysis_session,
    get_findings,
    store_finding,
    update_finding_status,
)

MCP_TOOLS = [
    {
        "name": "get_security_patterns",
        "description": "Get OWASP LLM Top 10 security patterns for code analysis.",
        "parameters": {
            "type": "object",
            "properties": {
                "context": {
                    "type": "string",
                    "description": "Filter: 'all', 'prompt_injection', 'excessive_agency', etc.",
                    "default": "all",
                },
                "min_severity": {
                    "type": "string",
                    "description": "Minimum severity: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'",
                    "default": "LOW",
                },
            },
        },
    },
    {
        "name": "get_owasp_control",
        "description": "Get detailed info for a specific OWASP LLM control.",
        "parameters": {
            "type": "object",
            "properties": {
                "control_id": {
                    "type": "string",
                    "description": "OWASP control ID (e.g., 'LLM01', 'LLM08')",
                },
            },
            "required": ["control_id"],
        },
    },
    {
        "name": "get_fix_template",
        "description": "Get remediation template for fixing a security issue.",
        "parameters": {
            "type": "object",
            "properties": {
                "finding_type": {
                    "type": "string",
                    "description": "Finding type (e.g., 'PROMPT_INJECTION', 'RATE_LIMIT')",
                },
            },
            "required": ["finding_type"],
        },
    },
    {
        "name": "create_analysis_session",
        "description": "Create a new analysis session to group findings.",
        "parameters": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent being analyzed"},
                "session_type": {"type": "string", "default": "STATIC"},
                "agent_name": {"type": "string"},
            },
            "required": ["agent_id"],
        },
    },
    {
        "name": "complete_analysis_session",
        "description": "Complete an analysis session and calculate risk score.",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "calculate_risk": {"type": "boolean", "default": True},
            },
            "required": ["session_id"],
        },
    },
    {
        "name": "store_finding",
        "description": "Store a security finding discovered during analysis.",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "file_path": {"type": "string"},
                "finding_type": {"type": "string"},
                "severity": {"type": "string"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "line_start": {"type": "integer"},
                "line_end": {"type": "integer"},
                "code_snippet": {"type": "string"},
                "context": {"type": "string"},
                "owasp_mapping": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["session_id", "file_path", "finding_type", "severity", "title"],
        },
    },
    {
        "name": "get_findings",
        "description": "Get stored findings with optional filtering.",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "agent_id": {"type": "string"},
                "severity": {"type": "string"},
                "status": {"type": "string"},
                "limit": {"type": "integer", "default": 100},
            },
        },
    },
    {
        "name": "update_finding_status",
        "description": "Update the status of a finding (OPEN, FIXED, IGNORED).",
        "parameters": {
            "type": "object",
            "properties": {
                "finding_id": {"type": "string"},
                "status": {"type": "string"},
                "notes": {"type": "string"},
            },
            "required": ["finding_id", "status"],
        },
    },
]


def list_tools() -> List[Dict[str, Any]]:
    """List all available MCP tools."""
    return MCP_TOOLS


def call_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Call an MCP tool by name with the given arguments."""
    tool_map = {
        "get_security_patterns": get_security_patterns,
        "get_owasp_control": get_owasp_control,
        "get_fix_template": get_fix_template,
        "create_analysis_session": create_analysis_session,
        "complete_analysis_session": complete_analysis_session,
        "store_finding": store_finding,
        "get_findings": get_findings,
        "update_finding_status": update_finding_status,
    }

    if tool_name not in tool_map:
        return {
            "success": False,
            "error": {
                "code": "UNKNOWN_TOOL",
                "message": f"Tool '{tool_name}' not found.",
                "suggestion": f"Available tools: {', '.join(tool_map.keys())}",
            },
        }

    tool_fn = tool_map[tool_name]
    try:
        return tool_fn(**arguments)
    except TypeError as e:
        # Handle missing required arguments
        return {
            "success": False,
            "error": {
                "code": "INVALID_ARGUMENTS",
                "message": f"Invalid arguments for tool '{tool_name}': {str(e)}",
                "suggestion": "Check that all required parameters are provided.",
            },
        }
    except Exception as e:
        # Handle any other unexpected errors
        return {
            "success": False,
            "error": {
                "code": "TOOL_EXECUTION_ERROR",
                "message": f"Error executing tool '{tool_name}': {str(e)}",
                "suggestion": "Check that the arguments are valid and the tool is properly configured.",
            },
        }


def initialize_mcp(store):
    """Initialize MCP tools with the TraceStore."""
    from .tools.storage import set_store

    set_store(store)
