# Cylestio Gateway

[![CI Pipeline](https://github.com/cylestio/cylestio-perimeter/actions/workflows/ci.yml/badge.svg)](https://github.com/cylestio/cylestio-perimeter/actions/workflows/ci.yml)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A configurable Python proxy server for LLM API requests with interceptor support, built with FastAPI.

## ✨ Features

### Core Functionality
- **🔄 LLM Provider Support**: Proxy requests to OpenAI, Anthropic, and other LLM providers
- **📡 Streaming Support**: Handle Server-Sent Events (SSE) for real-time responses
- **📊 Request Tracing**: Capture and save request/response data to JSON files
- **🔍 Session Management**: Intelligent session detection using message history hashing
- **🏷️ External ID Support**: Custom session and agent IDs via `x-cylestio-*` headers
- **⚙️ Interceptor System**: Extensible interceptors for tracing, logging, and analysis
- **💻 CLI Interface**: Simple command-line interface with configuration file support
- **🐳 Docker Support**: Ready-to-use Docker containers
- **📈 Metrics Endpoint**: Monitor proxy performance and session statistics

### Live Trace & Security
- **🖥️ Live Trace Dashboard**: Real-time web UI for monitoring agent sessions and events
- **🔒 Security Analysis**: OWASP LLM Top 10 pattern detection and risk scoring
- **🕵️ PII Detection**: Automatic detection of personally identifiable information
- **🤖 MCP Integration**: AI assistant integration via Model Context Protocol


## Quick Start

### Installation

1. **Install through pip:**

   ```bash
   pip install cylestio-perimeter
   ```

1. **For Developers: Install directly from source code:**
   ```bash
   git clone https://github.com/cylestio/cylestio-perimeter.git
   cd cylestio-perimeter
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install the package in development mode
   pip install -e .
   ```

2. **Run the server:**
   ```bash
   # With CLI arguments
   cylestio-perimeter run --base-url https://api.openai.com --type openai --api-key sk-your-key
   
   # With config file
   cylestio-perimeter run --config config.yaml
   ```

3. **Or run with config file:**
   ```bash
   python -m src.main --config config.yaml
   ```


### Docker Usage

1. **Using docker-compose (recommended):**
   ```bash
   # Set environment variables
   export LLM_BASE_URL=https://api.openai.com
   export LLM_TYPE=openai
   export LLM_API_KEY=sk-your-key-here
   
   # Start the service
   docker-compose up -d
   ```

2. **Using Docker directly:**
   ```bash
   docker build -t llm-proxy .
   docker run -p 4000:4000 -e LLM_BASE_URL=https://api.openai.com -e LLM_TYPE=openai -e LLM_API_KEY=sk-your-key llm-proxy
   ```

## Usage Examples

### Basic Proxy Usage
```bash
# Start proxy server
cylestio-perimeter run --base-url https://api.openai.com --type openai --api-key sk-your-key

# Make requests to the proxy
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello!"}]}'
```

### Streaming Requests
```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello!"}], "stream": true}'
```

### With Configuration File
```yaml
# config.yaml
server:
  port: 4000
  host: "0.0.0.0"

llm:
  base_url: "https://api.openai.com"
  type: "openai"
  api_key: "sk-your-key-here"

interceptors:
  - type: "printer"
    enabled: true
    config:
      log_requests: true
      log_responses: true
```

### External ID Headers
The gateway supports custom session and agent identification via headers:

```bash
# Custom session ID
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "x-cylestio-session-id: my-session-123" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello!"}]}'

# Custom agent ID
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "x-cylestio-agent-id: math-tutor-v2" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "What is 2+2?"}]}'

# Both custom session and agent ID
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "x-cylestio-session-id: user-session-456" \
  -H "x-cylestio-agent-id: customer-support-bot" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Help me reset my password"}]}'
```

See [External Agent ID Documentation](docs/external-agent-id.md) for complete details.

## CLI Commands

The CLI supports several subcommands for different operations:

### Run the Server
```bash
cylestio-perimeter run --base-url https://api.openai.com --type openai --api-key sk-your-key
cylestio-perimeter run --config config.yaml
```

### Generate Example Config
```bash
cylestio-perimeter generate-config example.yaml
```

### Validate Configuration
```bash
cylestio-perimeter validate-config config.yaml
```

### Replay Recorded Traffic
```bash
cylestio-perimeter replay recordings/ --config config.yaml --delay 0.5
```

### Get Help
```bash
cylestio-perimeter --help
cylestio-perimeter run --help
```

### Development Mode
```bash
uvicorn src.main:app --reload --port 4000
```

## Configuration

### CLI Options
- `--base-url`: Base URL of target LLM API (required)
- `--type`: LLM provider type (required)
- `--api-key`: API key to inject into requests
- `--port`: Proxy server port (default: 4000)
- `--host`: Server host (default: 0.0.0.0)
- `--log-level`: Logging level (INFO, DEBUG, etc.)
- `--config`: Path to YAML configuration file

### Interceptor Configuration

Available interceptors that can be enabled in your config file:

| Interceptor | Description |
|-------------|-------------|
| `printer` | Logs requests/responses to console |
| `message_logger` | Saves LLM conversations to JSONL files |
| `event_recorder` | Records raw events per session |
| `http_recorder` | Records HTTP traffic for replay testing |
| `cylestio_trace` | Sends events to Cylestio platform |
| `live_trace` | Real-time dashboard with security analysis |

#### Printer Interceptor
```yaml
interceptors:
  - type: "printer"
    enabled: true
    config:
      log_requests: true
      log_responses: true
      log_body: false
```

#### Live Trace Interceptor
```yaml
interceptors:
  - type: "live_trace"
    enabled: true
    config:
      server_port: 7100
      auto_open_browser: true
      storage_mode: "sqlite"  # "memory" (default) or "sqlite" for persistence
      enable_presidio: true   # PII detection
```

## Testing

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src

# Run specific tests
pytest tests/test_config.py -v
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /metrics` - Metrics endpoint with session statistics
- `GET /config` - Current server configuration and interceptor status
- `/{path:path}` - Catch-all proxy route (all HTTP methods)

**Live Trace endpoints** (when enabled):
- `GET /api/dashboard` - Dashboard data with agents and sessions
- `GET /api/agent/{id}` - Agent details with risk analysis
- `GET /api/session/{id}` - Session timeline with events
- `POST /mcp` - MCP protocol endpoint (SSE) for AI assistants

## Session Management

The proxy includes intelligent session detection that tracks conversations across multiple requests:

- **Hash-based Tracking**: Uses message history hashing to identify unique conversations
- **LRU Cache**: Maintains up to 10,000 sessions with automatic eviction
- **Session TTL**: Sessions expire after 1 hour of inactivity
- **Fuzzy Matching**: Detects continued conversations even with slight variations
- **Multiple Heuristics**: Identifies new sessions based on message count and reset phrases

### Session Configuration

```yaml
session:
  enabled: true
  max_sessions: 10000
  session_ttl_seconds: 3600
```

### Monitoring Sessions

Access session metrics via the `/metrics` endpoint:

```bash
curl http://localhost:4000/metrics
```

Response includes:
- Active sessions count
- Cache hit/miss rates
- Session creation rate
- Fuzzy match statistics

## Live Trace Dashboard

When the `live_trace` interceptor is enabled, a real-time web dashboard is available for monitoring agent activity.

### Features
- **Real-time Monitoring**: View active sessions and events as they happen
- **Security Analysis**: Automatic OWASP LLM Top 10 pattern detection
- **PII Detection**: Identify personally identifiable information in requests/responses
- **Risk Scoring**: Aggregate security scores for agents and sessions
- **MCP Integration**: AI assistants can query data via the `/mcp` endpoint

### Quick Start
```yaml
interceptors:
  - type: "live_trace"
    enabled: true
    config:
      server_port: 7100        # Dashboard port
      auto_open_browser: true  # Open browser on startup
      storage_mode: "sqlite"   # Persistent storage
```

Access the dashboard at `http://localhost:7100` after starting the server.

## Environment Variables

- `LLM_BASE_URL` - Base URL for LLM provider
- `LLM_TYPE` - LLM provider type
- `LLM_API_KEY` - API key for authentication
- `LOG_LEVEL` - Logging level (INFO, DEBUG, etc.)

## Security

Cylestio Gateway implements comprehensive security measures to ensure safe deployment in enterprise environments.

[![Security Pipeline](https://github.com/cylestio/cylestio-perimeter/actions/workflows/security.yml/badge.svg)](https://github.com/cylestio/cylestio-perimeter/actions/workflows/security.yml)
[![Known Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0-brightgreen.svg)](https://github.com/cylestio/cylestio-perimeter/actions/workflows/security.yml)
[![Dependencies](https://img.shields.io/badge/dependencies-secure-brightgreen.svg)](https://github.com/cylestio/cylestio-perimeter/actions/workflows/security.yml)

**Security Measures:**
- **Automated Vulnerability Scanning**: Every release is scanned for known security issues
- **Dependency Security**: All third-party packages are continuously monitored for vulnerabilities  
- **Static Code Analysis**: Source code is analyzed for security vulnerabilities using industry-standard tools
- **Secret Detection**: Pre-commit hooks prevent accidental credential exposure
- **Supply Chain Security**: Complete Software Bill of Materials (SBOM) provides full transparency
- **License Compliance**: Automated scanning ensures only approved licenses are used

**Documentation:** [Security Policy](SECURITY.md)

## Development

### Setting Up Development Environment

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Set up pre-commit hooks (includes security scanning)
pre-commit install

# Run tests with coverage
pytest --cov=src

# Run security checks locally
pre-commit run --all-files
```

### Security Development Practices

1. **Never commit secrets** - Use environment variables for all credentials
2. **Run pre-commit hooks** - Automated security checks before each commit
3. **Review security reports** - Check CI security scan results
4. **Follow secure coding** - Follow standard Python security best practices

See [CLAUDE.md](CLAUDE.md) for detailed development guidance and architecture information.

## License

This project is developed according to the specifications in [INSTRUCTIONS.md](INSTRUCTIONS.md).