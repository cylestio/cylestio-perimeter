# Agent Inspector Templates

Integration templates for AI coding assistants (Claude Code & Cursor).

## Quick Start

### 1. Start Agent Inspector

```bash
uvx cylestio-perimeter run --config path/to/config.yaml
```

**Default ports:**
- Proxy: `http://localhost:4000` (point your agent here)
- Dashboard/MCP: `http://localhost:7100`

### 2. Connect Your IDE

#### Claude Code

```bash
claude mcp add --transport http agent-inspector http://localhost:7100/mcp
```

#### Cursor

Create `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "agent-inspector": {
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

Then restart Cursor and approve the MCP server when prompted.

### 3. Verify

- **Claude Code:** Run `/mcp` - should show 13 tools
- **Cursor:** Ask "What MCP tools are available?"

---

## Available MCP Tools (13)

| Tool | Purpose |
|------|---------|
| `get_security_patterns` | OWASP LLM Top 10 patterns |
| `create_analysis_session` | Start analysis session |
| `store_finding` | Record security finding |
| `complete_analysis_session` | Finalize with risk score |
| `get_findings` | Retrieve findings |
| `update_finding_status` | Mark FIXED/IGNORED |
| `get_owasp_control` | OWASP control details |
| `get_fix_template` | Remediation templates |
| `get_workflow_state` | Check static/dynamic data exists |
| `get_tool_usage_summary` | Runtime tool usage patterns |
| `get_workflow_correlation` | Correlate static ↔ dynamic |
| `get_agents` | List agents |
| `update_agent_info` | Link/name agents |

---

## Usage

### Run a Security Scan

Ask your AI assistant:
> "Run a security scan on this codebase"

### Test Your Agent (Dynamic Analysis)

Configure your agent to use the proxy:

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:4000/workflow/my-project")

# or Anthropic
from anthropic import Anthropic
client = Anthropic(base_url="http://localhost:4000/workflow/my-project")
```

### View Results

Open the dashboard: `http://localhost:7100/workflow/{workflow_id}`

---

## Optional: Install Rules/Skills

### Cursor Rules

```bash
mkdir -p .cursor/rules
cp templates/cursor-rules/agent-inspector.mdc .cursor/rules/
```

### Claude Code Skills

```bash
mkdir -p .claude/skills
cp templates/skills/static-analysis/SKILL.md .claude/skills/
cp templates/skills/dynamic-analysis/SKILL.md .claude/skills/
cp templates/skills/auto-fix/SKILL.md .claude/skills/
```

---

## Templates Directory

```
templates/
├── README.md                    # This file (human guide)
├── AGENT_INSPECTOR_SETUP.md     # AI agent setup instructions
├── skills/                      # Claude Code skills
│   ├── static-analysis/SKILL.md
│   ├── dynamic-analysis/SKILL.md
│   └── auto-fix/SKILL.md
└── cursor-rules/                # Cursor rules
    ├── .cursorrules
    └── agent-inspector.mdc
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP server not found | Ensure server is running on port 7100 |
| Connection refused | Check `curl http://localhost:4000/health` |
| Tools not showing | Restart IDE after adding mcp.json |

---

## Ports Reference

| Port | Service |
|------|---------|
| 4000 | Proxy (LLM API routing) |
| 7100 | Dashboard + MCP endpoint |
