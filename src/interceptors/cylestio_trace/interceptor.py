"""Cylestio trace interceptor for sending events to Cylestio API."""
import logging
import os
from typing import Any, Optional

from ...proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from .client import CylestioClient

logger = logging.getLogger(__name__)


class CylestioTraceInterceptor(BaseInterceptor):
    """Interceptor for sending trace events to Cylestio API."""

    def __init__(self, config: dict[str, Any]):
        """Initialize Cylestio trace interceptor.

        Args:
            config: Configuration dict with Cylestio settings
        """
        super().__init__(config)

        # Extract Cylestio configuration
        api_url = config.get("api_url", "https://api.cylestio.com")
        access_key = config.get("access_key") or os.getenv("CYLESTIO_ACCESS_KEY")
        timeout = config.get("timeout", 10)

        # Validate required configuration
        if not access_key:
            raise ValueError("Cylestio interceptor requires access_key")
            
        # Create single client instance
        self._client = CylestioClient(
            api_url=api_url,
            access_key=access_key, 
            timeout=timeout
        )
        
        # Worker will be started lazily on first use

    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "cylestio_trace"


    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Send events that were created by the provider."""
        if not self.enabled:
            return None

        # Send all events created by the provider in background (non-blocking)
        if request_data.events:
            await self._client.send_events_async(request_data.events)

        return None

    async def after_response(self, _request_data: LLMRequestData, response_data: LLMResponseData) -> Optional[LLMResponseData]:
        """Send events that were created by the provider."""
        if not self.enabled:
            return None

        # Send all events created by the provider in background (non-blocking)
        if response_data.events:
            await self._client.send_events_async(response_data.events)

        return None

    async def on_error(self, _request_data: LLMRequestData, _error: Exception) -> None:
        """Send error events that would be created by the provider."""
        if not self.enabled:
            return

        # For now, error handling logic could be moved to providers in the future
        # This maintains the existing behavior for error events
        
    async def cleanup(self) -> None:
        """Cleanup resources and stop background processing."""
        if hasattr(self, '_client'):
            await self._client.stop()
