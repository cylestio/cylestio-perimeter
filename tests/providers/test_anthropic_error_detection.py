"""Tests for Anthropic provider error detection."""
import pytest
from src.providers.anthropic import AnthropicProvider
from src.events.types import LLMCallErrorEvent, LLMCallFinishEvent
from tests.fixtures.error_responses import (
    ANTHROPIC_OVERLOADED_ERROR,
    ANTHROPIC_RATE_LIMIT_ERROR,
    ANTHROPIC_INVALID_REQUEST_ERROR,
    ANTHROPIC_AUTH_ERROR,
    ANTHROPIC_PERMISSION_ERROR,
    ANTHROPIC_API_ERROR,
    ANTHROPIC_STREAMING_ERROR,
    ANTHROPIC_UNEXPECTED_FORMAT_ERROR,
    ANTHROPIC_UNEXPECTED_STRING_ERROR,
    ANTHROPIC_NO_BODY_ERROR,
    ANTHROPIC_SUCCESS_RESPONSE,
    ANTHROPIC_STREAMING_ERROR_SSE,
    ANTHROPIC_STREAMING_SUCCESS_SSE,
    create_request_metadata,
)


class TestAnthropicIsErrorResponse:
    """Tests for is_error_response method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()

    def test_400_is_error(self):
        """HTTP 400 Bad Request should be detected as error."""
        assert self.provider.is_error_response(400, ANTHROPIC_INVALID_REQUEST_ERROR["body"]) is True

    def test_401_is_error(self):
        """HTTP 401 Unauthorized should be detected as error."""
        assert self.provider.is_error_response(401, ANTHROPIC_AUTH_ERROR["body"]) is True

    def test_403_is_error(self):
        """HTTP 403 Forbidden should be detected as error."""
        assert self.provider.is_error_response(403, ANTHROPIC_PERMISSION_ERROR["body"]) is True

    def test_429_is_error(self):
        """HTTP 429 Rate Limit should be detected as error."""
        assert self.provider.is_error_response(429, ANTHROPIC_RATE_LIMIT_ERROR["body"]) is True

    def test_500_is_error(self):
        """HTTP 500 Internal Server Error should be detected as error."""
        assert self.provider.is_error_response(500, ANTHROPIC_API_ERROR["body"]) is True

    def test_529_overloaded_is_error(self):
        """HTTP 529 Overloaded should be detected as error."""
        assert self.provider.is_error_response(529, ANTHROPIC_OVERLOADED_ERROR["body"]) is True

    def test_200_with_error_type_is_error(self):
        """200 OK with type=error in body should be detected as error (streaming case)."""
        assert self.provider.is_error_response(200, ANTHROPIC_STREAMING_ERROR["body"]) is True

    def test_200_success_not_error(self):
        """200 OK with normal response should NOT be detected as error."""
        assert self.provider.is_error_response(200, ANTHROPIC_SUCCESS_RESPONSE["body"]) is False

    def test_200_none_body_not_error(self):
        """200 OK with None body should NOT be detected as error."""
        assert self.provider.is_error_response(200, None) is False

    def test_200_empty_body_not_error(self):
        """200 OK with empty body should NOT be detected as error."""
        assert self.provider.is_error_response(200, {}) is False

    def test_200_message_type_not_error(self):
        """200 OK with type=message should NOT be detected as error."""
        body = {"type": "message", "content": []}
        assert self.provider.is_error_response(200, body) is False


class TestAnthropicExtractErrorInfo:
    """Tests for extract_error_info method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()

    def test_extract_overloaded_error(self):
        """Should extract overloaded_error details."""
        result = self.provider.extract_error_info(529, ANTHROPIC_OVERLOADED_ERROR["body"])
        assert result["status_code"] == 529
        assert result["error_type"] == "overloaded_error"
        assert "overloaded" in result["error_message"].lower()

    def test_extract_rate_limit_error(self):
        """Should extract rate_limit_error details."""
        result = self.provider.extract_error_info(429, ANTHROPIC_RATE_LIMIT_ERROR["body"])
        assert result["status_code"] == 429
        assert result["error_type"] == "rate_limit_error"

    def test_extract_invalid_request_error(self):
        """Should extract invalid_request_error details."""
        result = self.provider.extract_error_info(400, ANTHROPIC_INVALID_REQUEST_ERROR["body"])
        assert result["status_code"] == 400
        assert result["error_type"] == "invalid_request_error"
        assert "non-empty" in result["error_message"]

    def test_extract_auth_error(self):
        """Should extract authentication_error details."""
        result = self.provider.extract_error_info(401, ANTHROPIC_AUTH_ERROR["body"])
        assert result["status_code"] == 401
        assert result["error_type"] == "authentication_error"

    def test_extract_permission_error(self):
        """Should extract permission_error details."""
        result = self.provider.extract_error_info(403, ANTHROPIC_PERMISSION_ERROR["body"])
        assert result["status_code"] == 403
        assert result["error_type"] == "permission_error"

    def test_extract_api_error(self):
        """Should extract api_error details."""
        result = self.provider.extract_error_info(500, ANTHROPIC_API_ERROR["body"])
        assert result["status_code"] == 500
        assert result["error_type"] == "api_error"

    def test_extract_streaming_error(self):
        """200 OK with error body should extract error info."""
        result = self.provider.extract_error_info(200, ANTHROPIC_STREAMING_ERROR["body"])
        assert result["status_code"] == 200
        assert result["error_type"] == "overloaded_error"

    def test_extract_unexpected_format_error(self):
        """Handle unexpected format - missing 'type' field at root."""
        result = self.provider.extract_error_info(500, ANTHROPIC_UNEXPECTED_FORMAT_ERROR["body"])
        assert result["status_code"] == 500
        # Should use fallback since format is unexpected
        assert result["error_type"] == "api_error"

    def test_extract_unexpected_string_error(self):
        """Handle unexpected string error format."""
        result = self.provider.extract_error_info(500, ANTHROPIC_UNEXPECTED_STRING_ERROR["body"])
        assert result["status_code"] == 500
        assert result["error_message"] == "Something went wrong"

    def test_extract_no_body_error(self):
        """Handle error with no body - should use fallback."""
        result = self.provider.extract_error_info(500, None)
        assert result["status_code"] == 500
        assert result["error_type"] == "api_error"
        assert "500" in result["error_message"]

    def test_fallback_for_unknown_status(self):
        """Unknown status code should use http_XXX format."""
        result = self.provider.extract_error_info(418, None)
        assert result["error_type"] == "http_418"


