# Agent Inspector - AI Agent Security Analysis

This project uses Agent Inspector for comprehensive AI agent security analysis.

## Connection Details

| Service | URL |
|---------|-----|
| MCP Server | http://localhost:7100/mcp |
| Dashboard | http://localhost:7100 |
| LLM Proxy | http://localhost:4000 |

## Commands

| Command | Description |
|---------|-------------|
| `/scan` | Run security scan on current workspace |
| `/scan path/` | Scan specific folder |
| `/fix REC-XXX` | Fix a specific recommendation (AI-powered, contextual) |
| `/fix` | Fix highest priority blocking recommendation |

## The 7 Security Categories

Every AI agent is evaluated against these 7 security check categories:

| # | Category | OWASP LLM | What It Checks |
|---|----------|-----------|----------------|
| 1 | **PROMPT** | LLM01 | Prompt injection, jailbreak, unsafe prompt construction |
| 2 | **OUTPUT** | LLM02 | Insecure output handling, XSS, downstream injection |
| 3 | **TOOL** | LLM07/08 | Dangerous tools, missing permissions, plugins |
| 4 | **DATA** | LLM06 | Hardcoded secrets, PII exposure, sensitive data |
| 5 | **MEMORY** | - | RAG poisoning, context injection, history security |
| 6 | **SUPPLY** | LLM05 | Dependencies, model sources, external prompts |
| 7 | **BEHAVIOR** | LLM08/09 | Unbounded operations, excessive agency |

### Gate Status
- 🔒 **BLOCKED**: Any CRITICAL or HIGH issues remain open → can't ship
- ✅ **OPEN**: All blocking issues resolved → ready to ship

## Recommendation Lifecycle

Every security finding has a recommendation (what to do about it):

```
PENDING → FIXING → FIXED → VERIFIED
              ↓
         DISMISSED / IGNORED
```

- **PENDING**: Issue found, waiting for action
- **FIXING**: AI or human is working on it
- **FIXED**: Fix applied, awaiting verification
- **VERIFIED**: Re-scan confirmed issue is resolved
- **DISMISSED**: Risk accepted (documented reason required)
- **IGNORED**: False positive (documented reason required)

## The /fix Command Workflow

When you see `/fix REC-XXX`:

1. **Get recommendation details** - understand the vulnerability
2. **Start fix tracking** - marks status as FIXING
3. **Read and analyze codebase** - understand context, patterns, style
4. **Apply intelligent fix** - not a template, but adapted to the codebase
5. **Complete the fix** - marks status as FIXED with notes

### Fix Quality Checklist
- [ ] Fix follows codebase's existing patterns and style
- [ ] Fix is minimal - only changes what's necessary
- [ ] Fix doesn't break existing functionality
- [ ] Explanation is clear to the user

## MCP Tools Reference

### Core Tools
| Tool | Purpose |
|------|---------|
| `create_analysis_session` | Start a scan session |
| `get_security_patterns` | Get OWASP LLM patterns for scanning |
| `store_finding` | Record a security finding |
| `complete_analysis_session` | Finalize scan, calculate risk |

### Recommendation Tools
| Tool | Purpose |
|------|---------|
| `get_recommendations` | List recommendations for workflow |
| `get_recommendation_detail` | Get full details for a recommendation |
| `start_fix` | Mark recommendation as FIXING |
| `complete_fix` | Mark recommendation as FIXED |
| `dismiss_recommendation` | Dismiss with documented reason |

### Analysis Tools
| Tool | Purpose |
|------|---------|
| `get_agent_workflow_state` | Check what data exists |
| `get_gate_status` | Check if production is blocked |
| `get_agent_workflow_correlation` | Correlate static ↔ dynamic |
| `get_tool_usage_summary` | See runtime behavior |

## Dynamic Analysis Setup

To capture runtime behavior, configure your agent's base_url:

```python
# OpenAI
client = OpenAI(base_url=f"http://localhost:4000/agent-workflow/{AGENT_WORKFLOW_ID}")

# Anthropic
client = Anthropic(base_url=f"http://localhost:4000/agent-workflow/{AGENT_WORKFLOW_ID}")
```

Use the **same agent_workflow_id** for static and dynamic analysis to get unified results.

## Quick Links

| Resource | URL |
|----------|-----|
| Static Analysis | http://localhost:7100/agent-workflow/{id}/static-analysis |
| Recommendations | http://localhost:7100/agent-workflow/{id}/recommendations |
| Dynamic Sessions | http://localhost:7100/agent-workflow/{id}/sessions |

## IDE Registration

When starting Agent Inspector work, register the connection:

```
register_ide_connection(
  ide_type="claude-code",
  agent_workflow_id="{project_name}",
  workspace_path="{full_path}",
  model="{your_model}"  // e.g., "claude-sonnet-4"
)
```

Send ONE heartbeat at the start of work:
```
ide_heartbeat(connection_id="{id}", is_developing=true)
```
