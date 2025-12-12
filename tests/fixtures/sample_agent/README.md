# Sample Agent - Security Test Fixture

This directory contains a sample AI agent with **intentional security vulnerabilities** for testing the Agent Inspector static scanner.

## Purpose

These files are used to:
1. Test the AI-powered security scanner
2. Verify finding detection for all 5 security categories
3. Test the fix workflow with known issues

## Vulnerabilities Present

### Category 1: Prompt Security
- **agent.py:20** - PROMPT_INJECT_DIRECT (CRITICAL)
  - User input directly in f-string prompt
- **agent.py:35** - PROMPT_JAILBREAK (HIGH)
  - No input filtering before prompt

### Category 2: Tool & Function Security
- **tools.py:15** - TOOL_DANGEROUS_UNRESTRICTED (CRITICAL)
  - Shell command execution without constraints
- **tools.py:25** - TOOL_INPUT_UNVALIDATED (HIGH)
  - File read with no path validation
- **tools.py:40** - TOOL_NO_CONFIRM (HIGH)
  - User deletion without confirmation

### Category 3: Data & Secrets
- **config.py:5** - SECRET_API_KEY (CRITICAL)
  - Hardcoded OpenAI API key
- **agent.py:50** - DATA_PII_LOGS (HIGH)
  - Logging user email and SSN

### Category 4: Supply Chain
- **requirements.txt:3** - SUPPLY_CVE (HIGH)
  - Vulnerable langchain version

### Category 5: Behavioral Boundaries
- **agent.py:60** - BOUNDARY_INFINITE_LOOP (MEDIUM)
  - Agent loop without max iterations

## Expected Scan Results

Running a security scan should find:
- 2 CRITICAL findings
- 4 HIGH findings
- 1 MEDIUM finding

## DO NOT USE IN PRODUCTION

⚠️ These files are intentionally insecure and should NEVER be used in a real application.
