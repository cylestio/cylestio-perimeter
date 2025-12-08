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
# Add the MCP server
claude mcp add --transport http agent-inspector http://localhost:3000/mcp
```

### Option 2: Project Configuration (.mcp.json)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "agent-inspector": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
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

Cursor's MCP support varies by version. Check Cursor documentation for the latest MCP configuration method.

### Step 2: Install Rules Files

Copy the rules files to your project root:

```bash
# Copy .cursorrules
cp /path/to/cylestio-perimeter/src/templates/cursor-rules/.cursorrules \
   .cursorrules

# Or copy the MDC format (alternative)
cp /path/to/cylestio-perimeter/src/templates/cursor-rules/agent-inspector.mdc \
   .cursor/rules/agent-inspector.mdc
```

### Step 3: Configure MCP (if supported)

If Cursor supports MCP configuration, add to your settings:

```json
{
  "mcp": {
    "servers": {
      "agent-inspector": {
        "url": "http://localhost:3000/mcp"
      }
    }
  }
}
```

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
http://localhost:3000/workflow/{workflow_id}
```

---

## Troubleshooting

### "MCP server not found"
- Ensure Agent Inspector is running on port 3000
- Check the URL in your configuration

### "Tools not available"
- Verify MCP connection with `/mcp` command (Claude Code)
- Restart Claude Code after configuration changes

### "Connection refused"
- Make sure the server is running: `curl http://localhost:3000/health`
- Check firewall settings

---

## File Locations

After installation, your project structure should look like:

```
your-agent-project/
├── .mcp.json                    # Claude Code MCP config
├── .cursorrules                 # Cursor rules (optional)
├── .claude/
│   └── skills/
│       ├── static-analysis.md   # Static analysis skill
│       └── auto-fix.md          # Auto-fix skill
└── ... your code
```

---

## Support

- Dashboard: http://localhost:3000
- API Docs: http://localhost:3000/docs (when server is running)
