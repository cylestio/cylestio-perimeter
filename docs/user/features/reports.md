# Reports

## What It Does

Reports generate comprehensive security assessments of your AI agent, combining static analysis, dynamic analysis, correlation results, and remediation progress into professional documents suitable for stakeholders, compliance teams, and customer due diligence.

## Report Types

### Security Assessment Report

**Audience**: Security teams, developers, auditors

**Contents**:
- Executive summary with GO/NO-GO decision
- Risk score with breakdown
- OWASP LLM Top 10 coverage
- SOC2 compliance status
- All findings with full details
- Remediation progress
- Audit trail

**Use for**: Regular security reviews, audit preparation, incident response documentation.

### Executive Summary

**Audience**: Leadership, stakeholders, non-technical reviewers

**Contents**:
- High-level risk assessment
- GO/NO-GO deployment recommendation
- Business impact analysis
- Key metrics and trends
- Blocking issues summary
- Compliance status overview

**Use for**: Board reports, executive briefings, investment due diligence.

### Customer Due Diligence (DD)

**Audience**: Potential customers, partners, enterprise procurement

**Contents**:
- Security posture overview
- Compliance certifications progress
- Risk management approach
- Incident response capabilities
- Third-party assessment summary
- Security roadmap

**Use for**: Sales enablement, RFP responses, customer security questionnaires.

## How to Generate Reports

### Option 1: Via the UI

1. Open the **Reports** page in Agent Inspector
2. Select the report type
3. Click "Generate Report"
4. Preview the report
5. Export as HTML or Markdown

### Option 2: /report Command
In Cursor, type:
```
/report
```

The AI will:
1. Gather all analysis data
2. Generate a comprehensive report
3. Provide the formatted output
4. Offer export options

### Option 3: Ask Naturally
Say to your AI assistant:
> "Generate a security report for my agent"
> "Create an executive summary for the board"

## Report Sections

### Executive Summary

Every report includes:

| Field | Description |
|-------|-------------|
| **Gate Status** | OPEN (safe to deploy) or BLOCKED |
| **Risk Score** | 0-100 calculated from findings |
| **Decision** | GO or NO-GO recommendation |
| **Finding Counts** | Total, open, fixed, dismissed |
| **Blocking Count** | Issues preventing deployment |

### Business Impact Assessment

For executive and DD reports:

| Category | Risk Level | Description |
|----------|------------|-------------|
| Remote Code Execution | HIGH/MEDIUM/LOW/NONE | Risk of arbitrary code execution |
| Data Exfiltration | HIGH/MEDIUM/LOW/NONE | Risk of unauthorized data access |
| Privilege Escalation | HIGH/MEDIUM/LOW/NONE | Risk of gaining elevated permissions |
| Supply Chain | HIGH/MEDIUM/LOW/NONE | Risk from dependencies |
| Compliance Violation | HIGH/MEDIUM/LOW/NONE | Risk of regulatory issues |

### OWASP LLM Top 10 Coverage

| Control | Status | Findings |
|---------|--------|----------|
| LLM01: Prompt Injection | PASS/FAIL/WARNING | Count |
| LLM02: Insecure Output | PASS/FAIL/WARNING | Count |
| LLM03: Training Data Poisoning | PASS/FAIL/N/A | Count |
| ... | ... | ... |

### SOC2 Compliance

| Control | Status | Notes |
|---------|--------|-------|
| CC6.1: Logical Access | COMPLIANT/NON-COMPLIANT | Details |
| CC6.6: System Operations | COMPLIANT/NON-COMPLIANT | Details |
| ... | ... | ... |

### Security Checks Summary

Status of each security category:
- PROMPT checks: PASS/FAIL
- OUTPUT checks: PASS/FAIL
- TOOL checks: PASS/FAIL
- DATA checks: PASS/FAIL
- MEMORY checks: PASS/FAIL
- SUPPLY_CHAIN checks: PASS/FAIL
- BEHAVIORAL checks: PASS/FAIL

### Remediation Summary

| Status | Count |
|--------|-------|
| Pending | X |
| Fixing | X |
| Fixed | X |
| Verified | X |
| Dismissed | X |
| Total Resolved | X |

### Blocking Items

Detailed list of all CRITICAL/HIGH issues blocking deployment:
- Issue description
- Affected component
- Recommended fix
- Business impact

### Audit Trail

Complete history of:
- Security scans performed
- Findings discovered
- Fixes applied
- Dismissals and reasons
- Verifications completed

## Export Formats

### HTML Export

Professional styled document suitable for:
- Sharing via email
- Printing for meetings
- Archiving for compliance

### Markdown Export

Plain text format suitable for:
- Version control
- Wiki/documentation systems
- Further editing

## Report History

All generated reports are saved and accessible from:
- Reports page history section
- API for integration with other systems

Each saved report captures:
- Point-in-time snapshot
- Full report data
- Generation timestamp
- Who generated it

## Best Practice Workflow

1. **Run complete analysis first**
   ```
   /scan
   /analyze
   /correlate
   ```

2. **Address blocking issues**
   ```
   /fix REC-001
   ```

3. **Generate appropriate report type**
   - Security Assessment for audits
   - Executive Summary for leadership
   - Customer DD for sales

4. **Review before sharing**
   Preview the report and ensure accuracy.

5. **Export and distribute**
   HTML for formal sharing, Markdown for collaboration.

6. **Archive for compliance**
   Save reports with timestamps for audit trail.

## Common Questions

**Q: How often should I generate reports?**

A: Generate reports:
- Before production deployments (gate check)
- Monthly for ongoing monitoring
- On-demand for audits or customer requests
- After significant changes

**Q: What determines GO vs NO-GO?**

A: The decision is based on:
- No CRITICAL issues in PENDING/FIXING status
- No HIGH issues in PENDING/FIXING status
- Risk score within acceptable threshold

**Q: Can I customize report content?**

A: Report types have fixed sections optimized for their audience. For custom reports, export Markdown and edit as needed.

**Q: How is risk score calculated?**

A: Risk score (0-100) is calculated from:
- Finding severities (weighted)
- Finding counts
- Correlation states (VALIDATED issues weigh more)
- Remediation progress

**Q: Are reports saved automatically?**

A: Reports are saved when you click "Save Report" or generate via API with `save=true`. Preview generation doesn't save.

**Q: Can I share reports externally?**

A: Yes, HTML exports are self-contained and can be shared. Consider redacting sensitive details for external audiences.
