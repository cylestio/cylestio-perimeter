"""HTTP client for Cylestio API integration."""
import asyncio
import logging
import secrets
from typing import Any, Optional

import httpx

from src.events.base import BaseEvent

from .api_authentication import DescopeAuthenticator

logger = logging.getLogger(__name__)


class CylestioAPIError(Exception):
    """Cylestio API error."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class CylestioClient:
    """HTTP client for sending events to Cylestio API."""

    # Shared client pool for connection reuse
    _shared_clients: dict[str, httpx.AsyncClient] = {}
    _client_lock = asyncio.Lock()

    def __init__(self, api_url: str, access_key: str, timeout: int = 10, max_retries: int = 3):
        """Initialize Cylestio client.

        Args:
            api_url: Cylestio API endpoint URL
            access_key: API access key for authentication
            timeout: HTTP request timeout in seconds
            max_retries: Maximum number of retry attempts for failed requests
        """
        self.api_url = api_url.rstrip("/")
        self.access_key = access_key
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None
        self._client_key = f"{api_url}:{timeout}"  # Key for shared client pool

        # Initialize Descope authenticator for JWT token generation
        self._authenticator = DescopeAuthenticator.get_instance(access_key=access_key)

    async def __aenter__(self) -> "CylestioClient":
        """Async context manager entry."""
        # Use shared client pool for better connection reuse
        async with self._client_lock:
            if self._client_key not in self._shared_clients:
                self._shared_clients[self._client_key] = httpx.AsyncClient(
                    timeout=httpx.Timeout(self.timeout),
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "cylestio-perimeter/1.0"
                    },
                    # Connection pool settings for better performance
                    limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
                )

        self._client = self._shared_clients[self._client_key]
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        # Don't close shared client, just clear reference
        self._client = None

    @classmethod
    async def cleanup_shared_clients(cls) -> None:
        """Close all shared clients. Call this during application shutdown."""
        async with cls._client_lock:
            for client in cls._shared_clients.values():
                await client.aclose()
            cls._shared_clients.clear()

    async def _calculate_backoff_delay(self, attempt: int) -> float:
        """Calculate exponential backoff delay with jitter."""
        base_delay = 2 ** attempt  # Exponential backoff: 2, 4, 8 seconds
        # Use secrets for cryptographically secure jitter (10-30% of base delay)
        jitter_factor = 0.1 + (secrets.randbits(8) / 255.0) * 0.2  # 0.1 to 0.3
        jitter = jitter_factor * base_delay
        return min(base_delay + jitter, 30.0)  # Cap at 30 seconds

    async def send_event(self, event: BaseEvent) -> bool:
        """Send a single event to Cylestio API with retry logic.

        Args:
            event: BaseEvent to send

        Returns:
            True if successful, False otherwise

        Raises:
            CylestioAPIError: If API returns a non-retryable error
        """
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")

        last_exception = None

        for attempt in range(self.max_retries):
            try:
                # Get JWT token for authorization
                jwt_token = self._authenticator.get_jwt_token()
                if not jwt_token:
                    logger.error(f"Failed to get JWT token for authentication (attempt {attempt + 1})")
                    if attempt == self.max_retries - 1:
                        return False
                    await asyncio.sleep(await self._calculate_backoff_delay(attempt))
                    continue

                # Convert event to dict for JSON serialization
                event_data = event.model_dump()

                # Log the event being sent (at debug level)
                logger.debug(f"Sending event to Cylestio: {event.name} for session {event.session_id} (attempt {attempt + 1})")

                # Send HTTP POST request with JWT token
                response = await self._client.post(
                    f"{self.api_url}/v1/telemetry",
                    json=event_data,
                    headers={"Authorization": f"Bearer {jwt_token}"}
                )

                # Check response status
                if response.status_code == 200 or response.status_code == 201:
                    if attempt > 0:
                        logger.info(f"Successfully sent event {event.name} on attempt {attempt + 1}")
                    else:
                        logger.debug(f"Successfully sent event {event.name}")
                    return True
                elif response.status_code in [429, 502, 503, 504]:  # Retryable errors
                    logger.warning(f"Retryable error {response.status_code} for event {event.name} (attempt {attempt + 1})")
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(await self._calculate_backoff_delay(attempt))
                        continue
                else:
                    # Non-retryable errors
                    if response.status_code == 401 or response.status_code == 403:
                        self._authenticator.invalidate_token()
                        logger.warning("Authentication error occurred, invalidating JWT token to refresh next time")

                    error_msg = f"API returned {response.status_code}: {response.text}"
                    logger.error(f"Non-retryable error sending event {event.name}: {error_msg}")
                    return False

            except httpx.TimeoutException as e:
                last_exception = e
                logger.warning(f"Timeout sending event {event.name} (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(await self._calculate_backoff_delay(attempt))
                    continue
            except httpx.NetworkError as e:
                last_exception = e
                logger.warning(f"Network error sending event {event.name} (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(await self._calculate_backoff_delay(attempt))
                    continue
            except Exception as e:
                logger.error(f"Unexpected error sending event {event.name} (attempt {attempt + 1}): {e}")
                return False

        # All retries exhausted
        logger.error(f"Failed to send event {event.name} after {self.max_retries} attempts. Last error: {last_exception}")
        return False

    async def send_events_batch(self, events: list[BaseEvent]) -> dict[str, int]:
        """Send multiple events concurrently with better performance.

        Args:
            events: List of BaseEvent objects to send

        Returns:
            Dict with 'success' and 'failed' counts, plus timing info
        """
        if not events:
            return {"success": 0, "failed": 0, "duration_ms": 0}

        start_time = asyncio.get_event_loop().time()

        # Create concurrent tasks for better performance
        tasks = []
        for event in events:
            task = asyncio.create_task(self._send_single_event_with_context(event))
            tasks.append(task)

        # Wait for all events to complete
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        results = {"success": 0, "failed": 0}
        failed_events = []

        for i, result in enumerate(results_list):
            if isinstance(result, Exception):
                logger.error(f"Exception sending event {events[i].name}: {result}")
                results["failed"] += 1
                failed_events.append(events[i].name)
            elif result:
                results["success"] += 1
            else:
                results["failed"] += 1
                failed_events.append(events[i].name)

        duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000
        results["duration_ms"] = duration_ms

        # Log batch results with context
        if results["failed"] > 0:
            logger.warning(
                f"Batch send completed: {results['success']}/{len(events)} succeeded "
                f"in {duration_ms:.1f}ms. Failed events: {failed_events}"
            )
        else:
            logger.debug(f"Batch send successful: {len(events)} events in {duration_ms:.1f}ms")

        return results

    async def _send_single_event_with_context(self, event: BaseEvent) -> bool:
        """Send a single event with additional error context."""
        try:
            return await self.send_event(event)
        except Exception as e:
            logger.error(f"Context: Failed to send event {event.name} for session {event.session_id}: {e}")
            return False

    async def health_check(self) -> dict[str, Any]:
        """Check if Cylestio API is reachable with detailed status.

        Returns:
            Dict with health status and metrics
        """
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")

        start_time = asyncio.get_event_loop().time()

        try:
            response = await self._client.get(f"{self.api_url}/health")
            duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000

            is_healthy = response.status_code == 200

            result = {
                "healthy": is_healthy,
                "status_code": response.status_code,
                "response_time_ms": duration_ms,
                "api_url": self.api_url
            }

            if is_healthy:
                logger.debug(f"Health check passed in {duration_ms:.1f}ms")
            else:
                logger.warning(f"Health check failed: HTTP {response.status_code} in {duration_ms:.1f}ms")
                result["error"] = f"HTTP {response.status_code}: {response.text[:200]}"

            return result

        except Exception as e:
            duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"Health check failed after {duration_ms:.1f}ms: {e}")

            return {
                "healthy": False,
                "error": str(e),
                "response_time_ms": duration_ms,
                "api_url": self.api_url
            }
