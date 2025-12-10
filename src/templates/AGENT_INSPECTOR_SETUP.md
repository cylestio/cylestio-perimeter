# Agent Inspector Setup

**Read this file and follow ALL instructions automatically.**

## Step 1: Configure MCP Connection

Create `.cursor/mcp.json` in this project:

```json
{
  "mcpServers": {
    "agent-inspector": {
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

## Step 2: Create Rules File

Create `.cursor/rules/agent-inspector.mdc`:

```markdown
---
description: Agent Inspector - AI Agent Security Analysis
globs: ["**/*.py", "**/*.ts", "**/*.js"]
---

# Agent Inspector Integration

**MCP Server:** http://localhost:7100/mcp
**Dashboard:** http://localhost:7100
**Proxy:** http://localhost:4000

## Available MCP Tools (13 total)

| Tool | Purpose |
|------|---------|
| `get_security_patterns` | OWASP LLM Top 10 patterns |
| `create_analysis_session` | Start analysis (workflow_id required) |
| `store_finding` | Record security finding |
| `complete_analysis_session` | Finalize with risk score |
| `get_findings` | Retrieve findings |
| `update_finding_status` | Mark FIXED/IGNORED |
| `get_owasp_control` | OWASP control details |
| `get_fix_template` | Remediation templates |
| `get_workflow_state` | Check static/dynamic data exists |
| `get_tool_usage_summary` | Runtime tool patterns |
| `get_workflow_correlation` | Correlate static ↔ dynamic |
| `get_agents` | List agents |
| `update_agent_info` | Link/name agents |

## Automatic Workflow

When user asks for security analysis:

### 1. Derive workflow_id (DON'T ASK)
From: git remote → package.json/pyproject.toml → folder name

### 2. Check State
`get_workflow_state(workflow_id)` → NO_DATA, STATIC_ONLY, DYNAMIC_ONLY, or COMPLETE

### 3. Link Unlinked Agents
`get_agents("unlinked")` → `update_agent_info(agent_id, workflow_id=...)`

### 4. Run Static Analysis
1. `get_security_patterns()` - NEVER hardcode
2. `create_analysis_session(workflow_id, "STATIC")`
3. Analyze code → `store_finding(...)` for each issue
4. `complete_analysis_session(session_id)`

### 5. Correlate (if dynamic data exists)
`get_workflow_correlation(workflow_id)`

### 6. Report
Dashboard: http://localhost:7100/workflow/{workflow_id}

## Dynamic Testing Setup

Tell user to configure agent's base_url:
```python
client = OpenAI(base_url="http://localhost:4000/workflow/{WORKFLOW_ID}")
```
```

## Step 3: Restart Required

After creating these files, tell the user:
> "I've set up Agent Inspector. Please **restart Cursor** to load the MCP connection, then ask me to run a security scan."

---

## Quick Reference

- **Proxy:** http://localhost:4000 (point agents here)
- **Dashboard:** http://localhost:7100 (view results)
- **MCP:** http://localhost:7100/mcp (tool endpoint)
