# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python LLM Proxy Server that acts as an intermediary for LLM API requests (OpenAI, Anthropic, etc.) with request tracing, analysis, and replay capabilities. The project provides security analysis features including PII detection, behavioral analysis, and live tracing. Specifications for future development are in `specs/`.

## Development Commands

### Initial Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Server
```bash
# Development mode with auto-reload
uvicorn src.main:app --reload --port 4000

# Basic CLI usage
cylestio-perimeter run --base-url https://api.openai.com --type openai

# With configuration file
cylestio-perimeter run --config config.yaml

# Alternative: using Python module
python -m src.main run --base-url https://api.openai.com --type openai

# Production mode
uvicorn src.main:app --host 0.0.0.0 --port 4000 --workers 4
```

### Replay Recorded Traffic
```bash
# Replay HTTP recordings through interceptors
python -m src.main replay test_data/input_http_recordings/ --config examples/configs/anthropic-basic.yaml

# With delay between requests
python -m src.main replay test_data/input_http_recordings/ --delay 0.5 --config config.yaml
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_proxy.py

# Run tests with verbose output
pytest -v
```

### Linting and Type Checking
```bash
# Run linting using virtual environment
./venv/bin/python -m ruff check src/
./venv/bin/python -m black src/ --check
./venv/bin/python -m isort src/ --check

# Type checking
./venv/bin/python -m mypy src/
```

## Architecture

### Project Structure
- `src/main.py` - FastAPI application entry point and CLI commands
- `src/config/` - Configuration management using Pydantic
- `src/proxy/` - Core proxy logic, middleware, session management, and tools
- `src/providers/` - LLM provider implementations (OpenAI, Anthropic)
- `src/interceptors/` - Request/response interceptors for tracing, logging, and analysis
  - `live_trace/` - Live tracing with web UI, analysis modules (PII, security, behavioral)
- `src/events/` - Event system for request/response tracking
- `src/replay/` - HTTP traffic replay service and pipeline
- `src/utils/` - Utilities for logging

### Key Design Patterns
1. **Configuration Hierarchy**: CLI args > Config file > Defaults
2. **Middleware Pattern**: Extensible middleware system for cross-cutting concerns
3. **Async/Await**: Full async support for better performance
4. **Streaming Support**: Handle Server-Sent Events (SSE) for LLM streaming responses

### Core Dependencies
- **FastAPI**: Web framework with async support and automatic OpenAPI docs
- **httpx**: Async HTTP client for proxying requests
- **pydantic-settings**: Type-safe configuration management
- **uvicorn**: ASGI server for running the application
- **typer**: CLI framework for command-line interface
- **presidio-analyzer/spacy**: PII detection and NLP

### Interceptor System
The proxy supports configurable interceptors specified in config.yaml:
- **printer**: Logs requests and responses to console
- **message_logger**: Logs messages to files
- **event_recorder**: Records events for analysis and replay
- **http_recorder**: Records HTTP request/response pairs for replay
- **live_trace**: Real-time tracing with web UI, security analysis, PII detection
- **test_recorder**: Records test scenarios

### Configuration System
Supports two modes:
1. **CLI Mode**: Direct command-line arguments for basic usage
2. **Config File Mode**: YAML configuration for advanced setups with middleware

Priority: CLI arguments override config file settings

### Request Flow
1. Incoming request → FastAPI router
2. LLM Middleware processes request with interceptors
3. Provider-specific handling (OpenAI/Anthropic)
4. Session detection and management (if enabled)
5. Proxy handler forwards to LLM API
6. Stream or buffer response based on request type
7. Interceptor post-processing (e.g., tracing, logging)
8. Return response to client

## MCP Server

The `live_trace` interceptor includes an MCP (Model Context Protocol) server at `/mcp` endpoint for AI assistant integration.

**Source of truth:** `src/interceptors/live_trace/mcp/tools.py`

**When modifying MCP tools, update these files:**
- `src/templates/INSTALLATION.md` - Tool documentation
- `src/templates/cursor-rules/.cursorrules` - Cursor rules
- `src/templates/cursor-rules/agent-inspector.mdc` - MDC format rules
- `src/templates/skills/static-analysis/SKILL.md` - Static analysis skill
- `src/templates/skills/auto-fix/SKILL.md` - Auto-fix skill

## Implementation Status
✅ **Completed Features:**
- Project structure and configuration system
- FastAPI application with proxy handler
- Provider implementations (OpenAI, Anthropic)
- Interceptor system with multiple interceptor types
- Streaming support for SSE responses
- Session detection and management
- Event system for request/response tracking
- CLI interface with Typer (run, replay, validate-config, generate-config)
- HTTP recording and replay functionality
- Live trace with web UI and analysis (PII detection, security assessment, behavioral analysis)
- Comprehensive test suite
- Docker support with docker-compose
- CI/CD pipeline

## Development Style

- When writing a package/module/logical unit - prefer placing relevant code on the same folder, so IF you are writing tests, or types for example - they should be together.
- Make sure to add documentation only if it is really important, let's not over document
- Only export things you want to expose as interface or required by other files
- **Important**: When planning, before implementing - review what you planned and make sure it makes sense and written efficiently
- Once task is completed. Do a code-review on the code and fix it if needed - when reviewing make sure to maintain funcioncality and API (unless some unused API found)

## Claude's Principles

- When explicitly asked for a refactor always maintain functionality (don't remove) and ask if you think it is important

## Test Organization

When writing tests for provider methods, create separate test files for methods with more than 3 test cases using the naming convention `test_{provider}_{method_name}.py`, while keeping core provider tests (≤3 cases) in the main `test_{provider}.py` file.

## Frontend Development

When working on the live_trace frontend (`src/interceptors/live_trace/frontend/`), you **MUST** follow:
- `src/interceptors/live_trace/frontend/CLAUDE.md` - Frontend-specific guidance
- `src/interceptors/live_trace/frontend/docs/DEVELOPMENT.md` - Detailed development guide with component patterns, import organization, and testing requirements

## Development Warnings

- Dont use TYPE_CHECKING
- When moving files always use `git mv`