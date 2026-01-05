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
        "description": "Create a new analysis session to group security findings for an agent workflow/codebase. Call this before storing findings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier for the codebase being analyzed"
                },
                "session_type": {
                    "type": "string",
                    "default": "STATIC",
                    "description": "STATIC, DYNAMIC, or AUTOFIX"
                },
                "agent_workflow_name": {
                    "type": "string",
                    "description": "Human-readable agent workflow/project name"
                }
            },
            "required": ["agent_workflow_id"]
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
                },
                "source_type": {
                    "type": "string",
                    "description": "STATIC or DYNAMIC",
                    "default": "STATIC"
                },
                "category": {
                    "type": "string",
                    "description": "Security category: PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY, BEHAVIOR"
                },
                "check_id": {
                    "type": "string",
                    "description": "ID of the check that found this issue"
                },
                "cvss_score": {
                    "type": "number",
                    "description": "CVSS score (0-10)"
                },
                "cwe": {
                    "type": "string",
                    "description": "CWE ID (e.g., 'CWE-79')"
                },
                "soc2_controls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of SOC2 control IDs"
                },
                "auto_create_recommendation": {
                    "type": "boolean",
                    "description": "Whether to auto-create a linked recommendation",
                    "default": True
                },
                "fix_hints": {
                    "type": "string",
                    "description": "Hints on how to fix (for recommendation)"
                },
                "impact": {
                    "type": "string",
                    "description": "Business impact description (for recommendation)"
                },
                "fix_complexity": {
                    "type": "string",
                    "description": "LOW, MEDIUM, or HIGH (for recommendation)"
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
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Filter by agent workflow/project identifier"
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
    # ==================== Correlation Tools ====================
    {
        "name": "update_finding_correlation",
        "description": "Update a finding's correlation state. Use this after correlating static findings with runtime data.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "finding_id": {
                    "type": "string",
                    "description": "The finding ID to update"
                },
                "correlation_state": {
                    "type": "string",
                    "description": "VALIDATED (confirmed at runtime), UNEXERCISED (never triggered), RUNTIME_ONLY (runtime-only issue), THEORETICAL (safe at runtime)",
                    "enum": ["VALIDATED", "UNEXERCISED", "RUNTIME_ONLY", "THEORETICAL"]
                },
                "correlation_evidence": {
                    "type": "object",
                    "description": "Evidence details (e.g., tool_calls, session_count, runtime_observations)"
                }
            },
            "required": ["finding_id", "correlation_state"]
        }
    },
    {
        "name": "get_correlation_summary",
        "description": "Get correlation summary for a workflow. Shows counts of findings by correlation state (VALIDATED, UNEXERCISED, etc.).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier (same as agent_workflow_id)"
                }
            },
            "required": ["workflow_id"]
        }
    },
    # ==================== Agent Workflow Lifecycle Tools ====================
    {
        "name": "get_agent_workflow_state",
        "description": "Get the current lifecycle state of an agent workflow. Shows what analysis exists (static, dynamic, or both) and recommends next steps. Use this first to understand what data is available.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier"
                }
            },
            "required": ["agent_workflow_id"]
        }
    },
    {
        "name": "get_tool_usage_summary",
        "description": "Get tool usage patterns from dynamic sessions. Shows which tools were called, how often, and coverage metrics.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier"
                }
            },
            "required": ["agent_workflow_id"]
        }
    },
    {
        "name": "get_agent_workflow_correlation",
        "description": "Correlate static findings with dynamic runtime observations. Shows which findings are VALIDATED (tool exercised at runtime) or UNEXERCISED (never called in tests). Only meaningful when both static and dynamic data exist.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier"
                }
            },
            "required": ["agent_workflow_id"]
        }
    },
    # ==================== Agent Discovery Tools ====================
    {
        "name": "get_agents",
        "description": "List all agents discovered during dynamic sessions. Use to find agents that need linking to agent workflows or naming.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Filter by agent workflow. Use 'unlinked' to get agents with no agent_workflow_id."
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
        "description": "Update an agent's display name, description, or link to an agent workflow. Use after discovering agents to give them meaningful names or to link dynamic agents to workflows for correlation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "The agent ID from dynamic sessions"
                },
                "display_name": {
                    "type": "string",
                    "description": "Human-friendly name (e.g., 'Customer Support Bot')"
                },
                "description": {
                    "type": "string",
                    "description": "Brief description of what the agent does"
                },
                "agent_workflow_id": {
                    "type": "string",
                    "description": "Link this agent to an agent workflow for correlation with static analysis"
                }
            },
            "required": ["agent_id"]
        }
    },
    # ==================== Workflow Query Tools ====================
    {
        "name": "get_workflow_agents",
        "description": "List all agents in a workflow with their system prompts, session counts, and last seen time. Returns the last 10 sessions across all agents in the workflow.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow identifier (agent_workflow_id)"
                },
                "include_system_prompts": {
                    "type": "boolean",
                    "description": "Include system prompts extracted from session events (default: true)",
                    "default": True
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_workflow_sessions",
        "description": "Query sessions for a workflow with pagination. Returns session metadata including agent, status, message count, and timestamps.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow identifier (agent_workflow_id)"
                },
                "agent_id": {
                    "type": "string",
                    "description": "Filter by specific agent ID"
                },
                "status": {
                    "type": "string",
                    "description": "Filter by status",
                    "enum": ["ACTIVE", "INACTIVE", "COMPLETED"]
                },
                "limit": {
                    "type": "integer",
                    "description": "Max sessions to return (default: 20, max: 100)",
                    "default": 20
                },
                "offset": {
                    "type": "integer",
                    "description": "Number of sessions to skip for pagination",
                    "default": 0
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_session_events",
        "description": "Get events for a session with pagination. Events include LLM calls, tool executions, and errors with full attributes.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID to get events for"
                },
                "limit": {
                    "type": "integer",
                    "description": "Max events to return (default: 50, max: 200)",
                    "default": 50
                },
                "offset": {
                    "type": "integer",
                    "description": "Number of events to skip for pagination",
                    "default": 0
                },
                "event_types": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Filter by event types (e.g., ['llm.call.start', 'tool.execution'])"
                }
            },
            "required": ["session_id"]
        }
    },
    {
        "name": "get_event",
        "description": "Get complete details for a single event by ID. Use this after get_session_events to retrieve full event data including all attributes.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID containing the event"
                },
                "event_id": {
                    "type": "string",
                    "description": "Event ID (span_id) to retrieve"
                }
            },
            "required": ["session_id", "event_id"]
        }
    },
    # ==================== IDE Activity Tools (Simplified) ====================
    # Activity is tracked AUTOMATICALLY when any MCP tool with agent_workflow_id is called.
    # These tools are optional - for providing IDE metadata or checking status.
    {
        "name": "ide_heartbeat",
        "description": "OPTIONAL: Provide IDE metadata for richer status display. Activity is tracked automatically - you do NOT need to call this for tracking. Use this once per session if you want to show IDE type and workspace in the dashboard.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_workflow_id": {
                    "type": "string",
                    "description": "The agent workflow ID - derive from project folder name (e.g., 'next-rooms', 'my-agent')"
                },
                "ide_type": {
                    "type": "string",
                    "description": "Type of IDE: 'cursor' or 'claude-code'",
                    "enum": ["cursor", "claude-code"]
                },
                "workspace_path": {
                    "type": "string",
                    "description": "Full path to the workspace/project being edited"
                },
                "model": {
                    "type": "string",
                    "description": "AI model name (e.g., 'claude-opus-4.5', 'gpt-4o')"
                },
                "host": {
                    "type": "string",
                    "description": "Hostname (optional)"
                },
                "user": {
                    "type": "string",
                    "description": "Username (optional)"
                }
            },
            "required": ["agent_workflow_id"]
        }
    },
    # ==================== Recommendation Tools ====================
    {
        "name": "get_recommendations",
        "description": "Get recommendations for a workflow. Each finding auto-creates a recommendation with fix guidance.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier (same as agent_workflow_id)"
                },
                "status": {
                    "type": "string",
                    "description": "Filter by status: PENDING, FIXING, FIXED, VERIFIED, DISMISSED, IGNORED"
                },
                "severity": {
                    "type": "string",
                    "description": "Filter by severity: CRITICAL, HIGH, MEDIUM, LOW"
                },
                "category": {
                    "type": "string",
                    "description": "Filter by category: PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY, BEHAVIOR"
                },
                "blocking_only": {
                    "type": "boolean",
                    "description": "Only return blocking items (CRITICAL/HIGH not yet fixed)",
                    "default": False
                },
                "limit": {
                    "type": "integer",
                    "default": 100
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_recommendation_detail",
        "description": "Get detailed information about a specific recommendation including the linked finding and audit history.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (e.g., 'REC-001')"
                }
            },
            "required": ["recommendation_id"]
        }
    },
    {
        "name": "start_fix",
        "description": "Mark a recommendation as being worked on. Sets status to FIXING. Call this before applying a fix.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (e.g., 'REC-001')"
                },
                "fixed_by": {
                    "type": "string",
                    "description": "Who is working on the fix (optional)"
                }
            },
            "required": ["recommendation_id"]
        }
    },
    {
        "name": "complete_fix",
        "description": "Mark a recommendation as fixed. Sets status to FIXED. Call after applying a fix.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (e.g., 'REC-001')"
                },
                "fix_notes": {
                    "type": "string",
                    "description": "Description of what was fixed and how"
                },
                "files_modified": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of files that were modified"
                },
                "fix_commit": {
                    "type": "string",
                    "description": "Git commit hash (if applicable)"
                },
                "fix_method": {
                    "type": "string",
                    "description": "How the fix was applied: MANUAL, AUTOFIX, etc."
                },
                "fixed_by": {
                    "type": "string",
                    "description": "Who applied the fix"
                }
            },
            "required": ["recommendation_id"]
        }
    },
    {
        "name": "verify_fix",
        "description": "Verify a fix was successful. Sets status to VERIFIED if passed, or reverts to PENDING if failed.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (e.g., 'REC-001')"
                },
                "verification_result": {
                    "type": "string",
                    "description": "Description of the verification result"
                },
                "success": {
                    "type": "boolean",
                    "description": "Whether verification passed",
                    "default": True
                },
                "verified_by": {
                    "type": "string",
                    "description": "Who performed verification"
                }
            },
            "required": ["recommendation_id", "verification_result"]
        }
    },
    {
        "name": "dismiss_recommendation",
        "description": "Dismiss or ignore a recommendation (accept the risk). Use when the issue is a false positive or acceptable risk.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (e.g., 'REC-001')"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for dismissal - REQUIRED for audit trail"
                },
                "dismiss_type": {
                    "type": "string",
                    "description": "DISMISSED (can reopen) or IGNORED (permanent)",
                    "default": "DISMISSED"
                },
                "dismissed_by": {
                    "type": "string",
                    "description": "Who dismissed it"
                }
            },
            "required": ["recommendation_id", "reason"]
        }
    },
    {
        "name": "get_gate_status",
        "description": "Get the production gate status. Shows if deployment is blocked due to unresolved critical/high issues.",
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
        "name": "get_audit_log",
        "description": "Get audit log entries for compliance. Shows all status changes for recommendations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "entity_type": {
                    "type": "string",
                    "description": "Filter by entity type (e.g., 'recommendation')"
                },
                "entity_id": {
                    "type": "string",
                    "description": "Filter by entity ID"
                },
                "action": {
                    "type": "string",
                    "description": "Filter by action (e.g., 'STATUS_CHANGED', 'DISMISSED')"
                },
                "limit": {
                    "type": "integer",
                    "default": 100
                }
            }
        }
    },
    # ==================== Dynamic Analysis On-Demand Tools ====================
    {
        "name": "trigger_dynamic_analysis",
        "description": "Trigger on-demand dynamic analysis for a workflow. Analysis processes only new sessions since last analysis. Previous issues not detected will be auto-resolved. Use /analyze as a shortcut.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier (same as agent_workflow_id)"
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_dynamic_analysis_status",
        "description": "Get comprehensive dynamic analysis status for a workflow. Shows whether analysis can be triggered, unanalyzed session counts, and per-agent status. Use /status as a shortcut.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier (same as agent_workflow_id)"
                }
            },
            "required": ["workflow_id"]
        }
    },
    {
        "name": "get_analysis_history",
        "description": "Get analysis history for a workflow. Shows past analysis runs - latest impacts gate status, historical ones are view-only records.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workflow_id": {
                    "type": "string",
                    "description": "Workflow/project identifier (same as agent_workflow_id)"
                },
                "session_type": {
                    "type": "string",
                    "description": "Filter by type: STATIC, DYNAMIC, or AUTOFIX",
                    "default": "DYNAMIC"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of analyses to return",
                    "default": 20
                }
            },
            "required": ["workflow_id"]
        }
    }
]


def get_tool_names() -> List[str]:
    """Get list of all available tool names."""
    return [tool["name"] for tool in MCP_TOOLS]
