---
name: agent-inspector-static-analysis
description: Analyze AI agent code for security vulnerabilities using Agent Inspector MCP tools
---

# Static Security Analysis

## When to Activate
- User asks for "security scan" or "security review"
- User mentions "OWASP" or "vulnerability check"
- User asks about "pre-production readiness"
- User wants to "check for security issues"

## Prerequisites
- Agent Inspector server running at localhost:3000
- MCP connection configured

## Workflow

1. **Get Patterns**
   Call `get_security_patterns` MCP tool to retrieve current security patterns.
   DO NOT use hardcoded patterns - always fetch from MCP.

2. **Create Session**
   Call `create_analysis_session` with:
   - agent_id: identifier for the codebase being analyzed
   - session_type: "STATIC"

3. **Analyze Code**
   Using patterns from step 1, review the codebase.
   Focus areas are defined in the MCP response, not here.

4. **Store Findings**
   For each issue found, call `store_finding` with:
   - session_id from step 2
   - file_path, line numbers
   - finding_type, severity, title, description

5. **Complete Session**
   Call `complete_analysis_session` to finalize and calculate risk score.

6. **Report**
   Summarize findings and provide dashboard link: `http://localhost:3000/agent/{agent_id}`

## MCP Tools Reference

**Core Workflow Tools:**
- `get_security_patterns` - Get patterns to check (context, min_severity)
- `create_analysis_session` - Start session (agent_id, session_type)
- `store_finding` - Record finding (session_id, file_path, finding_type, severity, title, description)
- `complete_analysis_session` - Finalize (session_id)

**Additional Tools:**
- `get_owasp_control` - Get detailed info for specific OWASP control (control_id)
- `get_findings` - Retrieve existing findings (session_id, agent_id, severity, status)
