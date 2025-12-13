"""MCP tool definitions following the Model Context Protocol specification.

Terminology:
- Agent: Project/grouping level (contains multiple system prompts)
- System Prompt: Individual LLM agent instance (identified by system prompt hash)
"""
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
        "description": "Create a new analysis session to group security findings for an agent/codebase. Call this before storing findings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent/project identifier for the codebase being analyzed"
                },
                "session_type": {
                    "type": "string",
                    "default": "STATIC",
                    "description": "STATIC, DYNAMIC, or AUTOFIX"
                },
                "agent_name": {
                    "type": "string",
                    "description": "Human-readable agent/project name"
                }
            },
            "required": ["agent_id"]
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
        "description": "Store a security finding discovered during analysis. Includes de-duplication by fingerprint.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "file_path": {"type": "string"},
                "finding_type": {
                    "type": "string",
                    "description": "e.g., 'PROMPT_INJECT_DIRECT', 'SECRET_API_KEY', 'TOOL_DANGEROUS_UNRESTRICTED'"
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
                    "items": {"type": "string"},
                    "description": "OWASP LLM IDs, e.g., ['LLM01', 'LLM08']"
                },
                "cvss_score": {
                    "type": "number",
                    "description": "CVSS score 0.0-10.0"
                },
                "cvss_vector": {
                    "type": "string",
                    "description": "CVSS vector string, e.g., 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N'"
                },
                "cwe_mapping": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "CWE IDs, e.g., ['CWE-74', 'CWE-798']"
                },
                "mitre_atlas": {
                    "type": "string",
                    "description": "MITRE ATLAS technique ID, e.g., 'AML.T0051'"
                },
                "soc2_controls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "SOC2 control IDs, e.g., ['CC6.1', 'CC6.6']"
                },
                "nist_csf": {
                    "type": "string",
                    "description": "NIST CSF reference, e.g., 'PR.DS-5'"
                },
                "fix_recommendation": {
                    "type": "string",
                    "description": "Suggested fix for this finding"
                },
                "ai_fixable": {
                    "type": "boolean",
                    "description": "Whether AI can fix this (default true)"
                },
                "function_name": {
                    "type": "string",
                    "description": "Function where finding was detected"
                },
                "class_name": {
                    "type": "string",
                    "description": "Class where finding was detected"
                },
                "data_flow": {
                    "type": "string",
                    "description": "Data flow description (source -> sink)"
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
                "agent_id": {
                    "type": "string",
                    "description": "Filter by agent/project identifier"
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
    # ==================== Recommendation Tools ====================
    {
        "name": "get_recommendation_detail",
        "description": "Get full recommendation details by ID (REC-XXX). PRIMARY ENTRY POINT for fixing issues. Returns finding, evidence, related files, correlation data, and mappings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID in REC-XXX format"
                }
            },
            "required": ["recommendation_id"]
        }
    },
    {
        "name": "get_recommendations",
        "description": "List recommendations for an agent. Filter by status, severity, or blocking issues only.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Filter by agent ID"
                },
                "status": {
                    "type": "string",
                    "description": "PENDING, FIXING, FIXED, VERIFIED, REOPENED, DISMISSED, or IGNORED"
                },
                "severity": {
                    "type": "string",
                    "description": "CRITICAL, HIGH, MEDIUM, or LOW"
                },
                "blocking_only": {
                    "type": "boolean",
                    "description": "Only return gate-blocking issues (CRITICAL/HIGH, not resolved)"
                },
                "limit": {
                    "type": "integer",
                    "default": 100
                }
            }
        }
    },
    {
        "name": "start_fix",
        "description": "Mark recommendation as FIXING. Call this BEFORE applying changes. Returns full context for the fix.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (REC-XXX)"
                }
            },
            "required": ["recommendation_id"]
        }
    },
    {
        "name": "complete_fix",
        "description": "Mark recommendation as FIXED. Call this AFTER applying changes. Triggers verification.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (REC-XXX)"
                },
                "fix_notes": {
                    "type": "string",
                    "description": "Explanation of what was fixed and why"
                },
                "files_modified": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of files that were modified"
                },
                "fix_commit": {
                    "type": "string",
                    "description": "Git commit hash if available"
                }
            },
            "required": ["recommendation_id", "fix_notes", "files_modified"]
        }
    },
    {
        "name": "verify_fix",
        "description": "Manually verify if a fix resolved the issue. Usually automatic, but can trigger manually.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (REC-XXX)"
                },
                "verification_result": {
                    "type": "string",
                    "description": "Description of verification outcome"
                },
                "success": {
                    "type": "boolean",
                    "description": "True if issue resolved, False if still present"
                }
            },
            "required": ["recommendation_id", "verification_result", "success"]
        }
    },
    {
        "name": "dismiss_recommendation",
        "description": "Dismiss or mark as false positive. Requires reason for audit trail.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recommendation_id": {
                    "type": "string",
                    "description": "Recommendation ID (REC-XXX)"
                },
                "reason": {
                    "type": "string",
                    "description": "REQUIRED: Why this is being dismissed (for audit)"
                },
                "dismiss_type": {
                    "type": "string",
                    "description": "'DISMISSED' (risk accepted) or 'IGNORED' (false positive)",
                    "enum": ["DISMISSED", "IGNORED"]
                }
            },
            "required": ["recommendation_id", "reason"]
        }
    },
    {
        "name": "get_gate_status",
        "description": "Check if Production deployment is blocked. Returns blocking issues count and details.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent ID to check"
                }
            },
            "required": ["agent_id"]
        }
    },
    # ==================== Dynamic Analysis Tools ====================
    {
        "name": "trigger_dynamic_analysis",
        "description": "Manually trigger dynamic analysis for an agent. Runs behavioral and security analysis on completed sessions that haven't been analyzed yet. Use this after running the agent multiple times to see security check results.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent identifier to analyze"
                },
                "force": {
                    "type": "boolean",
                    "description": "If true, re-analyze even if no new sessions since last analysis (default: false)",
                    "default": False
                }
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "get_dynamic_analysis_status",
        "description": "Get the current status of dynamic analysis for an agent. Shows pending sessions count, latest analysis info, and whether analysis is currently running.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent identifier"
                }
            },
            "required": ["agent_id"]
        }
    },
    # ==================== Agent Lifecycle Tools ====================
    {
        "name": "get_agent_state",
        "description": "Get the current lifecycle state of an agent. Shows what analysis exists (static, dynamic, or both) and recommends next steps. Use this first to understand what data is available.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent/project identifier"
                }
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "get_tool_usage_summary",
        "description": "Get tool usage patterns from dynamic sessions. Shows which tools were called, how often, and coverage metrics.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent/project identifier"
                }
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "get_agent_correlation",
        "description": "Correlate static findings with dynamic runtime observations. Shows which findings are VALIDATED (tool exercised at runtime) or UNEXERCISED (never called in tests). Only meaningful when both static and dynamic data exist.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Agent/project identifier"
                }
            },
            "required": ["agent_id"]
        }
    },
    # ==================== System Prompt Discovery Tools ====================
    {
        "name": "get_system_prompts",
        "description": "List all system prompts discovered during dynamic sessions. Use to find system prompts that need linking to agents or naming.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Filter by agent. Use 'unlinked' to get system prompts with no agent_id."
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
        "name": "update_system_prompt_info",
        "description": "Update a system prompt's display name, description, or link to an agent. Use after discovering system prompts to give them meaningful names or to link them to agents for correlation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "system_prompt_id": {
                    "type": "string",
                    "description": "The system prompt ID from dynamic sessions"
                },
                "display_name": {
                    "type": "string",
                    "description": "Human-friendly name (e.g., 'Customer Support Bot')"
                },
                "description": {
                    "type": "string",
                    "description": "Brief description of what the system prompt does"
                },
                "agent_id": {
                    "type": "string",
                    "description": "Link this system prompt to an agent for correlation with static analysis"
                }
            },
            "required": ["system_prompt_id"]
        }
    },
    # ==================== IDE Connection Tools ====================
    {
        "name": "register_ide_connection",
        "description": "Register this IDE as connected to Agent Inspector. REQUIRED at start of every session. You MUST include your AI model name (e.g., 'claude-opus-4.5', 'gpt-4o'). Save the returned connection_id for heartbeats.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ide_type": {
                    "type": "string",
                    "description": "Type of IDE you are running in. Use 'cursor' for Cursor IDE, 'claude-code' for Claude Code CLI.",
                    "enum": ["cursor", "claude-code"]
                },
                "agent_id": {
                    "type": "string",
                    "description": "The agent ID - derive from project folder name (e.g., 'next-rooms', 'my-agent')"
                },
                "workspace_path": {
                    "type": "string",
                    "description": "Full path to the workspace/project being edited"
                },
                "model": {
                    "type": "string",
                    "description": "YOUR AI model name. Examples: 'claude-opus-4.5', 'claude-sonnet-4', 'gpt-4o', 'gpt-4-turbo'. Check your system prompt if unsure."
                },
                "host": {
                    "type": "string",
                    "description": "Hostname of the machine (optional)"
                },
                "user": {
                    "type": "string",
                    "description": "Username on the machine (optional)"
                }
            },
            "required": ["ide_type", "agent_id", "workspace_path", "model"]
        }
    },
    {
        "name": "ide_heartbeat",
        "description": "Send ONE heartbeat at the START of Agent Inspector work. Do NOT call after every action - that wastes tokens. Connection stays active for 60 seconds.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "connection_id": {
                    "type": "string",
                    "description": "The connection_id from register_ide_connection"
                },
                "is_developing": {
                    "type": "boolean",
                    "description": "true when doing security work, false otherwise",
                    "default": False
                },
                "agent_id": {
                    "type": "string",
                    "description": "Only if switching agents"
                }
            },
            "required": ["connection_id"]
        }
    },
    {
        "name": "disconnect_ide",
        "description": "Disconnect this IDE from Agent Inspector. Call when ending a security analysis session.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "connection_id": {
                    "type": "string",
                    "description": "Connection ID from register_ide_connection"
                }
            },
            "required": ["connection_id"]
        }
    },
    {
        "name": "get_ide_connection_status",
        "description": "OPTIONAL: Check IDE connection status. Usually you can skip this and just call register_ide_connection directly (it's idempotent).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {
                    "type": "string",
                    "description": "Filter by agent ID"
                }
            }
        }
    }
]


def get_tool_names() -> List[str]:
    """Get list of all available tool names."""
    return [tool["name"] for tool in MCP_TOOLS]
