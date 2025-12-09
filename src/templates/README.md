# Agent Inspector Templates

Templates for integrating Agent Inspector with AI coding assistants.

## Contents

```
templates/
├── INSTALLATION.md          # Complete setup guide
├── README.md               # This file
├── skills/
│   ├── static-analysis/
│   │   └── SKILL.md        # Security scanning skill for Claude Code
│   ├── dynamic-analysis/
│   │   └── SKILL.md        # Runtime tracing skill for Claude Code
│   └── auto-fix/
│       └── SKILL.md        # Auto-fix skill for Claude Code
└── cursor-rules/
    ├── .cursorrules        # Rules file for Cursor
    └── agent-inspector.mdc # MDC format rules (alternative)
```

## Quick Start

### Claude Code

```bash
# 1. Start Agent Inspector server (includes live trace on port 7100)
uvicorn src.main:app --reload --port 4000

# 2. Add MCP server to Claude Code (MCP endpoint is on port 7100)
claude mcp add --transport http agent-inspector http://localhost:7100/mcp

# 3. (Optional) Copy skills to your project
mkdir -p .claude/skills
cp templates/skills/static-analysis/SKILL.md .claude/skills/
```

### Cursor

```bash
# 1. Start Agent Inspector server (includes live trace on port 7100)
uvicorn src.main:app --reload --port 4000

# 2. Create MCP config (MCP endpoint is on port 7100)
mkdir -p ~/.cursor
echo '{"mcpServers":{"agent-inspector":{"url":"http://localhost:7100/mcp"}}}' > ~/.cursor/mcp.json

# 3. Restart Cursor and approve the MCP server when prompted

# 4. (Optional) Copy rules to your project
mkdir -p .cursor/rules
cp templates/cursor-rules/agent-inspector.mdc .cursor/rules/
```

## Ports Reference

| Port | Service | Purpose |
|------|---------|---------|
| 4000 | Proxy Server | LLM API proxy, workflow URLs |
| 7100 | Dashboard | Live trace UI, MCP endpoint at `/mcp` |

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| `get_security_patterns` | OWASP LLM Top 10 patterns |
| `get_owasp_control` | Specific OWASP control details |
| `get_fix_template` | Remediation templates |
| `create_analysis_session` | Start analysis session |
| `store_finding` | Record security finding |
| `complete_analysis_session` | Finalize with risk score |
| `get_findings` | Retrieve findings |
| `update_finding_status` | Mark fixed/ignored |

## Unified Workflow ID

**Important:** Use the same `workflow_id` for both static and dynamic analysis to get unified results.

| Analysis Type | How to Set workflow_id |
|--------------|------------------------|
| Static Analysis | `create_analysis_session(workflow_id="my-agent")` |
| Dynamic Analysis | `base_url="http://localhost:4000/workflow/my-agent"` |

Both types appear unified in the dashboard at `http://localhost:4000/workflow/{workflow_id}`

## Documentation

- [Full Installation Guide](./INSTALLATION.md)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Claude Code Docs](https://code.claude.com/docs)
