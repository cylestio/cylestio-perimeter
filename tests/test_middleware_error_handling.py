"""Tests for middleware error handling."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import Response
from src.proxy.middleware import LLMMiddleware
from src.proxy.interceptor_base import LLMRequestData, LLMResponseData
from src.events.types import LLMCallErrorEvent, LLMCallFinishEvent


class TestMiddlewareErrorResponseHandling:
    """Tests for middleware handling of error responses."""

    @pytest.fixture
    def mock_provider(self):
        """Create mock provider for testing."""
        provider = MagicMock()
        provider.name = "openai"
        provider.extract_response_events = MagicMock(return_value=[])
        provider.is_error_response = MagicMock(return_value=False)
        provider.parse_tool_requests = MagicMock(return_value=[])
        return provider

    @pytest.fixture
    def mock_request_data(self):
        """Create mock request data for testing."""
        request_data = MagicMock(spec=LLMRequestData)
        request_data.session_id = "test-session"
        request_data.provider = "openai"
        request_data.model = "gpt-4"
        request_data.request = MagicMock()
        request_data.request.state = MagicMock()
        request_data.request.state.cylestio_trace_id = "trace-123"
        request_data.request.state.agent_id = "agent-123"
        request_data.request.state.model = "gpt-4"
        request_data.request.state.agent_workflow_id = None
        return request_data

    @pytest.mark.asyncio
    async def test_passes_status_code_to_provider(self, mock_provider, mock_request_data):
        """Middleware should pass status_code to extract_response_events."""
        # Create middleware with mock
        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[])

        response = Response(content=b'{"error": {}}', status_code=429)

        await middleware._process_response(
            mock_request_data,
            {"error": {}},
            response,
            100.0
        )

        # Verify status_code was passed
        mock_provider.extract_response_events.assert_called_once()
        call_kwargs = mock_provider.extract_response_events.call_args[1]
        assert call_kwargs["status_code"] == 429

    @pytest.mark.asyncio
    async def test_passes_status_code_200_for_success(self, mock_provider, mock_request_data):
        """Middleware should pass status_code 200 for successful responses."""
        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[])

        response = Response(content=b'{"choices": []}', status_code=200)

        await middleware._process_response(
            mock_request_data,
            {"choices": []},
            response,
            100.0
        )

        call_kwargs = mock_provider.extract_response_events.call_args[1]
        assert call_kwargs["status_code"] == 200

    @pytest.mark.asyncio
    async def test_extracts_events_for_4xx_even_without_body(self, mock_provider, mock_request_data):
        """Middleware should extract events for 4xx even if body is None."""
        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[])

        response = Response(content=b'', status_code=503)

        await middleware._process_response(
            mock_request_data,
            None,  # No body
            response,
            100.0
        )

        # Should still call extract_response_events because status >= 400
        mock_provider.extract_response_events.assert_called_once()
        call_kwargs = mock_provider.extract_response_events.call_args[1]
        assert call_kwargs["status_code"] == 503
        assert call_kwargs["response_body"] is None

    @pytest.mark.asyncio
    async def test_interceptors_receive_error_events(self, mock_provider, mock_request_data):
        """Interceptors should receive error events in response_data.events."""
        error_event = LLMCallErrorEvent.create(
            trace_id="trace-123",
            span_id="span-123",
            agent_id="agent-123",
            vendor="openai",
            model="gpt-4",
            error_message="Quota exceeded",
            error_type="insufficient_quota"
        )
        mock_provider.extract_response_events.return_value = [error_event]

        mock_interceptor = MagicMock()
        mock_interceptor.enabled = True
        mock_interceptor.name = "test_interceptor"
        mock_interceptor.after_response = AsyncMock(return_value=None)

        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[mock_interceptor])

        response = Response(content=b'{"error": {}}', status_code=429)

        await middleware._process_response(
            mock_request_data,
            {"error": {}},
            response,
            100.0
        )

        # Verify interceptor received error event
        mock_interceptor.after_response.assert_called_once()
        call_args = mock_interceptor.after_response.call_args[0]
        response_data = call_args[1]
        assert len(response_data.events) == 1
        assert isinstance(response_data.events[0], LLMCallErrorEvent)

    @pytest.mark.asyncio
    async def test_response_data_has_status_code(self, mock_provider, mock_request_data):
        """LLMResponseData should include status_code."""
        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[])

        response = Response(content=b'{"error": {}}', status_code=500)

        result = await middleware._process_response(
            mock_request_data,
            {"error": {}},
            response,
            100.0
        )

        assert result.status_code == 500

    @pytest.mark.asyncio
    async def test_multiple_error_status_codes(self, mock_provider, mock_request_data):
        """Test various HTTP error status codes are handled correctly."""
        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[])

        error_codes = [400, 401, 403, 404, 429, 500, 502, 503, 529]

        for status_code in error_codes:
            mock_provider.extract_response_events.reset_mock()
            response = Response(content=b'{}', status_code=status_code)

            await middleware._process_response(
                mock_request_data,
                {},
                response,
                100.0
            )

            call_kwargs = mock_provider.extract_response_events.call_args[1]
            assert call_kwargs["status_code"] == status_code, f"Failed for status {status_code}"


class TestMiddlewareSessionHandling:
    """Tests for middleware session handling with errors."""

    @pytest.fixture
    def mock_provider(self):
        provider = MagicMock()
        provider.name = "openai"
        provider.extract_response_events = MagicMock(return_value=[])
        return provider

    @pytest.mark.asyncio
    async def test_no_events_without_session_id(self, mock_provider):
        """Should not extract events without session_id."""
        request_data = MagicMock(spec=LLMRequestData)
        request_data.session_id = None  # No session
        request_data.provider = "openai"

        app = MagicMock()
        middleware = LLMMiddleware(app, mock_provider, interceptors=[])

        response = Response(content=b'{"error": {}}', status_code=429)

        await middleware._process_response(
            request_data,
            {"error": {}},
            response,
            100.0
        )

        # Should NOT call extract_response_events without session_id
        mock_provider.extract_response_events.assert_not_called()
