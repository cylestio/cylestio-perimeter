---
name: agent-inspector-auto-fix
description: Apply security fixes to AI agent code using Agent Inspector MCP tools
---

# Security Auto-Fix

## When to Activate
- User types `/fix REC-XXX` (e.g., `/fix REC-001`)
- User types `/fix` (to fix the next recommendation)
- User asks to "fix this security issue"
- User wants to "remediate this finding"
- User clicks "Fix with Cursor" in the UI and copies the command
- After static analysis reveals findings

## Prerequisites
- Agent Inspector running (MCP on port 7100)
- MCP connection to `http://localhost:7100/mcp`
- Existing recommendation ID (REC-XXX) or finding to fix

## /fix Command

When user types `/fix REC-XXX` or `/fix`:

### If specific recommendation: `/fix REC-001`
1. Get the recommendation details
2. Read the affected file(s)
3. Understand the context and vulnerability
4. Apply an intelligent, contextual fix
5. Mark as fixed in the system
6. Report what was done

### If no ID: `/fix`
1. Get all open recommendations
2. Pick the highest priority one (CRITICAL > HIGH > MEDIUM > LOW)
3. Follow the fix flow above

## The Fix Workflow (Detailed)

### 1. Get Recommendation Details
```
get_recommendation_detail(recommendation_id="REC-001")
```
This returns:
- Finding details (file, line numbers, code snippet)
- Severity and category
- Fix hints and guidance
- OWASP/CWE mappings

### 2. Start the Fix
```
start_fix(recommendation_id="REC-001")
```
This marks the recommendation as "FIXING" in the system.

### 3. Read and Understand the Code
Read the affected file(s) and understand:
- What the vulnerability is
- Why it's a security issue
- The context around the code
- Related code that might be affected

### 4. Get Fix Template (if available)
```
get_fix_template(finding_type)
```
The template provides:
- `before_pattern`: Example of vulnerable code
- `after_pattern`: Example of fixed code
- `application_guidance`: Steps to apply
- `verification`: Checklist to confirm fix

**NEVER blindly apply templates** - adapt to the specific codebase context.

### 5. Apply Intelligent Fix
As an AI, you can:
- Understand the INTENT of the fix template
- Adapt it to the specific code style
- Handle edge cases the template doesn't cover
- Make the fix idiomatic for the language/framework

### 6. Complete the Fix
```
complete_fix(
  recommendation_id="REC-001",
  fix_notes="Sanitized user input before including in system prompt using html.escape()",
  files_modified=["src/agent.py"],
  fix_method="AI_ASSISTED"
)
```

### 7. Report Result
```markdown
✅ **Fixed REC-001: Prompt Injection Vulnerability**

**Category:** PROMPT Security (LLM01)
**File:** src/agent.py (lines 42-45)

**What I did:**
- Added input sanitization before prompt interpolation
- Used `html.escape()` to neutralize special characters
- Added length limit to prevent token exhaustion

**Verification:**
- [ ] Re-run `/scan` to confirm fix
- [ ] Test with malicious input

**Next recommendation:** REC-002 (HIGH severity)
Run `/fix REC-002` to continue.
```

## Prioritization Matrix

| Severity | Correlation | Priority | Action |
|----------|-------------|----------|--------|
| CRITICAL | VALIDATED | 🔴 Immediate | Fix NOW - actively exploitable |
| CRITICAL | UNEXERCISED | 🟠 High | Fix soon - potential risk |
| HIGH | VALIDATED | 🟠 High | Fix soon - confirmed at runtime |
| HIGH | UNEXERCISED | 🟡 Medium | Schedule fix |
| MEDIUM/LOW | Any | 🟢 Normal | Fix when convenient |

## Example Flow

```
User: "/fix REC-001"

1. Get recommendation details
   → REC-001: Prompt injection in agent.py:42
   → Category: PROMPT, Severity: CRITICAL
   → Code: system_prompt = f"You are... {user_input}"

2. start_fix(recommendation_id="REC-001")
   → Status changed to FIXING

3. Read src/agent.py and understand context
   → User input comes from web form
   → System prompt is constructed with f-string

4. get_fix_template("PROMPT_INJECTION")
   → Guidance: Sanitize input, use parameterized templates

5. Apply fix:
   - Import html.escape
   - Add: sanitized_input = html.escape(user_input)[:1000]
   - Update: system_prompt = f"You are... {sanitized_input}"

6. complete_fix(
     recommendation_id="REC-001",
     fix_notes="Added html.escape and length limit",
     files_modified=["src/agent.py"]
   )

7. Report: "Fixed! Added input sanitization. Run /scan to verify."
```

## MCP Tools Reference

**Core Tools:**
| Tool | Purpose |
|------|---------|
| `get_recommendation_detail` | Get full details for a recommendation |
| `start_fix` | Mark recommendation as being fixed |
| `complete_fix` | Mark recommendation as fixed with notes |
| `get_fix_template` | Get remediation guidance |

**Discovery Tools:**
| Tool | Purpose |
|------|---------|
| `get_findings` | Get findings (filter by status="OPEN") |
| `get_recommendations` | Get recommendations to fix |
| `get_agent_workflow_state` | Check what data exists |
| `get_agent_workflow_correlation` | See if finding was validated at runtime |

## Recommendation Lifecycle

```
PENDING → FIXING → FIXED → VERIFIED
              ↓
         DISMISSED/IGNORED
```

- **PENDING**: Not yet addressed
- **FIXING**: Currently being worked on
- **FIXED**: Fix applied, awaiting verification
- **VERIFIED**: Fix confirmed working
- **DISMISSED**: Risk accepted with reason
- **IGNORED**: False positive, won't fix

## After Fixing

1. **Re-scan**: Run `/scan` to verify the fix
2. **Test**: Run the agent to confirm it works
3. **Continue**: Run `/fix` for next recommendation
4. **View results**: Check dashboard at `http://localhost:7100/agent-workflow/{id}/static-analysis`

**Gate opens when all CRITICAL and HIGH findings are fixed!**
