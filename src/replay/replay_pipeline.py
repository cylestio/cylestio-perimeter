"""Pipeline for replaying recorded HTTP traffic through interceptors."""

import json
from typing import Any, Dict, Optional
from unittest.mock import MagicMock

from src.proxy.interceptor_base import LLMRequestData, LLMResponseData
from src.proxy.interceptor_manager import interceptor_manager
from src.config.settings import Settings
from src.replay.replay_service import RequestResponsePair
from src.utils.logger import get_logger
from src.providers.openai import OpenAIProvider
from src.providers.anthropic import AnthropicProvider
from src.providers.base import SessionInfo

logger = get_logger(__name__)


class MockRequest:
    """Mock FastAPI Request object for replay."""

    def __init__(self, recorded_request: Dict[str, Any]):
        self.method = recorded_request.get("method", "POST")
        self.url = MagicMock()
        self.url.path = recorded_request.get("path", "/")
        self.url.query = recorded_request.get("query", "")
        # Fix the __str__ method to properly handle the str() call
        self.url.__str__ = lambda *args: recorded_request.get("url", "http://localhost/")

        # Reconstruct headers
        self.headers = recorded_request.get("headers", {})

        # Reconstruct body
        body_info = recorded_request.get("body", {})
        self._body_content = self._reconstruct_body(body_info)
        self._body = self._body_content  # Some providers may check this attribute

        # Add state for metadata storage (used by interceptors)
        self.state = MagicMock()

        # Set basic metadata for event extraction
        self.state.cylestio_trace_id = None  # Will be set by provider
        self.state.agent_id = recorded_request.get("headers", {}).get("x-cylestio-agent-id", "unknown")
        self.state.model = recorded_request.get("model", "unknown")

    async def body(self) -> bytes:
        """Return the request body as bytes."""
        return self._body_content

    def _reconstruct_body(self, body_info: Dict[str, Any]) -> bytes:
        """Reconstruct request body from recorded body information."""
        if not body_info or body_info.get("size", 0) == 0:
            return b""

        content_type = body_info.get("type", "text")
        content = body_info.get("content")

        if content is None:
            return b""

        if content_type == "json":
            # Re-serialize JSON content
            return json.dumps(content, ensure_ascii=False).encode('utf-8')
        elif content_type == "text":
            # Return text content as bytes
            return content.encode('utf-8') if isinstance(content, str) else b""
        elif content_type == "binary":
            # Decode base64 content
            import base64
            return base64.b64decode(content) if isinstance(content, str) else b""

        return b""


class MockResponse:
    """Mock FastAPI Response object for replay."""

    def __init__(self, recorded_response: Dict[str, Any]):
        self.status_code = recorded_response.get("status_code", 200)
        self.headers = recorded_response.get("headers", {})

        # Reconstruct body
        body_info = recorded_response.get("body", {})
        self.body = self._reconstruct_body(body_info)
        self.content = self.body  # Some interceptors check content instead

    def _reconstruct_body(self, body_info: Dict[str, Any]) -> bytes:
        """Reconstruct response body from recorded body information."""
        if not body_info or body_info.get("size", 0) == 0:
            return b""

        content_type = body_info.get("type", "text")
        content = body_info.get("content")

        if content is None:
            return b""

        if content_type == "json":
            # Re-serialize JSON content
            return json.dumps(content, ensure_ascii=False).encode('utf-8')
        elif content_type == "text":
            # Return text content as bytes
            return content.encode('utf-8') if isinstance(content, str) else b""
        elif content_type == "binary":
            # Decode base64 content
            import base64
            return base64.b64decode(content) if isinstance(content, str) else b""

        return b""


