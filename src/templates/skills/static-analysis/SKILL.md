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
- Agent Inspector server running (proxy on port 3000, MCP on port 8080)
- MCP connection configured to `http://localhost:8080/mcp`

**Relationship to Dynamic Analysis:** Static analysis examines code without execution. For complete security coverage, also run dynamic analysis using the **same workflow_id** to observe actual runtime behavior.

## Workflow

1. **Get Patterns**
   Call `get_security_patterns` MCP tool to retrieve current security patterns.
   DO NOT use hardcoded patterns - always fetch from MCP.

2. **Create Session**
   Call `create_analysis_session` with:
   - workflow_id: identifier for the project/codebase being analyzed
   - session_type: "STATIC"
   - workflow_name: (optional) human-readable project name

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
   Summarize findings and provide dashboard link: `http://localhost:3000/workflow/{workflow_id}`

## MCP Tools Reference

**Core Workflow Tools:**
- `get_security_patterns` - Get patterns to check (context, min_severity)
- `create_analysis_session` - Start session (workflow_id, session_type, workflow_name)
- `store_finding` - Record finding (session_id, file_path, finding_type, severity, title, description)
- `complete_analysis_session` - Finalize (session_id)

**Additional Tools:**
- `get_owasp_control` - Get detailed info for specific OWASP control (control_id)
- `get_findings` - Retrieve existing findings (workflow_id, session_id, severity, status)

## Combining with Dynamic Analysis

For complete security coverage, suggest running dynamic analysis after static analysis:

1. **Use the same workflow_id** - Critical for unified results
2. **Configure agent's base_url** with workflow_id:
   ```python
   base_url = f"http://localhost:3000/workflow/{workflow_id}"
   ```
3. **View unified results** at `http://localhost:3000/workflow/{workflow_id}`

This validates static findings with actual runtime behavior.
