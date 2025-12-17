# Sample Agent Fixture

This directory contains a sample AI agent with **intentional security vulnerabilities** for testing the Agent Inspector security scanning capabilities.

## ⚠️ WARNING

**DO NOT use this code in production!** This agent contains intentional security vulnerabilities designed for testing purposes only.

## Purpose

Use this sample agent to:
1. Test the `/scan` command in Cursor or Claude Code
2. Verify security findings are properly detected and categorized
3. Test the fix workflow with `/fix REC-XXX` commands
4. Verify UI displays findings correctly across all 7 security check categories

## Vulnerabilities by Category

### 1. PROMPT Security (LLM01)
- User input concatenated directly into system prompt
- No input sanitization before LLM calls
- Prompt injection vectors

### 2. OUTPUT Security (LLM02)
- Agent output used in SQL queries without escaping
- Agent output rendered in HTML without sanitization

### 3. TOOL Security (LLM07, LLM08)
- Shell command execution without constraints
- File access without path validation
- Missing permission checks

### 4. DATA Security (LLM06)
- Hardcoded API keys
- PII logged without redaction
- Credentials in error messages

### 5. MEMORY Security
- Conversation history stored in plaintext
- No memory isolation between users

### 6. SUPPLY CHAIN Security (LLM05)
- Unpinned model versions
- External prompt template loading without validation

### 7. BEHAVIORAL Security (LLM08/09)
- No token limits
- Unbounded tool call loops
- Missing approval gates for sensitive operations

## How to Test

1. Start Agent Inspector:
   ```bash
   python3 -m src.main run --config examples/configs/anthropic-live-trace.yaml
   ```

2. In Cursor or Claude Code, run:
   ```
   /scan tests/fixtures/sample_agent
   ```

3. View results at: http://localhost:7100/agent-workflow/sample-agent/static-analysis

## Expected Results

The scan should detect:
- 2 CRITICAL findings (PROMPT, TOOL)
- 3 HIGH findings (DATA, OUTPUT, BEHAVIORAL)
- 4 MEDIUM findings (MEMORY, SUPPLY)
- Gate Status: BLOCKED
