---
name: agent-inspector-dynamic-analysis
description: Trace, debug, and analyze AI agents by running them through Agent Inspector - a proxy that captures all LLM API calls with real-time visualization
---

# Dynamic Analysis: Runtime Tracing with Agent Inspector

When the user is building, running, or debugging an AI agent that uses OpenAI or Anthropic APIs, use Agent Inspector to capture and analyze all LLM interactions at runtime.

**Relationship to Static Analysis:** Dynamic analysis complements static analysis by observing actual agent behavior. Use the **same agent_workflow_id** for both static and dynamic analysis to get unified results in the dashboard.

## When to Use Dynamic Analysis

**ALWAYS offer to use Agent Inspector when:**
- User is implementing a new AI agent or chatbot
- User is debugging agent behavior or unexpected responses
- User wants to understand what prompts are being sent to the LLM
- User wants to analyze token usage, latency, or costs
- User is testing agent multi-turn conversations
- User mentions "tracing", "debugging", "inspecting", or "monitoring" agents
- User is troubleshooting why an agent isn't working correctly
- User wants to see the actual API requests/responses
- User wants to debug or replay a specific message in the middle of a session
- User has completed static analysis and wants to validate findings with runtime data

**DO NOT use for:**
- Simple one-off API calls during development (unless debugging)
- Production deployments (this is a development/debugging tool)
- Non-LLM related tasks

## Quick Start

**Important: Always run Agent Inspector for the user**

### Step 1: Start Agent Inspector

```bash
# Quick start with uvx (no installation needed)
uvx cylestio-perimeter run --config path/to/config.yaml

# Or install globally
pip install cylestio-perimeter
cylestio-perimeter run --config path/to/config.yaml
```

See `examples/configs/` for sample configurations (e.g., `anthropic-live-trace.yaml`, `openai-live-trace.yaml`).

The proxy server starts on **port 4000** and the live trace dashboard opens at **http://localhost:7100**.

### Step 2: Configure the Agent's base_url with Agent Workflow ID

**IMPORTANT:** Use the agent_workflow_id URL pattern to group traces with your static analysis results.

The base_url format is:
```
http://localhost:4000/agent-workflow/<agent-workflow-id>
```

Choose a consistent `agent_workflow_id` for your project (e.g., `my-agent-v1`, `customer-service-bot`). Use the **same agent_workflow_id** you used in static analysis to get unified results.

**OpenAI:**
```python
import os
from openai import OpenAI

AGENT_WORKFLOW_ID = "my-agent-v1"  # Same ID used in static analysis

client = OpenAI(
    base_url=f"http://localhost:4000/agent-workflow/{AGENT_WORKFLOW_ID}",
    api_key=os.getenv("OPENAI_API_KEY")
)
```

**Anthropic:**
```python
import os
from anthropic import Anthropic

AGENT_WORKFLOW_ID = "my-agent-v1"  # Same ID used in static analysis

client = Anthropic(
    base_url=f"http://localhost:4000/agent-workflow/{AGENT_WORKFLOW_ID}",
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

## CLI Options Reference

```bash
cylestio-perimeter run [OPTIONS]

Options:
  --config PATH         Path to YAML configuration file
  --base-url URL        Base URL of target LLM API
  --type TYPE           LLM provider type (openai, anthropic)
  --port PORT           Proxy server port (default: 4000)
  --host HOST           Server host
```

### Examples

```bash
# Run with Anthropic config
cylestio-perimeter run --config examples/configs/anthropic-live-trace.yaml

# Run with OpenAI config
cylestio-perimeter run --config examples/configs/openai-live-trace.yaml

# Quick start without config file
cylestio-perimeter run --base-url https://api.anthropic.com --type anthropic
```

## Complete Agent Example

When helping users implement agents, include Agent Inspector support with agent_workflow_id:

```python
#!/usr/bin/env python3
"""AI Agent with Agent Inspector tracing support."""

import os
from openai import OpenAI

# Define agent workflow ID - use the same ID across static and dynamic analysis
AGENT_WORKFLOW_ID = "my-agent-v1"

def create_client(use_perimeter: bool = True):
    """Create OpenAI client, optionally routing through Agent Inspector."""
    if use_perimeter:
        return OpenAI(
            base_url=f"http://localhost:4000/agent-workflow/{AGENT_WORKFLOW_ID}",
            api_key=os.getenv("OPENAI_API_KEY")
        )
    return OpenAI()

def main():
    client = create_client(use_perimeter=True)

    print(f"Agent running - view traces at http://localhost:7100/agent-workflow/{AGENT_WORKFLOW_ID}")

    messages = [{"role": "user", "content": "Hello!"}]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )

    print(f"Response: {response.choices[0].message.content}")

if __name__ == "__main__":
    main()
```

## Troubleshooting

### "Connection refused" or agent can't connect

1. **Check if Agent Inspector is running:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Start Agent Inspector first, then run your agent:**
   ```bash
   # Terminal 1: Start Agent Inspector
   cylestio-perimeter run --config examples/configs/openai-live-trace.yaml

   # Terminal 2: Run your agent
   python my_agent.py
   ```

### "Wrong provider" or authentication errors

Make sure the config matches your agent's LLM provider:
- OpenAI agents (`gpt-4`, `gpt-4o`, etc.) → Use OpenAI config
- Anthropic agents (`claude-3`, etc.) → Use Anthropic config

### Port already in use

Use custom port in your config file or CLI:
```bash
cylestio-perimeter run --config config.yaml --port 3001
```

Then update agent's base_url:
```python
AGENT_WORKFLOW_ID = "my-agent-v1"
client = OpenAI(base_url=f"http://localhost:3001/agent-workflow/{AGENT_WORKFLOW_ID}", ...)
```

### Traces not appearing in dashboard

1. Verify the agent is configured with the agent-workflow URL pattern
2. Check the terminal where Agent Inspector is running for errors
3. Navigate to `http://localhost:7100/agent-workflow/{agent_workflow_id}` to see your traces

