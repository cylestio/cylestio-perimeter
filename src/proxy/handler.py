"""Proxy handler for forwarding requests to LLM providers."""
import json
from typing import Any, Dict, Optional

import httpx
from fastapi import Request, Response
from fastapi.responses import StreamingResponse

from src.config.settings import Settings
from src.providers.base import BaseProvider
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ProxyHandler:
    """Handles proxying requests to LLM providers."""
    
    def __init__(self, settings: Settings, provider: BaseProvider):
        """Initialize proxy handler with settings and provider.
        
        Args:
            settings: Application settings
            provider: Provider instance for this proxy
        """
        self.settings = settings
        self.provider = provider
    
    async def close(self) -> None:
        """No-op: clients are created per request."""
        return None
    
    def _prepare_headers(self, request_headers: Dict[str, str]) -> Dict[str, str]:
        """Prepare headers for the proxied request.
        
        Args:
            request_headers: Original request headers
            
        Returns:
            Modified headers dict
        """
        # Copy headers, excluding host-related ones and cylestio control headers
        excluded_headers = {"host", "content-length"}
        
        headers = {
            k: v for k, v in request_headers.items() 
            if k.lower() not in excluded_headers and not k.lower().startswith("x-cylestio-")
        }
        
        # Get provider-specific auth headers and merge without overwriting client headers
        provider_auth_headers = self.provider.get_auth_headers()
        client_headers_lower = {k.lower() for k in headers}
        
        # Add provider headers only if client didn't provide them (case-insensitive check)
        missing_provider_headers = {
            k: v for k, v in provider_auth_headers.items()
            if k.lower() not in client_headers_lower
        }
        headers.update(missing_provider_headers)
        
        return headers
    
    def _is_streaming_request(self, body: Any) -> bool:
        """Check if request is for streaming response.
        
        Args:
            body: Request body
            
        Returns:
            True if streaming is requested
        """
        if isinstance(body, dict):
            return self.provider.extract_streaming_from_body(body)
        return False
    
    async def handle_request(self, request: Request, path: str) -> Response:
        """Handle a proxy request.
        
        Args:
            request: FastAPI request object
            path: Request path
            
        Returns:
            Response object
        """
        # Build target URL using provider
        base_url = self.provider.get_base_url()
        target_url = f"{base_url}/{path}"
        if request.url.query:
            target_url += f"?{request.url.query}"
        
        # Get request body
        body_bytes = await request.body()
        
        # Check if this is a streaming request
        is_streaming = False
        if body_bytes and request.headers.get("content-type", "").startswith("application/json"):
            try:
                body_json = json.loads(body_bytes)
                is_streaming = self._is_streaming_request(body_json)
            except json.JSONDecodeError:
                pass
        
        # Prepare headers
        headers = self._prepare_headers(dict(request.headers))
        
        logger.info(
            "Proxying request",
            extra={
                "method": request.method,
                "path": path,
                "target_url": target_url,
                "is_streaming": is_streaming
            }
        )
        
        try:
            # Handle streaming vs non-streaming
            if is_streaming:
                return await self._handle_streaming_request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    content=body_bytes
                )
            else:
                return await self._handle_standard_request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    content=body_bytes
                )
        except httpx.TimeoutException:
            logger.error(f"Request timeout for {target_url}")
            return Response(
                content=json.dumps({"error": "Request timeout"}),
                status_code=504,
                media_type="application/json"
            )
        except Exception as e:
            logger.error(f"Proxy error: {str(e)}", exc_info=True)
            return Response(
                content=json.dumps({"error": "Internal proxy error"}),
                status_code=500,
                media_type="application/json"
            )
    
    async def _handle_standard_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        content: bytes
    ) -> Response:
        """Handle a standard (non-streaming) request.
        
        Args:
            method: HTTP method
            url: Target URL
            headers: Request headers
            content: Request body
            
        Returns:
            Response object
        """
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(self.settings.llm.timeout),
            follow_redirects=True,
            limits=httpx.Limits(max_keepalive_connections=0, keepalive_expiry=0, max_connections=100),
        ) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=content,
            )
        
        # Copy response headers, excluding some
        excluded_response_headers = {"content-encoding", "content-length", "transfer-encoding"}
        response_headers = {
            k: v for k, v in response.headers.items()
            if k.lower() not in excluded_response_headers
        }
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers
        )
    
    async def _handle_streaming_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        content: bytes
    ) -> StreamingResponse:
        """Handle a streaming request.
        
        Args:
            method: HTTP method
            url: Target URL
            headers: Request headers
            content: Request body
            
        Returns:
            StreamingResponse object
        """
        async def stream_generator():
            """Generate streaming response chunks."""
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(self.settings.llm.timeout),
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=0, keepalive_expiry=0, max_connections=100),
            ) as client:
                async with client.stream(
                    method=method,
                    url=url,
                    headers=headers,
                    content=content,
                ) as response:
                    # Log response status
                    logger.info(f"Streaming response status: {response.status_code}")
                    
                    # Stream the response
                    async for chunk in response.aiter_bytes(chunk_size=1024):
                        yield chunk
        
        # For SSE responses, use text/event-stream
        media_type = "text/event-stream"
        
        return StreamingResponse(
            stream_generator(),
            media_type=media_type,
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )