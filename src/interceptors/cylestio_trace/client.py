"""HTTP client for Cylestio API integration."""
import asyncio
import logging
import secrets
from typing import Any, Optional, List

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
    """HTTP client for sending events to Cylestio API with ordered background processing."""

    # Shared client pool for connection reuse
    _shared_clients: dict[str, httpx.AsyncClient] = {}
    _client_lock = asyncio.Lock()

    def __init__(self, api_url: str, access_key: str, timeout: int = 10, max_retries: int = 3, batch_size: int = 10, batch_timeout: float = 0.1):
        """Initialize Cylestio client.

        Args:
            api_url: Cylestio API endpoint URL
            access_key: API access key for authentication
            timeout: HTTP request timeout in seconds
            max_retries: Maximum number of retry attempts for failed requests
            batch_size: Maximum events per batch
            batch_timeout: Max time to wait for batch completion in seconds
        """
        self.api_url = api_url.rstrip("/")
        self.access_key = access_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.batch_size = batch_size
        self.batch_timeout = batch_timeout
        
        self._client: Optional[httpx.AsyncClient] = None
        self._client_key = f"{api_url}:{timeout}"  # Key for shared client pool
        
        # Background processing queue and worker
        self._event_queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()

        # Initialize Descope authenticator for JWT token generation
        self._authenticator = DescopeAuthenticator.get_instance(access_key=access_key)

    async def _initialize_client(self) -> None:
        """Initialize HTTP client from shared pool."""
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

    async def start(self) -> None:
        """Start the background event processing worker."""
        if self._worker_task is None or self._worker_task.done():
            self._shutdown_event.clear()
            self._worker_task = asyncio.create_task(self._process_event_queue())

    async def stop(self) -> None:
        """Stop the background worker and wait for pending events."""
        self._shutdown_event.set()
        if self._worker_task and not self._worker_task.done():
            await self._worker_task

    async def send_events_async(self, events: List[BaseEvent]) -> None:
        """Queue events for background processing in order. Non-blocking.
        
        Args:
            events: List of events to send
        """
        if not events:
            return
            
        # Ensure worker is running
        if self._worker_task is None or self._worker_task.done():
            await self.start()
            
        # Queue events in order - this is fast and non-blocking
        for event in events:
            await self._event_queue.put(event)

    async def _process_event_queue(self) -> None:
        """Background worker that processes events from queue in batches."""
        while not self._shutdown_event.is_set():
            batch = []
            
            try:
                # Collect a batch with timeout for efficiency
                batch_start_time = asyncio.get_event_loop().time()
                
                while len(batch) < self.batch_size:
                    remaining_time = self.batch_timeout - (asyncio.get_event_loop().time() - batch_start_time)
                    if remaining_time <= 0:
                        break
                        
                    try:
                        event = await asyncio.wait_for(
                            self._event_queue.get(), 
                            timeout=remaining_time
                        )
                        batch.append(event)
                        self._event_queue.task_done()
                    except asyncio.TimeoutError:
                        break
                
                # Process batch if we have events
                if batch:
                    await self._send_events_batch_internal(batch)
                    
            except Exception as e:
                logger.error(f"Error in event queue processor: {e}")
                # Continue processing despite errors
                
        # Process remaining events on shutdown
        remaining_events = []
        while not self._event_queue.empty():
            try:
                event = self._event_queue.get_nowait()
                remaining_events.append(event)
                self._event_queue.task_done()
            except asyncio.QueueEmpty:
                break
                
        if remaining_events:
            await self._send_events_batch_internal(remaining_events)

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

    async def _send_event(self, event: BaseEvent) -> bool:
        """Send a single event to Cylestio API with retry logic.

        Args:
            event: BaseEvent to send

        Returns:
            True if successful, False otherwise

        Raises:
            CylestioAPIError: If API returns a non-retryable error
        """
        if not self._client:
            await self._initialize_client()

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
                if response.status_code in [200, 201]:
                    self._log_success(event.name, attempt)
                    return True
                elif self._is_retryable_error(response.status_code):
                    logger.warning(f"Retryable error {response.status_code} for event {event.name} (attempt {attempt + 1})")
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(await self._calculate_backoff_delay(attempt))
                        continue
                else:
                    return self._handle_non_retryable_error(response, event.name)

            except (httpx.TimeoutException, httpx.NetworkError) as e:
                last_exception = e
                error_type = "Timeout" if isinstance(e, httpx.TimeoutException) else "Network error"
                logger.warning(f"{error_type} sending event {event.name} (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(await self._calculate_backoff_delay(attempt))
                    continue
            except Exception as e:
                logger.error(f"Unexpected error sending event {event.name} (attempt {attempt + 1}): {e}")
                return False

        # All retries exhausted
        logger.error(f"Failed to send event {event.name} after {self.max_retries} attempts. Last error: {last_exception}")
        return False

    def _is_retryable_error(self, status_code: int) -> bool:
        """Check if HTTP status code indicates a retryable error."""
        return status_code in [429, 502, 503, 504]

    def _log_success(self, event_name: str, attempt: int) -> None:
        """Log successful event sending with appropriate level."""
        if attempt > 0:
            logger.info(f"Successfully sent event {event_name} on attempt {attempt + 1}")
        else:
            logger.debug(f"Successfully sent event {event_name}")

    def _handle_non_retryable_error(self, response, event_name: str) -> bool:
        """Handle non-retryable HTTP errors."""
        if response.status_code in [401, 403]:
            self._authenticator.invalidate_token()
            logger.warning("Authentication error occurred, invalidating JWT token to refresh next time")

        error_msg = f"API returned {response.status_code}: {response.text}"
        logger.error(f"Non-retryable error sending event {event_name}: {error_msg}")
        return False

    async def _send_events_batch_internal(self, events: List[BaseEvent]) -> dict[str, int]:
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
            task = asyncio.create_task(self._send_event(event))
            tasks.append(task)

        # Wait for all events to complete
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        results = {"success": 0, "failed": 0}
        failed_events = []

        for i, result in enumerate(results_list):
            event_name = events[i].name
            if isinstance(result, Exception):
                logger.error(f"Exception sending event {event_name}: {result}")
                results["failed"] += 1
                failed_events.append(event_name)
            elif result:
                results["success"] += 1
            else:
                results["failed"] += 1
                failed_events.append(event_name)

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


    async def health_check(self) -> dict[str, Any]:
        """Check if Cylestio API is reachable with detailed status.

        Returns:
            Dict with health status and metrics
        """
        if not self._client:
            await self._initialize_client()

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
