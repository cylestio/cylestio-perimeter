# API Endpoints Reference

Complete reference for all API endpoints available in Cylestio Gateway.

## Health Check

### GET /health

Health check endpoint for monitoring and load balancer health checks.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "llm-proxy",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "uptime_seconds": 3600
}
```

## Metrics

### GET /metrics

Returns detailed metrics about proxy performance and session statistics.

**Request:**
```bash
curl http://localhost:3000/metrics
```

**Response:**
```json
{
  "service": {
    "name": "cylestio-gateway",
    "version": "1.0.0",
    "uptime_seconds": 3600,
    "start_time": "2024-01-20T09:30:45.123Z"
  },
  "requests": {
    "total": 1247,
    "success": 1198,
    "errors": 49,
    "rate_per_minute": 15.2,
    "average_duration_ms": 1234
  },
  "sessions": {
    "active_count": 156,
    "total_created": 423,
    "cache_hit_rate": 0.847,
    "fuzzy_matches": 34,
    "average_session_length": 8.5
  },
  "providers": {
    "openai": {
      "requests": 980,
      "errors": 12,
      "average_duration_ms": 1100
    },
    "anthropic": {
      "requests": 267,
      "errors": 5,
      "average_duration_ms": 1800
    }
  },
  "interceptors": {
    "trace": {
      "enabled": true,
      "traces_written": 1247
    },
    "printer": {
      "enabled": true,
      "logs_written": 1247
    }
  }
}
```

## Configuration

### GET /config

Returns current server configuration and middleware status.

**Request:**
```bash
curl http://localhost:3000/config
```

**Response:**
```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 3000,
    "workers": 1
  },
  "llm": {
    "type": "openai",
    "base_url": "https://api.openai.com",
    "timeout": 30
  },
  "session": {
    "enabled": true,
    "max_sessions": 10000,
    "session_ttl_seconds": 3600
  },
  "interceptors": [
    {
      "type": "printer",
      "enabled": true
    },
    {
      "type": "trace",
      "enabled": true
    }
  ],
  "logging": {
    "level": "INFO",
    "format": "console"
  }
}
```

## Proxy Endpoints

### Catch-All Proxy Route

**Pattern:** `/{path:path}`
**Methods:** All HTTP methods (GET, POST, PUT, DELETE, etc.)

Proxies all requests to the configured LLM provider.

### OpenAI Endpoints

When configured with `type: "openai"`:

#### POST /v1/chat/completions

Chat completions API for conversational AI.

**Request:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1000
  }'
```

**Streaming Request:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

#### POST /v1/completions

Text completions API.

**Request:**
```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo-instruct",
    "prompt": "Once upon a time",
    "max_tokens": 100
  }'
```

#### POST /v1/embeddings

Text embeddings API.

**Request:**
```bash
curl -X POST http://localhost:3000/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "The food was delicious and the waiter..."
  }'
```

#### GET /v1/models

List available models.

**Request:**
```bash
curl http://localhost:3000/v1/models
```

### Anthropic Endpoints

When configured with `type: "anthropic"`:

#### POST /v1/messages

Claude messages API.

**Request:**
```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-opus-20240229",
    "messages": [
      {"role": "user", "content": "Hello Claude!"}
    ],
    "max_tokens": 1024
  }'
```

**Streaming Request:**
```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [{"role": "user", "content": "Write a poem"}],
    "max_tokens": 500,
    "stream": true
  }'
```

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": {
    "message": "Description of the error",
    "type": "error_type",
    "code": "error_code",
    "details": {}
  },
  "timestamp": "2024-01-20T10:30:45.123Z",
  "request_id": "req_abc123"
}
```

### Common Error Codes

#### 400 Bad Request
```json
{
  "error": {
    "message": "Invalid request format",
    "type": "invalid_request_error",
    "code": "bad_request"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "message": "Invalid API key provided",
    "type": "authentication_error",
    "code": "invalid_api_key"
  }
}
```

#### 429 Rate Limited
```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded",
    "details": {
      "retry_after": 60
    }
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal server error",
    "type": "server_error",
    "code": "internal_error"
  }
}
```

#### 502 Bad Gateway
```json
{
  "error": {
    "message": "Error communicating with LLM provider",
    "type": "provider_error",
    "code": "bad_gateway"
  }
}
```

## Streaming Responses

### Server-Sent Events (SSE)

When `stream: true` is specified, responses use SSE format:

```
data: {"choices": [{"delta": {"content": "Hello"}}]}

data: {"choices": [{"delta": {"content": " there!"}}]}

data: [DONE]

```

### Handling Streaming

**JavaScript Example:**
```javascript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{role: 'user', content: 'Hello'}],
    stream: true
  })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = new TextDecoder().decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const json = JSON.parse(data);
      console.log(json.choices[0].delta.content);
    }
  }
}
```

**curl Example:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Count to 5"}],"stream":true}' \
  --no-buffer
```

## Request Headers

### Required Headers
- `Content-Type: application/json` (for POST requests)

### Optional Headers
- `Authorization: Bearer token` (if not using config API key)
- `anthropic-version: 2023-06-01` (for Anthropic requests)
- `User-Agent: your-app/1.0.0`

### Custom Headers
Any additional headers are passed through to the LLM provider.

## Response Headers

### Standard Headers
- `Content-Type: application/json` or `text/event-stream`
- `X-Request-ID: req_abc123` (for request tracking)
- `X-Session-ID: sess_def456` (if session tracking enabled)
- `X-Provider: openai` (which provider handled the request)

### Provider Headers
Headers from the LLM provider are passed through, including:
- `X-RateLimit-*` headers
- `X-Request-ID` from provider
- Custom provider headers

## Rate Limiting

### Provider Rate Limits
Rate limits are enforced by the LLM provider and passed through:

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error"
  }
}
```

Response includes headers:
- `X-RateLimit-Limit: 1000`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1642684800`

## Authentication

### API Key in Configuration
When API key is configured, no additional authentication needed:

```yaml
llm:
  api_key: "${OPENAI_API_KEY}"
```

### API Key in Request
Override configured key with request header:

```bash
curl -H "Authorization: Bearer sk-different-key" \
     http://localhost:3000/v1/chat/completions
```

## CORS Support

CORS is enabled by default for web applications:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## WebSocket Support

Currently not supported. Use SSE for real-time streaming.

## Next Steps

- Review [CLI Options](cli-options.md) for command-line usage
- Check [Configuration Reference](configuration.md) for all options
- Learn about [Session Tracking](../guides/session-tracking.md)