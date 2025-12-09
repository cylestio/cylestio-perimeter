"""MCP tool definitions following the Model Context Protocol specification."""
from typing import Any, Dict, List

# MCP Tool Definitions - JSON Schema format
MCP_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "get_security_patterns",
        "description": "Get OWASP LLM Top 10 security patterns for code analysis. Use this to understand what vulnerabilities to look for.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "context": {
                    "type": "string",
                    "description": "Filter: 'all', 'prompt_injection', 'excessive_agency', 'data_exposure'",
                    "default": "all"
                },
                "min_severity": {
                    "type": "string",
                    "description": "Minimum severity: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'",
                    "default": "LOW"
                }
            }
        }
    },
    {
        "name": "get_owasp_control",
        "description": "Get detailed information for a specific OWASP LLM control by ID (e.g., 'LLM01', 'LLM08').",
        "inputSchema": {
            "type": "object",
            "properties": {
                "control_id": {
                    "type": "string",
                    "description": "OWASP control ID (e.g., 'LLM01', 'LLM08')"
                }
            },
            "required": ["control_id"]
        }
    },
    {
        "name": "get_fix_template",
        "description": "Get remediation template for fixing a specific security issue type.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "finding_type": {
                    "type": "string",
                    "description": "Finding type (e.g., 'PROMPT_INJECTION', 'RATE_LIMIT')"
                }
            },
            "required": ["finding_type"]
        }
    },
    {
        "name": "create_analysis_session",
        "description": "Create a new analysis session to group security findings for a workflow/codebase. Call this before storing findings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier for the codebase being analyzed"
                },
                "session_type": {
                    "type": "string",
                    "default": "STATIC",
                    "description": "STATIC, DYNAMIC, or AUTOFIX"
                },
                "workflow_name": {
                    "type": "string",
                    "description": "Human-readable workflow/project name"
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "complete_analysis_session",
        "description": "Complete an analysis session and calculate the risk score.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID to complete"
                },
                "calculate_risk": {
                    "type": "boolean",
                    "default": True
                }
            },
            "required": ["session_id"]
        }
    },
    {
        "name": "store_finding",
        "description": "Store a security finding discovered during analysis.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "file_path": {"type": "string"},
                "finding_type": {
                    "type": "string",
                    "description": "e.g., 'LLM01', 'PROMPT_INJECTION'"
                },
                "severity": {
                    "type": "string",
                    "description": "CRITICAL, HIGH, MEDIUM, or LOW"
                },
                "title": {"type": "string"},
                "description": {"type": "string"},
                "line_start": {"type": "integer"},
                "line_end": {"type": "integer"},
                "code_snippet": {"type": "string"},
                "owasp_mapping": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["session_id", "file_path", "finding_type", "severity", "title"]
        }
    },
    {
        "name": "get_findings",
        "description": "Get stored security findings with optional filtering.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Filter by workflow/project identifier"
                },
                "session_id": {"type": "string"},
                "severity": {"type": "string"},
                "status": {
                    "type": "string",
                    "description": "OPEN, FIXED, or IGNORED"
                },
                "limit": {
                    "type": "integer",
                    "default": 100
                }
            }
        }
    },
    {
        "name": "update_finding_status",
        "description": "Update the status of a finding (mark as FIXED or IGNORED).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "finding_id": {"type": "string"},
                "status": {
                    "type": "string",
                    "description": "OPEN, FIXED, or IGNORED"
                },
                "notes": {"type": "string"}
            },
            "required": ["finding_id", "status"]
        }
    },
    # ==================== Workflow Config Tools ====================
    {
        "name": "get_workflow_config",
        "description": "Read workflow configuration from cylestio.yaml in the project. Returns workflow_id, name, and agents if config exists.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project_path": {
                    "type": "string",
                    "description": "Path to project root. If not provided, searches from current directory."
                }
            }
        }
    },
    # ==================== Lifecycle & Correlation Tools ====================
    {
        "name": "get_workflow_state",
        "description": "Get the current lifecycle state of a workflow. Shows what analysis exists (static, dynamic, or both) and recommends next steps.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier"
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_tool_usage_summary",
        "description": "Get tool usage patterns from dynamic sessions. Shows which tools were called, how often, and in what sequences.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier"
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_workflow_correlation",
        "description": "Get correlation between static findings and dynamic observations. Shows which static findings are validated or unexercised.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier"
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_agents",
        "description": "List all agents discovered during dynamic sessions. Use to find agents that need linking to workflows or naming.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Filter by workflow (optional). Use 'unlinked' to get agents with no workflow_id."
                },
                "include_stats": {
                    "type": "boolean",
                    "description": "Include session/tool usage stats",
                    "default": True
                }
            }
        }
    },
    {
        "name": "update_agent_info",
        "description": "Update an agent's display name, description, or link to a workflow. Use after analyzing code to name agents or to link dynamic agents to workflows for correlation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "The agent ID from dynamic sessions"
                },
                "display_name": {
                    "type": "string",
                    "description": "Human-friendly name (e.g., 'Customer Support Bot', 'Booking Assistant')"
                },
                "description": {
                    "type": "string",
                    "description": "Brief description of what the agent does"
                },
                "workflow_id": {
                    "type": "string",
                    "description": "Link this agent to a workflow (for correlation with static analysis)"
                }
            },
            "required": ["agent_id"]
        }
    }
]


def get_tool_names() -> List[str]:
    """Get list of all available tool names."""
    return [tool["name"] for tool in MCP_TOOLS]
