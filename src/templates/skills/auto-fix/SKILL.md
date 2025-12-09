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
- Agent Inspector server running (proxy on port 4000, MCP on port 7100)
- MCP connection configured to `http://localhost:7100/mcp`
- Existing finding ID or known vulnerability type

## Lifecycle Awareness

After fixing:
1. Update finding status to "FIXED"
2. Suggest re-running dynamic tests to validate the fix
3. Optionally re-run static analysis to confirm remediation

## Workflow

1. **Get Findings to Fix**
   Call `get_findings(workflow_id, status="OPEN")` to see what needs fixing.
   Prioritize by severity: CRITICAL > HIGH > MEDIUM > LOW.

2. **Get Fix Template**
   Call `get_fix_template(finding_type)` for remediation guidance.
   The template provides before/after patterns.

3. **Review Template**
   The MCP response includes:
   - before_pattern: Example of vulnerable code
   - after_pattern: Example of fixed code
   - application_guidance: Steps to apply
   - verification: Checklist to confirm fix

4. **Apply Fix**
   Follow the guidance, adapt to specific codebase context.

5. **Verify**
   Go through the verification checklist.

6. **Update Status**
   Call `update_finding_status`:
   - finding_id
   - status: "FIXED"
   - notes: Description of fix applied

7. **Recommend Validation**
   Suggest: "Run dynamic tests to validate this fix works at runtime."

## MCP Tools Reference

**Core Tools:**
- `get_findings` - Get findings to fix (workflow_id, status="OPEN")
- `get_fix_template` - Get remediation guidance (finding_type)
- `update_finding_status` - Mark as fixed (finding_id, status, notes)

**Validation Tools:**
- `get_workflow_state` - Check overall state
- `get_workflow_correlation` - See if fix is validated dynamically

## Example Flow

```
User: "Fix the security issues in my agent"

1. get_findings(workflow_id="my-agent", status="OPEN")
   → 3 findings: CRITICAL delete_without_confirm, HIGH pii_exposure, MEDIUM rate_limit

2. get_fix_template("EXCESSIVE_AGENCY")
   → before: delete_record(id), after: confirm_action() then delete_record(id)

3. Apply fix to code

4. update_finding_status(finding_id="find_abc", status="FIXED", notes="Added confirmation")

5. "Fix applied! Run dynamic tests to validate: agent-inspector openai"
```

## After Fixing

Recommend based on workflow state:
- **If dynamic data exists**: "Re-run your agent to validate the fix works"
- **If no dynamic data**: "Test your agent to confirm the fix"
- **Multiple findings**: "1 fixed, 2 remaining. Continue?"
