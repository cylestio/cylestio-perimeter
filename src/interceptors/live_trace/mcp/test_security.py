"""Tests for MCP security module (CSRF protection)."""
import pytest
from unittest.mock import AsyncMock, MagicMock

from src.interceptors.live_trace.mcp.security import (
    generate_session_id,
    validate_origin,
    validate_host,
    ALLOWED_ORIGINS,
    ALLOWED_HOSTS,
)


class TestGenerateSessionId:
    """Tests for session ID generation."""

    def test_generates_full_uuid(self):
        """Session IDs should use full 128-bit UUIDs (32 hex chars)."""
        session_id = generate_session_id()
        assert session_id.startswith("mcp-")
        # Full UUID hex is 32 characters
        uuid_part = session_id[4:]
        assert len(uuid_part) == 32
        assert all(c in "0123456789abcdef" for c in uuid_part)

    def test_generates_unique_ids(self):
        """Each call should generate a unique session ID."""
        ids = {generate_session_id() for _ in range(100)}
        assert len(ids) == 100

    def test_format_is_consistent(self):
        """Session ID format should be mcp-{uuid}."""
        for _ in range(10):
            session_id = generate_session_id()
            assert session_id.startswith("mcp-")
            assert len(session_id) == 36  # "mcp-" (4) + uuid (32)


class TestValidateOrigin:
    """Tests for Origin header validation (CSRF protection)."""

    def test_allows_no_origin(self):
        """Requests without Origin header should be allowed (CLI tools)."""
        assert validate_origin(None) is True

    def test_allows_localhost_origins(self):
        """Requests from localhost origins should be allowed."""
        for origin in ALLOWED_ORIGINS:
            assert validate_origin(origin) is True, f"Should allow {origin}"

    def test_blocks_external_origins(self):
        """Requests from external origins should be blocked (CSRF attack)."""
        malicious_origins = [
            "https://evil.com",
            "http://attacker.com",
            "https://malicious-site.io",
            "http://localhost.evil.com",  # Subdomain trick
            "http://127.0.0.1.evil.com",
            "https://example.com",
            "http://192.168.1.1:7100",  # Local network
            "http://10.0.0.1:7100",
        ]
        for origin in malicious_origins:
            assert validate_origin(origin) is False, f"Should block {origin}"

    def test_blocks_null_origin(self):
        """Requests with 'null' origin should be blocked."""
        # Note: "null" string is different from None
        assert validate_origin("null") is False

    def test_blocks_file_origin(self):
        """Requests from file:// should be blocked."""
        assert validate_origin("file://") is False

    def test_case_sensitive(self):
        """Origin validation should be case-sensitive."""
        assert validate_origin("HTTP://LOCALHOST:7100") is False
        assert validate_origin("http://LOCALHOST:7100") is False


class TestValidateHost:
    """Tests for Host header validation."""

    def test_allows_localhost(self):
        """localhost should be allowed."""
        assert validate_host("localhost") is True
        assert validate_host("localhost:7100") is True
        assert validate_host("localhost:5173") is True

    def test_allows_127_0_0_1(self):
        """127.0.0.1 should be allowed."""
        assert validate_host("127.0.0.1") is True
        assert validate_host("127.0.0.1:7100") is True
        assert validate_host("127.0.0.1:5173") is True

    def test_blocks_no_host(self):
        """Requests without Host header should be blocked."""
        assert validate_host(None) is False

    def test_blocks_external_hosts(self):
        """External hosts should be blocked."""
        external_hosts = [
            "evil.com",
            "0.0.0.0",
            "0.0.0.0:7100",
            "192.168.1.1",
            "10.0.0.1:7100",
            "example.com:7100",
            "localhost.evil.com",
        ]
        for host in external_hosts:
            assert validate_host(host) is False, f"Should block {host}"

    def test_blocks_ipv6_localhost(self):
        """IPv6 localhost should be blocked (not in allowed list)."""
        # Could be added to allowed list if needed
        assert validate_host("::1") is False
        assert validate_host("[::1]:7100") is False


