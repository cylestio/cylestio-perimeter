---
name: agent-inspector-dynamic-analysis
description: Trace, debug, and analyze AI agents by running them through Agent Inspector - a proxy that captures all LLM API calls with real-time visualization
---

# Dynamic Analysis: Runtime Tracing with Agent Inspector

When the user is building, running, or debugging an AI agent that uses OpenAI or Anthropic APIs, use Agent Inspector to capture and analyze all LLM interactions at runtime.

**Relationship to Static Analysis:** Dynamic analysis complements static analysis by observing actual agent behavior. Use the **same workflow_id** for both static and dynamic analysis to get unified results in the dashboard.

## When to Use Dynamic Analysis

**ALWAYS offer to use Agent Inspector when:**
- User is implementing a new AI agent or chatbot
- User is debugging agent behavior or unexpected responses
- User wants to understand what prompts are being sent to the LLM
- User wants to analyze token usage, latency, or costs
- User is testing agent workflows or multi-turn conversations
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

**Important: Always run the agent inspector for the user**

### Step 1: Install Agent Inspector (if not installed)

```bash
# Via pipx (recommended)
pipx install agent-inspector

# Or via pip
pip install agent-inspector
```

### Step 2: Start Agent Inspector

**For OpenAI agents:**
```bash
agent-inspector openai
```

**For Anthropic agents:**
```bash
agent-inspector anthropic
```

The proxy server starts on **port 3000** and the live trace dashboard opens at **http://localhost:8080**.

### Step 3: Configure the Agent's base_url with Workflow ID

**IMPORTANT:** Use the workflow_id URL pattern to group traces with your static analysis results.

The base_url format is:
```
http://localhost:3000/workflow/<workflow-id>
```

Choose a consistent `workflow_id` for your project (e.g., `my-agent-v1`, `customer-service-bot`). Use the **same workflow_id** you used in static analysis to get unified results.

**OpenAI:**
```python
import os
from openai import OpenAI

WORKFLOW_ID = "my-agent-v1"  # Same ID used in static analysis

client = OpenAI(
    base_url=f"http://localhost:3000/workflow/{WORKFLOW_ID}",
    api_key=os.getenv("OPENAI_API_KEY")
)
```

**Anthropic:**
```python
import os
from anthropic import Anthropic

WORKFLOW_ID = "my-agent-v1"  # Same ID used in static analysis

client = Anthropic(
    base_url=f"http://localhost:3000/workflow/{WORKFLOW_ID}",
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

## CLI Options Reference

```bash
agent-inspector <provider> [OPTIONS]

Arguments:
  PROVIDER              openai or anthropic (default: openai)

Options:
  -p, --port PORT       Override proxy server port (default: 3000)
  --trace-port PORT     Override dashboard port (default: 8080)
  --use-local-storage   Enable SQLite persistence for traces
  --local-storage-path  Custom database path (requires --use-local-storage)
  --show-configs        Display bundled configurations and exit
```

### Examples

```bash
# Persist traces to SQLite for later analysis (recommended)
agent-inspector anthropic --use-local-storage

# Run with custom ports
agent-inspector openai --port 8000 --trace-port 9090

# Persist to custom path
agent-inspector openai --use-local-storage --local-storage-path ./my-traces.db
```

## Complete Agent Example

When helping users implement agents, include Agent Inspector support with workflow_id:

```python
#!/usr/bin/env python3
"""AI Agent with Agent Inspector tracing support."""

import os
from openai import OpenAI

# Define workflow ID - use the same ID across static and dynamic analysis
WORKFLOW_ID = "my-agent-v1"

def create_client(use_inspector: bool = True):
    """Create OpenAI client, optionally routing through Agent Inspector."""
    if use_inspector:
        return OpenAI(
            base_url=f"http://localhost:3000/workflow/{WORKFLOW_ID}",
            api_key=os.getenv("OPENAI_API_KEY")
        )
    return OpenAI()

def main():
    client = create_client(use_inspector=True)

    print(f"Agent running - view traces at http://localhost:3000/workflow/{WORKFLOW_ID}")

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
   curl http://localhost:3000/health
   ```

2. **Start Agent Inspector first, then run your agent:**
   ```bash
   # Terminal 1: Start inspector
   agent-inspector openai

   # Terminal 2: Run your agent
   python my_agent.py
   ```

### "Wrong provider" or authentication errors

Make sure the provider matches your agent's LLM:
- OpenAI agents (`gpt-4`, `gpt-4o`, etc.) → `agent-inspector openai`
- Anthropic agents (`claude-3`, etc.) → `agent-inspector anthropic`

### Port already in use

Use custom ports:
```bash
agent-inspector openai --port 3001 --trace-port 8081
```

Then update agent's base_url:
```python
WORKFLOW_ID = "my-agent-v1"
client = OpenAI(base_url=f"http://localhost:3001/workflow/{WORKFLOW_ID}", ...)
```

### Traces not appearing in dashboard

1. Verify the agent is configured with the workflow URL pattern
2. Check the terminal where Agent Inspector is running for errors
3. Navigate to `http://localhost:3000/workflow/{workflow_id}` to see your traces

### Agent works without inspector but fails with it

1. Check API key is set correctly in the agent (inspector forwards it)
2. Verify the provider type matches (`openai` vs `anthropic`)
3. Check for firewall/network issues blocking localhost:3000

## Environment Variable Alternative

Instead of hardcoding base_url, use environment variables:

```bash
# Set workflow ID and base URL together
export WORKFLOW_ID="my-agent-v1"
export OPENAI_BASE_URL="http://localhost:3000/workflow/${WORKFLOW_ID}"
# Or for Anthropic
export ANTHROPIC_BASE_URL="http://localhost:3000/workflow/${WORKFLOW_ID}"
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

The workflow dashboard at `http://localhost:3000/workflow/{workflow_id}` provides:

- **Real-time request/response capture** - See exactly what's sent to the LLM
- **Session timeline** - Track multi-turn conversations
- **Risk analytics** - PII detection, behavioral analysis, resource usage
- **Static + Dynamic unified view** - Combined results when same workflow_id is used
- **Agent health badges** - Quick status overview
- **Request timing** - Latency and performance metrics

## Workflow Summary

1. **Choose a workflow_id** for your project (e.g., `my-agent-v1`)
2. **Start Agent Inspector** in one terminal: `agent-inspector openai`
3. **Configure agent** with `base_url=f"http://localhost:3000/workflow/{WORKFLOW_ID}"`
4. **Run your agent** in another terminal
5. **View traces** at `http://localhost:3000/workflow/{workflow_id}`
6. **Run static analysis** with the same workflow_id for unified results

## Default Ports

| Service | Default Port |
|---------|-------------|
| Proxy Server | 3000 |
| Dashboard | 8080 |

## Unified Analysis

For complete security coverage, use the same workflow_id for both:

1. **Static Analysis** (via MCP tools):
   - `create_analysis_session(workflow_id="my-agent-v1", session_type="STATIC")`

2. **Dynamic Analysis** (via proxy):
   - `base_url=f"http://localhost:3000/workflow/my-agent-v1"`

Both appear unified in the dashboard at `http://localhost:3000/workflow/my-agent-v1`
