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

## Prerequisites
- Agent Inspector server running (proxy on port 3000, MCP on port 8080)
- MCP connection configured to `http://localhost:8080/mcp`
- Existing finding ID or known vulnerability type

**Works with:** Findings from both static analysis (code review) and dynamic analysis (runtime tracing) when they share the same workflow_id.

## Workflow

1. **Get Fix Template**
   Call `get_fix_template` MCP tool with the finding_type.
   The template provides before/after patterns and guidance.
   DO NOT use hardcoded fix patterns - always fetch from MCP.

2. **Review Template**
   The MCP response includes:
   - before_pattern: Example of vulnerable code
   - after_pattern: Example of fixed code
   - application_guidance: Steps to apply
   - verification: Checklist to confirm fix

3. **Apply Fix**
   Follow the guidance from the MCP response.
   Adapt the pattern to the specific codebase context.

4. **Verify**
   Go through the verification checklist from the MCP response.

5. **Update Status**
   If fixing a tracked finding, call `update_finding_status`:
   - finding_id
   - status: "FIXED"
   - notes: Description of fix applied

## MCP Tools Reference

**Core Workflow Tools:**
- `get_fix_template` - Get remediation guidance (finding_type)
- `update_finding_status` - Mark finding as fixed (finding_id, status, notes)

**Additional Tools:**
- `get_findings` - Retrieve findings to fix (workflow_id, session_id, severity, status)