### Agent works without inspector but fails with it

1. Check API key is set correctly in the agent (inspector forwards it)
2. Verify the provider type matches (`openai` vs `anthropic`)
3. Check for firewall/network issues blocking localhost:4000

## Environment Variable Alternative

Instead of hardcoding base_url, use environment variables:

```bash
# Set agent workflow ID and base URL together
export AGENT_WORKFLOW_ID="my-agent-v1"
export OPENAI_BASE_URL="http://localhost:4000/agent-workflow/${AGENT_WORKFLOW_ID}"
# Or for Anthropic
export ANTHROPIC_BASE_URL="http://localhost:4000/agent-workflow/${AGENT_WORKFLOW_ID}"
```

Then in code:
```python
# OpenAI automatically uses OPENAI_BASE_URL
client = OpenAI()

# Anthropic needs explicit handling
import os
base_url = os.getenv("ANTHROPIC_BASE_URL")
client = Anthropic(base_url=base_url) if base_url else Anthropic()
```

## What the Dashboard Shows

The agent workflow dashboard at `http://localhost:7100/agent-workflow/{agent_workflow_id}` provides:

- **Real-time request/response capture** - See exactly what's sent to the LLM
- **Session timeline** - Track multi-turn conversations
- **Risk analytics** - PII detection, behavioral analysis, resource usage
- **Static + Dynamic unified view** - Combined results when same agent_workflow_id is used
- **Agent health badges** - Quick status overview
- **Request timing** - Latency and performance metrics

## Summary

1. **Choose an agent_workflow_id** for your project (e.g., `my-agent-v1`)
2. **Start Agent Inspector** in one terminal: `cylestio-perimeter run --config config.yaml`
3. **Configure agent** with `base_url=f"http://localhost:4000/agent-workflow/{AGENT_WORKFLOW_ID}"`
4. **Run your agent** in another terminal
5. **View traces** at `http://localhost:7100/agent-workflow/{agent_workflow_id}`
6. **Run static analysis** with the same agent_workflow_id for unified results

## Default Ports

| Service | Default Port |
|---------|-------------|
| Proxy Server | 4000 |
| Dashboard | 7100 |

## Unified Analysis with MCP Tools

After dynamic sessions are captured, use MCP tools to analyze and correlate:

### Check Agent Workflow State
```
get_agent_workflow_state(agent_workflow_id)
```
Returns: `DYNAMIC_ONLY` if only dynamic data exists.

### View Tool Usage Patterns
```
get_tool_usage_summary(agent_workflow_id)
```
Shows which tools were called, how often, and coverage metrics.

### Discover & Name Agents
```
get_agents(agent_workflow_id)
get_agents("unlinked")  # Find agents not linked to any agent workflow
```

Give agents meaningful names:
```
update_agent_info(agent_id, display_name="Customer Support Bot", description="Handles inquiries")
```

### Link Unlinked Agents
If agents were run without an agent_workflow_id in the URL:
```
update_agent_info(agent_id, agent_workflow_id="my-agent-v1")
```

## Correlation: Dynamic → Static Flow

When user has dynamic data and then asks for security analysis:

1. **Check state**: `get_agent_workflow_state(agent_workflow_id)` → `DYNAMIC_ONLY`
2. **Link any unlinked agents**: `get_agents("unlinked")` → `update_agent_info(...)`
3. **Run static analysis** (see static-analysis skill)
4. **Correlate**: `get_agent_workflow_correlation(agent_workflow_id)`

The correlation shows:
- **VALIDATED**: Static findings where the tool was exercised at runtime
- **UNEXERCISED**: Static findings for tools never called in tests

```markdown
### Correlation Results
| Finding | Tool | Runtime Status |
|---------|------|----------------|
| Unconfirmed delete | delete_user | ⚠️ VALIDATED (12 calls) |
| Missing rate limit | bulk_update | ✅ UNEXERCISED |

Recommendation: Add test scenarios for UNEXERCISED tools.
```

## Complete Flow: Both Static + Dynamic

For full security coverage, use the same agent_workflow_id for both:

1. **Static Analysis** (via MCP tools):
   ```
   create_analysis_session(agent_workflow_id="my-agent-v1", session_type="STATIC")
   ```

2. **Dynamic Analysis** (via proxy):
   ```python
   base_url = "http://localhost:4000/agent-workflow/my-agent-v1"
   ```

3. **Correlate**:
   ```
   get_agent_workflow_correlation(agent_workflow_id="my-agent-v1")
   ```

Both appear unified in the dashboard at `http://localhost:7100/agent-workflow/my-agent-v1`

## MCP Tools for Dynamic Analysis

| Tool | Purpose |
|------|---------|
| `get_agent_workflow_state` | Check what data exists for agent workflow |
| `get_tool_usage_summary` | View runtime tool usage patterns |
| `get_agents` | List agents (filter: agent_workflow_id, "unlinked") |
| `update_agent_info` | Name agents, link to agent workflows |
| `get_agent_workflow_correlation` | Correlate static ↔ dynamic |
