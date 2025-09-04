"""Cylestio trace interceptor for sending events to Cylestio API."""
import logging
import os
from typing import Any, Optional

from ...proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from .client import CylestioAPIError, CylestioClient

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
        self.api_url = config.get("api_url", "https://api.cylestio.com")
        self.access_key = config.get("access_key") or os.getenv("CYLESTIO_ACCESS_KEY")
        self.timeout = config.get("timeout", 10)

        # Validate required configuration
        if not self.access_key:
            raise ValueError("Cylestio interceptor requires access_key (either in config or CYLESTIO_ACCESS_KEY env var)")

    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "cylestio_trace"

    async def _send_event_safe(self, event) -> bool:
        """Send event with error handling."""
        try:
            async with CylestioClient(self.api_url, self.access_key, self.timeout) as client:
                return await client.send_event(event)
        except CylestioAPIError as e:
            logger.error(f"Cylestio API error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending Cylestio event: {e}")
            return False

    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        """Send events that were created by the provider."""
        if not self.enabled:
            return None

        # Send all events created by the provider
        for event in request_data.events:
            await self._send_event_safe(event)

        return None

    async def after_response(self, _request_data: LLMRequestData, response_data: LLMResponseData) -> Optional[LLMResponseData]:
        """Send events that were created by the provider."""
        if not self.enabled:
            return None

        # Send all events created by the provider
        for event in response_data.events:
            await self._send_event_safe(event)

        return None

    async def on_error(self, _request_data: LLMRequestData, _error: Exception) -> None:
        """Send error events that would be created by the provider."""
        if not self.enabled:
            return

        # For now, error handling logic could be moved to providers in the future
        # This maintains the existing behavior for error events
