# Quick Start Guide

Get Cylestio Gateway running in 5 minutes!

## 1. Basic Setup (2 minutes)

```bash
# Clone and enter the project
git clone https://github.com/cylestio/cylestio-gateway.git
cd cylestio-gateway

# Set up Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## 2. Start the Gateway (1 minute)

### Option A: OpenAI Proxy
```bash
# Set your API key
export OPENAI_API_KEY=sk-your-key-here

# Start the gateway
python -m src.main --base-url https://api.openai.com --type openai
```

### Option B: Anthropic Proxy
```bash
# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Start the gateway
python -m src.main --base-url https://api.anthropic.com --type anthropic
```

The gateway is now running at `http://localhost:3000`!

## 3. Test It Out (2 minutes)

### Test Health Endpoint
```bash
curl http://localhost:3000/health
# Response: {"status": "healthy", "service": "llm-proxy"}
```

### Make Your First Request

#### OpenAI Example
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello!"}]
  }'
```

#### Anthropic Example
```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "messages": [{"role": "user", "content": "Say hello!"}],
    "max_tokens": 100
  }'
```

## 4. Enable Request Tracing

Want to see what's happening? Use a config file:

```yaml
# quick-start-config.yaml
server:
  port: 3000

llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"

interceptors:
  - type: "printer"
    enabled: true
  - type: "trace"
    enabled: true
    config:
      directory: "./traces"
```

Run with config:
```bash
python -m src.main --config quick-start-config.yaml
```

Now check the `traces/` directory to see captured requests!

## 5. What's Next?

### Try Streaming
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Count to 5"}],
    "stream": true
  }'
```

### Check Metrics
```bash
curl http://localhost:3000/metrics
```

### Explore Examples
```bash
# Run example scripts
python examples/scripts/test-openai.py

# Try different configs
python -m src.main --config examples/configs/openai-with-tracing.yaml
```

## Common Quick Start Issues

### "API key not found"
```bash
# Make sure to export your API key
export OPENAI_API_KEY=sk-your-key-here
# OR
export ANTHROPIC_API_KEY=your-key-here
```

### "Port already in use"
```bash
# Use a different port
python -m src.main --port 3001 --base-url https://api.openai.com --type openai
```

### "Module not found"
```bash
# Ensure virtual environment is activated
which python  # Should show venv/bin/python

# Reinstall dependencies
pip install -r requirements.txt
```

## Learn More

- [Configuration Guide](configuration.md) - Customize your setup
- [Interceptors Guide](../guides/interceptors.md) - Add logging and tracing
- [Docker Guide](../guides/docker.md) - Deploy with Docker
- [API Reference](../api/endpoints.md) - All available endpoints