class ReplayPipeline:
    """Pipeline for replaying recorded traffic through interceptors."""

    def __init__(self, config: Optional[Settings] = None, provider_name: str = "replay"):
        """Initialize replay pipeline.

        Args:
            config: Optional configuration for interceptors
            provider_name: Name of the provider for this replay session
        """
        self.provider_name = provider_name
        self.provider = None
        self.sessions = {}  # Track session state for event extraction

        # Initialize interceptors
        if config and config.interceptors:
            # Create provider config for interceptors (including LiveTrace)
            provider_config = {
                "base_url": config.llm.base_url if config.llm else "unknown",
                "type": config.llm.type if config.llm else "unknown",
                "timeout": config.llm.timeout if config.llm else 30,
                "max_retries": config.llm.max_retries if config.llm else 3,
                "proxy_host": config.server.host if config.server else "127.0.0.1",
                "proxy_port": config.server.port if config.server else 4000
            }
            # Prepare global config for interceptors
            global_config = {}
            if hasattr(config, 'live_trace') and config.live_trace:
                global_config["live_trace"] = {
                    "session_completion_timeout": config.live_trace.session_completion_timeout,
                    "completion_check_interval": config.live_trace.completion_check_interval
                }

            self.interceptors = interceptor_manager.create_interceptors(
                config.interceptors,
                provider_name,
                provider_config,
                global_config
            )
            # Only use enabled interceptors and exclude http_recorder during replay
            self.interceptors = [i for i in self.interceptors if i.enabled and i.name != "http_recorder"]
        else:
            # Default: just use printer for basic output
            from src.interceptors.printer import PrinterInterceptor
            self.interceptors = [PrinterInterceptor({"enabled": True})]

        logger.info(f"Replay pipeline initialized with {len(self.interceptors)} interceptors:")
        for interceptor in self.interceptors:
            logger.info(f"  - {interceptor.name}")

    def _get_provider(self, provider_type: str):
        """Get or create provider instance based on recorded provider type.

        Args:
            provider_type: Provider type from recorded data

        Returns:
            Provider instance for event extraction
        """
        if self.provider is None:
            if provider_type.lower() == "openai":
                self.provider = OpenAIProvider()
                logger.info("Created OpenAI provider for event extraction")
            elif provider_type.lower() == "anthropic":
                self.provider = AnthropicProvider()
                logger.info("Created Anthropic provider for event extraction")
            else:
                logger.warning(f"Unknown provider type: {provider_type}, using Anthropic as default")
                self.provider = AnthropicProvider()

        return self.provider

    def _get_or_create_session_info(self, session_id: str, recorded_request: Dict[str, Any]) -> SessionInfo:
        """Get or create session info for a session.

        Args:
            session_id: Session identifier
            recorded_request: Recorded request data

        Returns:
            SessionInfo object for this session
        """
        if session_id not in self.sessions:
            # Create new session info
            self.sessions[session_id] = SessionInfo(
                is_session_start=True,
                is_session_end=False,
                conversation_id=session_id,
                message_count=0,
                model=recorded_request.get("model"),
                is_streaming=recorded_request.get("is_streaming", False),
                metadata={"replay": True},
                last_processed_index=0
            )
            logger.debug(f"Created new session info for {session_id}")
        else:
            # Update session start flag for subsequent requests
            self.sessions[session_id].is_session_start = False

        return self.sessions[session_id]

    async def process_pair(self, pair: RequestResponsePair) -> None:
        """Process a single request/response pair through the interceptor chain.

        Args:
            pair: Request/response pair to process
        """
        try:
            # Get provider type from recorded data
            recorded_request = pair.request.data
            provider_type = recorded_request.get("provider", "anthropic")
            session_id = recorded_request.get("session_id")

            # Get provider for event extraction
            provider = self._get_provider(provider_type)

            # Reconstruct request data with event extraction
            request_data = self._create_request_data(pair, provider)

            if not request_data:
                logger.warning("Could not reconstruct request data, skipping pair")
                return

            logger.debug(f"Processing request: {request_data.request.method} {request_data.request.url.path}")

            # Run before_request interceptors
            for interceptor in self.interceptors:
                try:
                    modified_data = await interceptor.before_request(request_data)
                    if modified_data:
                        request_data = modified_data
                except Exception as e:
                    logger.error(f"Error in {interceptor.name}.before_request: {e}", exc_info=True)

            # If we have a response, process it too
            if pair.has_response:
                response_data = self._create_response_data(pair, request_data, provider)

                if response_data:
                    logger.debug(f"Processing response: {response_data.status_code}")

                    # Run after_response interceptors
                    for interceptor in self.interceptors:
                        try:
                            modified_response = await interceptor.after_response(request_data, response_data)
                            if modified_response:
                                response_data = modified_response
                        except Exception as e:
                            logger.error(f"Error in {interceptor.name}.after_response: {e}", exc_info=True)
            else:
                # No response - generate a finish event indicating incomplete request
                logger.debug(f"Request has no response, generating incomplete finish event")

                # Create a minimal response data for the finish event
                response_data = self._create_incomplete_response_data(pair, request_data, provider)

                if response_data:
                    # Run after_response interceptors with the incomplete response
                    for interceptor in self.interceptors:
                        try:
                            modified_response = await interceptor.after_response(request_data, response_data)
                            if modified_response:
                                response_data = modified_response
                        except Exception as e:
                            logger.error(f"Error in {interceptor.name}.after_response: {e}", exc_info=True)

            # If we have an error, notify interceptors
            if pair.has_error:
                error_msg = pair.error.data.get("error_message", "Unknown error")
                error_type = pair.error.data.get("error_type", "Exception")

                # Create a mock exception
                mock_error = Exception(f"{error_type}: {error_msg}")

                for interceptor in self.interceptors:
                    try:
                        await interceptor.on_error(request_data, mock_error)
                    except Exception as e:
                        logger.error(f"Error in {interceptor.name}.on_error: {e}", exc_info=True)

        except Exception as e:
            logger.error(f"Error processing pair: {e}", exc_info=True)

    def _create_request_data(self, pair: RequestResponsePair, provider) -> Optional[LLMRequestData]:
        """Create LLMRequestData from recorded request with event extraction.

        Args:
            pair: Request/response pair
            provider: Provider instance for event extraction

        Returns:
            LLMRequestData object or None if creation fails
        """
        try:
            recorded_request = pair.request.data

            # Create mock request
            mock_request = MockRequest(recorded_request)

            # Parse body if it exists
            body = None
            if recorded_request.get("body", {}).get("content"):
                body_info = recorded_request["body"]
                if body_info.get("type") == "json":
                    body = body_info.get("content")

            # Get session information
            session_id = recorded_request.get("session_id")
            events = []

            # Extract events if we have session_id and body
            if session_id and body:
                # Get or create session info for this session
                session_info = self._get_or_create_session_info(session_id, recorded_request)

                try:
                    # Extract tool results from request body
                    from src.proxy.tools.parser import ToolParser
                    tool_parser = ToolParser()
                    tool_results = tool_parser.parse_tool_results(body, provider.name)

                    # Set trace_id in request state
                    trace_id = provider.get_trace_id(session_id) if hasattr(provider, 'get_trace_id') else None
                    mock_request.state.cylestio_trace_id = trace_id

                    # Extract events using provider
                    agent_id = recorded_request.get("headers", {}).get("x-cylestio-agent-id", "unknown")
                    events, new_processed_index = provider.extract_request_events(
                        body=body,
                        session_info=session_info,
                        session_id=session_id,
                        is_new_session=session_info.is_session_start,
                        last_processed_index=session_info.last_processed_index,
                        computed_agent_id=agent_id
                    )

                    # Update session processed index
                    session_info.last_processed_index = new_processed_index

                    logger.debug(f"Extracted {len(events)} events from request for session {session_id} (including {len(tool_results)} tool results)")

                except Exception as e:
                    logger.error(f"Error extracting request events: {e}", exc_info=True)

            # Create LLMRequestData
            return LLMRequestData(
                request=mock_request,
                body=body,
                is_streaming=recorded_request.get("is_streaming", False),
                session_id=session_id,
                provider=recorded_request.get("provider", self.provider_name),
                model=recorded_request.get("model"),
                is_new_session=False,  # We handle this in session info
                tool_results=[],
                events=events
            )

        except Exception as e:
            logger.error(f"Error creating request data: {e}", exc_info=True)
            return None

    def _create_response_data(self, pair: RequestResponsePair, request_data: LLMRequestData, provider) -> Optional[LLMResponseData]:
        """Create LLMResponseData from recorded response with event extraction.

        Args:
            pair: Request/response pair
            request_data: Associated request data
            provider: Provider instance for event extraction

        Returns:
            LLMResponseData object or None if creation fails
        """
        try:
            if not pair.response:
                return None

            recorded_response = pair.response.data

            # Create mock response
            mock_response = MockResponse(recorded_response)

            # Parse response body if it exists
            body = None
            if recorded_response.get("body", {}).get("content"):
                body_info = recorded_response["body"]
                if body_info.get("type") == "json":
                    body = body_info.get("content")

            # Extract events from response if we have session and body
            events = []
            if request_data.session_id and body:
                try:
                    # Extract tool uses from response body
                    from src.proxy.tools.parser import ToolParser
                    tool_parser = ToolParser()
                    tool_uses = tool_parser.parse_tool_requests(body, provider.name)

                    # Get metadata for event extraction
                    request_metadata = {
                        'cylestio_trace_id': getattr(request_data.request.state, 'cylestio_trace_id', None),
                        'agent_id': getattr(request_data.request.state, 'agent_id', 'unknown'),
                        'model': getattr(request_data.request.state, 'model', request_data.model or 'unknown')
                    }

                    events = provider.extract_response_events(
                        response_body=body,
                        session_id=request_data.session_id,
                        duration_ms=recorded_response.get("duration_ms", 0.0),
                        tool_uses=tool_uses,  # Pass extracted tool uses
                        request_metadata=request_metadata
                    )

                    logger.debug(f"Extracted {len(events)} events from response for session {request_data.session_id} (including {len(tool_uses)} tool uses)")

                except Exception as e:
                    logger.error(f"Error extracting response events: {e}", exc_info=True)

            # Create LLMResponseData
            return LLMResponseData(
                response=mock_response,
                body=body,
                duration_ms=recorded_response.get("duration_ms", 0.0),
                session_id=request_data.session_id,
                status_code=recorded_response.get("status_code", 200),
                tool_uses_request=[],
                events=events
            )

        except Exception as e:
            logger.error(f"Error creating response data: {e}", exc_info=True)
            return None

    def _create_incomplete_response_data(self, pair: RequestResponsePair, request_data: LLMRequestData, provider) -> Optional[LLMResponseData]:
        """Create LLMResponseData for incomplete requests (no response recorded).

        Args:
            pair: Request/response pair (with no response)
            request_data: Associated request data
            provider: Provider instance for event extraction

        Returns:
            LLMResponseData object with minimal data and finish event
        """
        try:
            # Create a minimal mock response indicating incomplete request
            mock_response = MockResponse({
                "status_code": 0,  # Indicates no response
                "headers": {},
                "body": {}
            })

            # Generate a finish event for the incomplete request
            events = []
            if request_data.session_id:
                # Get metadata for event extraction
                request_metadata = {
                    'cylestio_trace_id': getattr(request_data.request.state, 'cylestio_trace_id', None),
                    'agent_id': getattr(request_data.request.state, 'agent_id', 'unknown'),
                    'model': getattr(request_data.request.state, 'model', request_data.model or 'unknown')
                }

                # Create a minimal finish event using provider's method
                # This ensures we generate llm.call.finish even without a response
                events = provider.extract_response_events(
                    response_body={},  # Empty body for incomplete request
                    session_id=request_data.session_id,
                    duration_ms=0.0,  # No duration available
                    tool_uses=[],
                    request_metadata=request_metadata
                )

                logger.debug(f"Generated finish event for incomplete request in session {request_data.session_id}")

            # Create LLMResponseData
            return LLMResponseData(
                response=mock_response,
                body=None,
                duration_ms=0.0,
                session_id=request_data.session_id,
                status_code=0,
                tool_uses_request=[],
                events=events
            )

        except Exception as e:
            logger.error(f"Error creating incomplete response data: {e}", exc_info=True)
            return None

    async def close(self) -> None:
        """Close the pipeline and clean up resources."""
        # Close any interceptors that need cleanup
        for interceptor in self.interceptors:
            if hasattr(interceptor, 'close'):
                try:
                    await interceptor.close()
                except Exception as e:
                    logger.error(f"Error closing interceptor {interceptor.name}: {e}", exc_info=True)

        logger.info("Replay pipeline closed")
