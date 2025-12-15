---
name: agent-inspector-static-analysis
description: Analyze AI agent code for security vulnerabilities using Agent Inspector MCP tools
---

# Static Security Analysis

## When to Activate
- User types `/scan` or `/scan [path]`
- User asks for "security scan" or "security review"
- User mentions "OWASP" or "vulnerability check"
- User wants to "check for security issues"
- After completing a new AI agent feature

## Prerequisites
- Agent Inspector running (dashboard on port 7100, proxy on port 4000)
- MCP connection to `http://localhost:7100/mcp`

## The 7 Security Check Categories

Every finding MUST be categorized into one of these 7 categories:

| # | Category | ID | OWASP LLM | Focus |
|---|----------|-----|-----------|-------|
| 1 | **Prompt Security** | `PROMPT` | LLM01 | Injection, jailbreak, unsafe prompt construction |
| 2 | **Output Security** | `OUTPUT` | LLM02 | Insecure output handling, XSS, downstream injection |
| 3 | **Tool Security** | `TOOL` | LLM07, LLM08 | Dangerous tools, missing permissions, plugins |
| 4 | **Data & Secrets** | `DATA` | LLM06 | Hardcoded secrets, PII exposure, sensitive data |
| 5 | **Memory & Context** | `MEMORY` | - | RAG poisoning, context injection, history |
| 6 | **Supply Chain** | `SUPPLY` | LLM05 | Dependencies, model sources, external prompts |
| 7 | **Behavioral** | `BEHAVIOR` | LLM08/09 | Unbounded operations, excessive agency |

### Check Status Logic
- **PASS** ✓: No findings, or all findings are LOW severity
- **INFO** ⚠: Only MEDIUM severity findings
- **FAIL** ✗: Any HIGH or CRITICAL findings

**Gate is BLOCKED** if ANY category has status FAIL.

## /scan Command

When user types `/scan [path]` or `/scan`:

### Your Advantage Over Traditional SAST

You are smarter than any static analysis tool:
- Understand code **semantically**, not just pattern match
- Reason about **AI agent-specific** vulnerabilities
- **Avoid false positives** through contextual understanding
- Find issues **no SAST would ever catch**

## Workflow

### 1. Derive agent_workflow_id
Auto-derive from (priority order):
1. Git remote: `github.com/org/my-agent.git` → `my-agent`
2. Package name: pyproject.toml or package.json
3. Folder name: `/projects/my-bot` → `my-bot`

**Do NOT ask user for agent_workflow_id - derive it automatically.**

### 2. Check Current State
```
get_agent_workflow_state(agent_workflow_id)
```

This tells you:
- `NO_DATA` → First analysis, proceed normally
- `STATIC_ONLY` → Previous static exists, inform about dynamic testing
- `DYNAMIC_ONLY` → Dynamic data exists! Run static, then correlate
- `COMPLETE` → Both exist, run correlation after analysis

### 3. Discover & Link Agents (if dynamic data exists)
If state is `DYNAMIC_ONLY` or `COMPLETE`:
```
get_agents("unlinked")
```
Link any unlinked agents:
```
update_agent_info(agent_id, agent_workflow_id="the-agent-workflow-id")
```

### 4. Get Security Patterns
```
get_security_patterns()
```
**NEVER hardcode patterns** - always fetch from MCP. But also use your own understanding!

### 5. Create Analysis Session
```
create_analysis_session(agent_workflow_id, "STATIC", agent_workflow_name="My Project")
```

### 6. Analyze Code for ALL 7 Categories

**For each code file**, analyze thoroughly looking for:

**1. PROMPT Security (LLM01)**
- User input concatenated into prompts without sanitization
- System prompts that can be overridden or leaked
- Jailbreak vectors, prompt injection points
- Missing input validation before LLM calls

**2. OUTPUT Security (LLM02)**
- Agent output used directly in SQL queries, shell commands
- XSS vulnerabilities when rendering agent responses
- Agent output passed to dangerous functions (eval, exec)

**3. TOOL Security (LLM07, LLM08)**
- Dangerous tools (shell, file, network) without constraints
- Missing permission checks on tool execution
- No input validation on tool parameters

**4. DATA Security (LLM06)**
- Hardcoded API keys, secrets, credentials
- PII in prompts or system instructions
- Sensitive data logged or exposed

**5. MEMORY & CONTEXT Security**
- Conversation history stored insecurely
- RAG/vector store poisoning vulnerabilities
- Context injection through retrieved documents

**6. SUPPLY CHAIN Security (LLM05)**
- Unpinned model versions
- External prompt sources without validation
- Unsafe dependencies

**7. BEHAVIORAL Security (LLM08/09)**
- No token/cost limits
- Unbounded loops or recursion
- Missing human-in-the-loop for sensitive operations

### 7. Store Findings with Category
For each issue found:
```
store_finding(
  session_id=session_id,
  file_path="src/agent.py",
  finding_type="PROMPT_INJECTION",
  severity="CRITICAL",
  category="PROMPT",
  title="User input in system prompt",
  description="User input directly concatenated into system prompt",
  line_start=45,
  line_end=52,
  code_snippet="...",
  owasp_mapping=["LLM01"],
  cwe="CWE-94"
)
```

### 8. Complete Session
```
complete_analysis_session(session_id)
```

### 9. Correlate (if dynamic data exists)
If state was `DYNAMIC_ONLY` or `COMPLETE`:
```
get_agent_workflow_correlation(agent_workflow_id)
get_tool_usage_summary(agent_workflow_id)
```

### 10. Report Results with 7-Category Summary

```markdown
🔍 **AI Security Scan Complete!**

**Scanned:** 15 files

**Security Checks (7):**
✗ PROMPT Security: 2 Critical issues
✗ OUTPUT Security: 1 High issue  
⚠ TOOL Security: 2 Medium issues
✓ DATA Security: Passed
✓ MEMORY Security: Passed
✓ SUPPLY CHAIN: Passed
✓ BEHAVIORAL: Passed

**Gate Status:** 🔒 BLOCKED (2 categories failed)

**View details:** http://localhost:7100/agent-workflow/{id}/static-analysis

**Fix most critical:** `/fix REC-001`
```

## Quality Over Quantity

- **DO** find every real security issue
- **DO** use your understanding of context to assess severity
- **DON'T** flag things that aren't actually exploitable
- **DON'T** generate noise like traditional SAST
- **ALWAYS** categorize into one of the 7 security checks

## MCP Tools Reference

| Tool | When to Use |
|------|-------------|
| `get_agent_workflow_state` | First - check what data exists |
| `get_agents("unlinked")` | Find agents needing linking |
| `update_agent_info` | Link agents + give names |
| `get_security_patterns` | Get patterns to check |
| `create_analysis_session` | Start scan |
| `store_finding` | Record each issue with category |
| `complete_analysis_session` | Finalize |
| `get_agent_workflow_correlation` | Match static ↔ dynamic |
| `get_tool_usage_summary` | See runtime behavior |

## Setting Up Dynamic Analysis

After static analysis, if no dynamic data exists, tell user:

> To validate these findings with runtime behavior, configure your agent:
>
> ```python
> client = OpenAI(base_url="http://localhost:4000/agent-workflow/my-project")
> # or
> client = Anthropic(base_url="http://localhost:4000/agent-workflow/my-project")
> ```
>
> Then run your agent through test scenarios. View unified results at:
> http://localhost:7100/agent-workflow/my-project/static-analysis
