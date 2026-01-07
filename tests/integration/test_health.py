import pytest
from fastapi.testclient import TestClient


def test_health_check_returns_service_status(client: TestClient) -> None:
    """Verify /health responds with a 200 and expected payload."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "llm-proxy"
    assert "version" in data
