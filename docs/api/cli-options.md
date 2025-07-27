# CLI Options Reference

Complete reference for all command-line options available in Cylestio Gateway.

## Basic Usage

```bash
python -m src.main [OPTIONS]
```

## Core Options

### --base-url
**Required** (unless using --config)

Base URL of the target LLM API.

```bash
python -m src.main --base-url https://api.openai.com
python -m src.main --base-url https://api.anthropic.com
python -m src.main --base-url http://localhost:1234  # Local LLM
```

### --type
**Required** (unless using --config)

LLM provider type.

**Supported values:**
- `openai` - OpenAI API
- `anthropic` - Anthropic Claude API

```bash
python -m src.main --type openai
python -m src.main --type anthropic
```

### --api-key
**Optional**

API key to inject into requests. Can also be set via environment variables.

```bash
python -m src.main --api-key sk-your-openai-key
python -m src.main --api-key your-anthropic-key

# Prefer environment variables for security
export OPENAI_API_KEY=sk-your-key
python -m src.main --base-url https://api.openai.com --type openai
```

## Server Options

### --port
**Default:** 3000

Port for the proxy server to listen on.

```bash
python -m src.main --port 8080
python -m src.main --port 3001  # Alternative port
```

### --host
**Default:** 0.0.0.0

Host address to bind the server to.

```bash
python -m src.main --host 127.0.0.1  # Localhost only
python -m src.main --host 0.0.0.0    # All interfaces
```

### --workers
**Default:** 1

Number of worker processes for production deployment.

```bash
python -m src.main --workers 4
python -m src.main --workers 8  # For high traffic
```

### --reload
**Default:** false

Enable auto-reload on code changes (development only).

```bash
python -m src.main --reload  # Development mode
```

## Configuration Options

### --config
**Optional**

Path to YAML configuration file. When used, file settings override CLI arguments.

```bash
python -m src.main --config config.yaml
python -m src.main --config /path/to/config.yaml
python -m src.main --config configs/production.yaml
```

### --generate-config
**Action**

Generate an example configuration file.

```bash
python -m src.main --generate-config example.yaml
python -m src.main --generate-config config.yaml
```

**Generated file example:**
```yaml
server:
  host: "0.0.0.0"
  port: 3000
  workers: 1

llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "${OPENAI_API_KEY}"
  timeout: 30

logging:
  level: "INFO"
  format: "console"

interceptors:
  - type: "printer"
    enabled: true
  - type: "trace"
    enabled: false
    config:
      directory: "./traces"
```

### --validate-config
**Action**

Validate a configuration file without starting the server.

```bash
python -m src.main --validate-config config.yaml
```

**Output:**
```
✓ Configuration is valid
✓ All required fields present
✓ LLM provider configuration valid
✓ Interceptor configurations valid
```

## Logging Options

### --log-level
**Default:** INFO

Set the logging level.

**Values:**
- `DEBUG` - Detailed debug information
- `INFO` - General information
- `WARNING` - Warning messages only
- `ERROR` - Error messages only

```bash
python -m src.main --log-level DEBUG
python -m src.main --log-level ERROR
```

### --log-format
**Default:** console

Logging output format.

**Values:**
- `console` - Human-readable console output
- `json` - Structured JSON logging

```bash
python -m src.main --log-format json     # For production
python -m src.main --log-format console  # For development
```

### --log-file
**Optional**

Write logs to a file instead of console.

```bash
python -m src.main --log-file /var/log/cylestio/gateway.log
python -m src.main --log-file logs/debug.log
```

## Help and Version

### --help, -h
**Action**

Show help message with all available options.

```bash
python -m src.main --help
python -m src.main -h
```

### --version
**Action**

Show version information.

```bash
python -m src.main --version
```

## Example Commands

### Basic OpenAI Proxy
```bash
python -m src.main \
  --base-url https://api.openai.com \
  --type openai \
  --api-key sk-your-key
```

### Anthropic with Custom Port
```bash
python -m src.main \
  --base-url https://api.anthropic.com \
  --type anthropic \
  --api-key your-key \
  --port 8080
```

### Development Mode
```bash
python -m src.main \
  --config configs/development.yaml \
  --reload \
  --log-level DEBUG
```

