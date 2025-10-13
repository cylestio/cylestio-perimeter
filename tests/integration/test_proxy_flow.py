from fastapi import Response
from fastapi.testclient import TestClient
import pytest
from src.main import create_app
from src.config.settings import Settings


def test_proxy_non_streaming_request_returns_upstream_result(client: TestClient, monkeypatch) -> None:
    """Verify POST /v1/chat/completions proxies to upstream and returns its response.

    What this verifies:
    - Request reaches the proxy route
    - The proxy's non-streaming handler is invoked
    - The upstream response (status, headers, body) is surfaced back to the client
    """

    # Arrange: patch the proxy handler's buffered request method to a stable stub
    async def mock_handle_buffered_request(self, *args, **kwargs):  # noqa: ARG001
        return Response(content=b'{"result": "success"}', status_code=200, media_type="application/json")

    from src.proxy.handler import ProxyHandler

    monkeypatch.setattr(
        ProxyHandler,
        "_handle_buffered_request",
        mock_handle_buffered_request,
    )

    # Act
    response = client.post("/v1/chat/completions", json={"model": "gpt-3.5-turbo"})

    # Assert
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/json"
    assert response.json() == {"result": "success"}


def test_openai_auth_header_injected_when_absent(client: TestClient, monkeypatch) -> None:
    """When client omits Authorization, inject provider Authorization header."""

    captured_headers = {}

    async def mock_handle_buffered_request(self, request, method, url, headers, content, is_streaming):  # noqa: ARG001
        nonlocal captured_headers
        captured_headers = headers
        return Response(content=b'{}', status_code=200, media_type="application/json")

    from src.proxy.handler import ProxyHandler
    monkeypatch.setattr(ProxyHandler, "_handle_buffered_request", mock_handle_buffered_request)

    response = client.post("/v1/chat/completions", json={"model": "gpt-3.5-turbo"})
    assert response.status_code == 200
    # Should inject Authorization: Bearer sk-test (case-insensitive)
    lc = {k.lower(): v for k, v in captured_headers.items()}
    assert lc.get("authorization") == "Bearer sk-test"


def test_openai_preserve_client_authorization_header(client: TestClient, monkeypatch) -> None:
    """When client provides Authorization, do not override with provider credentials."""

    captured_headers = {}

    async def mock_handle_buffered_request(self, request, method, url, headers, content, is_streaming):  # noqa: ARG001
        nonlocal captured_headers
        captured_headers = headers
        return Response(content=b'{}', status_code=200, media_type="application/json")

    from src.proxy.handler import ProxyHandler
    monkeypatch.setattr(ProxyHandler, "_handle_buffered_request", mock_handle_buffered_request)

    response = client.post(
        "/v1/chat/completions",
        json={"model": "gpt-3.5-turbo"},
        headers={"Authorization": "Bearer client-key"},
    )
    assert response.status_code == 200
    # Should preserve client's Authorization and not double-inject (case-insensitive)
    lc = {k.lower(): v for k, v in captured_headers.items()}
    assert lc.get("authorization") == "Bearer client-key"


def test_anthropic_auth_header_injected_and_preserved(monkeypatch) -> None:
    """For Anthropic provider, inject x-api-key when absent; preserve when present."""

    # Build an Anthropic-configured app and client
    settings = Settings(llm={"base_url": "https://api.anthropic.com", "type": "anthropic", "api_key": "anthropic-key"})
    app = create_app(settings)
    local_client = TestClient(app)

    from src.proxy.handler import ProxyHandler

    # Case 1: Absent → inject
    captured_headers = {}

    async def mock_handle_buffered_request(self, request, method, url, headers, content, is_streaming):  # noqa: ARG001
        nonlocal captured_headers
        captured_headers = headers
        return Response(content=b'{}', status_code=200, media_type="application/json")

    monkeypatch.setattr(ProxyHandler, "_handle_buffered_request", mock_handle_buffered_request)

    resp = local_client.post("/v1/messages", json={"model": "claude-3-5-sonnet-20241022", "messages": []})
    assert resp.status_code == 200
    lc = {k.lower(): v for k, v in captured_headers.items()}
    assert lc.get("x-api-key") == "anthropic-key"
    assert "authorization" not in lc

    # Case 2: Present → preserve
    captured_headers = {}
    resp = local_client.post(
        "/v1/messages",
        json={"model": "claude-3-5-sonnet-20241022", "messages": []},
        headers={"x-api-key": "client-key"},
    )
    assert resp.status_code == 200
    lc = {k.lower(): v for k, v in captured_headers.items()}
    assert lc.get("x-api-key") == "client-key"


def test_internal_headers_are_not_forwarded(client: TestClient, monkeypatch) -> None:
    """Verify that x-cylestio-* headers are stripped before forwarding."""

    captured_headers = {}

    async def mock_handle_buffered_request(self, request, method, url, headers, content, is_streaming):  # noqa: ARG001
        nonlocal captured_headers
        captured_headers = headers
        return Response(content=b'{}', status_code=200, media_type="application/json")

    from src.proxy.handler import ProxyHandler
    monkeypatch.setattr(ProxyHandler, "_handle_buffered_request", mock_handle_buffered_request)

    response = client.post(
        "/v1/chat/completions",
        json={"model": "gpt-3.5-turbo"},
        headers={
            "X-Cylestio-Trace-Id": "abc123",
            "X-Cylestio-Debug": "1",
        },
    )
    assert response.status_code == 200
    lc = {k.lower(): v for k, v in captured_headers.items()}
    assert "x-cylestio-trace-id" not in lc
    assert "x-cylestio-debug" not in lc