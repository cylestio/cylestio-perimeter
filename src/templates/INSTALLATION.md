# Agent Inspector Integration Guide

This guide explains how to integrate Agent Inspector's security analysis tools with your AI coding assistant (Claude Code or Cursor).

## Overview

Agent Inspector provides MCP (Model Context Protocol) tools that enable AI assistants to:
- Scan code for OWASP LLM Top 10 vulnerabilities
- Store and track security findings
- Get remediation templates for fixing issues
- **Correlate static analysis with dynamic runtime behavior**
- **Track workflow lifecycle (development → testing → production)**

## Prerequisites

1. **Agent Inspector server running**
   ```bash
   # Install agent-inspector
   pipx install agent-inspector

   # Start for your provider
   agent-inspector openai --use-local-storage
   # or
   agent-inspector anthropic --use-local-storage
   ```

2. **Your agent project directory** where you want to enable security analysis

---

## Claude Code Setup

### Option 1: CLI Configuration (Recommended)

```bash
# Add the MCP server (port 8080 is the dashboard with MCP endpoint)
claude mcp add --transport http agent-inspector http://localhost:8080/mcp
```

### Option 2: Project Configuration (.mcp.json)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "agent-inspector": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### Option 3: Install Skills (Optional)

Copy the skill files to your project's `.claude/skills/` directory:

```bash
# Create skills directory
mkdir -p .claude/skills

# Copy static analysis skill
cp /path/to/cylestio-perimeter/src/templates/skills/static-analysis/SKILL.md \
   .claude/skills/static-analysis.md

# Copy auto-fix skill (optional)
cp /path/to/cylestio-perimeter/src/templates/skills/auto-fix/SKILL.md \
   .claude/skills/auto-fix.md
```

### Verify Setup

In Claude Code, run:
```
/mcp
```

You should see `agent-inspector` listed with **14 available tools**.

---

## Cursor Setup

### Step 1: Configure MCP Server