### Production Mode
```bash
python -m src.main \
  --config configs/production.yaml \
  --workers 4 \
  --log-format json \
  --log-file /var/log/cylestio/gateway.log
```

### Local LLM
```bash
python -m src.main \
  --base-url http://localhost:1234 \
  --type openai \
  --port 3000
```

## Environment Variables

CLI options can be set via environment variables:

| CLI Option | Environment Variable | Example |
|------------|---------------------|----------|
| `--base-url` | `LLM_BASE_URL` | `export LLM_BASE_URL=https://api.openai.com` |
| `--type` | `LLM_TYPE` | `export LLM_TYPE=openai` |
| `--api-key` | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | `export OPENAI_API_KEY=sk-key` |
| `--port` | `SERVER_PORT` | `export SERVER_PORT=3000` |
| `--host` | `SERVER_HOST` | `export SERVER_HOST=0.0.0.0` |
| `--log-level` | `LOG_LEVEL` | `export LOG_LEVEL=DEBUG` |

**Example with environment variables:**
```bash
export LLM_BASE_URL=https://api.openai.com
export LLM_TYPE=openai
export OPENAI_API_KEY=sk-your-key
export SERVER_PORT=3000
export LOG_LEVEL=INFO

python -m src.main  # Uses environment variables
```

## Configuration Priority

Settings are applied in this order (later overrides earlier):

1. **Default values**
2. **Environment variables**
3. **Configuration file** (--config)
4. **CLI arguments**

**Example:**
```bash
# 1. Default port: 3000
# 2. Environment: SERVER_PORT=8080
# 3. Config file: port: 9000
# 4. CLI: --port 7000
# Result: Server runs on port 7000

export SERVER_PORT=8080
python -m src.main --config config.yaml --port 7000
```

## Validation

### Required Combinations

**Method 1: CLI arguments**
```bash
# Both required
python -m src.main --base-url URL --type TYPE
```

**Method 2: Configuration file**
```bash
# Config file must contain llm.base_url and llm.type
python -m src.main --config config.yaml
```

**Method 3: Environment + CLI**
```bash
export LLM_BASE_URL=https://api.openai.com
export LLM_TYPE=openai
python -m src.main  # Minimal CLI
```

### Validation Errors

**Missing required options:**
```bash
python -m src.main --type openai
# Error: --base-url is required when not using --config
```

**Invalid type:**
```bash
python -m src.main --type invalid --base-url https://api.openai.com
# Error: Invalid LLM type 'invalid'. Supported: openai, anthropic
```

**Invalid port:**
```bash
python -m src.main --port 99999
# Error: Port must be between 1 and 65535
```

## Advanced Usage

### Multiple Instances
```bash
# Run multiple gateways on different ports
python -m src.main --config openai.yaml --port 3000 &
python -m src.main --config anthropic.yaml --port 3001 &
```

### Docker Integration
```bash
# Pass CLI options to Docker
docker run cylestio/gateway \
  --base-url https://api.openai.com \
  --type openai \
  --port 3000
```

### Systemd Service
```ini
# /etc/systemd/system/cylestio-gateway.service
[Unit]
Description=Cylestio Gateway
After=network.target

[Service]
Type=exec
User=cylestio
WorkingDirectory=/opt/cylestio-gateway
ExecStart=/opt/cylestio-gateway/venv/bin/python -m src.main --config /etc/cylestio/gateway.yaml
Restart=always

[Install]
WantedBy=multi-user.target
```

## Debugging CLI Issues

### Show Effective Configuration
```bash
# Add --validate-config to see final configuration
python -m src.main --config config.yaml --validate-config
```

### Verbose Logging
```bash
# Enable debug logging to troubleshoot
python -m src.main --log-level DEBUG --config config.yaml
```

### Test Configuration
```bash
# Validate without starting server
python -m src.main --config config.yaml --validate-config

# Generate example to compare
python -m src.main --generate-config test.yaml
```

## Next Steps

- Review [Configuration Reference](configuration.md) for YAML options
- Check [Getting Started](../getting-started/quick-start.md) for examples
- Learn about [Environment Variables](../getting-started/configuration.md#environment-variables)