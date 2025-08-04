# Cylestio Gateway

High-performance LLM proxy server with request interception, tracing, and session management.

## Features

- **Multi-Provider Support** - OpenAI, Anthropic, and more
- **Request Tracing** - Capture and analyze LLM interactions
- **Session Tracking** - Intelligent conversation management
- **Streaming Support** - Real-time SSE responses
- **Extensible Interceptors** - Add custom logic via middleware
- **Simple Setup** - CLI or config file based configuration

## Quick Start

```bash
# Install
git clone https://github.com/cylestio/cylestio-gateway.git
cd cylestio-gateway
pip install -r requirements.txt

# Run with OpenAI
export OPENAI_API_KEY=sk-your-key
python -m src.main --base-url https://api.openai.com --type openai

# Test it
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello!"}]}'
```

## Documentation

📚 **[Full Documentation](docs/)** - Complete guides and references

### Getting Started
- [Installation Guide](docs/getting-started/installation.md)
- [Quick Start Tutorial](docs/getting-started/quick-start.md)
- [Configuration Basics](docs/getting-started/configuration.md)

### Guides
- [Docker Deployment](docs/guides/docker.md)
- [Using Interceptors](docs/guides/interceptors.md)
- [LLM Providers Setup](docs/guides/providers.md)
- [Session Tracking](docs/guides/session-tracking.md)

### Reference
- [API Endpoints](docs/api/endpoints.md)
- [CLI Options](docs/api/cli-options.md)
- [Configuration Reference](docs/api/configuration.md)

## Examples

Check out the [examples/](examples/) directory for:
- Sample configurations
- Docker compose files
- Test scripts
- Common use cases

## Development

See [CLAUDE.md](CLAUDE.md) for development guidelines.

## License

MIT License - see LICENSE file for details.