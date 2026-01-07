"""Main entry point for LLM Proxy Server."""
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from importlib.metadata import version as get_package_version, PackageNotFoundError
from pathlib import Path
from typing import AsyncGenerator, Optional

import typer
import uvicorn
import yaml
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import click

from src.config.settings import Settings, load_settings
from src.proxy.middleware import LLMMiddleware
from src.proxy.interceptor_manager import interceptor_manager
from src.interceptors.printer import PrinterInterceptor
from src.interceptors.message_logger import MessageLoggerInterceptor
from src.interceptors.event_recorder import EventRecorderInterceptor
from src.interceptors.http_recorder import HttpRecorderInterceptor
from src.interceptors.live_trace import LiveTraceInterceptor
from src.proxy.handler import ProxyHandler
from src.providers.openai import OpenAIProvider
from src.providers.anthropic import AnthropicProvider
from src.utils.logger import get_logger, setup_logging

# CLI app
cli = typer.Typer(help="LLM Proxy Server - Route requests to LLM providers with middleware support")

# Global settings and app instances
settings: Optional[Settings] = None
app: Optional[FastAPI] = None
proxy_handler: Optional[ProxyHandler] = None
logger = get_logger(__name__)


def get_version() -> str:
    """Get package version from installed metadata."""
    try:
        return get_package_version("cylestio-perimeter")
    except PackageNotFoundError:
        return "unknown"


def version_callback(value: bool):
    """Handle --version flag."""
    if value:
        typer.echo(f"cylestio-perimeter {get_version()}")
        raise typer.Exit()


@cli.callback()
def main_callback(
    version: bool = typer.Option(
        False, "--version", "-v",
        callback=version_callback,
        is_eager=True,
        help="Show version and exit"
    )
):
    """LLM Proxy Server - Route requests to LLM providers with middleware support."""
    pass


