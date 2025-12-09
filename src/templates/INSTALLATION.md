# Agent Inspector Integration Guide

This guide explains how to integrate Agent Inspector's security analysis tools with your AI coding assistant (Claude Code or Cursor).

## Overview

Agent Inspector provides MCP (Model Context Protocol) tools that enable AI assistants to:
- Scan code for OWASP LLM Top 10 vulnerabilities
- Store and track security findings
- Get remediation templates for fixing issues

## Prerequisites

1. **Agent Inspector server running**
   ```bash
   # From the cylestio-perimeter project
   uvicorn src.main:app --reload --port 3000
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

You should see `agent-inspector` listed with 8 available tools.

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

The AI assistant should now have access to 8 MCP tools. Test by asking:
> "What OWASP security patterns should I check for?"

---

## Available MCP Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_security_patterns` | Get OWASP LLM security patterns | Start of analysis |
| `get_owasp_control` | Get details for specific control | Deep dive on LLM01 |
| `get_fix_template` | Get remediation template | When fixing issues |
| `create_analysis_session` | Start analysis session | Before scanning |
| `store_finding` | Record a security finding | When issue found |
| `complete_analysis_session` | Finalize and get risk score | End of analysis |
| `get_findings` | Retrieve stored findings | Review results |
| `update_finding_status` | Mark finding as fixed/ignored | After remediation |

---

## Usage Examples

### Security Scan

Ask Claude/Cursor:
> "Run a security scan on this codebase"

The AI will:
1. Call `get_security_patterns` to get OWASP patterns
2. Call `create_analysis_session` with your `workflow_id` (project identifier)
3. Analyze code and call `store_finding` for each issue found
4. Call `complete_analysis_session` to get risk score

### Fix a Finding

Ask Claude/Cursor:
> "Fix the prompt injection vulnerability in api.py"

The AI will:
1. Call `get_fix_template` for remediation guidance
2. Apply the fix to your code
3. Call `update_finding_status` to mark as fixed

### View Dashboard

After analysis, view results at:
```
http://localhost:8080
```
Or directly at a workflow:
```
http://localhost:3000/workflow/{workflow_id}
```

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

After installation, your project structure should look like:

```
your-agent-project/
├── .mcp.json                    # Claude Code MCP config
├── .cursor/
│   ├── mcp.json                 # Cursor MCP config
│   └── rules/
│       └── agent-inspector.mdc  # Cursor rules
├── .claude/
│   └── skills/
│       ├── static-analysis.md   # Static analysis skill
│       └── auto-fix.md          # Auto-fix skill
└── ... your code
```

Global config (applies to all projects):
- Cursor: `~/.cursor/mcp.json`

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
