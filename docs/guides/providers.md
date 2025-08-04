# LLM Providers Guide

Configure Cylestio Gateway to work with different LLM providers.

## Supported Providers

- **OpenAI** - GPT-3.5, GPT-4, and other OpenAI models
- **Anthropic** - Claude models (Opus, Sonnet, Haiku)
- **Custom** - Any OpenAI-compatible API

## OpenAI Configuration

### Basic Setup

```bash
# CLI
python -m src.main \
  --base-url https://api.openai.com \
  --type openai \
  --api-key sk-your-key
```

### Configuration File

```yaml
llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"
  timeout: 30
```

### Supported Endpoints

- `/v1/chat/completions` - Chat completions (GPT-3.5, GPT-4)
- `/v1/completions` - Text completions
- `/v1/embeddings` - Text embeddings
- `/v1/models` - List available models

### Example Requests

```bash
# Chat completion
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'

# Streaming
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

## Anthropic Configuration

### Basic Setup

```bash
# CLI
python -m src.main \
  --base-url https://api.anthropic.com \
  --type anthropic \
  --api-key your-anthropic-key
```

### Configuration File

```yaml
llm:
  base_url: "https://api.anthropic.com"
  type: "anthropic"
  api_key: "${ANTHROPIC_API_KEY}"
  timeout: 60
```

### Supported Endpoints

- `/v1/messages` - Claude messages API
- `/v1/complete` - Legacy completions

### Example Requests

```bash
# Messages API
curl -X POST http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-opus-20240229",
    "messages": [{"role": "user", "content": "Hello Claude!"}],
    "max_tokens": 1024
  }'

# Streaming
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

## Custom Providers

### OpenAI-Compatible APIs

Many providers offer OpenAI-compatible APIs:

```yaml
# Example: Local LLM with LM Studio
llm:
  base_url: "http://localhost:1234"
  type: "openai"
  api_key: "not-needed"  # Some local models don't need keys

# Example: Azure OpenAI
llm:
  base_url: "https://your-resource.openai.azure.com"
  type: "openai"
  api_key: "${AZURE_OPENAI_KEY}"
```

### Custom Headers

Some providers require additional headers:

```yaml
llm:
  base_url: "https://custom-api.example.com"
  type: "openai"
  api_key: "${CUSTOM_API_KEY}"
  headers:
    "X-Custom-Header": "value"
    "X-API-Version": "2024-01"
```

## Provider-Specific Features

### OpenAI Functions

```json
{
  "model": "gpt-4",
  "messages": [...],
  "functions": [
    {
      "name": "get_weather",
      "description": "Get current weather",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string"}
        }
      }
    }
  ]
}
```

### Anthropic System Prompts

```json
{
  "model": "claude-3-opus-20240229",
  "system": "You are a helpful coding assistant.",
  "messages": [
    {"role": "user", "content": "Write a Python function"}
  ],
  "max_tokens": 2000
}
```

## Model Selection

### OpenAI Models

```yaml
# GPT-3.5
model: "gpt-3.5-turbo"
model: "gpt-3.5-turbo-16k"

# GPT-4
model: "gpt-4"
model: "gpt-4-turbo-preview"
model: "gpt-4-vision-preview"

# Embeddings
model: "text-embedding-3-small"
model: "text-embedding-3-large"
```

### Anthropic Models

```yaml
# Claude 3
model: "claude-3-opus-20240229"    # Most capable
model: "claude-3-sonnet-20240229"  # Balanced
model: "claude-3-haiku-20240307"   # Fastest

# Legacy
model: "claude-2.1"
model: "claude-instant-1.2"
```

## Rate Limiting and Retries

### Configuration

```yaml
llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"
  timeout: 30
  retry_attempts: 3
  retry_delay: 1.0  # seconds
```

### Provider Limits

**OpenAI:**
- Rate limits vary by tier
- Automatic retry on 429 errors
- Exponential backoff

**Anthropic:**
- Request limits per minute
- Token limits per day
- Automatic retry handling

## Error Handling

### Common Errors

```yaml
# Invalid API Key
{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}

# Rate Limit
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}

# Model Not Found
{
  "error": {
    "message": "Model 'gpt-5' not found",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

### Error Configuration

```yaml
llm:
  error_handling:
    retry_on: ["rate_limit", "timeout"]
    max_retries: 3
    backoff_factor: 2.0
```

## Testing Different Providers

### Quick Switch

```bash
# Test OpenAI
export PROVIDER=openai
python -m src.main --config configs/${PROVIDER}.yaml

# Test Anthropic
export PROVIDER=anthropic
python -m src.main --config configs/${PROVIDER}.yaml
```

### Side-by-Side

Run multiple instances on different ports:

```bash
# Terminal 1: OpenAI on port 3000
python -m src.main --type openai --port 3000

# Terminal 2: Anthropic on port 3001
python -m src.main --type anthropic --port 3001
```

## Provider Comparison

| Feature | OpenAI | Anthropic |
|---------|--------|-----------|
| Chat API | ✅ `/v1/chat/completions` | ✅ `/v1/messages` |
| Streaming | ✅ SSE | ✅ SSE |
| Functions | ✅ Native | ❌ Use tools |
| Vision | ✅ GPT-4V | ✅ Claude 3 |
| Context | 128k (GPT-4) | 200k (Claude 3) |
| Embeddings | ✅ | ❌ |

## Advanced Configuration

### Load Balancing

```yaml
# Future feature
llm:
  providers:
    - base_url: "https://api.openai.com"
      type: "openai"
      weight: 70
    - base_url: "https://api.anthropic.com"
      type: "anthropic"
      weight: 30
```

### Fallback Providers

```yaml
# Future feature
llm:
  primary:
    base_url: "https://api.openai.com"
    type: "openai"
  fallback:
    base_url: "https://api.anthropic.com"
    type: "anthropic"
```

## Monitoring Provider Usage

### Metrics Endpoint

```bash
curl http://localhost:3000/metrics
```

Returns:
- Request counts by provider
- Average response times
- Error rates
- Token usage (if available)

### Trace Analysis

```bash
# Count requests by provider
jq -r '.provider' traces/*.json | sort | uniq -c

# Average response time by provider
jq -r '[.provider, .response.duration_ms] | @tsv' traces/*.json | \
  awk '{sum[$1]+=$2; count[$1]++} END {for (p in sum) print p, sum[p]/count[p]}'
```

## Security Considerations

1. **API Key Storage**
   - Always use environment variables
   - Never commit keys to version control
   - Rotate keys regularly

2. **Network Security**
   - Use HTTPS for all provider URLs
   - Consider VPN for sensitive deployments
   - Implement IP allowlisting if available

3. **Request Validation**
   - Validate model names
   - Check token limits
   - Sanitize user inputs

## Troubleshooting

### Connection Issues

```bash
# Test provider directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check DNS
nslookup api.openai.com

# Test through gateway
curl http://localhost:3000/v1/models
```

### Authentication Errors

```bash
# Verify environment variable
echo $OPENAI_API_KEY

# Check config file
grep api_key config.yaml

# Test with curl
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "test"}]}' \
  -v
```

## Next Steps

- Configure [Session Tracking](session-tracking.md)
- Set up [Interceptors](interceptors.md) for monitoring
- Review [API Reference](../api/endpoints.md)