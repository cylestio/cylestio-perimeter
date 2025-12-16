# Recommendations

## What It Does

Recommendations are actionable security fixes generated from your static and dynamic analysis findings. Each recommendation has a unique ID (like `REC-001`) and tracks through a fix lifecycle with full audit trail.

## Why It Matters

Finding vulnerabilities is only half the battle. Recommendations help you:

- **Prioritize fixes** based on severity and correlation state
- **Track progress** through a structured fix workflow
- **Maintain audit trail** for compliance and accountability
- **Verify fixes** to ensure issues are properly resolved

## Recommendation Lifecycle

```
PENDING → FIXING → FIXED → VERIFIED
           ↘        ↘
         DISMISSED  IGNORED
```

| Status | Meaning |
|--------|---------|
| **PENDING** | Issue identified, fix not started |
| **FIXING** | Developer actively working on fix |
| **FIXED** | Fix implemented, awaiting verification |
| **VERIFIED** | Fix confirmed working |
| **DISMISSED** | Accepted as false positive |
| **IGNORED** | Risk accepted with documented reason |

## How to Fix Issues

### Option 1: /fix Command
In Cursor, type:
```
/fix REC-001
```

The AI will:
1. Look up the recommendation details
2. Navigate to the affected code
3. Implement a secure fix
4. Update the recommendation status
5. Log the fix in the audit trail

### Option 2: Manual Fix

1. Open the **Recommendations** page
2. Click on a recommendation to see details
3. Click "Copy Fix Command" for the `/fix` command
4. Or manually fix and click "Mark as Fixed"

### Option 3: Ask Naturally
Say to your AI assistant:
> "Fix the hardcoded API key issue in auth.py"

## Understanding Recommendations

Each recommendation includes:

### Core Information

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier (e.g., `REC-001`) |
| **Title** | Brief description of the issue |
| **Severity** | CRITICAL, HIGH, MEDIUM, LOW, INFO |
| **Category** | PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY_CHAIN, BEHAVIORAL |
| **Source** | STATIC (code scan) or DYNAMIC (runtime analysis) |

### Context

| Field | Description |
|-------|-------------|
| **Location** | File path and line numbers |
| **Code Snippet** | Relevant code excerpt |
| **Impact** | What could happen if exploited |
| **Fix Hints** | Suggested approach to remediation |
| **Fix Complexity** | Estimated effort (LOW, MEDIUM, HIGH) |

### Framework Mappings

| Framework | Purpose |
|-----------|---------|
| **OWASP LLM Top 10** | AI-specific vulnerability classification |
| **CWE** | Industry-standard weakness identifier |
| **SOC2** | Compliance control mapping |

## Filtering & Prioritization

### By Severity
Focus on what matters most:
- Filter to CRITICAL + HIGH for immediate action
- Review MEDIUM before production deployment
- Address LOW + INFO for continuous improvement

### By Source
- **STATIC**: Code-level vulnerabilities
- **DYNAMIC**: Runtime behavior issues

### By Status
- **PENDING**: What needs attention
- **FIXING**: What's in progress
- **FIXED**: What's awaiting verification

### By Category
Focus on specific security domains:
- PROMPT: Input handling issues
- TOOL: Tool permission issues
- DATA: Data protection issues

### Blocking Only
Toggle to show only recommendations blocking production deployment (CRITICAL/HIGH severity, PENDING/FIXING status).

## Dismissing Recommendations

Sometimes findings are false positives or risks you've decided to accept.

### How to Dismiss

1. Click the recommendation
2. Click "Dismiss" button
3. Choose dismiss type:
   - **DISMISSED**: False positive
   - **IGNORED**: Accepted risk
4. Provide a reason (required)
5. Confirm

### Dismiss vs Ignore

| Action | When to Use | Appears in Reports |
|--------|-------------|-------------------|
| **DISMISSED** | False positive, not a real issue | As "false positive" |
| **IGNORED** | Real risk, accepted with justification | As "accepted risk" |

### Audit Trail

All dismissals are logged with:
- Who dismissed
- When dismissed
- Reason provided
- Original finding details

## Progress Tracking

### Summary Cards

The Recommendations page shows:
- **Total**: All recommendations
- **Pending**: Awaiting fix
- **Fixing**: In progress
- **Fixed**: Completed
- **Blocking**: Issues blocking production

### Production Gate

CRITICAL and HIGH severity recommendations block the production gate. The gate opens when:
- All CRITICAL issues are FIXED, VERIFIED, DISMISSED, or IGNORED
- All HIGH issues are FIXED, VERIFIED, DISMISSED, or IGNORED

## Best Practice Workflow

1. **Review new recommendations**
   Check the Recommendations page regularly for new issues.

2. **Prioritize by severity and correlation**
   - VALIDATED + CRITICAL: Fix immediately
   - VALIDATED + HIGH: Fix before production
   - UNEXERCISED: Consider test coverage gaps

3. **Fix with AI assistance**
   ```
   /fix REC-001
   ```
   Let the AI implement secure patterns.

4. **Verify fixes**
   - Re-run static scan
   - Test the affected functionality
   - Update status to VERIFIED

5. **Document dismissals**
   For false positives or accepted risks, always provide clear justification.

6. **Check gate status**
   ```
   /gate
   ```
   Ensure no blocking issues before deployment.

## Common Questions

**Q: How are recommendations created?**

A: Automatically from findings. When static or dynamic analysis finds an issue, a linked recommendation is created. Fixing the recommendation resolves the finding.

**Q: Can I create custom recommendations?**

A: Currently, recommendations are auto-generated from analysis. For custom security tasks, use your normal issue tracking system.

**Q: What happens when I dismiss?**

A: The recommendation moves to DISMISSED/IGNORED status, the linked finding is marked RESOLVED, and an audit entry is created. It won't block the production gate.

**Q: Can I un-dismiss a recommendation?**

A: Yes, dismissed recommendations can be reopened if the situation changes. The audit trail preserves the history.

**Q: How do recommendations relate to findings?**

A: 1:1 relationship. Each finding creates one recommendation. Fixing the recommendation resolves the finding. They share severity and category.
