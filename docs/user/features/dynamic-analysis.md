# Dynamic Analysis

## What It Does

Dynamic analysis examines your AI agent's **runtime behavior** by analyzing actual sessions captured through the proxy. It identifies security issues that only manifest when your agent runs in the real world.

## Why It Matters

Some vulnerabilities can't be found by looking at code alone:

- **Unexpected tool usage patterns** - calling tools in dangerous sequences
- **Data leakage at runtime** - sensitive info appearing in outputs
- **Behavioral anomalies** - agent straying outside intended boundaries
- **Resource abuse** - excessive token usage or API calls

Dynamic analysis catches what static analysis misses by observing **actual behavior**.

## How It Works

1. **Run your agent** through the Cylestio Gateway proxy
2. **Sessions are captured** with full observability
3. **Trigger analysis** to evaluate captured behavior
4. **Review findings** specific to runtime patterns

## How to Run Dynamic Analysis

### Option 1: Via the UI

1. Open the **Dynamic Analysis** page in Agent Inspector
2. Click the **Run Analysis** button
3. Select which agents/sessions to analyze
4. Review the results

### Option 2: /analyze Command
In Cursor, type:
```
/analyze
```

The AI will:
1. Query your runtime sessions
2. Analyze tool usage patterns
3. Check for behavioral anomalies
4. Look for data leakage
5. Report findings with evidence

### Option 3: Ask Naturally
Say to your AI assistant:
> "Analyze my agent's runtime behavior"

## What Gets Analyzed

### Tool Usage Patterns

| Check | What It Detects |
|-------|----------------|
| Unconstrained tools | Tools called without proper constraints |
| Dangerous sequences | Risky tool call patterns |
| Excessive calls | Unusual frequency of sensitive operations |
| Unexpected tools | Tools used outside normal patterns |

### Behavioral Checks

| Check | What It Detects |
|-------|----------------|
| Scope violations | Agent actions outside intended boundaries |
| Autonomy escalation | Agent gaining unintended capabilities |
| Pattern anomalies | Unusual behavior compared to baseline |

### Data Flow Checks

| Check | What It Detects |
|-------|----------------|
| PII exposure | Personal data in outputs |
| Secret leakage | API keys or credentials in responses |
| Exfiltration patterns | Sensitive data sent to external services |

## Understanding Results

### Analysis Status Card

Shows the current state of dynamic analysis:
- **Not Started**: No analysis run yet
- **Running**: Analysis in progress
- **Completed**: Results available
- **Failed**: Analysis encountered an error

### Security Checks by Agent

Results are grouped by agent, showing:
- Number of checks passed/failed
- Critical issues requiring attention
- Warnings to investigate

### Example Finding

```
🟠 HIGH - Tool Called Without Constraints

Agent: my-agent
Session: sess_abc123
Check: TOOL

Description:
The 'execute_code' tool was called 47 times without input validation
constraints, allowing arbitrary code execution.

Evidence:
- Session sess_abc123: 15 calls, 3 with user-controlled input
- Session sess_def456: 32 calls, 12 with external URLs

Recommendation:
Add input validation and allowlist constraints to the execute_code tool.
```

## Best Practice Workflow

1. **Set up the proxy**
   Configure your agent to use the Cylestio Gateway proxy URL.

2. **Generate representative traffic**
   - Run your agent through typical use cases
   - Include edge cases and error scenarios
   - Test with various input types

3. **Trigger analysis**
   ```
   /analyze
   ```

4. **Review by agent**
   Check each agent's results on the Dynamic Analysis page.

5. **Correlate with static findings**
   ```
   /correlate
   ```
   Link runtime evidence to code-level vulnerabilities.

6. **Fix validated issues**
   Prioritize issues confirmed by both static and dynamic analysis.

## Analysis Options

### Incremental Analysis

By default, analysis only processes new sessions since the last run. This is efficient for continuous monitoring.

### Full Re-analysis

Click "Re-analyze All" to process all sessions again. Useful after:
- Major code changes
- New analysis rules
- Investigating specific issues

### Per-Agent Analysis

Select specific agents to analyze rather than the entire workflow. Useful for:
- Focusing on high-risk agents
- Debugging specific behaviors
- Comparing agent versions

## Common Questions

**Q: How many sessions should I capture before analyzing?**

A: At least 5-10 sessions with diverse inputs gives meaningful results. More sessions provide better behavioral baselines.

**Q: How often should I run dynamic analysis?**

A: Run after:
- Significant code changes
- New deployment
- Suspicious behavior reported
- As part of regular security checks (weekly/monthly)

**Q: What if I have no findings?**

A: This is good! It means observed behavior aligns with security expectations. Continue monitoring as usage patterns evolve.

**Q: Can I export the results?**

A: Yes, use the Reports page to generate compliance reports that include dynamic analysis results.

**Q: How does this relate to static analysis?**

A: They're complementary:
- Static analysis: finds vulnerabilities in code
- Dynamic analysis: confirms which vulnerabilities are exploitable
- Correlation: links them together for prioritization
