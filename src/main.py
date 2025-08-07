"""Main entry point for LLM Proxy Server."""
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Optional

import typer
import uvicorn
import yaml
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse

from src.config.settings import Settings, load_settings
from src.proxy.middleware import LLMMiddleware
from src.proxy.interceptor_manager import interceptor_manager
from src.interceptors.printer import PrinterInterceptor
from src.interceptors.message_logger import MessageLoggerInterceptor
from src.interceptors.cylestio_trace import CylestioTraceInterceptor
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
    interceptor_manager.register_interceptor("cylestio_trace", CylestioTraceInterceptor)
    
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
        version="1.0.0",
        lifespan=lifespan
    )
    
    # Store proxy handler in app state for access in routes
    fast_app.state.proxy_handler = proxy_handler_instance
    
    # Create interceptors from configuration with provider info
    interceptors = interceptor_manager.create_interceptors(config.interceptors, provider.name)
    
    # Prepare session configuration for middleware
    session_config = None
    if config.session:
        session_config = config.session.model_dump()
        logger.info("Session detection enabled", extra={"session_config": session_config})
    
    # Register the LLM middleware with provider, interceptors and session management
    fast_app.add_middleware(
        LLMMiddleware, 
        provider=provider,
        interceptors=interceptors,
        session_config=session_config
    )
    logger.info(f"LLM Middleware registered with {len(interceptors)} interceptors and provider: {provider.name}")
    
    # Health check endpoint
    @fast_app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "llm-proxy"}
    
    # Metrics endpoint
    @fast_app.get("/metrics")
    async def metrics():
        """Metrics endpoint for monitoring."""
        metrics_data = {
            "service": "llm-proxy",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add session metrics from Cylestio interceptor if available
        # TODO: Get session metrics from active Cylestio interceptor instance
        
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
            "session": config.session.model_dump(),
            "logging": config.logging.model_dump()
        }
        
        return config_data
    
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
def main(
    base_url: Optional[str] = typer.Option(None, "--base-url", help="Base URL of target LLM API"),
    llm_type: Optional[str] = typer.Option(None, "--type", help="LLM provider type (openai, anthropic, etc.)"),
    api_key: Optional[str] = typer.Option(None, "--api-key", help="API key to inject into requests"),
    port: Optional[int] = typer.Option(None, "--port", help="Proxy server port"),
    host: Optional[str] = typer.Option(None, "--host", help="Server host"),
    log_level: Optional[str] = typer.Option(None, "--log-level", help="Logging level"),
    config: Optional[str] = typer.Option(None, "--config", help="Path to YAML configuration file"),
    validate_config: Optional[str] = typer.Option(None, "--validate-config", help="Validate configuration file"),
    generate_config: Optional[str] = typer.Option(None, "--generate-config", help="Generate example configuration file"),
):
    """Run the LLM Proxy Server."""
    global settings, app
    
    # Handle utility commands
    if generate_config:
        generate_example_config(generate_config)
        return
    
    if validate_config:
        validate_configuration(validate_config)
        return
    
    # Load settings
    try:
        cli_args = {
            "base_url": base_url,
            "type": llm_type,
            "api_key": api_key,
            "port": port,
            "host": host,
            "log_level": log_level,
        }
        # Remove None values
        cli_args = {k: v for k, v in cli_args.items() if v is not None}
        
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


def generate_example_config(output_path: str):
    """Generate an example configuration file.
    
    Args:
        output_path: Path to write example config
    """
    example_config = {
        "server": {
            "port": 3000,
            "host": "0.0.0.0",
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
                    "log_responses": True,
                    "log_body": True
                }
            },
            {
                "type": "cylestio_trace",
                "enabled": False,
                "config": {
                    "api_url": "https://api.cylestio.com",
                    "access_key": "your-cylestio-access-key-here",
                    "timeout": 10
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
    import sys
    if len(sys.argv) == 1:
        # Show usage when no arguments provided
        print("LLM Proxy Server")
        print("\nRequired arguments:")
        print("  --base-url TEXT    Base URL of target LLM API")
        print("  --type TEXT        LLM provider type (openai, anthropic, etc.)")
        print("\nOptional arguments:")
        print("  --config TEXT      Path to YAML configuration file")
        print("  --api-key TEXT     API key to inject into requests")
        print("  --port INTEGER     Proxy server port (default: 3000)")
        print("  --host TEXT        Server host (default: 0.0.0.0)")
        print("  --log-level TEXT   Logging level (default: INFO)")
        print("\nUtility commands:")
        print("  --validate-config TEXT    Validate configuration file")
        print("  --generate-config TEXT    Generate example configuration file")
        print("\nExamples:")
        print("  python -m src.main --base-url https://api.openai.com --type openai")
        print("  python -m src.main --config examples/configs/anthropic-basic.yaml")
        sys.exit(1)
    
    cli()