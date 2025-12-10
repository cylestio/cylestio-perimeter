---
name: agent-inspector-auto-fix
description: Apply security fixes to AI agent code using Agent Inspector MCP tools
---

# Security Auto-Fix

## When to Activate
- User asks to "fix this security issue"
- User wants to "remediate this finding"
- User asks "how do I fix this OWASP issue?"
- User says "apply the security fix"
- After static analysis reveals findings

## Prerequisites
- Agent Inspector running (MCP on port 7100)
- MCP connection to `http://localhost:7100/mcp`
- Existing finding ID or known vulnerability type

## Workflow

### 1. Get Findings to Fix
```
get_findings(workflow_id, status="OPEN")
```
Prioritize by severity: CRITICAL > HIGH > MEDIUM > LOW.

### 2. Check Correlation (if dynamic data exists)
```
get_workflow_state(workflow_id)
```
If `COMPLETE`, check correlation:
```
get_workflow_correlation(workflow_id)
```
Prioritize **VALIDATED** findings (tools actively used at runtime) over **UNEXERCISED** ones.

### 3. Get Fix Template
```
get_fix_template(finding_type)
```
**NEVER use hardcoded fix patterns** - always fetch from MCP.

The template provides:
- `before_pattern`: Example of vulnerable code
- `after_pattern`: Example of fixed code
- `application_guidance`: Steps to apply
- `verification`: Checklist to confirm fix

### 4. Apply Fix
Follow the guidance from the MCP response.
Adapt the pattern to the specific codebase context.

### 5. Verify
Go through the verification checklist from the template.

### 6. Update Status
```
update_finding_status(finding_id, "FIXED", notes="Applied input validation")
```

### 7. Recommend Validation
Based on workflow state:
- **If dynamic data exists**: "Re-run your agent through the proxy to validate the fix works at runtime."
- **If no dynamic data**: "Test your agent to confirm the fix."
- **Multiple findings remaining**: "1 fixed, 2 remaining. Continue?"

## Example Flow

```
User: "Fix the security issues in my agent"

1. get_workflow_state(workflow_id="my-agent")
   → state: COMPLETE

2. get_findings(workflow_id="my-agent", status="OPEN")
   → 3 findings: CRITICAL delete_without_confirm, HIGH pii_exposure, MEDIUM rate_limit

3. get_workflow_correlation(workflow_id="my-agent")
   → delete_without_confirm: VALIDATED (called 12x)
   → pii_exposure: VALIDATED (called 8x)
   → rate_limit: UNEXERCISED

4. get_fix_template("EXCESSIVE_AGENCY")
   → before: delete_record(id)
   → after: confirm_action() then delete_record(id)

5. Apply fix to code

6. update_finding_status(finding_id="find_abc", status="FIXED", notes="Added confirmation dialog")

7. "Fix applied! The delete_user tool was called 12 times during testing - re-run your agent to validate the fix works."
```

## MCP Tools Reference

**Core Tools:**
| Tool | Purpose |
|------|---------|
| `get_findings` | Get findings to fix (filter: workflow_id, status="OPEN") |
| `get_fix_template` | Get remediation guidance (finding_type) |
| `update_finding_status` | Mark as FIXED (finding_id, status, notes) |

**Context Tools:**
| Tool | Purpose |
|------|---------|
| `get_workflow_state` | Check what data exists |
| `get_workflow_correlation` | See if finding was validated at runtime |

## Prioritization Matrix

| Severity | Correlation | Priority |
|----------|-------------|----------|
| CRITICAL | VALIDATED | 🔴 Immediate - actively exploitable |
| CRITICAL | UNEXERCISED | 🟠 High - potential risk |
| HIGH | VALIDATED | 🟠 High - confirmed at runtime |
| HIGH | UNEXERCISED | 🟡 Medium |
| MEDIUM/LOW | Any | 🟢 Normal |

## After Fixing

Recommend next steps based on state:
- **STATIC_ONLY**: "Test your agent to validate fixes"
- **COMPLETE**: "Re-run dynamic tests to confirm fixes work at runtime"
- **Multiple findings**: "X fixed, Y remaining. Continue with next highest priority?"
