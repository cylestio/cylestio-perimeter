# Correlation

## What It Does

Correlation connects your **static** findings (code vulnerabilities found by scanning your codebase) with **dynamic** observations (what actually happened when your agent ran).

This helps you prioritize: a vulnerability that's actively triggered at runtime is more dangerous than one in code that never executes.

## Why It Matters

Not all security findings are equally urgent:

- A hardcoded API key that's **actively used** at runtime is a critical risk
- The same key in dead code that never runs is lower priority

Correlation tells you which findings are **real, exploitable risks** vs **theoretical concerns**.

## Correlation States

| Badge | State | Meaning | Priority |
|-------|-------|---------|----------|
| 🔴 | **Validated** | Code vulnerability + triggered at runtime | Fix first! |
| 📋 | **Unexercised** | Code vulnerability, never triggered | Test gap |
| 🔵 | **Runtime Only** | Issue at runtime, no static finding | Different fix needed |
| 📚 | **Theoretical** | Code vulnerability, but safe at runtime | Lower priority |

### Validated (🔴)
These are **real, active risks**. The vulnerable code:
1. Has a security issue (found by static scan)
2. Was actually executed (observed at runtime)

**Example**: A dangerous tool without constraints was called 47 times in your tests.

**Action**: Fix these immediately!

### Unexercised (📋)
These indicate **test gaps**:
1. Code has a vulnerability
2. But that code path was never run in your tests

**Action**: Add test cases that exercise this code path, then re-correlate.

### Runtime Only (🔵)
These are issues found at runtime that weren't caught by static analysis:
1. No static finding exists
2. But runtime behavior shows a concern

**Example**: Agent making unexpected API calls to unauthorized domains.

**Action**: Investigate the runtime behavior and add appropriate constraints.

### Theoretical (📚)
Code looks vulnerable but is safe in practice:
1. Static analysis flags an issue
2. But runtime shows the code is never called, or
3. Other safeguards prevent exploitation

**Example**: Hardcoded key exists but is always overridden by environment variable.

**Action**: Can be addressed later, focus on validated issues first.

## How to Correlate

### Option 1: /correlate Command
In Cursor, type:
```
/correlate
```

The AI will:
1. Query your static findings
2. Query your runtime tool usage
3. Match findings with runtime evidence
4. Update each finding's correlation state
5. Report the results

### Option 2: Ask Naturally
Say to your AI assistant:
> "Correlate my static findings with runtime data"

### Option 3: UI Hint
On the **Dynamic Analysis** page, you'll see a hint card suggesting correlation
when you have both static findings and runtime sessions.

## Understanding the Results

After correlation, you'll see:

### In the Terminal (AI Report)
```
🔗 Correlation Complete!

Cross-referenced 5 static findings with 25 runtime sessions.

🔴 VALIDATED (2) - Active risks confirmed at runtime:
- Tool without constraints: Called 47 times
- Hardcoded secret: Used in all sessions

📋 UNEXERCISED (3) - Static risks, never triggered:
- Prompt injection in handle_request(): Code path never executed

💡 Prioritize fixing VALIDATED issues first - they're actively exploitable.
```

### In the Static Analysis UI
- **Correlation Summary Card**: Shows counts by state
- **Correlation Badges**: On each finding card

### In the Dynamic Analysis UI
- **Correlate Hint Card**: Suggests correlation when data is available

## Best Practice Workflow

1. **Run static scan first**
   ```
   /scan
   ```

2. **Run your agent through several test scenarios**
   - Use the proxy URL: `http://localhost:4000/agent-workflow/{your-workflow-id}`
   - Cover different code paths

3. **Run dynamic analysis**
   - Click "Run Analysis" in the Dynamic Analysis UI, or
   - Use `/analyze` command

4. **Correlate findings**
   ```
   /correlate
   ```

5. **Fix VALIDATED issues first**
   - These are confirmed active risks
   ```
   /fix REC-001
   ```

6. **Address UNEXERCISED findings**
   - Add tests to cover those code paths
   - Re-run correlation to update states

## Common Questions

**Q: How does correlation work?**

A: The AI compares static findings (vulnerable code locations) with dynamic data (tool calls, function executions at runtime). If a finding's affected code/tool was observed at runtime, it's marked VALIDATED. If never triggered, it's UNEXERCISED.

**Q: Do I need both static and dynamic data?**

A: Yes. Correlation requires:
- Static findings from `/scan`
- Runtime sessions from running your agent through the proxy

**Q: How often should I correlate?**

A: Re-correlate after:
- Adding new tests
- Running more runtime scenarios
- Fixing issues (to update states)

**Q: Can a finding change states?**

A: Yes! After adding tests that exercise previously UNEXERCISED code, re-correlate to update the state. Fixed findings will show as FIXED.
