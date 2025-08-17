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

# Basic CLI usage (once implemented)
python -m src.main --base-url https://api.openai.com --type openai

# With configuration file
python -m src.main --config config.yaml

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
# Run linting (once configured)
ruff check src/
black src/ --check
isort src/ --check

# Type checking
mypy src/
```

## Architecture

### Project Structure
- `src/main.py` - FastAPI application entry point
- `src/config/` - Configuration management using Pydantic
- `src/proxy/` - Core proxy logic for forwarding requests
- `src/middlewares/` - Middleware implementations (trace, auth, rate limiting)
- `src/models/` - Data models for request/response tracing
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

### Middleware System
The proxy supports configurable middleware specified in config.yaml:
- **trace**: Captures request/response data to timestamped JSON files
- **rate_limit**: Rate limiting (future enhancement)
- **auth**: API key authentication (future enhancement)

### Configuration System
Supports two modes:
1. **CLI Mode**: Direct command-line arguments for basic usage
2. **Config File Mode**: YAML configuration for advanced setups with middleware

Priority: CLI arguments override config file settings

### Request Flow
1. Incoming request → FastAPI router
2. Middleware pre-processing (if enabled)
3. Proxy handler forwards to LLM API
4. Stream or buffer response based on request type
5. Middleware post-processing (e.g., tracing)
6. Return response to client

## Implementation Status
Currently implementing based on INSTRUCTIONS.md checklist:
- Project structure and config.yaml created
- Need to implement Python modules following the specified architecture
- FastAPI application with proxy handler pending
- Middleware system to be implemented
- Streaming support for SSE responses required

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