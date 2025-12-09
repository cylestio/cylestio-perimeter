# Agent Inspector Integration Guide

This guide explains how to integrate Agent Inspector's security analysis tools with your AI coding assistant (Claude Code or Cursor).

## Overview

Agent Inspector provides MCP (Model Context Protocol) tools that enable AI assistants to:
- Scan code for OWASP LLM Top 10 vulnerabilities
- Store and track security findings
- Get remediation templates for fixing issues
- **Correlate static analysis with dynamic runtime behavior**
- **Discover and manage agents across workflows**

## Prerequisites

1. **Agent Inspector server running**
   ```bash
   # Quick start with uvx (no installation needed)
   uvx cylestio-perimeter run --config path/to/config.yaml
   
   # Or install globally
   pip install cylestio-perimeter
   cylestio-perimeter run --config path/to/config.yaml
   ```
   
   See `examples/configs/` for sample configurations (e.g., `anthropic-live-trace.yaml`).
   
   **Default ports:**
   - Proxy: `http://localhost:4000` (point your agent here)
   - Dashboard/MCP: `http://localhost:7100`

2. **Your agent project directory** where you want to enable security analysis

---

## Claude Code Setup

### Option 1: CLI Configuration (Recommended)

```bash
# Add the MCP server (port 7100 is the dashboard with MCP endpoint)
claude mcp add --transport http agent-inspector http://localhost:7100/mcp
```

### Option 2: Project Configuration (.mcp.json)

Create `.mcp.json` in your project root:

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

### Option 3: Install Skills (Optional)

Copy the skill files to your project's `.claude/skills/` directory:

```bash
# Create skills directory
mkdir -p .claude/skills

# Copy skills
cp /path/to/cylestio-perimeter/src/templates/skills/static-analysis/SKILL.md \
   .claude/skills/static-analysis.md

cp /path/to/cylestio-perimeter/src/templates/skills/dynamic-analysis/SKILL.md \
   .claude/skills/dynamic-analysis.md

cp /path/to/cylestio-perimeter/src/templates/skills/auto-fix/SKILL.md \
   .claude/skills/auto-fix.md
```

### Verify Setup

In Claude Code, run:
```
/mcp
```

You should see `agent-inspector` listed with **13 available tools**.

---

## Cursor Setup

### Step 1: Configure MCP Server

