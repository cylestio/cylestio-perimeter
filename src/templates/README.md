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
│   └── auto-fix/
│       └── SKILL.md        # Auto-fix skill for Claude Code
└── cursor-rules/
    ├── .cursorrules        # Rules file for Cursor
    └── agent-inspector.mdc # MDC format rules (alternative)
```

## Quick Start

### Claude Code

```bash
# 1. Start Agent Inspector server
uvicorn src.main:app --reload --port 3000

# 2. Add MCP server to Claude Code
claude mcp add --transport http agent-inspector http://localhost:3000/mcp

# 3. (Optional) Copy skills to your project
mkdir -p .claude/skills
cp templates/skills/static-analysis/SKILL.md .claude/skills/
```

### Cursor

```bash
# 1. Start Agent Inspector server
uvicorn src.main:app --reload --port 3000

# 2. Copy rules to your project
cp templates/cursor-rules/.cursorrules .cursorrules
```

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

## Documentation

- [Full Installation Guide](./INSTALLATION.md)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Claude Code Docs](https://code.claude.com/docs)
