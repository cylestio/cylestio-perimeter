# Secure Agent Lifecycle Guide

## Overview

The Secure Agent Lifecycle is a comprehensive security framework for AI agents. It provides continuous security assessment from development through production, ensuring your agents are safe to deploy and operate.

## The Lifecycle Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURE AGENT LIFECYCLE                          │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│   DEV    │  STATIC  │ DYNAMIC  │ CORRELATE│  GATE    │ PRODUCTION  │
│  ○       │    ○     │    ○     │    ○     │    ○     │     ○       │
│ Develop  │  Scan    │ Analyze  │  Link    │  Check   │   Deploy    │
│ your     │  code    │ runtime  │ findings │  status  │   safely    │
│ agent    │  first   │ behavior │ together │  before  │             │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────────┘
```

### 1. DEV - Development

Write your AI agent code with security in mind.

**What happens**:
- Agent code is written
- Tools and prompts are configured
- Business logic is implemented

**Best practices**:
- Follow secure coding guidelines
- Use structured prompts (not string concatenation)
- Define tool constraints early
- Handle sensitive data carefully

### 2. STATIC - Static Analysis

Scan your codebase for vulnerabilities before running.

**What happens**:
- AI-powered code analysis
- 7 security categories checked
- Findings generated with recommendations

**Command**: `/scan`

**Key outputs**:
- Security findings by category
- Severity ratings (CRITICAL → INFO)
- OWASP LLM Top 10 mappings
- Actionable recommendations

[Learn more →](features/static-analysis.md)

### 3. DYNAMIC - Dynamic Analysis

Analyze actual runtime behavior from captured sessions.

**What happens**:
- Sessions captured via proxy
- Behavioral analysis performed
- Runtime issues identified

**Command**: `/analyze`

**Key outputs**:
- Tool usage patterns
- Behavioral anomalies
- Data flow issues
- Runtime-specific findings

[Learn more →](features/dynamic-analysis.md)

### 4. CORRELATE - Correlation

Connect static and dynamic findings to prioritize effectively.

**What happens**:
- Static findings matched with runtime evidence
- Correlation states assigned
- True risks distinguished from theoretical issues

**Command**: `/correlate`

**Correlation states**:
| State | Meaning | Priority |
|-------|---------|----------|
| 🔴 VALIDATED | Code issue + triggered at runtime | Fix first! |
| 📋 UNEXERCISED | Code issue, never triggered | Test gap |
| 🔵 RUNTIME_ONLY | Runtime issue, no code finding | Investigate |
| 📚 THEORETICAL | Code issue, safe at runtime | Lower priority |

[Learn more →](features/correlation.md)

### 5. GATE - Production Gate

Check if your agent is safe to deploy.

**What happens**:
- All findings evaluated
- Blocking issues identified
- GO/NO-GO decision made

**Command**: `/gate`

**Gate status**:
- **OPEN** ✅: Safe to deploy (no blocking CRITICAL/HIGH issues)
- **BLOCKED** 🚫: Fix blocking issues before deployment

### 6. PRODUCTION - Deployment

Deploy your agent with confidence.

**What happens**:
- Agent deployed to production
- Continuous monitoring continues
- New issues trigger alerts

## Quick Start Workflow

### First-Time Setup

1. **Install the cursor rules**
   Copy `.cursor/rules/agent-inspector.mdc` to your project.

2. **Start the Agent Inspector server**
   ```bash
   python -m src.interceptors.live_trace
   ```

3. **Open the dashboard**
   Navigate to `http://localhost:7100`

### Daily Security Workflow

```bash
# 1. Scan your code
/scan

# 2. Fix any critical issues
/fix REC-001

# 3. Run your agent to generate sessions
# (Use the proxy URL for your agent)

# 4. Analyze runtime behavior
/analyze

# 5. Correlate findings
/correlate

# 6. Check production gate
/gate

# 7. Generate report (optional)
/report
```

## The Two-Actor Model

The Secure Agent Lifecycle uses a two-actor model:

### AI Coding Agent (You + Cursor)

**Role**: Performs security analysis and fixes

**Responsibilities**:
- Runs `/scan` command (uses AI credits)
- Analyzes code semantically
- Implements fixes via `/fix`
- Updates recommendation statuses