def create_app(config: Settings) -> FastAPI:
    """Create FastAPI application with configuration.

    Args:
        config: Settings configuration

    Returns:
        Configured FastAPI application
    """
    global proxy_handler

    # Set up logging first
    setup_logging(config.logging)
    logger.info("Starting LLM Proxy Server", extra={"config": config.model_dump()})

    # Register interceptor types
    interceptor_manager.register_interceptor("printer", PrinterInterceptor)
    interceptor_manager.register_interceptor("message_logger", MessageLoggerInterceptor)
    interceptor_manager.register_interceptor("event_recorder", EventRecorderInterceptor)
    interceptor_manager.register_interceptor("http_recorder", HttpRecorderInterceptor)
    interceptor_manager.register_interceptor("live_trace", LiveTraceInterceptor)

    # Create provider based on config type first (needed for interceptors and lifespan)
    if config.llm.type.lower() == "openai":
        provider = OpenAIProvider(config)
    elif config.llm.type.lower() == "anthropic":
        provider = AnthropicProvider(config)
    else:
        raise ValueError(f"Unsupported provider type: {config.llm.type}. Supported: openai, anthropic")

    # Create proxy handler
    proxy_handler_instance = ProxyHandler(config, provider)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        """Manage application lifespan events."""
        global proxy_handler

        # Startup - set global proxy_handler for the route function
        proxy_handler = proxy_handler_instance
        yield

        # Shutdown
        if proxy_handler_instance:
            await proxy_handler_instance.close()

    # Create FastAPI app with lifespan
    fast_app = FastAPI(
        title="LLM Proxy Server",
        description="Proxy server for LLM API requests with middleware support",
        version=get_version(),
        lifespan=lifespan
    )

    # Add CORS middleware for local development security
    # Only allow requests from localhost origins
    fast_app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",    # Vite dev server
            "http://127.0.0.1:5173",
            "http://localhost:7100",    # Live trace dashboard
            "http://127.0.0.1:7100",
            "http://localhost:4000",    # Proxy itself
            "http://127.0.0.1:4000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Store proxy handler in app state for access in routes
    fast_app.state.proxy_handler = proxy_handler_instance

    # Create interceptors from configuration with provider info
    provider_config = {
        "base_url": config.llm.base_url,
        "type": config.llm.type,
        "timeout": config.llm.timeout,
        "max_retries": config.llm.max_retries,
        "proxy_host": config.server.host,
        "proxy_port": config.server.port
    }

    # Prepare global config for interceptors (e.g., live_trace settings)
    global_config = {}
    if config.live_trace:
        global_config["live_trace"] = {
            "session_completion_timeout": config.live_trace.session_completion_timeout,
            "completion_check_interval": config.live_trace.completion_check_interval
        }

    interceptors = interceptor_manager.create_interceptors(
        config.interceptors,
        provider.name,
        provider_config,
        global_config
    )

    # Register the LLM middleware with provider and interceptors
    fast_app.add_middleware(
        LLMMiddleware,
        provider=provider,
        interceptors=interceptors
    )
    logger.info(f"LLM Middleware registered with {len(interceptors)} interceptors and provider: {provider.name}")

    # Health check endpoint
    @fast_app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "llm-proxy", "version": get_version()}

    # Metrics endpoint
    @fast_app.get("/metrics")
    async def metrics():
        """Metrics endpoint for monitoring."""
        metrics_data = {
            "service": "llm-proxy",
            "timestamp": datetime.utcnow().isoformat()
        }

        return metrics_data

    # Configuration endpoint
    @fast_app.get("/config")
    async def get_config():
        """Get current server configuration."""
        config_data = {
            "service": "llm-proxy",
            "timestamp": datetime.utcnow().isoformat(),
            "server": config.server.model_dump(),
            "llm": {
                "base_url": config.llm.base_url,
                "type": config.llm.type,
                "timeout": config.llm.timeout,
                "max_retries": config.llm.max_retries,
                "api_key_configured": bool(config.llm.api_key)
            },
            "interceptors": [
                {
                    "type": ic.type,
                    "enabled": ic.enabled,
                    "config": ic.config
                }
                for ic in config.interceptors
            ],

            "logging": config.logging.model_dump()
        }

        return config_data

    # Agent-workflow-scoped proxy route (must be before catch-all)
    @fast_app.api_route("/agent-workflow/{agent_workflow_id}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def agent_workflow_proxy_request(request: Request, agent_workflow_id: str, path: str):
        """Proxy requests with agent workflow context for grouping agents."""
        request.state.agent_workflow_id = agent_workflow_id
        proxy_handler_to_use = getattr(request.app.state, 'proxy_handler', None) or proxy_handler
        if proxy_handler_to_use is None:
            raise RuntimeError("Proxy handler not initialized")
        return await proxy_handler_to_use.handle_request(request, path)

    # Catch-all proxy route
    @fast_app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def proxy_request(request: Request, path: str):
        """Proxy all requests to the configured LLM backend."""
        # Use proxy handler from app state (more reliable for testing than global)
        proxy_handler_to_use = getattr(request.app.state, 'proxy_handler', None) or proxy_handler
        if proxy_handler_to_use is None:
            raise RuntimeError("Proxy handler not initialized")
        return await proxy_handler_to_use.handle_request(request, path)

    return fast_app


@cli.command()
def run(
    base_url: str = typer.Option(None, "--base-url", help="Base URL of target LLM API"),
    llm_type: str = typer.Option(None, "--type", help="LLM provider type (openai, anthropic, etc.)"),
    api_key: str = typer.Option(None, "--api-key", help="[DEPRECATED] API key - use environment variables instead"),
    port: int = typer.Option(None, "--port", help="Proxy server port"),
    host: str = typer.Option(None, "--host", help="Server host"),
    log_level: str = typer.Option(None, "--log-level", help="Logging level"),
    config: str = typer.Option(None, "--config", help="Path to YAML configuration file"),
):
    """Run the LLM Proxy Server."""
    global settings, app

    # SECURITY: Warn about API key exposure via CLI
    if api_key:
        typer.echo(
            "⚠️  SECURITY WARNING: Passing API keys via --api-key is insecure.\n"
            "   API keys are visible in process lists (ps aux) and shell history.\n"
            "   Use environment variables instead: OPENAI_API_KEY, ANTHROPIC_API_KEY\n",
            err=True
        )

    # Load settings
    try:
        cli_args = {}
        if base_url:
            cli_args["base_url"] = base_url
        if llm_type:
            cli_args["type"] = llm_type
        if api_key:
            cli_args["api_key"] = api_key
        if port:
            cli_args["port"] = port
        if host:
            cli_args["host"] = host
        if log_level:
            cli_args["log_level"] = log_level

        settings = load_settings(config_file=config, **cli_args)

        # Validate we have minimum required settings
        if not settings.llm.base_url or not settings.llm.type:
            typer.echo("Error: --base-url and --type are required (or provide --config)", err=True)
            raise typer.Exit(1)

    except Exception as e:
        typer.echo(f"Error loading configuration: {e}", err=True)
        raise typer.Exit(1)

    # Create app
    app = create_app(settings)

    # Run server
    uvicorn.run(
        app,
        host=settings.server.host,
        port=settings.server.port,
        access_log=False,  # We handle our own logging
        log_level=settings.logging.level.lower()
    )


@cli.command()
def validate_config(config_path: str):
    """Validate a configuration file."""
    validate_configuration(config_path)


@cli.command()
def generate_config(output_path: str):
    """Generate example configuration file."""
    generate_example_config(output_path)


@cli.command()
def replay(
    input_path: str = typer.Argument(..., help="Path to recording file or directory"),
    delay: float = typer.Option(0.0, "--delay", help="Delay in seconds between replaying requests"),
    config: str = typer.Option(None, "--config", help="Path to YAML configuration file for interceptors"),
):
    """Replay recorded HTTP traffic through interceptors."""
    import asyncio
    asyncio.run(replay_recordings(input_path, delay, config))


async def replay_recordings(input_path: str, delay: float, config_path: Optional[str]) -> None:
    """Replay recorded HTTP traffic through interceptors.

    Args:
        input_path: Path to recording file or directory
        delay: Delay in seconds between replaying requests
        config_path: Optional path to configuration file
    """
    from src.replay.replay_service import ReplayService
    from src.replay.replay_pipeline import ReplayPipeline
    from src.config.settings import Settings

    try:
        # Load configuration if provided
        config = None
        if config_path:
            try:
                config = Settings.from_yaml(config_path)
                typer.echo(f"Loaded configuration from: {config_path}")
                # Register interceptor types for replay
                interceptor_manager.register_interceptor("printer", PrinterInterceptor)
                interceptor_manager.register_interceptor("message_logger", MessageLoggerInterceptor)
                interceptor_manager.register_interceptor("event_recorder", EventRecorderInterceptor)
                interceptor_manager.register_interceptor("http_recorder", HttpRecorderInterceptor)
                interceptor_manager.register_interceptor("live_trace", LiveTraceInterceptor)
            except Exception as e:
                typer.echo(f"Error loading configuration: {e}", err=True)
                raise typer.Exit(1)

        # Initialize replay service and pipeline
        replay_service = ReplayService()
        replay_pipeline = ReplayPipeline(config)

        typer.echo(f"Reading recordings from: {input_path}")

        # Read recordings
        pairs = replay_service.read_recordings(input_path)
        typer.echo(f"Found {len(pairs)} request/response pairs to replay")

        if delay > 0:
            typer.echo(f"Replay delay: {delay} seconds between requests")

        # Process pairs with delay
        async for pair in replay_service.replay_with_delay(pairs, delay):
            await replay_pipeline.process_pair(pair)

        # Close pipeline
        await replay_pipeline.close()

        typer.echo("Replay completed successfully!")

    except Exception as e:
        typer.echo(f"Error during replay: {e}", err=True)
        raise typer.Exit(1)


def main():
    """Entry point for the CLI."""
    cli()


def generate_example_config(output_path: str):
    """Generate an example configuration file.

    Args:
        output_path: Path to write example config
    """
    example_config = {
        "server": {
            "port": 4000,
            "host": "127.0.0.1",
            "workers": 1
        },
        "llm": {
            "base_url": "https://api.openai.com",
            "type": "openai",
            "api_key": "sk-your-api-key-here",
            "timeout": 30,
            "max_retries": 3
        },
        "interceptors": [
            {
                "type": "printer",
                "enabled": True,
                "config": {
                    "log_requests": True,
                    "log_responses": True
                }
            }
        ],
        "logging": {
            "level": "INFO",
            "format": "text",
            "file": None
        }
    }

    path = Path(output_path)
    with open(path, "w") as f:
        yaml.dump(example_config, f, default_flow_style=False, sort_keys=False)

    typer.echo(f"Example configuration written to: {output_path}")


def validate_configuration(config_path: str):
    """Validate a configuration file.

    Args:
        config_path: Path to configuration file
    """
    try:
        settings = Settings.from_yaml(config_path)
        typer.echo(f"✓ Configuration is valid: {config_path}")
        typer.echo(f"  - Server: {settings.server.host}:{settings.server.port}")
        typer.echo(f"  - LLM: {settings.llm.type} @ {settings.llm.base_url}")
        typer.echo(f"  - Interceptors: {len(settings.interceptors)} configured")
    except Exception as e:
        typer.echo(f"✗ Configuration is invalid: {e}", err=True)
        raise typer.Exit(1)


if __name__ == "__main__":
    cli()
