# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python LLM Proxy Server that acts as an intermediary for LLM API requests (OpenAI, Anthropic, etc.) with request tracing capabilities. The project is in initial development phase and follows the specifications in INSTRUCTIONS.md.

## Development Commands

### Initial Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (once requirements.txt is created)
pip install -r requirements.txt
```

### Running the Server
```bash
# Development mode with auto-reload
uvicorn src.main:app --reload --port 3000

# Basic CLI usage
cylestio-perimeter run --base-url https://api.openai.com --type openai

# With configuration file
cylestio-perimeter run --config config.yaml

# Alternative: using Python module
python -m src.main run --base-url https://api.openai.com --type openai

# Production mode
uvicorn src.main:app --host 0.0.0.0 --port 3000 --workers 4
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
- `src/main.py` - FastAPI application entry point
- `src/config/` - Configuration management using Pydantic
- `src/proxy/` - Core proxy logic, middleware, and session management
- `src/providers/` - LLM provider implementations (OpenAI, Anthropic)
- `src/interceptors/` - Request/response interceptors for tracing and logging
- `src/events/` - Event system for request/response tracking
- `src/utils/` - Utilities for logging and HTTP requests

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
- **descope**: Authentication service integration

### Interceptor System
The proxy supports configurable interceptors specified in config.yaml:
- **printer**: Logs requests and responses to console
- **message_logger**: Logs messages to files
- **cylestio_trace**: Traces requests to Cylestio platform
- **event_recorder**: Records events for analysis and replay
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

## Implementation Status
✅ **Completed Features:**
- Project structure and configuration system
- FastAPI application with proxy handler
- Provider implementations (OpenAI, Anthropic)
- Interceptor system with multiple interceptor types
- Streaming support for SSE responses
- Session detection and management
- Event system for request/response tracking
- CLI interface with Typer
- Comprehensive test suite
- Docker support with docker-compose

🔄 **Current Development:**
- External session/agent ID support
- Enhanced session management features
- Performance optimizations

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

## Development Warnings

- Dont use TYPE_CHECKING