class TestAnthropicInferErrorTypeFromStatus:
    """Tests for _infer_error_type_from_status method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()

    def test_infer_400(self):
        """400 should map to invalid_request_error."""
        assert self.provider._infer_error_type_from_status(400) == "invalid_request_error"

    def test_infer_401(self):
        """401 should map to authentication_error."""
        assert self.provider._infer_error_type_from_status(401) == "authentication_error"

    def test_infer_403(self):
        """403 should map to permission_denied."""
        assert self.provider._infer_error_type_from_status(403) == "permission_denied"

    def test_infer_404(self):
        """404 should map to not_found."""
        assert self.provider._infer_error_type_from_status(404) == "not_found"

    def test_infer_429(self):
        """429 should map to rate_limit_error."""
        assert self.provider._infer_error_type_from_status(429) == "rate_limit_error"

    def test_infer_500(self):
        """500 should map to api_error."""
        assert self.provider._infer_error_type_from_status(500) == "api_error"

    def test_infer_529(self):
        """529 should map to overloaded_error."""
        assert self.provider._infer_error_type_from_status(529) == "overloaded_error"

    def test_infer_unknown(self):
        """Unknown status should return http_XXX format."""
        assert self.provider._infer_error_type_from_status(418) == "http_418"


class TestAnthropicStreamingErrorDetection:
    """Tests for streaming response error detection."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()

    def test_parse_streaming_detects_error_in_first_chunk(self):
        """Should detect error in first SSE chunk."""
        result = self.provider.parse_streaming_response(ANTHROPIC_STREAMING_ERROR_SSE)
        assert result is not None
        assert result.get("type") == "error"
        assert result["error"]["type"] == "overloaded_error"

    def test_parse_streaming_success(self):
        """Normal streaming response should parse correctly."""
        result = self.provider.parse_streaming_response(ANTHROPIC_STREAMING_SUCCESS_SSE)
        # Should not be an error
        assert result is None or result.get("type") != "error"


class TestAnthropicExtractResponseEventsWithErrors:
    """Tests for extract_response_events with error responses."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = AnthropicProvider()
        # Initialize session span tracking
        self.provider._session_utility = type('obj', (object,), {
            'get_session_info': lambda self, x: None
        })()

    def test_creates_error_event_for_529(self):
        """Should create LLMCallErrorEvent for 529 overloaded."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_OVERLOADED_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=529
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["error.type"] == "overloaded_error"
        assert events[0].attributes["http.status_code"] == 529

    def test_creates_error_event_for_429(self):
        """Should create LLMCallErrorEvent for 429 rate limit."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_RATE_LIMIT_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=429
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["error.type"] == "rate_limit_error"

    def test_creates_error_event_for_streaming_200_error(self):
        """Should create LLMCallErrorEvent for streaming 200 with error body."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_STREAMING_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=200  # Note: 200 OK but error in body
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["error.type"] == "overloaded_error"

    def test_creates_error_event_for_no_body(self):
        """Should create LLMCallErrorEvent even without response body."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=None,
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=500
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["error.type"] == "api_error"

    def test_error_event_has_duration(self):
        """Error event should include response duration."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_OVERLOADED_ERROR["body"],
            session_id="session-123",
            duration_ms=250.5,
            tool_uses=[],
            request_metadata=metadata,
            status_code=529
        )
        assert events[0].attributes["llm.response.duration_ms"] == 250.5

    def test_error_event_has_vendor_and_model(self):
        """Error event should include vendor and model."""
        metadata = create_request_metadata(model="claude-3-opus-20240229")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_API_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=500
        )
        assert events[0].attributes["llm.vendor"] == "anthropic"
        assert events[0].attributes["llm.model"] == "claude-3-opus-20240229"

    def test_no_finish_event_for_errors(self):
        """Error responses should NOT also create a finish event."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_API_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=500
        )
        finish_events = [e for e in events if isinstance(e, LLMCallFinishEvent)]
        assert len(finish_events) == 0

    def test_creates_finish_event_for_success(self):
        """Successful responses should create LLMCallFinishEvent, not error event."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_SUCCESS_RESPONSE["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=200
        )
        # Should have at least one event
        assert len(events) >= 1
        # Should be finish event, not error event
        assert any(isinstance(e, LLMCallFinishEvent) for e in events)
        assert not any(isinstance(e, LLMCallErrorEvent) for e in events)

    def test_no_events_without_session_id(self):
        """Should not create events without session_id."""
        metadata = create_request_metadata(model="claude-3-opus")
        events = self.provider.extract_response_events(
            response_body=ANTHROPIC_OVERLOADED_ERROR["body"],
            session_id=None,
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=529
        )
        assert len(events) == 0
