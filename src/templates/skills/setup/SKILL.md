---
name: agent-inspector-setup
description: Auto-setup Agent Inspector workflow configuration for a project
---

# Agent Inspector Setup

## When to Activate
- First time using Agent Inspector on a project
- User asks to "setup agent inspector" or "configure cylestio"
- Before running static or dynamic analysis (if no config exists)
- Other skills call `get_workflow_config()` and find no config

## Auto-Setup Workflow

### 1. Check for Existing Config
```
get_workflow_config()
```

If `config_found: true` → Use existing config, done.

### 2. Derive Workflow ID

If no config, derive workflow_id automatically from (in priority order):

1. **Git remote** (most stable):
   ```bash
   git remote get-url origin
   # github.com/acme/my-agent.git → workflow_id: "my-agent"
   ```

2. **Package name** (Python):
   ```python
   # pyproject.toml or setup.py
   name = "customer_support_bot"  → workflow_id: "customer-support-bot"
   ```

3. **Package name** (Node.js):
   ```json
   // package.json
   { "name": "support-agent" }  → workflow_id: "support-agent"
   ```

4. **Folder name** (fallback):
   ```bash
   basename $(pwd)
   # /Users/me/projects/my-bot → workflow_id: "my-bot"
   ```

### 3. Create Config File

Create `cylestio.yaml` in project root:

```yaml
# cylestio.yaml - Agent Inspector Configuration
# This file links your code (static analysis) with runtime behavior (dynamic analysis)

workflow_id: {derived-id}
workflow_name: {Human Readable Name}

# Optional: Define agents if you have multiple in this project
# agents:
#   - id: main-agent
#     entry_point: src/agent.py
```

### 4. Inform User

```
✓ Created cylestio.yaml with workflow_id: "{id}"

This ID will be used to:
- Link static security analysis with dynamic runtime tests
- Track findings across analysis sessions
- Show unified results in the dashboard

View results at: http://localhost:3000/workflow/{id}
```

### 5. Update Agent Code (for Dynamic Analysis)

If user's agent code doesn't already read from config, suggest updating it:

```python
# Add to agent code for dynamic testing
import yaml

with open("cylestio.yaml") as f:
    config = yaml.safe_load(f)

WORKFLOW_ID = config["workflow_id"]

client = OpenAI(
    base_url=f"http://localhost:3000/workflow/{WORKFLOW_ID}",
    api_key=os.getenv("OPENAI_API_KEY")
)
```

## ID Derivation Rules

| Source | Example | Derived ID |
|--------|---------|------------|
| Git remote | `github.com/acme/Customer-Bot.git` | `customer-bot` |
| pyproject.toml | `name = "my_agent"` | `my-agent` |
| package.json | `"name": "@acme/support"` | `support` |
| Folder | `/path/to/MyProject` | `myproject` |

**Normalization:**
- Lowercase
- Replace `_` with `-`
- Remove special characters
- Remove org prefix (`@acme/foo` → `foo`)

## MCP Tool

```
get_workflow_config(project_path?)
→ { config_found, workflow_id, workflow_name, agents, config_path }
→ If not found: { config_found: false, template: "..." }
```