**Where it runs**: Your IDE (Cursor)

### Agent Inspector Server

**Role**: Stores data and provides UI

**Responsibilities**:
- Captures runtime sessions
- Stores findings and recommendations
- Provides dashboard UI
- Generates compliance reports

**Where it runs**: Locally (`localhost:7100`)

## Key Concepts

### Findings

A security issue discovered by analysis.

**Properties**:
- **Severity**: CRITICAL, HIGH, MEDIUM, LOW, INFO
- **Category**: PROMPT, OUTPUT, TOOL, DATA, MEMORY, SUPPLY_CHAIN, BEHAVIORAL
- **Source**: STATIC (code) or DYNAMIC (runtime)
- **Status**: OPEN, FIXED, RESOLVED

### Recommendations

An actionable fix for a finding.

**Properties**:
- **ID**: Unique identifier (e.g., `REC-001`)
- **Status**: PENDING, FIXING, FIXED, VERIFIED, DISMISSED, IGNORED
- **Blocking**: Whether it blocks production gate

[Learn more →](features/recommendations.md)

### Reports

Comprehensive security assessments for different audiences.

**Types**:
- Security Assessment (technical)
- Executive Summary (leadership)
- Customer Due Diligence (sales)

[Learn more →](features/reports.md)

## Command Reference

| Command | Purpose | Stage |
|---------|---------|-------|
| `/scan` | Run static analysis | STATIC |
| `/fix REC-XXX` | Fix a recommendation | STATIC/DYNAMIC |
| `/analyze` | Run dynamic analysis | DYNAMIC |
| `/correlate` | Link static ↔ dynamic | CORRELATE |
| `/gate` | Check production status | GATE |
| `/report` | Generate compliance report | ALL |

## Dashboard Pages

### Overview

- Lifecycle progress indicator
- Production gate status
- Key metrics
- Recent activity

### Static Analysis

- 7 security check categories
- Recent scans history
- Correlation summary
- Finding details

### Dynamic Analysis

- Analysis status
- Per-agent results
- Session history
- Behavioral insights

### Recommendations

- All recommendations
- Filter by severity/status/category
- Fix workflow actions
- Progress tracking

### Reports

- Generate reports
- Export options
- Report history
- Compliance evidence

## Integration with CI/CD

### Pre-Commit Hook

Run static analysis before commits:
```bash
# In .pre-commit-config.yaml
- repo: local
  hooks:
    - id: agent-security-scan
      name: Agent Security Scan
      entry: python -c "print('Run /scan in Cursor')"
      language: system
```

### Pre-Deployment Check

Check gate status before deployment:
```bash
# In your CI/CD pipeline
curl http://localhost:7100/api/workflow/{id}/gate-status | jq '.is_blocked'
```

### Compliance Reports

Generate reports for audit trail:
```bash
curl "http://localhost:7100/api/workflow/{id}/compliance-report?report_type=security_assessment&save=true"
```

## Troubleshooting

### "No findings found"

- Ensure you've run `/scan` first
- Check the workflow ID matches your agent
- Verify the Agent Inspector server is running

### "Gate is blocked but I fixed the issues"

- Re-run `/scan` to update findings
- Check recommendation statuses are FIXED or VERIFIED
- Ensure no CRITICAL/HIGH issues in PENDING/FIXING status

### "Correlation shows no results"

- Run both static (`/scan`) and dynamic (`/analyze`) analysis first
- Ensure runtime sessions exist (run your agent through the proxy)
- Run `/correlate` to link findings

### "Commands not working"

- Verify `.cursor/rules/agent-inspector.mdc` is in your project
- Ensure the Agent Inspector MCP server is registered
- Check the server is running on `localhost:7100`

## Next Steps

1. **Read the feature guides** for detailed information:
   - [Static Analysis](features/static-analysis.md)
   - [Dynamic Analysis](features/dynamic-analysis.md)
   - [Recommendations](features/recommendations.md)
   - [Reports](features/reports.md)
   - [Correlation](features/correlation.md)

2. **Run your first scan**:
   ```
   /scan
   ```

3. **Explore the dashboard** at `http://localhost:7100`

4. **Join the community** for questions and best practices
