---
name: agent-inspector-dynamic-analysis
description: Trace, debug, and analyze AI agents by running them through Agent Inspector - captures runtime behavior for validation and insights
---

# Dynamic Analysis: Runtime Testing with Agent Inspector

Dynamic analysis captures **actual runtime behavior** of AI agents in testing/evaluation environments. It validates static findings and provides behavioral insights.

**Key Value in Testing Environments:**
- Validate static security findings with real execution
- Discover attack surfaces that are actually exercised
- Observe tool usage patterns and sequences
- Measure behavioral consistency and error handling
- Identify coverage gaps (untested tools/paths)

## When to Use Dynamic Analysis

**ALWAYS offer when:**
- User wants to validate static analysis findings
- User is testing agent behavior before deployment
- User wants to see actual tool usage patterns
- User is debugging unexpected agent behavior
- User has completed code changes and wants to test
- User asks about "testing", "tracing", "validating"

## Lifecycle Awareness

**Check workflow state first:**

1. Call `get_workflow_state(workflow_id)` via MCP
2. Inform user what exists:
   - If `state == "STATIC_ONLY"`: "I see static findings. Dynamic testing will validate them."
   - If `state == "NO_DATA"`: "No analysis yet. Dynamic testing is a good start!"
3. After testing, show correlation with static findings

## Getting the Workflow ID (Auto-Setup)

**CRITICAL:** Ensure workflow_id exists to correlate with static analysis.

1. Call `get_workflow_config()` to check for `cylestio.yaml`
2. **If config exists:** use the `workflow_id` from the config
3. **If no config:** AUTO-CREATE it:
   - Derive workflow_id from folder name, git remote, or package name
   - Create `cylestio.yaml`:
   ```yaml
   workflow_id: {derived-project-name}
   ```
   - Inform user: "Created cylestio.yaml with workflow_id: {id}"

## Quick Start

### Step 1: Start Agent Inspector

```bash
# For OpenAI agents
agent-inspector openai

# For Anthropic agents  
agent-inspector anthropic

# With persistence (recommended)
agent-inspector openai --use-local-storage
```

The proxy server starts on **port 4000** and the live trace dashboard opens at **http://localhost:7100**.

### Step 2: Configure Agent with Workflow ID

**MINIMAL CHANGE REQUIRED** - Just update `base_url` to include workflow_id:

**IMPORTANT:** Use the workflow_id URL pattern to group traces with your static analysis results.

The base_url format is:
```
http://localhost:4000/workflow/<workflow-id>
```

Choose a consistent `workflow_id` for your project (e.g., `my-agent-v1`, `customer-service-bot`). Use the **same workflow_id** you used in static analysis to get unified results.

**OpenAI:**
```python
import os
from openai import OpenAI

# The workflow_id should match what's in cylestio.yaml
# This is the ONLY change needed to agent code
client = OpenAI(
    base_url="http://localhost:4000/workflow/my-project",  # workflow_id in URL
    api_key=os.getenv("OPENAI_API_KEY")
)
```

**Anthropic:**
```python
from anthropic import Anthropic

client = Anthropic(
    base_url="http://localhost:4000/workflow/my-project",  # workflow_id in URL
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

**NOTE:** The agent code does NOT need to read `cylestio.yaml`. That file is only for the coding agent to know the workflow_id. The proxy extracts the workflow_id from the URL path automatically.

### Step 3: Run Test Scenarios

Execute your agent with various inputs to:
- Exercise all defined tools
- Test edge cases
- Validate security controls (rate limits, confirmations)

### Step 4: Review Results

View dashboard at `http://localhost:4000/workflow/{workflow_id}`

## MCP Tools for Analysis

After dynamic testing, use MCP tools to analyze:

**Lifecycle Tools:**
- `get_workflow_state(workflow_id)` - Check overall state
- `get_tool_usage_summary(workflow_id)` - See tool usage patterns
- `get_workflow_correlation(workflow_id)` - Correlate with static findings

**Example Analysis Flow:**
```
1. get_workflow_state("my-agent") 
   → state: "COMPLETE", has both static and dynamic

2. get_tool_usage_summary("my-agent")
   → 7 of 10 tools used, delete_record called 23 times

3. get_workflow_correlation("my-agent")
   → Finding "unconfirmed delete" validated: 5 calls without confirmation
```

## CLI Options

```
Options:
  -p, --port PORT       Override proxy server port (default: 4000)
  --trace-port PORT     Override dashboard port (default: 7100)
  --use-local-storage   Enable SQLite persistence for traces
  --local-storage-path  Custom database path (requires --use-local-storage)
  --show-configs        Display bundled configurations and exit
```

## What Dynamic Analysis Provides

| Insight | Value for Testing |
|---------|-------------------|
| **Tool Usage** | Which tools were called, how often |
| **Coverage** | Which tools were never exercised |
| **Sequences** | Common tool call patterns |
| **Validation** | Did dangerous patterns actually occur? |
| **Consistency** | Same input → same behavior? |
| **Error Handling** | How does agent handle failures? |

## Validating Static Findings

Dynamic testing answers questions like:
- "Does the 'unconfirmed delete' vulnerability actually happen?"
- "Is the 'PII to external' data flow actually exercised?"
- "Which attack surfaces are never reached in testing?"

**Example Report:**
```markdown
## Dynamic Validation Results

**Tool Coverage:** 7/10 tools exercised (70%)

### Static Findings Validation:
✓ VALIDATED: "delete without confirmation" - occurred 5 times
✓ VALIDATED: "PII in external call" - occurred 8 times  
⚠ UNEXERCISED: "bulk_update" - tool never called in tests

### Recommendations:
- Add test scenarios for: bulk_update, export_data, admin_override
- The 2 validated vulnerabilities are confirmed risks
```

## After Dynamic Testing

Based on results, recommend:
- **If no static analysis**: "Run static analysis to identify what to validate"
- **If findings unexercised**: "Add test scenarios to exercise these tools"
- **If findings validated**: "These vulnerabilities are confirmed - prioritize fixes"

## Dashboard Views

`http://localhost:4000/workflow/{workflow_id}` shows:
- Real-time request/response capture
- Tool usage analytics
- Session timeline
- Correlation with static findings
- Behavioral patterns

## Troubleshooting

### Agent can't connect
```bash
# Check inspector is running
curl http://localhost:4000/health

# Start inspector first, then agent
```

### Traces not appearing
1. Verify base_url includes `/workflow/{workflow_id}`
2. Check terminal for errors
3. Ensure workflow_id matches what you expect

### Custom ports
```bash
agent-inspector openai --port 4001
# Update agent: base_url=f"http://localhost:4001/workflow/{WORKFLOW_ID}"
```

## Default Ports

| Service | Default Port |
|---------|-------------|
| Proxy Server | 4000 |
| Dashboard | 7100 |

## Unified Analysis

For complete security coverage, use the same workflow_id for both:

1. **Static Analysis** (via MCP tools):
   - `create_analysis_session(workflow_id="my-agent-v1", session_type="STATIC")`

2. **Dynamic Analysis** (via proxy):
   - `base_url=f"http://localhost:4000/workflow/my-agent-v1"`

Both appear unified in the dashboard at `http://localhost:4000/workflow/my-agent-v1`