class TestLocalhostSecurityMiddleware:
    """Tests for LocalhostSecurityMiddleware."""

    @pytest.fixture
    def middleware(self):
        """Create middleware instance."""
        from src.interceptors.live_trace.mcp.security import LocalhostSecurityMiddleware
        return LocalhostSecurityMiddleware(app=MagicMock())

    @pytest.fixture
    def mock_request(self):
        """Create a mock request."""
        request = MagicMock()
        request.url.path = "/mcp"
        request.method = "POST"
        request.headers = MagicMock()
        return request

    @pytest.mark.asyncio
    async def test_allows_valid_request(self, middleware, mock_request):
        """Valid localhost request should be allowed."""
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": None,
        }.get(key)

        call_next = AsyncMock(return_value=MagicMock())
        response = await middleware.dispatch(mock_request, call_next)
        call_next.assert_called_once()

    @pytest.mark.asyncio
    async def test_allows_localhost_origin(self, middleware, mock_request):
        """Request with localhost Origin should be allowed."""
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": "http://localhost:7100",
        }.get(key)

        call_next = AsyncMock(return_value=MagicMock())
        response = await middleware.dispatch(mock_request, call_next)
        call_next.assert_called_once()

    @pytest.mark.asyncio
    async def test_blocks_external_origin(self, middleware, mock_request):
        """Request with external Origin should be blocked (CSRF)."""
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": "https://evil.com",
        }.get(key)

        call_next = AsyncMock()
        with pytest.raises(Exception) as exc_info:
            await middleware.dispatch(mock_request, call_next)
        assert "Cross-origin" in str(exc_info.value.detail)
        call_next.assert_not_called()

    @pytest.mark.asyncio
    async def test_blocks_invalid_host(self, middleware, mock_request):
        """Request with invalid Host should be blocked."""
        mock_request.headers.get = lambda key: {
            "host": "evil.com",
            "origin": None,
        }.get(key)

        call_next = AsyncMock()
        with pytest.raises(Exception) as exc_info:
            await middleware.dispatch(mock_request, call_next)
        assert "Access denied" in str(exc_info.value.detail)
        call_next.assert_not_called()

    @pytest.mark.asyncio
    async def test_blocks_api_get_from_external_origin(self, middleware, mock_request):
        """GET requests to API from external origin should be blocked."""
        mock_request.url.path = "/api/dashboard"
        mock_request.method = "GET"
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": "https://evil.com",
        }.get(key)

        call_next = AsyncMock()
        with pytest.raises(Exception) as exc_info:
            await middleware.dispatch(mock_request, call_next)
        assert "Cross-origin" in str(exc_info.value.detail)
        call_next.assert_not_called()

    @pytest.mark.asyncio
    async def test_allows_api_get_from_localhost(self, middleware, mock_request):
        """GET requests to API from localhost should be allowed."""
        mock_request.url.path = "/api/dashboard"
        mock_request.method = "GET"
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": "http://localhost:7100",
        }.get(key)

        call_next = AsyncMock(return_value=MagicMock())
        response = await middleware.dispatch(mock_request, call_next)
        call_next.assert_called_once()

    @pytest.mark.asyncio
    async def test_blocks_api_post_from_external_origin(self, middleware, mock_request):
        """POST requests to API from external origin should be blocked."""
        mock_request.url.path = "/api/recommendations/123/dismiss"
        mock_request.method = "POST"
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": "https://evil.com",
        }.get(key)

        call_next = AsyncMock()
        with pytest.raises(Exception) as exc_info:
            await middleware.dispatch(mock_request, call_next)
        assert "Cross-origin" in str(exc_info.value.detail)
        call_next.assert_not_called()

    @pytest.mark.asyncio
    async def test_allows_api_post_from_localhost(self, middleware, mock_request):
        """POST requests to API from localhost should be allowed."""
        mock_request.url.path = "/api/findings"
        mock_request.method = "POST"
        mock_request.headers.get = lambda key: {
            "host": "localhost:7100",
            "origin": "http://localhost:7100",
        }.get(key)

        call_next = AsyncMock(return_value=MagicMock())
        response = await middleware.dispatch(mock_request, call_next)
        call_next.assert_called_once()


class TestCSRFAttackScenarios:
    """Test specific CSRF attack scenarios."""

    def test_0_0_0_0_attack_blocked(self):
        """The 0.0.0.0 attack vector should be blocked."""
        # Attack: malicious website sends request to 0.0.0.0:port
        # This should be blocked because:
        # 1. Origin header from malicious site is rejected
        # 2. Host header 0.0.0.0 is rejected
        assert validate_host("0.0.0.0") is False
        assert validate_host("0.0.0.0:7100") is False
        assert validate_origin("https://malicious-site.com") is False

    def test_csrf_attack_blocked(self):
        """CSRF attack from malicious website should be blocked."""
        # Attack: JavaScript on evil.com sends fetch() to localhost MCP
        # Browser will include Origin: https://evil.com
        assert validate_origin("https://evil.com") is False

    def test_legitimate_cli_allowed(self):
        """Legitimate CLI tools (no Origin) should work."""
        # CLI tools like curl, MCP CLI don't send Origin header
        assert validate_origin(None) is True
        assert validate_host("localhost:7100") is True

    def test_legitimate_dashboard_allowed(self):
        """Legitimate dashboard access should work."""
        # Dashboard at localhost:7100 accessing its own MCP
        assert validate_origin("http://localhost:7100") is True
        assert validate_host("localhost:7100") is True
