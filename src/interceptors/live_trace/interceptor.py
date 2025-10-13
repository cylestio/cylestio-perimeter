"""Live trace interceptor for real-time debugging."""
import threading
import webbrowser
from typing import Any, Dict, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

from .insights import InsightsEngine
from .server import create_trace_server
from .store import TraceStore

logger = get_logger(__name__)


class LiveTraceInterceptor(BaseInterceptor):
    """Interceptor that provides real-time tracing with web dashboard."""

    def __init__(self, config: Dict[str, Any], provider_name: str = "unknown", provider_config: Dict[str, Any] = None):
        """Initialize live trace interceptor.

        Args:
            config: Interceptor configuration with the following options:
                - server_port: Port for the web dashboard (default: 8080)
                - server_host: Host interface to bind to (default: 127.0.0.1)
                - auto_open_browser: Whether to open browser on startup (default: True)
                - max_events: Maximum events to keep in memory (default: 10000)
                - retention_minutes: Session retention time (default: 30)
                - refresh_interval: Page refresh interval in seconds (default: 2)
            provider_name: Name of the LLM provider (e.g., "openai", "anthropic")
            provider_config: Provider configuration including base_url
        """
        super().__init__(config)

        # Configuration
        self.server_port = config.get("server_port", 8080)
        self.server_host = config.get("server_host", "127.0.0.1")
        self.auto_open_browser = config.get("auto_open_browser", True)
        self.max_events = config.get("max_events", 10000)
        self.retention_minutes = config.get("retention_minutes", 30)
        self.refresh_interval = config.get("refresh_interval", 2)

        # Store provider configuration for API endpoint
        self.provider_name = provider_name
        self.provider_config = provider_config or {}

        # Initialize storage and insights
        self.store = TraceStore(
            max_events=self.max_events,
            retention_minutes=self.retention_minutes
        )
        
        # Pass configuration to insights engine
        proxy_config = {
            "provider_type": self.provider_name,
            "provider_base_url": self.provider_config.get("base_url", "unknown"),
            "proxy_host": self.server_host,
            "proxy_port": self.server_port
        }
        self.insights = InsightsEngine(self.store, proxy_config)

        # Server management
        self.server_thread = None
        self.server_started = False

        logger.info(f"LiveTraceInterceptor initialized on {self.server_host}:{self.server_port}")

        # Start server only if interceptor is enabled
        if self.enabled:
            self._start_server()
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

        # Process all events from the request
        for event in request_data.events:
            try:
                # Extract agent_id from request metadata or use default
                agent_id = getattr(request_data.request.state, 'agent_id', 'unknown')
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
