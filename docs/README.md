# Cylestio Gateway Documentation

Welcome to the Cylestio Gateway documentation! This gateway is a high-performance LLM proxy server that sits between your applications and LLM providers, offering request interception, tracing, and session management capabilities.

## 📚 Documentation Overview

### Getting Started
New to Cylestio Gateway? Start here:
- [Installation](getting-started/installation.md) - Set up the gateway in your environment
- [Quick Start](getting-started/quick-start.md) - Get running in 5 minutes
- [Configuration Basics](getting-started/configuration.md) - Understanding config files

### User Guides
Learn how to use specific features:
- [Docker Deployment](guides/docker.md) - Deploy with Docker and docker-compose
- [Interceptors](guides/interceptors.md) - Add middleware for logging, tracing, and more
- [LLM Providers](guides/providers.md) - Configure OpenAI, Anthropic, and other providers
- [Session Tracking](guides/session-tracking.md) - Track conversations and user sessions

### API Reference
Detailed technical references:
- [REST Endpoints](api/endpoints.md) - Health, metrics, and proxy endpoints
- [CLI Options](api/cli-options.md) - Command-line interface reference
- [Configuration Reference](api/configuration.md) - Complete config file options

### Development
For contributors and developers:
- [Architecture](development/architecture.md) - System design and components
- [Contributing](development/contributing.md) - Development setup and guidelines
- [Testing](development/testing.md) - Running and writing tests
- [Roadmap](development/roadmap.md) - Future features and improvements

## 🔍 Quick Links

- **Need help?** Start with the [Quick Start Guide](getting-started/quick-start.md)
- **Deploying to production?** See [Docker Deployment](guides/docker.md)
- **Want to add custom logic?** Check out [Interceptors](guides/interceptors.md)
- **Contributing?** Read the [Contributing Guide](development/contributing.md)

## 📦 What is Cylestio Gateway?

Cylestio Gateway is a transparent proxy that:
- Routes requests to multiple LLM providers (OpenAI, Anthropic, etc.)
- Captures detailed traces for debugging and monitoring
- Tracks user sessions across conversations
- Provides extensible middleware for custom logic
- Supports streaming responses (SSE)
- Offers simple CLI and configuration file setup

## 🚀 Next Steps

1. Follow the [Installation Guide](getting-started/installation.md)
2. Try the [Quick Start Tutorial](getting-started/quick-start.md)
3. Explore [Interceptors](guides/interceptors.md) to add custom functionality
4. Deploy with [Docker](guides/docker.md) for production use