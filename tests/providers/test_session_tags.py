"""Tests for session tags functionality via x-cylestio-tags and related headers."""
import pytest
from unittest.mock import Mock, AsyncMock
from fastapi import Request
from fastapi.datastructures import Headers

from src.proxy.middleware import LLMMiddleware
from src.proxy.handler import ProxyHandler
from src.providers.openai import OpenAIProvider


class TestTagsHeaderParsing:
    """Test suite for x-cylestio-tags header parsing."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
        self.app = Mock()
        self.middleware = LLMMiddleware(self.app, self.provider)

    def _create_mock_request(self, tags_header: str) -> Mock:
        """Create a mock request with tags header."""
        request = Mock(spec=Request)
        headers_dict = {"content-type": "application/json"}
        if tags_header:
            headers_dict["x-cylestio-tags"] = tags_header
        request.headers = Headers(headers_dict)
        return request

    def test_parse_single_tag_key_value(self):
        """Test parsing a single key:value tag."""
        request = self._create_mock_request("user:test@example.com")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {"user": "test@example.com"}

    def test_parse_multiple_tags(self):
        """Test parsing multiple comma-separated tags."""
        request = self._create_mock_request("user:test@example.com,env:production,team:engineering")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {
            "user": "test@example.com",
            "env": "production",
            "team": "engineering"
        }

    def test_parse_tag_without_value(self):
        """Test parsing tags without values (treated as boolean)."""
        request = self._create_mock_request("debug,verbose")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {"debug": "true", "verbose": "true"}

    def test_parse_mixed_tags(self):
        """Test parsing mix of key:value and key-only tags."""
        request = self._create_mock_request("user:alice@test.com,debug,env:staging")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {
            "user": "alice@test.com",
            "debug": "true",
            "env": "staging"
        }

    def test_parse_tag_value_with_colons(self):
        """Test that values containing colons are parsed correctly (split on first colon only)."""
        request = self._create_mock_request("time:12:30:45,path:/api/v1:users")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {
            "time": "12:30:45",
            "path": "/api/v1:users"
        }

    def test_parse_empty_header(self):
        """Test parsing empty tags header returns empty dict."""
        request = self._create_mock_request("")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {}

    def test_parse_no_header(self):
        """Test parsing when no tags header is present."""
        request = Mock(spec=Request)
        request.headers = Headers({"content-type": "application/json"})
        tags = self.middleware._parse_tags_header(request)

        assert tags == {}

    def test_parse_whitespace_handling(self):
        """Test that whitespace around keys and values is trimmed."""
        request = self._create_mock_request("  user : test@example.com , env : prod  ")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {"user": "test@example.com", "env": "prod"}

    def test_parse_empty_segments(self):
        """Test handling of empty segments (consecutive commas)."""
        request = self._create_mock_request("user:test,,env:prod,")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {"user": "test", "env": "prod"}

    def test_max_tags_limit(self):
        """Test that tags are limited to max 50."""
        # Create 60 tags
        tags_list = [f"key{i}:value{i}" for i in range(60)]
        request = self._create_mock_request(",".join(tags_list))
        tags = self.middleware._parse_tags_header(request)

        # Should only have 50 tags
        assert len(tags) == 50

    def test_key_length_limit(self):
        """Test that keys exceeding 64 chars are skipped."""
        long_key = "k" * 70  # 70 char key, exceeds 64 limit
        request = self._create_mock_request(f"{long_key}:value,valid:ok")
        tags = self.middleware._parse_tags_header(request)

        # Long key should be skipped
        assert long_key not in tags
        assert tags == {"valid": "ok"}

    def test_value_length_limit(self):
        """Test that values exceeding 512 chars are truncated."""
        long_value = "v" * 600  # 600 char value, exceeds 512 limit
        request = self._create_mock_request(f"key:{long_value}")
        tags = self.middleware._parse_tags_header(request)

        # Value should be truncated to 512
        assert len(tags["key"]) == 512

    def test_special_characters_in_values(self):
        """Test handling special characters in values."""
        request = self._create_mock_request("path:/api/v1/users?id=123&name=test,query:name=foo%20bar")
        tags = self.middleware._parse_tags_header(request)

        assert tags == {
            "path": "/api/v1/users?id=123&name=test",
            "query": "name=foo%20bar"
        }

    def test_session_header_auto_injected_as_tag(self):
        """Test that x-cylestio-session-id header is auto-injected as 'session' tag."""
        request = Mock(spec=Request)
        request.headers = Headers({
            "content-type": "application/json",
            "x-cylestio-session-id": "run-abc123",
            "x-cylestio-tags": "user:alice"
        })
        tags = self.middleware._parse_tags_header(request)

        assert tags == {
            "session": "run-abc123",
            "user": "alice"
        }

    def test_session_header_without_tags(self):
        """Test that x-cylestio-session-id works without x-cylestio-tags."""
        request = Mock(spec=Request)
        request.headers = Headers({
            "content-type": "application/json",
            "x-cylestio-session-id": "run-xyz789"
        })
        tags = self.middleware._parse_tags_header(request)

        assert tags == {"session": "run-xyz789"}

    def test_tags_can_override_session_tag(self):
        """Test that explicit session tag in x-cylestio-tags overrides header value."""
        request = Mock(spec=Request)
        request.headers = Headers({
            "content-type": "application/json",
            "x-cylestio-session-id": "from-header",
            "x-cylestio-tags": "session:from-tags,user:alice"
        })
        tags = self.middleware._parse_tags_header(request)

        # Tags header should override the session header
        assert tags == {
            "session": "from-tags",
            "user": "alice"
        }


class TestTagsIntegration:
    """Test tags integration with request flow."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
        self.app = Mock()
        self.middleware = LLMMiddleware(self.app, self.provider)

    @pytest.mark.asyncio
    async def test_tags_stored_in_request_state(self):
        """Test that parsed tags are stored in request.state."""
        request = Mock(spec=Request)
        request.headers = Headers({
            "x-cylestio-tags": "user:test@example.com,env:prod",
            "content-type": "application/json"
        })
        request.body = AsyncMock(return_value=b'{"messages": [{"role": "user", "content": "Hello"}], "model": "gpt-4"}')
        request.url = Mock()
        request.url.path = "/v1/chat/completions"

        # Use a simple object to track state assignments
        class State:
            pass
        request.state = State()

        # Create request data
        request_data = await self.middleware._create_request_data(request)

        # Verify tags were stored in request state
        assert request.state.tags == {"user": "test@example.com", "env": "prod"}

    @pytest.mark.asyncio
    async def test_tags_with_external_conversation_id(self):
        """Test tags work alongside external conversation ID."""
        request = Mock(spec=Request)
        request.headers = Headers({
            "x-cylestio-conversation-id": "my-conversation-123",
            "x-cylestio-tags": "user:alice,team:backend",
            "content-type": "application/json"
        })
        request.body = AsyncMock(return_value=b'{"messages": [{"role": "user", "content": "Hello"}], "model": "gpt-4"}')

        # Use a simple object to track state assignments
        class State:
            pass
        request.state = State()

        request_data = await self.middleware._create_request_data(request)

        assert request_data.session_id == "my-conversation-123"
        assert request.state.tags == {"user": "alice", "team": "backend"}


