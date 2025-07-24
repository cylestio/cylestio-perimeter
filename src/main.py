"""Main entry point for LLM Proxy Server."""
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional

import typer
import uvicorn
import yaml
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse

from src.config.settings import Settings, load_settings
from src.middlewares.printer import PrinterMiddleware
from src.middlewares.trace import TraceMiddleware
from src.proxy.handler import ProxyHandler
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
    
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        """Manage application lifespan events."""
        global proxy_handler
        
        # Startup
        proxy_handler = ProxyHandler(config)
        yield
        
        # Shutdown
        if proxy_handler:
            await proxy_handler.close()
    
    # Create FastAPI app with lifespan
    fast_app = FastAPI(
        title="LLM Proxy Server",
        description="Proxy server for LLM API requests with middleware support",
        version="1.0.0",
        lifespan=lifespan
    )
    
    # Register middlewares in reverse order (last registered is executed first)
    middleware_types = {
        "trace": TraceMiddleware,
        "printer": PrinterMiddleware,
    }
    
    for middleware_config in reversed(config.middlewares):
        if middleware_config.enabled and middleware_config.type in middleware_types:
            middleware_class = middleware_types[middleware_config.type]
            fast_app.add_middleware(
                middleware_class,
                config=middleware_config.config
            )
            logger.info(f"Registered middleware: {middleware_config.type}")
    
    # Health check endpoint
    @fast_app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "llm-proxy"}
    
    # Catch-all proxy route
    @fast_app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def proxy_request(request: Request, path: str):
        """Proxy all requests to the configured LLM backend."""
        return await proxy_handler.handle_request(request, path)
    
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
        "middlewares": [
            {
                "type": "trace",
                "enabled": True,
                "config": {
                    "directory": "./traces",
                    "include_headers": True,
                    "include_body": True,
                    "max_body_size": 1048576
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
        typer.echo(f"  - Middlewares: {len(settings.middlewares)} configured")
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