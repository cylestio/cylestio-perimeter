# Static Analysis

## What It Does

Static analysis scans your AI agent's **codebase** for security vulnerabilities before runtime. Unlike traditional SAST tools, it uses AI to understand the semantic meaning of your code and identify AI-agent-specific risks.

## Why It Matters

AI agents have unique security concerns that traditional scanners miss:

- **Prompt injection vulnerabilities** in how user input reaches the LLM
- **Tool misuse risks** from overly permissive tool configurations
- **Data leakage patterns** where sensitive data flows to external APIs
- **Supply chain risks** from unvetted MCP servers or plugins

Static analysis catches these issues **before** your agent ever runs.

## The 7 Security Check Categories

| Category | What It Checks | Example Risks |
|----------|---------------|---------------|
| 🎯 **PROMPT** | Input handling & prompt construction | Prompt injection, unsafe templating |
| 📤 **OUTPUT** | Response generation & filtering | Unfiltered model outputs, PII leakage |
| 🔧 **TOOL** | Tool definitions & constraints | Missing constraints, dangerous permissions |
| 🔐 **DATA** | Sensitive data handling | Hardcoded secrets, insecure storage |
| 🧠 **MEMORY** | Context & conversation management | Unbounded context, memory poisoning |
| 📦 **SUPPLY_CHAIN** | Dependencies & external services | Unvetted MCP servers, risky packages |
| 🚧 **BEHAVIORAL** | Agent behavior boundaries | Scope creep, autonomy limits |

## How to Run a Scan

### Option 1: /scan Command
In Cursor, type:
```
/scan
```

The AI will:
1. Identify your agent's entry point
2. Trace code paths for security-relevant patterns
3. Analyze tool definitions and permissions
4. Check for data handling issues
5. Report findings with severity and recommendations

### Option 2: Ask Naturally
Say to your AI assistant:
> "Scan my agent for security vulnerabilities"

### Option 3: Via the UI
Open the **Static Analysis** page in the Agent Inspector dashboard to view scan history and findings.

## Understanding Findings

Each finding includes:

### Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| 🔴 **CRITICAL** | Immediate exploitation risk | Fix before any deployment |
| 🟠 **HIGH** | Significant security risk | Fix before production |
| 🟡 **MEDIUM** | Moderate risk | Address soon |
| 🔵 **LOW** | Minor concern | Fix when convenient |
| ⚪ **INFO** | Best practice suggestion | Consider improving |

### Framework Mappings

Findings map to industry standards:
- **OWASP LLM Top 10**: AI-specific vulnerability categories
- **CWE**: Common Weakness Enumeration IDs
- **SOC2**: Compliance control mappings

### Example Finding

```
🔴 CRITICAL - Prompt Injection Vulnerability

File: src/agent/chat_handler.py:45
Category: PROMPT

Description:
User input is directly concatenated into the system prompt without
sanitization, allowing prompt injection attacks.

Code:
  prompt = f"You are a helpful assistant. User says: {user_input}"

OWASP: LLM01 - Prompt Injection
CWE: CWE-77

Recommendation:
Use structured message arrays instead of string concatenation.
Validate and sanitize user input before including in prompts.
```

## Best Practice Workflow

1. **Scan early and often**
   ```
   /scan
   ```
   Run scans during development, not just before deployment.

2. **Review findings by severity**
   - Fix CRITICAL/HIGH issues immediately
   - Address MEDIUM issues before production
   - Track LOW/INFO for future improvement

3. **Fix issues with AI assistance**
   ```
   /fix REC-001
   ```
   Let the AI implement secure fixes with proper patterns.

4. **Verify fixes**
   Re-scan after fixes to confirm resolution.

5. **Run dynamic analysis**
   Use `/analyze` to see if vulnerabilities are actually exploitable.

6. **Correlate findings**
   Use `/correlate` to prioritize based on runtime evidence.

## What Makes This Different from Traditional SAST

| Traditional SAST | AI-Powered Static Analysis |
|-----------------|---------------------------|
| Pattern matching | Semantic understanding |
| High false positives | Context-aware assessment |
| Generic vulnerabilities | AI-agent-specific checks |
| Rule-based | Learns from codebase patterns |
| Limited to known patterns | Identifies novel risks |

## Common Questions

**Q: How long does a scan take?**

A: Typically 30 seconds to 2 minutes, depending on codebase size. The AI focuses on security-relevant code paths rather than scanning everything blindly.

**Q: Will it find all vulnerabilities?**

A: No tool catches everything. Static analysis excels at code-level issues but can't detect runtime behavior problems. Use dynamic analysis and correlation for complete coverage.

**Q: What if I get too many findings?**

A: Start with CRITICAL and HIGH severity. Use `/fix` to address them with AI assistance. Lower severity findings can be addressed incrementally.

**Q: Can I ignore false positives?**

A: Yes, use the Recommendations page to dismiss findings with documented reasons. This creates an audit trail and prevents re-flagging.

**Q: Does this replace code review?**

A: No, it augments code review by surfacing AI-specific risks that reviewers might miss. Human review is still valuable for business logic and architectural concerns.