Create `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project-specific):

```json
{
  "mcpServers": {
    "agent-inspector": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

**Note:** The MCP endpoint is on port **8080** (the live trace dashboard), not 3000 (the proxy).

### Step 2: Restart Cursor and Approve

1. Restart Cursor to detect the new MCP server
2. Cursor will prompt you to approve the new server - click **Approve**

### Step 3: Install Rules Files (Optional)

Copy the rules files for additional AI context:

```bash
# Create rules directory
mkdir -p .cursor/rules

# Copy the MDC format rules
cp /path/to/cylestio-perimeter/src/templates/cursor-rules/agent-inspector.mdc \
   .cursor/rules/agent-inspector.mdc
```

### Verify Setup

The AI assistant should now have access to **14 MCP tools**. Test by asking:
> "Check the workflow state for my project using Agent Inspector"

Or simply:
> "Run a security scan on this codebase"

---

## Available MCP Tools (14 total)

### Config & Lifecycle Tools
| Tool | Description |
|------|-------------|
| `get_workflow_config` | Read/auto-create `cylestio.yaml` for workflow_id |
| `get_workflow_state` | Check what analysis exists (static/dynamic/both) |
| `get_workflow_correlation` | Correlate static findings with dynamic runtime |
| `get_tool_usage_summary` | Get tool usage patterns from dynamic sessions |
| `get_agents` | List agents (filter by workflow_id or "unlinked") |
| `update_agent_info` | Link agents to workflows, set display names |

### Knowledge Tools
| Tool | Description |
|------|-------------|
| `get_security_patterns` | Get OWASP LLM security patterns |
| `get_owasp_control` | Get details for specific OWASP control |
| `get_fix_template` | Get remediation template |

### Analysis Tools
| Tool | Description |
|------|-------------|
| `create_analysis_session` | Start analysis session (requires workflow_id) |
| `store_finding` | Record a security finding |
| `complete_analysis_session` | Finalize and get risk score |
| `get_findings` | Retrieve stored findings |
| `update_finding_status` | Mark finding as fixed/ignored |

---

## How It Works: Auto-Setup

When you first ask for a security scan, the AI assistant will:

1. **Auto-detect workflow_id** - Derives from git remote, package name, or folder
2. **Auto-create `cylestio.yaml`** - Saves the config in your project root
3. **Auto-discover agents** - Finds any unlinked dynamic agents using `get_agents("unlinked")`
4. **Auto-link agents** - Links them to your workflow using `update_agent_info(agent_id, workflow_id=...)`
5. **Auto-correlate** - Connects static analysis with dynamic runtime traces

```yaml
# cylestio.yaml (auto-created)
workflow_id: your-project-name
workflow_name: Your Project Name
```

This file should be committed to git so the whole team uses the same workflow_id.

---

## Usage Examples

### Security Scan (Static Analysis)

Ask Claude/Cursor:
> "Run a security scan on this codebase"

The AI will:
1. Call `get_workflow_config()` - auto-creates `cylestio.yaml` if missing
2. Call `get_workflow_state()` - check what analysis already exists
3. Call `get_agents("unlinked")` - find any unlinked dynamic agents
4. Call `update_agent_info(agent_id, workflow_id=...)` - link them
5. Call `get_security_patterns()` - get OWASP patterns
6. Call `create_analysis_session(workflow_id)` - start session
7. Analyze code and call `store_finding()` for each issue
8. Call `complete_analysis_session()` - finalize
9. Call `get_workflow_correlation()` - correlate with any dynamic data
10. Call `update_agent_info(agent_id, display_name=...)` - name agents based on code

### Dynamic Analysis (Runtime Testing)

Ask Claude/Cursor:
> "Help me test my agent with Agent Inspector"

The AI will:
1. Read workflow_id from `cylestio.yaml`
2. Configure your agent code to use: `base_url=f"http://localhost:3000/workflow/{workflow_id}"`
3. Run tests and view traces in dashboard

### Check Correlation

Ask Claude/Cursor:
> "Show me the correlation between static findings and dynamic tests"

The AI will:
1. Call `get_workflow_correlation(workflow_id)`
2. Report which findings are validated by runtime behavior
3. Recommend additional test scenarios

### Fix a Finding

Ask Claude/Cursor:
> "Fix the prompt injection vulnerability in api.py"

The AI will:
1. Call `get_fix_template()` for remediation guidance
2. Apply the fix to your code
3. Call `update_finding_status()` to mark as fixed

### View Dashboard

After analysis, view results at:
```
http://localhost:8080/workflow/{workflow_id}
```

The dashboard shows:
- Lifecycle state (Static Only → Dynamic Only → Complete)
- Security findings with severity
- Tool usage patterns from dynamic sessions
- Correlation between static findings and runtime behavior

---

## Troubleshooting

### "MCP server not found"
- Ensure Agent Inspector is running (the live trace dashboard starts on port 8080)
- Verify MCP endpoint: `curl -X POST http://localhost:8080/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`

### "Tools not available"
- Verify MCP connection with `/mcp` command (Claude Code)
- For Cursor: Restart Cursor after adding mcp.json and approve the server when prompted

### "Connection refused"
- Make sure the server is running: `curl http://localhost:3000/health`
- MCP endpoint is on port **8080** (dashboard), not 3000 (proxy)
- Check firewall settings

---

## File Locations

After installation and first scan, your project structure should look like:

```
your-agent-project/
├── cylestio.yaml                # Workflow config (auto-created, commit to git!)
├── .mcp.json                    # Claude Code MCP config
├── .cursor/
│   ├── mcp.json                 # Cursor MCP config
│   └── rules/
│       └── agent-inspector.mdc  # Cursor rules
├── .claude/
│   └── skills/
│       ├── static-analysis.md   # Static analysis skill
│       ├── dynamic-analysis.md  # Dynamic analysis skill
│       └── auto-fix.md          # Auto-fix skill
└── ... your code
```

Global config (applies to all projects):
- Cursor: `~/.cursor/mcp.json`

**Important:** Commit `cylestio.yaml` to git so your team uses the same workflow_id!

---

## Ports Reference

| Service | Port | Purpose |
|---------|------|---------|
| Proxy Server | 3000 | Routes LLM API requests, workflow URLs |
| Dashboard + MCP | 8080 | Live trace UI, MCP endpoint at `/mcp` |

---

## Support

- Dashboard: http://localhost:8080 (or http://localhost:3000/workflow/{id})
- MCP Endpoint: http://localhost:8080/mcp
- Health Check: http://localhost:3000/health
- API Docs: http://localhost:3000/docs