Create `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project-specific):

```json
{
  "mcpServers": {
    "agent-inspector": {
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

**Note:** The MCP endpoint is on port **7100** (the live trace dashboard), not 4000 (the proxy).

### Step 2: Restart Cursor and Approve

1. Restart Cursor to detect the new MCP server
2. Cursor will prompt you to approve the new server - click **Approve**

### Step 3: Install Rules Files (Recommended)

Copy the rules file for automatic workflow support:

```bash
# Create rules directory
mkdir -p .cursor/rules

# Copy the MDC format rules
cp /path/to/cylestio-perimeter/src/templates/cursor-rules/agent-inspector.mdc \
   .cursor/rules/agent-inspector.mdc
```

### Verify Setup

The AI assistant should now have access to **13 MCP tools**. Test by asking:
> "Run a security scan on this codebase"

---

## Available MCP Tools (13 total)

### Analysis Tools
| Tool | Description |
|------|-------------|
| `get_security_patterns` | Get OWASP LLM Top 10 patterns for analysis |
| `create_analysis_session` | Start analysis session (requires workflow_id) |
| `store_finding` | Record a security finding |
| `complete_analysis_session` | Finalize and get risk score |
| `get_findings` | Retrieve stored findings |
| `update_finding_status` | Mark finding as FIXED or IGNORED |

### Knowledge Tools
| Tool | Description |
|------|-------------|
| `get_owasp_control` | Get specific OWASP control details (LLM01-LLM10) |
| `get_fix_template` | Get remediation template for fixing issues |

### Workflow Lifecycle Tools
| Tool | Description |
|------|-------------|
| `get_workflow_state` | Check what analysis exists (static/dynamic/both) |
| `get_tool_usage_summary` | Get tool usage patterns from dynamic sessions |
| `get_workflow_correlation` | Correlate static findings with dynamic runtime |

### Agent Discovery Tools
| Tool | Description |
|------|-------------|
| `get_agents` | List agents (filter by workflow_id or "unlinked") |
| `update_agent_info` | Link agents to workflows, set display names |

---

## How It Works: Automatic Workflow

When you ask for a security scan, the AI assistant will automatically:

1. **Derive workflow_id** from git remote, package name, or folder name
2. **Check workflow state** to see what data already exists
3. **Discover & link agents** from any dynamic sessions
4. **Run analysis** and store findings
5. **Correlate** if both static and dynamic data exist
6. **Report** with dashboard link

### Workflow States

| State | Meaning | AI Action |
|-------|---------|-----------|
| `NO_DATA` | No analysis yet | Run static analysis |
| `STATIC_ONLY` | Only static analysis | Inform user to run dynamic tests |
| `DYNAMIC_ONLY` | Only runtime data | Run static analysis, then correlate |
| `COMPLETE` | Both static & dynamic | Run correlation, show unified results |

---

## Usage Examples

### Security Scan (Static Analysis)

Ask Claude/Cursor:
> "Run a security scan on this codebase"

The AI will:
1. Derive `workflow_id` from project (e.g., folder name)
2. Call `get_workflow_state(workflow_id)` to check existing data
3. Call `get_agents("unlinked")` to find unlinked dynamic agents
4. Link any unlinked agents with `update_agent_info(agent_id, workflow_id=...)`
5. Call `get_security_patterns()` to get OWASP patterns
6. Call `create_analysis_session(workflow_id)` to start session
7. Analyze code and call `store_finding()` for each issue
8. Call `complete_analysis_session()` to finalize
9. If dynamic data exists: `get_workflow_correlation(workflow_id)` to correlate
10. Report results with dashboard link

### Dynamic Analysis (Runtime Testing)

Ask Claude/Cursor:
> "Help me test my agent with Agent Inspector"

The AI will:
1. Derive workflow_id
2. Configure your agent code to use: `base_url="http://localhost:4000/workflow/{workflow_id}"`
3. Run tests and view traces in dashboard

### Check Correlation

Ask Claude/Cursor:
> "Show me the correlation between static findings and dynamic tests"

The AI will:
1. Call `get_workflow_correlation(workflow_id)`
2. Report which findings are **VALIDATED** (exercised at runtime) vs **UNEXERCISED** (never called)
3. Recommend additional test scenarios

### Fix a Finding

Ask Claude/Cursor:
> "Fix the prompt injection vulnerability in api.py"

The AI will:
1. Call `get_fix_template()` for remediation guidance
2. Apply the fix to your code
3. Call `update_finding_status()` to mark as fixed
4. Recommend re-running dynamic tests to validate

### View Dashboard

After analysis, view results at:
```
http://localhost:7100/workflow/{workflow_id}
```

The dashboard shows:
- Lifecycle state (Static Only → Dynamic Only → Complete)
- Security findings with severity
- Tool usage patterns from dynamic sessions
- Correlation between static findings and runtime behavior

---

## Dynamic Analysis Setup

To capture runtime behavior, configure your agent's `base_url`:

```python
# OpenAI
from openai import OpenAI
client = OpenAI(base_url="http://localhost:4000/workflow/my-project")

# Anthropic
from anthropic import Anthropic
client = Anthropic(base_url="http://localhost:4000/workflow/my-project")
```

Use the **same workflow_id** for both static and dynamic analysis to get unified results.

---

## Troubleshooting

### "MCP server not found"
- Ensure Agent Inspector is running (the live trace dashboard starts on port 7100)
- Verify MCP endpoint: `curl -X POST http://localhost:7100/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`

### "Tools not available"
- Verify MCP connection with `/mcp` command (Claude Code)
- For Cursor: Restart Cursor after adding mcp.json and approve the server when prompted

### "Connection refused"
- Make sure the server is running: `curl http://localhost:4000/health`
- MCP endpoint is on port **7100** (dashboard), not 4000 (proxy)
- Check firewall settings

---

## File Locations

After installation, your project structure should look like:

```
your-agent-project/
├── .mcp.json                    # Claude Code MCP config
├── .cursor/
│   ├── mcp.json                 # Cursor MCP config
│   └── rules/
│       └── agent-inspector.mdc  # Cursor rules (recommended)
├── .claude/
│   └── skills/
│       ├── static-analysis.md   # Static analysis skill
│       ├── dynamic-analysis.md  # Dynamic analysis skill
│       └── auto-fix.md          # Auto-fix skill
└── ... your code
```

Global config (applies to all projects):
- Cursor: `~/.cursor/mcp.json`

---

## Ports Reference

| Service | Port | Purpose |
|---------|------|---------|
| Proxy Server | 4000 | Routes LLM API requests, workflow URLs |
| Dashboard + MCP | 7100 | Live trace UI, MCP endpoint at `/mcp` |

---

## Support

- Dashboard: http://localhost:7100 (or http://localhost:7100/workflow/{id})
- MCP Endpoint: http://localhost:7100/mcp
- Health Check: http://localhost:4000/health
- API Docs: http://localhost:4000/docs