class TestProxyHandlerTagsFiltering:
    """Test that x-cylestio-tags headers are filtered from forwarded requests."""

    def setup_method(self):
        """Set up test fixtures."""
        self.provider = OpenAIProvider()
        settings = Mock()
        self.handler = ProxyHandler(provider=self.provider, settings=settings)

    def test_tags_header_filtered(self):
        """Test that x-cylestio-tags header is not forwarded to LLM provider."""
        original_headers = {
            "authorization": "Bearer sk-test123",
            "x-cylestio-tags": "user:test,env:prod",
            "content-type": "application/json",
            "user-agent": "test-client"
        }

        filtered_headers = self.handler._prepare_headers(original_headers)

        assert "x-cylestio-tags" not in filtered_headers
        assert "user-agent" in filtered_headers
        assert "content-type" in filtered_headers

    def test_all_cylestio_headers_filtered(self):
        """Test that all x-cylestio-* headers are filtered."""
        original_headers = {
            "x-cylestio-conversation-id": "conversation-123",
            "x-cylestio-prompt-id": "prompt-456",
            "x-cylestio-session-id": "session-789",
            "x-cylestio-tags": "user:test",
            "x-cylestio-custom": "should-filter",
            "user-agent": "test-client"
        }

        filtered_headers = self.handler._prepare_headers(original_headers)

        # All cylestio headers should be filtered
        cylestio_headers = [k for k in filtered_headers.keys() if k.lower().startswith("x-cylestio-")]
        assert len(cylestio_headers) == 0

        # Regular headers should remain
        assert "user-agent" in filtered_headers
