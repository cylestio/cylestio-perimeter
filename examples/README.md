# LLM Proxy Server Examples

This directory contains example configurations, scripts, and Docker setups to help you get started with the LLM Proxy Server.

## 📁 Directory Structure

```
examples/
├── configs/           # Configuration files for different scenarios
├── scripts/          # Testing and demonstration scripts
├── docker/           # Docker deployment examples
└── README.md         # This file
```

## 🚀 Quick Start Examples

### 1. Basic OpenAI Setup

```bash
# Set your API key
export OPENAI_API_KEY=sk-your-key-here

# Run with basic OpenAI config
python -m src.main --config examples/configs/openai-basic.yaml

# Test it (in another terminal)
./examples/scripts/curl-examples.sh
```

### 2. Development Setup with Debug Logging

```bash
export OPENAI_API_KEY=sk-your-key-here
python -m src.main --config examples/configs/development.yaml
```

### 3. Production Setup with Full Tracing

```bash
export OPENAI_API_KEY=sk-your-key-here
python -m src.main --config examples/configs/production.yaml
```

## 📋 Configuration Examples

### `configs/openai-basic.yaml`
- Basic OpenAI setup with printer middleware
- Good for getting started
- Minimal logging

### `configs/openai-with-tracing.yaml`
- Full request/response tracing to files
- Console logging enabled
- Perfect for debugging and monitoring

### `configs/anthropic-basic.yaml`
- Basic Anthropic Claude setup
- Printer middleware for console output
- Works with Claude 3 models

### `configs/development.yaml`
- Debug-level logging
- Disabled tracing for speed
- Local-only binding (127.0.0.1)
- Fast fail configuration

### `configs/production.yaml`
- Multi-worker setup
- JSON logging for structured output
- File-based logging with rotation
- Enhanced tracing with larger limits

## 🧪 Testing Scripts

### Python Scripts

**`scripts/test-openai.py`**
```bash
# Make sure proxy is running first
python -m src.main --config examples/configs/openai-basic.yaml

# Then run the test
python examples/scripts/test-openai.py
```

**`scripts/test-anthropic.py`**
```bash
# Configure for Anthropic
python -m src.main --config examples/configs/anthropic-basic.yaml

# Run Anthropic tests
python examples/scripts/test-anthropic.py
```

### cURL Examples

**`scripts/curl-examples.sh`**
```bash
# Start proxy server
python -m src.main --config examples/configs/openai-basic.yaml

# Run curl tests
./examples/scripts/curl-examples.sh
```

This script tests:
- Health check endpoint
- OpenAI chat completions (regular & streaming)
- Anthropic messages (regular & streaming)

## 🐳 Docker Examples

### Quick Docker Setup

1. **Copy environment file:**
   ```bash
   cp examples/docker/.env.example examples/docker/.env
   # Edit .env with your API keys
   ```

2. **Run with OpenAI:**
   ```bash
   cd examples/docker
   docker-compose -f docker-compose.openai.yml up -d
   ```

3. **Run with Anthropic:**
   ```bash
   cd examples/docker
   docker-compose -f docker-compose.anthropic.yml up -d
   ```

### Docker Environment Variables

Set these in your `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-your-openai-key-here
# OR
ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional
LOG_LEVEL=INFO
SERVER_PORT=4000
```

## 💡 Usage Patterns

### 1. Local Development
```bash
# Start development server
python -m src.main --config examples/configs/development.yaml

# Make requests
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello!"}]}'
```

### 2. Production Deployment
```bash
# Production server with full logging
python -m src.main --config examples/configs/production.yaml

# Check logs
tail -f /var/log/llm-proxy/app.log

# View traces
ls -la /var/log/llm-proxy/traces/
```

### 3. Testing Different Providers

**Switch between providers:**
```bash
# OpenAI
export OPENAI_API_KEY=sk-...
python -m src.main --config examples/configs/openai-basic.yaml

# Anthropic (in different terminal)
export ANTHROPIC_API_KEY=...
python -m src.main --config examples/configs/anthropic-basic.yaml --port 3001
```

### 4. Trace Analysis
```bash
# Run with tracing enabled
python -m src.main --config examples/configs/openai-with-tracing.yaml

# Make some requests
python examples/scripts/test-openai.py

# Check captured traces
ls -la traces/
cat traces/trace-*.json | jq .
```

## 🔧 Environment Variables

All configs support environment variable substitution:

```yaml
llm:
  api_key: "${OPENAI_API_KEY}"  # Reads from environment
  base_url: "${LLM_BASE_URL:-https://api.openai.com}"  # With default
```

Common variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `LLM_BASE_URL` - Override base URL
- `LOG_LEVEL` - Set logging level (DEBUG, INFO, WARNING, ERROR)

## 📊 Monitoring

### Health Checks
```bash
curl http://localhost:4000/health
# Returns: {"status": "healthy", "service": "llm-proxy"}
```

### Trace Files
When tracing is enabled, check the `traces/` directory:
```bash
# List recent traces
ls -lt traces/ | head -5

# View a trace
cat traces/trace-2024-01-15T14-30-45-123Z.json | jq .
```

### Logs
Production setup logs to files:
```bash
# Application logs
tail -f /var/log/llm-proxy/app.log

# Trace directory
ls -la /var/log/llm-proxy/traces/
```

## 🎯 Next Steps

1. **Choose a configuration** that matches your use case
2. **Set your API keys** as environment variables
3. **Start the proxy server** with your chosen config
4. **Test with the provided scripts** to verify everything works
5. **Check the traces/** directory to see captured requests
6. **Customize the configuration** for your specific needs

For more detailed information, see the main [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md) files.