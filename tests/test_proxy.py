"""Tests for proxy handler."""
import json

import httpx
import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from src.config.settings import Settings
from src.main import create_app

# Unit tests are currently disabled; focusing on integration coverage
# pytestmark = pytest.mark.skip(reason="Unit tests temporarily disabled")


@pytest.fixture
def settings():
    """Create test settings."""
    return Settings(
        llm={
            "base_url": "https://api.openai.com",
            "type": "openai",
            "api_key": "sk-test"
        }
    )


@pytest.fixture
def app(settings):
    """Create test app."""
    return create_app(settings)


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


class TestHealthCheck:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test /health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "service": "llm-proxy"}


class TestProxyHandler:
    """Test proxy handler functionality."""
    
    def test_headers_preparation(self, settings):
        """Test header preparation logic."""
        from src.proxy.handler import ProxyHandler
        from src.providers.openai import OpenAIProvider
        
        provider = OpenAIProvider(settings)
        handler = ProxyHandler(settings, provider)
        
        original_headers = {
            "host": "localhost",
            "content-type": "application/json",
            "user-agent": "test"
        }
        
        prepared = handler._prepare_headers(original_headers)
        
        # Should remove host header
        assert "host" not in prepared
        # Should add authorization from provider
        assert prepared["Authorization"] == "Bearer sk-test"
        # Should preserve other headers
        assert prepared["content-type"] == "application/json"
        assert prepared["user-agent"] == "test"
    
    def test_streaming_detection(self, settings):
        """Test streaming request detection."""
        from src.proxy.handler import ProxyHandler
        from src.providers.openai import OpenAIProvider
        
        provider = OpenAIProvider(settings)
        handler = ProxyHandler(settings, provider)
        
        # Should detect streaming
        assert handler._is_streaming_request({"stream": True}) is True
        assert handler._is_streaming_request({"stream": False}) is False
        assert handler._is_streaming_request({"other": "data"}) is False
        assert handler._is_streaming_request("not a dict") is False


class TestProxyIntegration:
    """Integration tests for proxy functionality."""
    
    @pytest.mark.asyncio
    async def test_proxy_request_flow(self, app, monkeypatch):
        """Test complete proxy request flow."""
        # Mock httpx client
        class MockResponse:
            status_code = 200
            headers = {"content-type": "application/json"}
            content = b'{"result": "success"}'
        
        async def mock_request(*args, **kwargs):
            return MockResponse()
        
        # Patch the proxy handler's client
        from src.proxy.handler import ProxyHandler
        monkeypatch.setattr(ProxyHandler, "_handle_standard_request", 
                          lambda self, *args, **kwargs: mock_request(*args, **kwargs))
        
        client = TestClient(app)
        response = client.post("/v1/chat/completions", json={"model": "gpt-3.5-turbo"})
        
        # Should get proxied response
        assert response.status_code == 200