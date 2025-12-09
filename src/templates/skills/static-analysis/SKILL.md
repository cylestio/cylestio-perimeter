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
- Agent Inspector running: `agent-inspector anthropic --use-local-storage`
- MCP connection to `http://localhost:8080/mcp`

## AUTOMATIC WORKFLOW

### 1. Setup Workflow
```
get_workflow_config()
```
- **If exists:** Use `workflow_id` from config
- **If not:** AUTO-CREATE `cylestio.yaml`:
  ```yaml
  workflow_id: {derived-from-folder-or-git}
  workflow_name: {Human Name}
  ```

### 2. Discover & Link Agents
```
get_workflow_state(workflow_id)
get_agents("unlinked")
```

If unlinked agents found:
```
update_agent_info(agent_id, workflow_id="the-workflow-id")
```

### 3. Get Security Patterns
```
get_security_patterns()
```
**NEVER hardcode patterns** - always fetch from MCP.

### 4. Run Analysis
```
create_analysis_session(workflow_id, "STATIC")
```

Analyze code for:
- Dangerous tool combinations
- Missing confirmations on destructive ops
- PII exposure in external calls
- Injection vulnerabilities
- Excessive permissions

### 5. Store Findings
```
store_finding(
  session_id=session_id,
  file_path="src/agent.py",
  finding_type="LLM08",
  severity="HIGH",
  title="Unconfirmed delete operation",
  description="delete_user called without confirmation",
  line_start=45,
  line_end=52
)
```

### 6. Complete Session
```
complete_analysis_session(session_id)
```

### 7. Correlate (if dynamic data exists)
Check state - if `COMPLETE` or `DYNAMIC_ONLY`:
```
get_workflow_correlation(workflow_id)
get_tool_usage_summary(workflow_id)
```

Report which findings are:
- **VALIDATED**: Tool was called during dynamic testing
- **UNEXERCISED**: Tool never called in tests

### 8. Name Agents
If agents exist, give them meaningful names based on code:
```
update_agent_info(
  agent_id="agent-xyz",
  display_name="Customer Support Bot",
  description="Handles booking and billing inquiries"
)
```

### 9. Report Results

```markdown
## Static Analysis Complete

**Workflow:** my-project
**Findings:** 8 (3 CRITICAL, 2 HIGH, 3 MEDIUM)

### Key Issues:
1. 🔴 CRITICAL: delete_user without confirmation (LLM08)
2. 🔴 CRITICAL: PII sent to external API (LLM06)
3. 🟡 HIGH: No rate limiting on tool calls (LLM08)

### Correlation with Dynamic Data:
| Finding | Runtime Status |
|---------|---------------|
| delete_user | ⚠️ VALIDATED (called 12 times) |
| send_external | ⚠️ VALIDATED (called 8 times) |
| bulk_update | ✅ UNEXERCISED |

**Dashboard:** http://localhost:8080/workflow/my-project

### Next Steps:
- Fix CRITICAL findings immediately
- Add test scenarios for UNEXERCISED tools
```

## MCP Tools Reference

| Tool | When to Use |
|------|-------------|
| `get_workflow_config` | First - check/create cylestio.yaml |
| `get_agents("unlinked")` | Find agents needing linking |
| `update_agent_info` | Link agents + give names |
| `get_workflow_state` | Check what analysis exists |
| `get_security_patterns` | Get patterns to check |
| `create_analysis_session` | Start scan |
| `store_finding` | Record each issue |
| `complete_analysis_session` | Finalize |
| `get_workflow_correlation` | Match static ↔ dynamic |
| `get_tool_usage_summary` | See runtime behavior |
