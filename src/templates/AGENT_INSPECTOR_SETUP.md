# Agent Inspector - AI Assistant Guide

> **When to read this file:** User asks to "set up Agent Inspector", "configure security scanning", or "integrate Agent Inspector".

---

## Prerequisites Check

Before setup, verify Agent Inspector server is running:
- Ask user: "Is Agent Inspector running? It should be on http://localhost:7100"
- If not running, tell user: "Please start Agent Inspector first with: `uvx cylestio-perimeter run --config your-config.yaml`"

---

## Step 1: Detect IDE

Determine which IDE the user is using:

| IDE | Detection |
|-----|-----------|
| **Cursor** | You're running in Cursor IDE, or `.cursor/` directory exists |
| **Claude Code** | You're Claude Code, or `.claude/` directory exists |

---

## Step 2: Create Configuration Files

### For Cursor

Create **two files**:

**File 1: `.cursor/mcp.json`**
```json
{
  "mcpServers": {
    "agent-inspector": {
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

**File 2: `.cursor/rules/agent-inspector.mdc`**

Copy from: `src/templates/cursor-rules/agent-inspector.mdc` (if available in the cylestio-perimeter package)

Or create with this content:
```
---
description: Agent Inspector - AI Agent Security Analysis
globs: ["**/*.py", "**/*.ts", "**/*.js"]
alwaysApply: true
---

# Agent Inspector MCP Tools

You have access to 13 security analysis tools via MCP. Use them when users ask for security scans.

## Quick Reference
- **Dashboard:** http://localhost:7100
- **Proxy:** http://localhost:4000

## Core Workflow

When user asks for security analysis:

1. **Get workflow_id** (DON'T ask user - derive it):
   - Check `cylestio.yaml` for `workflow_id` field
   - Or use git remote name: `git remote get-url origin` → extract repo name
   - Or use folder name as fallback

2. **Check state:** `get_workflow_state(workflow_id)`

3. **Link unlinked agents:** `get_agents("unlinked")` → `update_agent_info(agent_id, workflow_id=...)`

4. **Run static analysis:**
   - `get_security_patterns()` → get patterns to look for
   - `create_analysis_session(workflow_id, "STATIC")`
   - Analyze code files for each pattern
   - `store_finding(...)` for each issue found
   - `complete_analysis_session(session_id)`

5. **Correlate** (if dynamic data exists): `get_workflow_correlation(workflow_id)`

6. **Report:** Share dashboard link: http://localhost:7100/workflow/{workflow_id}
```

### For Claude Code

Create **one file**:

**File: `.mcp.json`** (in project root)
```json
{
  "mcpServers": {
    "agent-inspector": {
      "type": "http",
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

Optionally copy skills from `src/templates/skills/` to `.claude/skills/`.

---

## Step 3: Tell User What to Do Next

### For Cursor Users

Say exactly:
> "I've set up Agent Inspector with MCP connection and rules.
> 
> **Please restart Cursor** to load the MCP server.
> 
> After restart, you can ask me to:
> - 'Run a security scan on this codebase'
> - 'Check for OWASP LLM vulnerabilities'
> - 'Help me test my agent with Agent Inspector'"

### For Claude Code Users

Say exactly:
> "I've configured Agent Inspector MCP connection.
> 
> Run `/mcp` to verify you see 'agent-inspector' with 13 tools.
> 
> Then you can ask me to:
> - 'Run a security scan on this codebase'
> - 'Check for OWASP LLM vulnerabilities'
> - 'Help me test my agent with Agent Inspector'"

---

## After Setup: How to Use

Once MCP is connected, you have these tools:

| Tool | When to Use |
|------|-------------|
| `get_security_patterns` | Start of any security scan - get patterns to look for |
| `create_analysis_session` | Before storing findings - creates a session |
| `store_finding` | For each vulnerability found |
| `complete_analysis_session` | After all findings stored |
| `get_findings` | To show existing findings |
| `update_finding_status` | When user fixes an issue |
| `get_workflow_state` | To check what analysis exists |
| `get_workflow_correlation` | To correlate static findings with runtime data |
| `get_agents` | To discover agents from dynamic testing |
| `update_agent_info` | To link/name agents |
| `get_owasp_control` | For detailed info on specific vulnerabilities |
| `get_fix_template` | To get remediation code templates |
| `get_tool_usage_summary` | To see runtime tool usage patterns |

---

## Dynamic Testing Guidance

When user wants to test their agent at runtime, tell them:

> "To capture runtime behavior, configure your agent to use the Agent Inspector proxy:
> 
> ```python
> # For OpenAI
> client = OpenAI(base_url='http://localhost:4000/workflow/{workflow_id}')
> 
> # For Anthropic  
> client = Anthropic(base_url='http://localhost:4000/workflow/{workflow_id}')
> ```
> 
> Replace `{workflow_id}` with: **[derive from project name]**
> 
> After running tests, ask me to correlate the results with static analysis."

---

## Error Handling

| Error | Response to User |
|-------|------------------|
| MCP tools not available | "Agent Inspector MCP isn't connected. Please restart your IDE and ensure the server is running on http://localhost:7100" |
| Connection refused | "Can't reach Agent Inspector. Please start it with: `uvx cylestio-perimeter run --config your-config.yaml`" |
| No workflow_id | Derive from folder name, never ask user |
| No findings | "Great news! No security issues found. Consider running dynamic tests to validate runtime behavior." |

---

## Ports Reference

| Port | Service | URL |
|------|---------|-----|
| 4000 | Proxy | `http://localhost:4000/workflow/{id}` |
| 7100 | Dashboard + MCP | `http://localhost:7100/mcp` |
