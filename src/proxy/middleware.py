"""Core LLM middleware with interceptor support."""
import json
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.proxy.session import SessionDetector
from src.proxy.tools import ToolParser
from src.providers.base import BaseProvider, SessionInfo
from src.utils.logger import get_logger

logger = get_logger(__name__)


class LLMMiddleware(BaseHTTPMiddleware):
    """Core middleware that handles LLM request/response detection and runs interceptors."""

    def __init__(self, app, provider: BaseProvider, **kwargs):
        """Initialize LLM middleware with provider and interceptors.

        Args:
            app: FastAPI application
            provider: The provider instance for this middleware
            **kwargs: Contains 'interceptors' key
        """
        super().__init__(app)
        self.provider = provider
        interceptors = kwargs.get('interceptors', [])
        self.interceptors = [i for i in interceptors if i.enabled]

        # Initialize tool parser
        self.tool_parser = ToolParser()

        # Initialize session detector with provider
        self.session_detector = SessionDetector(provider)

        logger.info(f"LLM Middleware initialized with {len(self.interceptors)} interceptors")
        logger.info(f"  - Provider: {self.provider.name}")
        if self.session_detector:
            logger.info("  - Session detection: enabled")
        else:
            logger.info("  - Session detection: disabled")

        for interceptor in self.interceptors:
            logger.info(f"  - {interceptor.name}: enabled")


    async def _process_response(
        self,
        request_data,
        response_body: Optional[Dict[str, Any]],
        response_obj: Response,
        duration_ms: float
    ) -> LLMResponseData:
        """Process response - extract events and run interceptors.

        Unified method for both streaming and non-streaming responses.

        Args:
            request_data: LLMRequestData object
            response_body: Parsed response body
            response_obj: Response object
            duration_ms: Request duration

        Returns:
            LLMResponseData with events and interceptors applied
        """
        # Parse tool information from response
        tool_uses_request = self.tool_parser.parse_tool_requests(response_body, request_data.provider)

        # Extract events from response using provider
        # Note: We extract events even for error responses (4xx/5xx) to track LLMCallErrorEvent
        response_events = []
        if request_data.session_id and (response_body or response_obj.status_code >= 400):
            try:
                request_metadata = {
                    'cylestio_trace_id': getattr(request_data.request.state, 'cylestio_trace_id', None),
                    'agent_id': getattr(request_data.request.state, 'agent_id', 'unknown'),
                    'model': getattr(request_data.request.state, 'model', request_data.model or 'unknown'),
                    'agent_workflow_id': getattr(request_data.request.state, 'agent_workflow_id', None)
                }

                response_events = self.provider.extract_response_events(
                    response_body=response_body,
                    session_id=request_data.session_id,
                    duration_ms=duration_ms,
                    tool_uses=tool_uses_request,
                    request_metadata=request_metadata,
                    status_code=response_obj.status_code
                )
            except Exception as e:
                logger.error(f"Error extracting response events: {e}", exc_info=True)

        # Create response data
        response_data = LLMResponseData(
            response=response_obj,
            body=response_body,
            duration_ms=duration_ms,
            session_id=request_data.session_id,
            status_code=response_obj.status_code,
            tool_uses_request=tool_uses_request,
            events=response_events
        )

        # Run after_response interceptors
        for interceptor in self.interceptors:
            try:
                modified_response = await interceptor.after_response(request_data, response_data)
                if modified_response:
                    response_data = modified_response
            except Exception as e:
                logger.error(f"Error in {interceptor.name}.after_response: {e}", exc_info=True)

        # Notify provider of response if we have session info
        if request_data.session_id and response_body:
            try:
                await self.provider.notify_response(
                    session_id=request_data.session_id,
                    request=request_data.request,
                    response_body=response_body
                )
            except Exception as e:
                logger.debug(f"Error notifying provider of response: {e}")

        return response_data

    async def _process_streaming_completion(self, request_data, start_time: float) -> None:
        """Process streaming response after it completes - run interceptors with buffered data.

        Args:
            request_data: Original request data
            start_time: Request start time for duration calculation
        """
        try:
            # Get buffered chunks from request state
            chunks = request_data.request.state.buffered_chunks
            body_bytes = b''.join(chunks)
            original_content_type = getattr(request_data.request.state, 'original_content_type', 'text/event-stream')

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Parse the SSE response using provider-specific parser
            response_body = self.provider.parse_streaming_response(body_bytes)
            if not response_body:
                logger.warning("Could not parse SSE response, skipping event extraction")
                response_body = {'raw_sse': body_bytes.decode('utf-8', errors='replace')[:1000]}

            # Create a Response object for interceptors (already sent to client, but needed for metadata)
            response_obj = Response(
                content=body_bytes,
                status_code=200,
                media_type=original_content_type
            )

            # Use unified response processing
            await self._process_response(request_data, response_body, response_obj, duration_ms)

            logger.info(f"Processed streaming response through {len(self.interceptors)} interceptors")

        except Exception as e:
            logger.error(f"Error processing streaming completion: {e}", exc_info=True)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through interceptor chain.

        Args:
            request: Incoming request
            call_next: Next middleware or endpoint

        Returns:
            Response object
        """
        # Skip non-proxy requests (health, metrics, config)
        if request.url.path in ["/health", "/metrics", "/config"]:
            return await call_next(request)

        start_time = time.time()

        # Parse and analyze request
        logger.info(f"LLM Middleware processing request for path: {request.url.path}")
        request_data = await self._create_request_data(request)
        if request_data:
            logger.debug(
                f"request.session_id={request_data.session_id}, provider={request_data.provider}, model={request_data.model}, events={len(request_data.events)}"
            )
        else:
            logger.info("Request data could not be created; passing through.")

        if not request_data:
            # Not an LLM request, pass through
            return await call_next(request)

        logger.debug(f"Processing LLM request: {request.method} {request.url.path}")

        try:
            # Run before_request interceptors
            for interceptor in self.interceptors:
                try:
                    modified_data = await interceptor.before_request(request_data)
                    if modified_data:
                        request_data = modified_data
                except Exception as e:
                    logger.error(f"Error in {interceptor.name}.before_request: {e}", exc_info=True)

            # Process the request
            response = await call_next(request_data.request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Check if this is a streaming response
            content_type = response.headers.get("content-type", "")
            is_streaming_response = content_type.startswith("text/event-stream")

            # For streaming responses, wrap to process interceptors after completion
            if is_streaming_response:
                logger.info("Streaming response detected - will process after streaming completes")

                async def stream_and_process_after():
                    """Pass through stream to client, then run interceptors on buffered data."""
                    # Pass through all chunks to client (ProxyHandler already buffered them)
                    async for chunk in response.body_iterator:
                        yield chunk

                    # After streaming completes, ProxyHandler has stored buffered data in request.state
                    # Now run interceptors with that buffered data
                    if hasattr(request_data.request.state, 'buffered_chunks'):
                        await self._process_streaming_completion(request_data, start_time)

                from fastapi.responses import StreamingResponse
                return StreamingResponse(
                    stream_and_process_after(),
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=content_type
                )

            # For JSON responses, capture the body before sending
            response_body = None
            if content_type.startswith("application/json"):
                # Read the response body
                body_bytes = b""
                async for chunk in response.body_iterator:
                    body_bytes += chunk

                # Parse JSON
                try:
                    response_body = json.loads(body_bytes.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    logger.debug("Failed to parse response body as JSON")

                # Create new response with the same body
                response = Response(
                    content=body_bytes,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )

            # Store response_id for session continuity (before client can make next request)
            if (request_data.session_id and response_body and
                hasattr(self.provider, 'response_sessions') and
                request_data.request.url.path.endswith("/responses")):
                response_id = response_body.get("id")
                if response_id:
                    self.provider.response_sessions[response_id] = request_data.session_id
                    logger.info(f"Stored response_id mapping: {response_id} -> {request_data.session_id}")

            # Use unified response processing
            response_data = await self._process_response(request_data, response_body, response, duration_ms)

            return response_data.response

        except Exception as e:
            logger.error(f"Error processing LLM request: {e}", exc_info=True)

            # Run error interceptors
            for interceptor in self.interceptors:
                try:
                    await interceptor.on_error(request_data, e)
                except Exception as ie:
                    logger.error(f"Error in {interceptor.name}.on_error: {ie}", exc_info=True)

            # Re-raise the original error
            raise

    async def _evaluate_session_id(self, request: Request, body: Dict[str, Any]) -> Tuple[str, SessionInfo, bool]:
        """Evaluate and determine session ID using either external headers or auto-generation.

        This function encapsulates all the complex logic for deciding how to handle session IDs:
        - Check for external session ID header
        - Fall back to normal session detection
        - Handle session creation/continuation logic

        Args:
            request: FastAPI request object
            body: Parsed request body

        Returns:
            Tuple of (session_id, session_info_obj, is_new_session)
        """
        # Check for external conversation ID header (identifies the conversation/thread)
        external_session_id = request.headers.get("x-cylestio-conversation-id")

        # If external session ID is provided, use it
        if external_session_id:
            session_info_obj = await self.provider.create_or_get_session(
                session_id=external_session_id,
                body=body,
                metadata={"external": True, "provider": self.provider.name}
            )
            return external_session_id, session_info_obj, session_info_obj.is_session_start

        # Otherwise, use normal session detection flow
        if self.session_detector:
            logger.info(f"Using session detector for path: {request.url.path}")
            try:
                session_info = await self.session_detector.analyze_request(request, body)
                logger.info(f"Session detection result: {session_info is not None}")
                if session_info:
                    session_id = session_info.get("session_id")
                    is_new_session = session_info.get("is_new_session", False)
                    session_info_obj = session_info.get("session_info_obj")
                    logger.info(f"Session detected: id={session_id}, new={is_new_session}")
                    return session_id, session_info_obj, is_new_session
            except Exception as e:
                logger.error(f"Failed to analyze session: {e}", exc_info=True)

        # Fallback: no session detected
        return None, None, False

    def _evaluate_agent_id(self, request: Request, body: Dict[str, Any]) -> str:
        """Evaluate and return the appropriate agent ID for a request.

        This method centralizes agent ID evaluation logic, checking for external
        agent ID from headers first, then falling back to provider-computed agent ID.

        Args:
            request: FastAPI request object
            body: Parsed request body

        Returns:
            The agent ID to use for this request
        """
        # Check for external prompt ID in headers (identifies the prompt pattern)
        external_agent_id = request.headers.get("x-cylestio-prompt-id")

        # Use provider's evaluation method which handles the fallback logic
        return self.provider.evaluate_agent_id(body, external_agent_id)

    def _parse_tags_header(self, request: Request) -> Dict[str, str]:
        """Parse the x-cylestio-tags and x-cylestio-session-id headers into a dictionary.

        Header format for tags: key1:value1,key2:value2,...
        Example: user:someone@email.com,env:production,team:backend

        The x-cylestio-session-id header is automatically injected as a 'session' tag
        to group conversations from one workflow execution.

        Tag limits:
        - Max 50 tags per request
        - Max 64 chars for key
        - Max 512 chars for value

        Args:
            request: FastAPI request object

        Returns:
            Dictionary of tag key-value pairs
        """
        tags: Dict[str, str] = {}

        # Check for session grouping header and auto-inject as tag
        session_group_id = request.headers.get("x-cylestio-session-id")
        if session_group_id:
            tags["session"] = session_group_id

        tags_header = request.headers.get("x-cylestio-tags")
        if not tags_header:
            return tags

        tag_count = len(tags)  # Account for pre-populated session tag
        max_tags = 50
        max_key_len = 64
        max_value_len = 512

        for tag_pair in tags_header.split(","):
            if tag_count >= max_tags:
                logger.warning(f"Tags limit exceeded ({max_tags}), ignoring remaining tags")
                break

            tag_pair = tag_pair.strip()
            if not tag_pair:
                continue

            # Split on first colon only (value may contain colons)
            if ":" in tag_pair:
                key, value = tag_pair.split(":", 1)
                key = key.strip()
                value = value.strip()
            else:
                # Tag without value - treat as boolean tag
                key = tag_pair
                value = "true"

            # Validate key and value lengths
            if len(key) > max_key_len:
                logger.warning(f"Tag key '{key[:20]}...' exceeds max length ({max_key_len}), skipping")
                continue
            if len(value) > max_value_len:
                logger.warning(f"Tag value for '{key}' exceeds max length ({max_value_len}), truncating")
                value = value[:max_value_len]

            if key:
                tags[key] = value
                tag_count += 1

        return tags

    async def _create_request_data(self, request: Request) -> Optional[LLMRequestData]:
        """Parse request and create LLMRequestData.

        Args:
            request: FastAPI request object

        Returns:
            LLMRequestData or None if not an LLM request
        """
        try:
            # Get request body
            body_bytes = await request.body()
            body = None
            is_streaming = False

            if body_bytes and request.headers.get("content-type", "").startswith("application/json"):
                try:
                    body = json.loads(body_bytes)
                    is_streaming = body.get("stream", False) is True
                except json.JSONDecodeError:
                    logger.warning("Failed to parse request body as JSON")
                    return None

            # Extract model from request body first, then use provider if needed
            model = None
            if body:
                model = self.provider.extract_model_from_body(body)

            # Use the dedicated session evaluation function
            session_id, session_info_obj, is_new_session = await self._evaluate_session_id(request, body)

            # Update model and streaming info from session detection if available
            if session_info_obj and not model and session_info_obj.model:
                model = session_info_obj.model
            if session_info_obj and session_info_obj.is_streaming is not None:
                is_streaming = session_info_obj.is_streaming

            # Extract events from request using provider
            events = []
            if session_id and body and session_info_obj:
                try:
                    # Evaluate agent_id BEFORE creating events
                    trace_id = self.provider.get_trace_id(session_id)
                    agent_id = self._evaluate_agent_id(request, body)

                    # Store trace ID and other metadata for response events
                    request.state.cylestio_trace_id = trace_id
                    request.state.agent_id = agent_id
                    request.state.model = model

                    # Parse and store tags from header
                    tags = self._parse_tags_header(request)
                    request.state.tags = tags

                    # Note: span_id will be set by individual events as needed

                    # Extract events from request with computed agent_id
                    events, new_processed_index = self.provider.extract_request_events(
                        body=body,
                        session_info=session_info_obj,
                        session_id=session_id,
                        is_new_session=is_new_session,
                        last_processed_index=session_info_obj.last_processed_index,
                        computed_agent_id=agent_id
                    )

                    # Update session with new processed index using provider interface
                    if new_processed_index > session_info_obj.last_processed_index:
                        self.provider.update_session_processed_index(session_id, new_processed_index)

                except Exception as e:
                    logger.error(f"Error extracting request events: {e}", exc_info=True)

            # Create request data
            return LLMRequestData(
                request=request,
                body=body,
                is_streaming=is_streaming,
                session_id=session_id,
                provider=self.provider.name,
                model=model,
                is_new_session=is_new_session,
                tool_results=[],  # Tool results are now processed within extract_request_events
                events=events
            )

        except Exception as e:
            logger.error(f"Error creating request data: {e}", exc_info=True)
            return None


    def _is_llm_request(self, request: Request) -> bool:
        """Check if request is for LLM processing.

        Args:
            request: Request object

        Returns:
            True if this is an LLM request
        """
        # Skip health, metrics, and config endpoints
        if request.url.path in ["/health", "/metrics", "/config"]:
            return False

        # For now, assume all other requests are LLM requests
        # You could add more sophisticated detection here
        return True
