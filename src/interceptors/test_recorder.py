"""Test recorder interceptor to capture events for assertions in tests.

This interceptor collects all events seen in before_request and after_response
into an in-memory store that tests can query. It's intended only for testing.
"""
from collections import defaultdict
from typing import Any, Dict, List, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData


# In-memory event store for tests
_ALL_EVENTS: List[Any] = []
_EVENTS_BY_SESSION: Dict[str, List[Any]] = defaultdict(list)


def reset_events() -> None:
    """Clear all recorded events."""
    _ALL_EVENTS.clear()
    _EVENTS_BY_SESSION.clear()


def get_all_events() -> List[Any]:
    """Return a copy of all recorded events in arrival order."""
    return list(_ALL_EVENTS)


def get_sessions() -> List[str]:
    """Return a list of session IDs that have recorded events."""
    return list(_EVENTS_BY_SESSION.keys())


def get_events_by_session(session_id: str) -> List[Any]:
    """Return events recorded for a specific session."""
    return list(_EVENTS_BY_SESSION.get(session_id, []))


class TestRecorderInterceptor(BaseInterceptor):
    """Interceptor that records request/response events for tests."""
    __test__ = False  # prevent pytest from trying to collect this as a test class

    @property
    def name(self) -> str:
        return "test_recorder"

    async def before_request(self, request_data: LLMRequestData) -> Optional[LLMRequestData]:
        if not self.enabled:
            return None

        # Record all request-side events
        for event in request_data.events:
            _ALL_EVENTS.append(event)
            session_id = event.session_id or request_data.session_id or "unknown"
            _EVENTS_BY_SESSION[session_id].append(event)

        return None

    async def after_response(
        self, request_data: LLMRequestData, response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        if not self.enabled:
            return None

        # Record all response-side events
        for event in response_data.events:
            _ALL_EVENTS.append(event)
            session_id = event.session_id or response_data.session_id or request_data.session_id or "unknown"
            _EVENTS_BY_SESSION[session_id].append(event)

        return None

    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:  # noqa: ARG002
        # No-op; error events are currently produced by providers when applicable
        return None

