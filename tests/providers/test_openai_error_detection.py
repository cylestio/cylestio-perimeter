"""Tests for OpenAI provider error detection."""
import pytest
from src.providers.openai import OpenAIProvider
from src.events.types import LLMCallErrorEvent, LLMCallFinishEvent
from tests.fixtures.error_responses import (
    OPENAI_QUOTA_ERROR,
    OPENAI_RATE_LIMIT_ERROR,
    OPENAI_INVALID_KEY_ERROR,
    OPENAI_SERVER_ERROR,
    OPENAI_BAD_REQUEST_ERROR,
    OPENAI_UNEXPECTED_STRING_ERROR,
    OPENAI_UNEXPECTED_EMPTY_ERROR,
    OPENAI_NO_BODY_ERROR,
    OPENAI_SUCCESS_RESPONSE,
    create_request_metadata,
)


class TestOpenAIIsErrorResponse:
    """Tests for is_error_response method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()

    def test_400_is_error(self):
        """HTTP 400 Bad Request should be detected as error."""
        assert self.provider.is_error_response(400, OPENAI_BAD_REQUEST_ERROR["body"]) is True

    def test_401_is_error(self):
        """HTTP 401 Unauthorized should be detected as error."""
        assert self.provider.is_error_response(401, OPENAI_INVALID_KEY_ERROR["body"]) is True

    def test_429_quota_is_error(self):
        """HTTP 429 quota exceeded should be detected as error."""
        assert self.provider.is_error_response(429, OPENAI_QUOTA_ERROR["body"]) is True

    def test_429_rate_limit_is_error(self):
        """HTTP 429 rate limit should be detected as error."""
        assert self.provider.is_error_response(429, OPENAI_RATE_LIMIT_ERROR["body"]) is True

    def test_500_is_error(self):
        """HTTP 500 Internal Server Error should be detected as error."""
        assert self.provider.is_error_response(500, OPENAI_SERVER_ERROR["body"]) is True

    def test_502_is_error(self):
        """HTTP 502 Bad Gateway should be detected as error."""
        assert self.provider.is_error_response(502, None) is True

    def test_503_is_error(self):
        """HTTP 503 Service Unavailable should be detected as error."""
        assert self.provider.is_error_response(503, OPENAI_NO_BODY_ERROR["body"]) is True

    def test_200_with_error_body_is_error(self):
        """Edge case: 200 OK but error in body should be detected as error."""
        body_with_error = {"error": {"message": "Unexpected error"}}
        assert self.provider.is_error_response(200, body_with_error) is True

    def test_200_success_not_error(self):
        """200 OK with normal response should NOT be detected as error."""
        assert self.provider.is_error_response(200, OPENAI_SUCCESS_RESPONSE["body"]) is False

    def test_200_none_body_not_error(self):
        """200 OK with None body should NOT be detected as error."""
        assert self.provider.is_error_response(200, None) is False

    def test_200_empty_body_not_error(self):
        """200 OK with empty body should NOT be detected as error."""
        assert self.provider.is_error_response(200, {}) is False


class TestOpenAIExtractErrorInfo:
    """Tests for extract_error_info method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()

    def test_extract_quota_error(self):
        """Should extract insufficient_quota error details."""
        result = self.provider.extract_error_info(429, OPENAI_QUOTA_ERROR["body"])
        assert result["status_code"] == 429
        assert result["error_type"] == "insufficient_quota"
        assert "exceeded" in result["error_message"].lower()

    def test_extract_rate_limit_error(self):
        """Should extract rate_limit_exceeded error details."""
        result = self.provider.extract_error_info(429, OPENAI_RATE_LIMIT_ERROR["body"])
        assert result["status_code"] == 429
        assert result["error_type"] == "rate_limit_exceeded"
        assert "rate limit" in result["error_message"].lower()

    def test_extract_invalid_key_error(self):
        """Should extract invalid_api_key error details."""
        result = self.provider.extract_error_info(401, OPENAI_INVALID_KEY_ERROR["body"])
        assert result["status_code"] == 401
        assert result["error_type"] == "invalid_api_key"

    def test_extract_server_error(self):
        """Should extract server_error details."""
        result = self.provider.extract_error_info(500, OPENAI_SERVER_ERROR["body"])
        assert result["status_code"] == 500
        assert result["error_type"] == "server_error"

    def test_extract_bad_request_error(self):
        """Should extract invalid_request_error details."""
        result = self.provider.extract_error_info(400, OPENAI_BAD_REQUEST_ERROR["body"])
        assert result["status_code"] == 400
        assert result["error_type"] == "invalid_request_error"

    def test_extract_unexpected_string_error(self):
        """Handle unexpected error format (string instead of dict)."""
        result = self.provider.extract_error_info(500, OPENAI_UNEXPECTED_STRING_ERROR["body"])
        assert result["status_code"] == 500
        assert result["error_message"] == "Something went wrong"
        # Should use fallback error_type
        assert result["error_type"] == "server_error"

    def test_extract_unexpected_empty_error(self):
        """Handle empty error dict with fallback."""
        result = self.provider.extract_error_info(502, OPENAI_UNEXPECTED_EMPTY_ERROR["body"])
        assert result["status_code"] == 502
        # Should use fallback error_type from status code
        assert result["error_type"] == "bad_gateway"

    def test_extract_no_body_error(self):
        """Handle error with no body - should use fallback."""
        result = self.provider.extract_error_info(503, None)
        assert result["status_code"] == 503
        assert result["error_type"] == "service_unavailable"
        assert "503" in result["error_message"]

    def test_fallback_for_unknown_status(self):
        """Unknown status code should use http_XXX format."""
        result = self.provider.extract_error_info(418, None)
        assert result["error_type"] == "http_418"
        assert "418" in result["error_message"]


