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

PERIMETER_HEADER_PREFIX = "x-cylestio-"

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
    
    def _strip_proxy_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """Remove headers that should not be forwarded to the LLM provider.
        
        This includes:
        - Host-related headers (host, content-length)
        - Cylestio control headers (x-cylestio-*)
        
        Args:
            headers: Original request headers
            
        Returns:
            Filtered headers dict
        """
        excluded_headers = {"host", "content-length"}
        
        return {
            k: v for k, v in headers.items() 
            if k.lower() not in excluded_headers and not k.lower().startswith(PERIMETER_HEADER_PREFIX)
        }
    
    def _inject_provider_headers(self, headers: Dict[str, str], provider_headers: Dict[str, str]) -> Dict[str, str]:
        """Inject provider-specific headers (e.g., API keys) into the request.
        
        Only adds provider headers if the client hasn't already provided them.
        Uses case-insensitive comparison to avoid duplicates.
        
        Args:
            headers: Current headers dict
            provider_headers: Headers to inject from provider
            
        Returns:
            Headers dict with provider headers added
        """
        client_headers_lower = {k.lower() for k in headers}
        
        # Add provider headers only if client didn't provide them (case-insensitive check)
        missing_provider_headers = {
            k: v for k, v in provider_headers.items()
            if k.lower() not in client_headers_lower
        }
        
        return {**headers, **missing_provider_headers}
    
    def _prepare_headers(self, request_headers: Dict[str, str]) -> Dict[str, str]:
        """Prepare headers for the proxied request.
        
        This function:
        1. Strips proxy-related headers (host, content-length, x-cylestio-*)
        2. Injects provider authentication headers if not already present
        
        Args:
            request_headers: Original request headers
            
        Returns:
            Modified headers dict ready for forwarding
        """
        # Step 1: Strip headers that shouldn't be forwarded
        headers = self._strip_proxy_headers(request_headers)
        
        # Step 2: Inject provider authentication headers
        provider_auth_headers = self.provider.get_auth_headers()
        headers = self._inject_provider_headers(headers, provider_auth_headers)
        
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
        content_type = request.headers.get("content-type", "")
        
        # Check if this is a streaming request
        is_streaming = False
        if body_bytes and content_type.startswith("application/json"):
            try:
                body_json = json.loads(body_bytes)
                is_streaming = self._is_streaming_request(body_json)
            except json.JSONDecodeError:
                logger.warning(
                    "Failed to parse JSON body despite application/json content-type",
                    extra={
                        "path": path,
                        "content_type": content_type,
                        "body_preview": body_bytes[:200].decode('utf-8', errors='replace')
                    }
                )
        elif body_bytes:
            # Non-JSON request with body - log for visibility
            logger.info(
                "Non-JSON request body detected",
                extra={
                    "path": path,
                    "content_type": content_type,
                    "body_size": len(body_bytes),
                    "body_preview": body_bytes[:100].decode('utf-8', errors='replace') if body_bytes else None
                }
            )
        
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
            # Always buffer the response (both streaming and non-streaming)
            return await self._handle_buffered_request(
                request=request,
                method=request.method,
                url=target_url,
                headers=headers,
                content=body_bytes,
                is_streaming=is_streaming
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
    
    async def _handle_buffered_request(
        self,
        request: Request,
        method: str,
        url: str,
        headers: Dict[str, str],
        content: bytes,
        is_streaming: bool
    ) -> Response:
        """Handle a request by buffering the entire response.
        
        For streaming requests, buffers all chunks and stores them in request.state
        so the middleware can replay them to preserve original chunk sizes.
        
        Args:
            request: FastAPI request object (for storing state)
            method: HTTP method
            url: Target URL
            headers: Request headers
            content: Request body
            is_streaming: Whether this is a streaming request
            
        Returns:
            Response object with full buffered body
        """
        if is_streaming:
            # For streaming requests, we need to keep the client alive during streaming
            # Create client outside the generator so it persists
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.settings.llm.timeout),
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=0, keepalive_expiry=0, max_connections=100),
            )
            
            chunks = []
            
            async def stream_and_buffer():
                """Stream to client while buffering for middleware."""
                try:
                    async with client.stream(
                        method=method,
                        url=url,
                        headers=headers,
                        content=content,
                    ) as response:
                        # Copy response headers, excluding some
                        excluded_response_headers = {"content-encoding", "content-length", "transfer-encoding"}
                        upstream_headers = {
                            k: v for k, v in response.headers.items()
                            if k.lower() not in excluded_response_headers
                        }
                        
                        logger.info(f"Streaming response to client: {response.status_code}")
                        
                        # Stream to client while buffering
                        async for chunk in response.aiter_bytes(chunk_size=1024):
                            chunks.append(chunk)  # Buffer for middleware
                            yield chunk  # Stream to client immediately
                    
                    # After streaming completes, store buffered data
                    request.state.buffered_chunks = chunks
                    request.state.original_content_type = upstream_headers.get("content-type", "text/event-stream")
                    logger.info(f"Streaming complete: {len(chunks)} chunks, {sum(len(c) for c in chunks)} bytes")
                    
                finally:
                    # Close client after streaming completes
                    await client.aclose()
            
            # Return StreamingResponse that will stream to client
            return StreamingResponse(
                stream_and_buffer(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                }
            )
        else:
            # For non-streaming requests, use context manager normally
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