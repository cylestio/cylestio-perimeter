"""Live trace interceptor for real-time debugging."""
import threading
import webbrowser
from typing import Any, Dict, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

from .runtime.analysis_runner import AnalysisRunner
from .runtime.engine import AnalysisEngine
from .runtime.session_monitor import SessionMonitor
from .server import create_trace_server
from .store import TraceStore

logger = get_logger(__name__)


class LiveTraceInterceptor(BaseInterceptor):
    """Interceptor that provides real-time tracing with web dashboard."""

    def __init__(self, config: Dict[str, Any], provider_name: str = "unknown", provider_config: Dict[str, Any] = None):
        """Initialize live trace interceptor.

        Args:
            config: Interceptor configuration with the following options:
                - server_port: Port for the web dashboard (default: 7100)
                - server_host: Host interface to bind to (default: 127.0.0.1)
                - auto_open_browser: Whether to open browser on startup (default: True)
                - max_events: Maximum events to keep in memory (default: 10000)
                - retention_minutes: Session retention time (default: 30)
                - refresh_interval: Page refresh interval in seconds (default: 2)
                - storage_mode: Storage mode - "memory" for in-memory SQLite, "sqlite" for disk (default: "sqlite")
                - db_path: Path to SQLite database file (default: "./trace_data/live_trace.db")
                - enable_presidio: Enable PII detection using Presidio (default: True)
            provider_name: Name of the LLM provider (e.g., "openai", "anthropic")
            provider_config: Provider configuration including base_url
        """
        super().__init__(config)

        # Configuration
        self.server_port = config.get("server_port", 7100)
        self.server_host = config.get("server_host", "127.0.0.1")
        self.auto_open_browser = config.get("auto_open_browser", True)
        self.max_events = config.get("max_events", 10000)
        self.retention_minutes = config.get("retention_minutes", 30)
        self.refresh_interval = config.get("refresh_interval", 2)

        # Storage configuration
        self.storage_mode = config.get("storage_mode", "memory")
        self.db_path = config.get("db_path", None)

        # Session completion configuration
        self.session_completion_timeout = config.get("session_completion_timeout", 30)
        self.completion_check_interval = config.get("completion_check_interval", 10)

        # PII analysis configuration
        self.enable_presidio = config.get("enable_presidio", True)

        # Store provider configuration for API endpoint
        self.provider_name = provider_name
        self.provider_config = provider_config or {}

        # Initialize storage and insights
        self.store = TraceStore(
            max_events=self.max_events,
            retention_minutes=self.retention_minutes,
            storage_mode=self.storage_mode,
            db_path=self.db_path
        )

        # Pass configuration to insights engine
        # Use the actual proxy server's host/port (where agents connect to)
        # not the dashboard server's host/port
        proxy_config = {
            "provider_type": self.provider_name,
            "provider_base_url": self.provider_config.get("base_url", "unknown"),
            "proxy_host": self.provider_config.get("proxy_host", "127.0.0.1"),
            "proxy_port": self.provider_config.get("proxy_port", 4000),
            "enable_presidio": self.enable_presidio,
            "api_key": self.provider_config.get("api_key"),
            "storage_mode": self.storage_mode,
            "db_path": self.db_path,
        }

        # Initialize analysis engine (pure computation)
        self.engine = AnalysisEngine(self.store, proxy_config)

        # Initialize analysis runner (orchestration)
        self.analysis_runner = AnalysisRunner(
            store=self.store,
            compute_fn=self.engine.compute_risk_analysis,
        )

        # Initialize session monitor (background thread)
        self.session_monitor = SessionMonitor(
            store=self.store,
            analysis_runner=self.analysis_runner,
            config=config,
        )

        # Keep insights as alias for backward compatibility (server uses it)
        self.insights = self.engine

        # Server management
        self.server_thread = None
        self.server_started = False

        logger.info(f"LiveTraceInterceptor initialized on {self.server_host}:{self.server_port}")
        logger.info(f"Session completion timeout: {self.session_completion_timeout}s, "
                   f"check interval: {self.completion_check_interval}s")

        # Start server only if interceptor is enabled
        if self.enabled:
            # Start background model check/download only if PII analysis is enabled
            if self.enable_presidio:
                from .model_downloader import download_model_async
                download_model_async()
            else:
                logger.info("PII analysis disabled (enable_presidio: false) - skipping model download")

            self._start_server()
            self.session_monitor.start()
            self.session_monitor.check_pending_on_startup()
        else:
            logger.info("LiveTraceInterceptor disabled; server not started")

    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "live_trace"

    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Process events from the request.

        Args:
            request_data: Request data container

        Returns:
            None (doesn't modify request)
        """
        if not self.enabled:
            return None

        # Extract agent_id and tags from request metadata
        agent_id = getattr(request_data.request.state, 'agent_id', 'unknown')
        tags = getattr(request_data.request.state, 'tags', None)

        # Update session tags if present
        if tags and request_data.session_id:
            try:
                self.store.update_session_tags(
                    session_id=request_data.session_id,
                    tags=tags,
                    agent_id=agent_id
                )
            except Exception as e:
                logger.error(f"Error updating session tags: {e}")

        # Process all events from the request
        for event in request_data.events:
            try:
                self.store.add_event(event, request_data.session_id, agent_id)
            except Exception as e:
                logger.error(f"Error processing request event: {e}")

        return None

    async def after_response(
        self,
        request_data: LLMRequestData,
        response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Process events from the response.

        Args:
            request_data: Original request data
            response_data: Response data container

        Returns:
            None (doesn't modify response)
        """
        if not self.enabled:
            return None

        # Process all events from the response
        for event in response_data.events:
            try:
                # Extract agent_id from request metadata or use default
                agent_id = getattr(request_data.request.state, 'agent_id', 'unknown')
                effective_session_id = response_data.session_id or request_data.session_id
                self.store.add_event(event, effective_session_id, agent_id)
            except Exception as e:
                logger.error(f"Error processing response event: {e}")

        return None

    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Process error events.

        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        if not self.enabled:
            return

        # Process any error events that might be present in the request data
        for event in request_data.events:
            if event.name.value.endswith(".error"):
                try:
                    agent_id = getattr(request_data.request.state, 'agent_id', 'unknown')
                    self.store.add_event(event, request_data.session_id, agent_id)
                except Exception as e:
                    logger.error(f"Error processing error event: {e}")

    def _start_server(self):
        """Start the web server in a separate thread."""
        if self.server_started:
            return

        try:
            # Create and start server thread
            self.server_thread = threading.Thread(
                target=self._run_server,
                daemon=True,
                name="LiveTraceServer"
            )
            self.server_thread.start()
            self.server_started = True

            logger.info(f"Live trace server starting on {self.server_host}:{self.server_port}")

            # Auto-open browser if configured
            if self.auto_open_browser:
                # Give server a moment to start
                threading.Timer(2.0, self._open_browser).start()

        except Exception as e:
            logger.error(f"Failed to start live trace server: {e}")

    def _run_server(self):
        """Run the FastAPI server."""
        try:
            import uvicorn

            # Create the FastAPI app
            app = create_trace_server(self.insights, self.refresh_interval)

            # Run the server
            uvicorn.run(
                app,
                host=self.server_host,
                port=self.server_port,
                log_level="warning",  # Reduce noise
                access_log=False
            )
        except Exception as e:
            logger.error(f"Live trace server error: {e}")

    def _open_browser(self):
        """Open the dashboard in the default browser."""
        try:
            # Use localhost for browser URL regardless of bind address
            url = f"http://127.0.0.1:{self.server_port}"
            webbrowser.open(url)
            logger.info(f"Opened live trace dashboard: {url}")
        except Exception as e:
            logger.warning(f"Could not open browser: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics (for debugging/testing)."""
        return self.store.get_global_stats()

    def get_dashboard_url(self) -> str:
        """Get the URL for the dashboard."""
        host_display = "127.0.0.1" if self.server_host in ("0.0.0.0", "::") else self.server_host
        return f"http://{host_display}:{self.server_port}"

    def stop(self):
        """Stop the session monitor and cleanup."""
        self.session_monitor.stop()
