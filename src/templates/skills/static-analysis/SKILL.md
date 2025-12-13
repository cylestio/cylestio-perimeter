---
name: agent-inspector-static-analysis
description: Analyze AI agent code for security vulnerabilities using Agent Inspector MCP tools
---

# Static Security Analysis

## When to Activate
- User asks for "security scan" or "security review"
- User mentions "OWASP" or "vulnerability check"
- User wants to "check for security issues"
- After completing a new AI agent feature

## Prerequisites
- Agent Inspector running: `uvx cylestio-perimeter run --config path/to/config.yaml`
- MCP connection to `http://localhost:7100/mcp`

## Workflow

### 1. Derive agent_workflow_id
Auto-derive from (priority order):
1. Git remote: `github.com/org/my-agent.git` → `my-agent`
2. Package name: pyproject.toml or package.json
3. Folder name: `/projects/my-bot` → `my-bot`

**Do NOT ask user for agent_workflow_id - derive it automatically.**

### 2. Check Current State
```
get_agent_workflow_state(agent_workflow_id)
```

This tells you:
- `NO_DATA` → First analysis, proceed normally
- `STATIC_ONLY` → Previous static exists, inform about dynamic testing
- `DYNAMIC_ONLY` → Dynamic data exists! Run static, then correlate
- `COMPLETE` → Both exist, run correlation after analysis

### 3. Discover & Link Agents (if dynamic data exists)
If state is `DYNAMIC_ONLY` or `COMPLETE`:
```
get_agents("unlinked")
```
Link any unlinked agents:
```
update_agent_info(agent_id, agent_workflow_id="the-agent-workflow-id")
```

### 4. Get Security Patterns
```
get_security_patterns()
```
**NEVER hardcode patterns** - always fetch from MCP.

### 5. Create Analysis Session
```
create_analysis_session(agent_workflow_id, "STATIC", agent_workflow_name="My Project")
```

### 6. Analyze Code & Store Findings
For each issue found:
```
store_finding(
  session_id=session_id,
  file_path="src/agent.py",
  finding_type="LLM08",
  severity="HIGH",
  title="Unconfirmed delete operation",
  description="delete_user called without confirmation",
  line_start=45,
  line_end=52,
  code_snippet="..."
)
```

### 7. Complete Session
```
complete_analysis_session(session_id)
```

### 8. Correlate (if dynamic data exists)
If state was `DYNAMIC_ONLY` or `COMPLETE`:
```
get_agent_workflow_correlation(agent_workflow_id)
get_tool_usage_summary(agent_workflow_id)
```

Report which findings are:
- **VALIDATED**: Tool was called during dynamic testing
- **UNEXERCISED**: Tool never called - needs test coverage

### 9. Name Agents (optional)
If agents exist, give them meaningful names based on code analysis:
```
update_agent_info(
  agent_id="agent-xyz",
  display_name="Customer Support Bot",
  description="Handles booking and billing inquiries"
)
```

### 10. Report Results

```markdown
## Static Analysis Complete

**Agent Workflow:** my-project
**State:** {state}
**Findings:** X total (Y open)

### Key Issues:
1. 🔴 CRITICAL: {title} (LLM08)
2. 🟡 HIGH: {title} (LLM06)
...

### Correlation (if dynamic data exists):
| Finding | Runtime Status |
|---------|---------------|
| delete_user | ⚠️ VALIDATED (called 12x) |
| bulk_update | ✅ UNEXERCISED |

**Dashboard:** http://localhost:7100/agent-workflow/my-project

### Next Steps:
- Fix CRITICAL findings immediately
- (If STATIC_ONLY): Run agent through proxy to validate findings
- (If correlation shows UNEXERCISED): Add test scenarios for unused tools
```

## MCP Tools Reference

| Tool | When to Use |
|------|-------------|
| `get_agent_workflow_state` | First - check what data exists |
| `get_agents("unlinked")` | Find agents needing linking |
| `update_agent_info` | Link agents + give names |
| `get_security_patterns` | Get patterns to check |
| `create_analysis_session` | Start scan |
| `store_finding` | Record each issue |
| `complete_analysis_session` | Finalize |
| `get_agent_workflow_correlation` | Match static ↔ dynamic |
| `get_tool_usage_summary` | See runtime behavior |

## Setting Up Dynamic Analysis

After static analysis, if no dynamic data exists, tell user:

> To validate these findings with runtime behavior, configure your agent:
>
> ```python
> client = OpenAI(base_url="http://localhost:4000/agent-workflow/my-project")
> # or
> client = Anthropic(base_url="http://localhost:4000/agent-workflow/my-project")
> ```
>
> Then run your agent through test scenarios. View unified results at:
> http://localhost:7100/agent-workflow/my-project
