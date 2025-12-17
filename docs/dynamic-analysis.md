# Dynamic Analysis

Dynamic Analysis provides runtime security and behavioral analysis of AI agents. It examines actual agent behavior captured during test sessions to identify security issues, resource problems, and behavioral anomalies.

## Overview

Unlike static analysis which examines code, dynamic analysis observes what your agent actually does at runtime:

- **Security Checks**: 16 checks covering resource management, environment, behavior, and privacy
- **Behavioral Insights**: Stability score, predictability, cluster analysis, outlier detection
- **Framework Mappings**: OWASP LLM, SOC2, CWE, and MITRE ATT&CK mappings for each finding
- **Per-Agent Results**: Separate analysis for each agent (defined by unique system prompts)
- **Incremental Analysis**: Only processes new sessions, auto-resolves stale issues

## Getting Started

### Step 1: Capture Runtime Sessions

Configure your agent to route API calls through the Agent Inspector proxy:

```python
# OpenAI
from openai import OpenAI
client = OpenAI(base_url="http://localhost:4000/workflow/my-agent")

# Anthropic
from anthropic import Anthropic
client = Anthropic(base_url="http://localhost:4000/workflow/my-agent")
```

The proxy captures:
- All LLM requests and responses
- Tool calls and their results
- Token usage and timing
- System prompts (for agent identification)

### Step 2: Run Test Sessions

Exercise your agent through typical use cases:

```python
# Run various scenarios
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Help me book a flight."}
    ]
)
```

For meaningful behavioral analysis, aim for **5+ completed sessions** per agent.

### Step 3: Trigger Analysis

Once sessions are captured, trigger dynamic analysis:

**Via UI:**
- Open Dashboard: `http://localhost:7100`
- Navigate to your workflow → Dynamic Analysis
- Click "Run Analysis"

**Via MCP (Cursor/Claude Code):**
```
trigger_dynamic_analysis(workflow_id="my-agent")
```

**Via API:**
```bash
curl -X POST http://localhost:7100/api/workflow/my-agent/trigger-dynamic-analysis
```

## Security Checks

Dynamic analysis runs 16 security checks grouped into 4 categories:

### Resource Management
| Check | Description | OWASP |
|-------|-------------|-------|
| Token Bounds | Max tokens per request within limits | LLM08 |
| Tool Call Bounds | Tool calls per session within limits | LLM08 |
| Token Variance | Consistent token usage across sessions | LLM08 |
| Tool Variance | Consistent tool usage patterns | LLM08 |
| Duration Variance | Consistent response times | LLM08 |

### Environment & Supply Chain
| Check | Description | OWASP |
|-------|-------------|-------|
| Consistent Model Usage | Same model used across sessions | LLM03 |
| Average Tools Coverage | Tools used vs available | LLM08 |
| Unused Tools | Identifies never-called tools | LLM08 |

### Behavioral Stability
| Check | Description | OWASP |
|-------|-------------|-------|
| Stability Score | Overall behavioral consistency | LLM07 |
| Outlier Rate | Percentage of anomalous sessions | LLM07 |
| Cluster Formation | Behavioral clustering quality | LLM07 |
| Predictability | Output determinism | LLM07 |
| Uncertainty Threshold | Confidence in predictions | LLM07 |

### Privacy & PII
| Check | Description | OWASP |
|-------|-------------|-------|
| PII Detection | Scans for personally identifiable info | LLM06 |
| PII in System Prompts | Checks prompts for inadvertent PII | LLM06 |
| PII Exposure Rate | % of sessions containing PII | LLM06 |

## Framework Mappings

Each finding includes mappings to industry standards:

- **OWASP LLM Top 10**: LLM01-LLM10 control mappings
- **SOC2**: Trust Services Criteria controls (CC6.1, CC7.2, etc.)
- **CWE**: Common Weakness Enumeration IDs
- **MITRE ATT&CK**: Tactic/technique IDs
- **CVSS**: Severity scores (0-10) for critical/warning findings

## Incremental Analysis

Dynamic analysis is incremental:

1. **New Sessions Only**: Only analyzes sessions not previously analyzed
2. **Auto-Resolve**: Issues not found in new scans are automatically resolved
3. **Analysis History**: Track how security posture changes over time

### Checking Status

```
get_dynamic_analysis_status(workflow_id="my-agent")
```

Returns:
- `can_trigger`: Whether new sessions exist to analyze
- `is_running`: Whether analysis is in progress
- `total_unanalyzed_sessions`: Count of new sessions
- `agents_with_new_sessions`: Agents with new data
- `agents_status`: Per-agent breakdown
- `last_analysis`: Info about most recent analysis

## Per-Agent Analysis

Agents are identified by their unique system prompts. Each agent gets:

- Separate security check results
- Individual behavioral profile
- Own stability and predictability scores
- Distinct cluster analysis

View per-agent results in the dashboard or via API:

```bash
curl http://localhost:7100/api/workflow/my-agent/security-checks
```

## Auto-Resolve

When dynamic analysis runs and doesn't detect an issue that was previously found, the finding is automatically marked as RESOLVED. This reflects that:

- The underlying behavior has changed
- The issue may have been fixed
- The problematic code path is no longer exercised

Auto-resolved findings:
- Are logged in the audit trail
- Show `fix_method: AUTO_RESOLVED`
- Include reference to the analysis session that resolved them

## Commands Reference

### MCP Tools

| Tool | Description |
|------|-------------|
| `trigger_dynamic_analysis` | Trigger on-demand analysis |
| `get_dynamic_analysis_status` | Check status and unanalyzed sessions |
| `get_analysis_history` | View past analysis runs |

### Quick Commands (Cursor Rules)

| Command | Action |
|---------|--------|
| `/analyze` | Trigger dynamic analysis for current workflow |
| `/status` | Check dynamic analysis status |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workflow/{id}/dynamic-analysis-status` | GET | Get analysis status |
| `/api/workflow/{id}/trigger-dynamic-analysis` | POST | Trigger analysis |
| `/api/workflow/{id}/analysis-history` | GET | Get analysis history |
| `/api/workflow/{id}/security-checks` | GET | Get security check results |

## Best Practices

1. **Minimum Sessions**: Aim for 5+ sessions before analysis for meaningful behavioral insights
2. **Diverse Scenarios**: Test various use cases to cover different code paths
3. **Regular Analysis**: Trigger analysis after significant agent changes
4. **Review Auto-Resolves**: Verify auto-resolved issues were actually fixed
5. **Link Agents**: Use `update_agent_info` to give agents meaningful names

## Troubleshooting

### "No new sessions to analyze"
- Ensure your agent is configured to use the proxy
- Check that sessions are completing (not just starting)
- Verify the workflow_id matches

### "Analysis in progress"
- Wait for current analysis to complete
- Check the dashboard for progress

### Low Stability Score
- Indicates high behavioral variance
- Review outlier sessions for anomalies
- Consider if variance is expected for your use case

## Related Documentation

- [Static Analysis](./static-analysis.md) - Code-based security analysis
- [Correlation](./correlation.md) - Combining static and dynamic findings
- [Recommendations](./recommendations.md) - Fix workflow and audit trail
