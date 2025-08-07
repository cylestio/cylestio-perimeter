"""HTTP client for Cylestio API integration."""
import json
import logging
from typing import Dict, Any, Optional

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
    
    def __init__(self, api_url: str, access_key: str, timeout: int = 10):
        """Initialize Cylestio client.
        
        Args:
            api_url: Cylestio API endpoint URL
            access_key: API access key for authentication
            timeout: HTTP request timeout in seconds
        """
        self.api_url = api_url.rstrip("/")
        self.access_key = access_key
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
        
        # Initialize Descope authenticator for JWT token generation
        self._authenticator = DescopeAuthenticator.get_instance(access_key=access_key)
    
    async def __aenter__(self) -> "CylestioClient":
        """Async context manager entry."""
        # Create client without Authorization header initially
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "cylestio-gateway/1.0"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def send_event(self, event: BaseEvent) -> bool:
        """Send a single event to Cylestio API.
        
        Args:
            event: BaseEvent to send
            
        Returns:
            True if successful, False otherwise
            
        Raises:
            CylestioAPIError: If API returns an error
        """
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        
        try:
            # Get JWT token for authorization
            jwt_token = self._authenticator.get_jwt_token()
            if not jwt_token:
                logger.error("Failed to get JWT token for authentication")
                return False
            
            # Convert event to dict for JSON serialization
            event_data = event.model_dump()
            
            # Log the event being sent (at debug level)
            logger.debug(f"Sending event to Cylestio: {event.name} for session {event.session_id}")

            # Send HTTP POST request with JWT token
            response = await self._client.post(
                f"{self.api_url}/v1/telemetry",
                json=event_data,
                headers={"Authorization": f"Bearer {jwt_token}"}
            )
            
            # Check response status
            if response.status_code == 200 or response.status_code == 201:
                logger.debug(f"Successfully sent event {event.name}")
                return True
            else:
                # Invalidate token on authentication errors
                if response.status_code == 401 or response.status_code == 403:
                    self._authenticator.invalidate_token()
                    logger.warning("Authentication error occurred, invalidating JWT token to refresh next time")
                
                error_msg = f"API returned {response.status_code}: {response.text}"
                logger.error(f"Failed to send event {event.name}: {error_msg}")
                raise CylestioAPIError(error_msg, response.status_code)
                
        except httpx.TimeoutException:
            logger.error(f"Timeout sending event {event.name} to Cylestio API")
            return False
        except httpx.NetworkError as e:
            logger.error(f"Network error sending event {event.name}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending event {event.name}: {e}")
            return False
    
    async def send_events_batch(self, events: list[BaseEvent]) -> Dict[str, int]:
        """Send multiple events in a batch.
        
        Args:
            events: List of BaseEvent objects to send
            
        Returns:
            Dict with 'success' and 'failed' counts
        """
        if not events:
            return {"success": 0, "failed": 0}
        
        results = {"success": 0, "failed": 0}
        
        for event in events:
            try:
                success = await self.send_event(event)
                if success:
                    results["success"] += 1
                else:
                    results["failed"] += 1
            except Exception as e:
                logger.error(f"Failed to send event {event.name}: {e}")
                results["failed"] += 1
        
        return results
    
    async def health_check(self) -> bool:
        """Check if Cylestio API is reachable.
        
        Returns:
            True if API is healthy, False otherwise
        """
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        
        try:
            response = await self._client.get(f"{self.api_url}/health")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False