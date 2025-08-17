from fastapi import Response
from fastapi.testclient import TestClient


def test_proxy_non_streaming_request_returns_upstream_result(client: TestClient, monkeypatch) -> None:
    """Verify POST /v1/chat/completions proxies to upstream and returns its response.

    What this verifies:
    - Request reaches the proxy route
    - The proxy's non-streaming handler is invoked
    - The upstream response (status, headers, body) is surfaced back to the client
    """

    # Arrange: patch the proxy handler's standard request method to a stable stub
    async def mock_handle_standard_request(self, *args, **kwargs):  # noqa: ARG001
        return Response(content=b'{"result": "success"}', status_code=200, media_type="application/json")

    from src.proxy.handler import ProxyHandler

    monkeypatch.setattr(
        ProxyHandler,
        "_handle_standard_request",
        mock_handle_standard_request,
    )

    # Act
    response = client.post("/v1/chat/completions", json={"model": "gpt-3.5-turbo"})

    # Assert
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/json"
    assert response.json() == {"result": "success"}