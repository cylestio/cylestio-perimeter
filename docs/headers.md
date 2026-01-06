# Cylestio Gateway Headers

## Overview

The Cylestio Gateway supports several custom HTTP headers for controlling request identification, grouping, and metadata. All `x-cylestio-*` headers are automatically stripped before forwarding requests to LLM providers.

## Headers Reference

| Header | Purpose | Auto-generated if not provided |
|--------|---------|-------------------------------|
| `x-cylestio-prompt-id` | Override auto-detected prompt pattern | Yes (computed from system prompt) |
| `x-cylestio-conversation-id` | Override conversation/thread ID | Yes (auto-generated UUID) |
| `x-cylestio-session-id` | Group conversations from one workflow execution | No |
| `x-cylestio-tags` | Arbitrary key:value metadata | No |

## Header Details

### x-cylestio-prompt-id

Override the auto-detected prompt pattern identifier (internally called `agent_id`). The gateway normally computes this from the system prompt hash, but you can provide your own identifier.

```bash
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "x-cylestio-prompt-id: math-tutor-v2" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

**Use cases:**
- Consistent identification across system prompt variations
- Meaningful names for analytics ("customer-support-bot" vs "prompt-abc123")
- Version tracking ("code-reviewer-v1", "code-reviewer-v2")

### x-cylestio-conversation-id

Override the auto-generated conversation/thread ID (internally called `session_id`). The gateway normally generates a UUID for each new conversation, but you can provide your own.

```bash
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "x-cylestio-conversation-id: conv-12345" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

**Use cases:**
- Continue a conversation across API calls
- Integrate with your existing session management
- Maintain conversation state in distributed systems

### x-cylestio-session-id

Group multiple conversations/LLM calls that belong to a single workflow execution. This is stored as a `session` tag and can be used for filtering.

```bash
# All three API calls share the same session ID
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "x-cylestio-session-id: run-abc123" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Classify this: ..."}]}'

curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "x-cylestio-session-id: run-abc123" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Retrieve context for: ..."}]}'

curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "x-cylestio-session-id: run-abc123" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Generate response: ..."}]}'
```

**Use cases:**
- Track multi-step workflows (classifier → retriever → generator)
- Group all LLM calls from one user request
- Filter and analyze workflow-level metrics

### x-cylestio-tags

Attach arbitrary key:value metadata to conversations. Multiple tags are comma-separated.

**Format:** `key1:value1,key2:value2,...`

```bash
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "x-cylestio-tags: user:alice@example.com,env:production,team:backend" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

**Tag formats:**
- `key:value` - Standard key-value pair
- `key` - Boolean tag (stored as `key: "true"`)

**Limits:**
- Max 50 tags per request
- Max 64 characters per key
- Max 512 characters per value

**Special characters:**
- Values can contain colons (split on first colon only)
- Whitespace is trimmed from keys and values

**Use cases:**
- User identification for analytics
- Environment tagging (dev/staging/prod)
- Team or project attribution
- Custom metadata for filtering

## Combined Usage Example

```bash
curl -X POST "http://localhost:4000/agent-workflow/my-project/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "x-cylestio-prompt-id: code-reviewer-v2" \
  -H "x-cylestio-conversation-id: conv-unique-123" \
  -H "x-cylestio-session-id: workflow-run-456" \
  -H "x-cylestio-tags: user:alice@example.com,env:production" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a code reviewer."},
      {"role": "user", "content": "Review this code: ..."}
    ]
  }'
```

## Python Example

```python
import httpx

# Configure headers for all requests
headers = {
    "Content-Type": "application/json",
    "x-cylestio-prompt-id": "data-analyst-v1",
    "x-cylestio-tags": "user:alice,team:analytics"
}

# For each workflow run, add session ID
workflow_headers = {
    **headers,
    "x-cylestio-session-id": f"run-{uuid.uuid4()}"
}

async with httpx.AsyncClient(
    base_url="http://localhost:4000/agent-workflow/my-project",
    headers=workflow_headers
) as client:
    # Multiple LLM calls in the same workflow run
    response1 = await client.post("/v1/chat/completions", json={...})
    response2 = await client.post("/v1/chat/completions", json={...})
```

## JavaScript Example

```javascript
const workflowHeaders = {
  'Content-Type': 'application/json',
  'x-cylestio-prompt-id': 'customer-support-bot',
  'x-cylestio-session-id': `run-${crypto.randomUUID()}`,
  'x-cylestio-tags': 'user:customer@example.com,channel:web'
};

const response = await fetch('http://localhost:4000/agent-workflow/support/v1/chat/completions', {
  method: 'POST',
  headers: workflowHeaders,
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [...]
  })
});
```

## Filtering by Tags

### API

```
GET /api/sessions/list?tag=user:alice
GET /api/sessions/list?tag=env:production
GET /api/sessions/list?tag=session:run-abc123
```

### Tag Filter Format
- `key:value` - Match exact key-value pair
- `key` - Match any session with this tag key (any value)

## Header Security

All `x-cylestio-*` headers are automatically stripped before forwarding requests to LLM providers (OpenAI, Anthropic, etc.). This ensures:
- No internal metadata leaks to external services
- Clean request forwarding
- Consistent behavior across providers

## Migration from Previous Headers

If you were using the previous header names:

| Old Header | New Header |
|------------|------------|
| `x-cylestio-agent-id` | `x-cylestio-prompt-id` |
| `x-cylestio-session-id` | `x-cylestio-conversation-id` |
| *(new)* | `x-cylestio-session-id` (for workflow grouping) |

The old header names will continue to work temporarily for backward compatibility, but please migrate to the new names.