class TestOpenAIInferErrorTypeFromStatus:
    """Tests for _infer_error_type_from_status method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()

    def test_infer_400(self):
        """400 should map to bad_request."""
        assert self.provider._infer_error_type_from_status(400) == "bad_request"

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
        """500 should map to server_error."""
        assert self.provider._infer_error_type_from_status(500) == "server_error"

    def test_infer_502(self):
        """502 should map to bad_gateway."""
        assert self.provider._infer_error_type_from_status(502) == "bad_gateway"

    def test_infer_503(self):
        """503 should map to service_unavailable."""
        assert self.provider._infer_error_type_from_status(503) == "service_unavailable"

    def test_infer_unknown(self):
        """Unknown status should return http_XXX format."""
        assert self.provider._infer_error_type_from_status(418) == "http_418"
        assert self.provider._infer_error_type_from_status(599) == "http_599"


class TestOpenAIExtractResponseEventsWithErrors:
    """Tests for extract_response_events with error responses."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
        # Initialize session span tracking
        self.provider._session_utility = type('obj', (object,), {
            'get_session_info': lambda self, x: None
        })()

    def test_creates_error_event_for_429(self):
        """Should create LLMCallErrorEvent for 429 responses."""
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=OPENAI_QUOTA_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=429
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["error.type"] == "insufficient_quota"
        assert events[0].attributes["http.status_code"] == 429

    def test_creates_error_event_for_500(self):
        """Should create LLMCallErrorEvent for 500 responses."""
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=OPENAI_SERVER_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=500
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["http.status_code"] == 500

    def test_creates_error_event_for_no_body(self):
        """Should create LLMCallErrorEvent even without response body."""
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=None,
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=503
        )
        assert len(events) == 1
        assert isinstance(events[0], LLMCallErrorEvent)
        assert events[0].attributes["error.type"] == "service_unavailable"

    def test_error_event_has_duration(self):
        """Error event should include response duration."""
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=OPENAI_QUOTA_ERROR["body"],
            session_id="session-123",
            duration_ms=250.5,
            tool_uses=[],
            request_metadata=metadata,
            status_code=429
        )
        assert events[0].attributes["llm.response.duration_ms"] == 250.5

    def test_error_event_has_vendor_and_model(self):
        """Error event should include vendor and model."""
        metadata = create_request_metadata(model="gpt-4-turbo")
        events = self.provider.extract_response_events(
            response_body=OPENAI_SERVER_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=500
        )
        assert events[0].attributes["llm.vendor"] == "openai"
        assert events[0].attributes["llm.model"] == "gpt-4-turbo"

    def test_no_finish_event_for_errors(self):
        """Error responses should NOT also create a finish event."""
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=OPENAI_SERVER_ERROR["body"],
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
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=OPENAI_SUCCESS_RESPONSE["body"],
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
        metadata = create_request_metadata()
        events = self.provider.extract_response_events(
            response_body=OPENAI_QUOTA_ERROR["body"],
            session_id=None,
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=429
        )
        assert len(events) == 0

    def test_no_events_without_trace_id(self):
        """Should not create events without trace_id in metadata."""
        metadata = {"agent_id": "agent-123", "model": "gpt-4"}  # Missing trace_id
        events = self.provider.extract_response_events(
            response_body=OPENAI_QUOTA_ERROR["body"],
            session_id="session-123",
            duration_ms=100.0,
            tool_uses=[],
            request_metadata=metadata,
            status_code=429
        )
        assert len(events) == 0
