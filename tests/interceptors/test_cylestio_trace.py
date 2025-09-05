"""Tests for Cylestio trace interceptor - cleaned up version."""
import asyncio
import json
import os
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
import httpx

from src.interceptors.cylestio_trace.interceptor import CylestioTraceInterceptor
from src.interceptors.cylestio_trace.client import CylestioClient, CylestioAPIError
from src.proxy.interceptor_base import LLMRequestData, LLMResponseData
from src.events.base import BaseEvent, EventName


class MockEvent(BaseEvent):
    """Mock event for testing."""
    
    def __init__(self, name: EventName = EventName.LLM_CALL_START, session_id: str = "session_123"):
        super().__init__(
            name=name, 
            session_id=session_id,
            trace_id="test_trace_id_123456789012345678901234567890ab",
            span_id="test_span_id_1234",
            agent_id="test_agent_123"
        )


class TestCylestioTraceInterceptor:
    """Test cases for CylestioTraceInterceptor."""
    
    @pytest.fixture
    def config(self):
        """Test configuration."""
        return {
            "enabled": True,
            "api_url": "https://api.cylestio.test",
            "access_key": "test_key",
            "timeout": 5
        }
    
    @pytest.fixture
    def interceptor(self, config):
        """Create interceptor instance."""
        return CylestioTraceInterceptor(config)
    
    @pytest.fixture
    def mock_request_data(self):
        """Mock request data with events."""
        mock_request = MagicMock()
        return LLMRequestData(
            request=mock_request,
            events=[MockEvent(EventName.LLM_CALL_START), MockEvent(EventName.LLM_CALL_FINISH)]
        )
    
    @pytest.fixture
    def mock_response_data(self):
        """Mock response data with events."""
        mock_response = MagicMock()
        return LLMResponseData(
            response=mock_response,
            events=[MockEvent(EventName.LLM_CALL_FINISH)]
        )
    
    def test_init_valid_config(self, config):
        """Test interceptor initialization with valid config."""
        interceptor = CylestioTraceInterceptor(config)
        
        assert interceptor.name == "cylestio_trace"
        assert interceptor.enabled is True
        # Don't test internal attributes - these are implementation details
        assert hasattr(interceptor, '_client')
    
    def test_init_missing_required_config(self):
        """Test interceptor initialization with missing required config."""
        config = {"enabled": True}  # Missing access_key
        
        # Ensure env var is not set for this test
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        if "CYLESTIO_ACCESS_KEY" in os.environ:
            del os.environ["CYLESTIO_ACCESS_KEY"]
        
        try:
            with pytest.raises(ValueError, match="requires access_key"):
                CylestioTraceInterceptor(config)
        finally:
            # Restore original env var if it existed
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
    
    def test_init_disabled_interceptor(self):
        """Test interceptor initialization when disabled."""
        config = {
            "enabled": False,
            "api_url": "https://api.cylestio.test",
            "access_key": "test_key"
        }
        
        interceptor = CylestioTraceInterceptor(config)
        assert interceptor.enabled is False
    
    def test_default_api_url(self):
        """Test default API URL is used when not specified."""
        config = {"enabled": True, "access_key": "test_key"}
        interceptor = CylestioTraceInterceptor(config)
        
        # Test internal client has correct URL (implementation detail, but important)
        assert interceptor._client.api_url == "https://api.cylestio.com"
    
    def test_custom_api_url(self):
        """Test custom API URL is used when specified."""
        config = {
            "enabled": True,
            "api_url": "https://custom.api.com",
            "access_key": "test_key"
        }
        interceptor = CylestioTraceInterceptor(config)
        
        assert interceptor._client.api_url == "https://custom.api.com"
    
    def test_missing_access_key_raises_error(self):
        """Test that missing access key raises ValueError."""
        config = {"enabled": True, "api_url": "https://api.cylestio.test"}
        
        # Ensure no env var is set
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        if "CYLESTIO_ACCESS_KEY" in os.environ:
            del os.environ["CYLESTIO_ACCESS_KEY"]
        
        try:
            with pytest.raises(ValueError, match="requires access_key"):
                CylestioTraceInterceptor(config)
        finally:
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
    
    def test_access_key_from_environment_variable(self):
        """Test access key can be loaded from environment variable."""
        config = {"enabled": True, "api_url": "https://api.cylestio.test"}
        
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        os.environ["CYLESTIO_ACCESS_KEY"] = "env_test_key"
        
        try:
            interceptor = CylestioTraceInterceptor(config)
            assert interceptor._client.access_key == "env_test_key"
        finally:
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
            else:
                del os.environ["CYLESTIO_ACCESS_KEY"]
    
    def test_config_access_key_overrides_environment_variable(self):
        """Test config access key takes precedence over environment variable."""
        config = {
            "enabled": True,
            "api_url": "https://api.cylestio.test",
            "access_key": "config_key"
        }
        
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        os.environ["CYLESTIO_ACCESS_KEY"] = "env_key"
        
        try:
            interceptor = CylestioTraceInterceptor(config)
            assert interceptor._client.access_key == "config_key"  # config takes precedence
        finally:
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
            else:
                del os.environ["CYLESTIO_ACCESS_KEY"]
    
    @pytest.mark.asyncio
    async def test_before_request_disabled(self, interceptor, mock_request_data):
        """Test before_request when interceptor is disabled."""
        interceptor.enabled = False
        
        result = await interceptor.before_request(mock_request_data)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_before_request_no_events(self, interceptor):
        """Test before_request with no events."""
        mock_request = MagicMock()
        request_data = LLMRequestData(request=mock_request, events=[])
        
        with patch.object(interceptor._client, 'send_events_async') as mock_send:
            result = await interceptor.before_request(request_data)
        
        assert result is None
        mock_send.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_before_request_with_events(self, interceptor, mock_request_data):
        """Test before_request with events."""
        with patch.object(interceptor._client, 'send_events_async') as mock_send:
            result = await interceptor.before_request(mock_request_data)
        
        assert result is None
        mock_send.assert_called_once_with(mock_request_data.events)
    
    @pytest.mark.asyncio
    async def test_after_response_with_events(self, interceptor, mock_request_data, mock_response_data):
        """Test after_response with events."""
        with patch.object(interceptor._client, 'send_events_async') as mock_send:
            result = await interceptor.after_response(mock_request_data, mock_response_data)
        
        assert result is None
        mock_send.assert_called_once_with(mock_response_data.events)
    
    @pytest.mark.asyncio
    async def test_on_error(self, interceptor, mock_request_data):
        """Test on_error method."""
        error = Exception("Test error")
        
        # Should not raise an exception
        await interceptor.on_error(mock_request_data, error)
    
    @pytest.mark.asyncio
    async def test_cleanup(self, interceptor):
        """Test cleanup method."""
        with patch.object(interceptor._client, 'stop') as mock_stop:
            await interceptor.cleanup()
        
        mock_stop.assert_called_once()


class TestCylestioClient:
    """Test cases for CylestioClient."""
    
    @pytest.fixture
    def client_config(self):
        """Client configuration for testing."""
        return {
            "api_url": "https://api.test.com",
            "access_key": "test_access_key",
            "timeout": 30,
            "max_retries": 2
        }
    
    @pytest.fixture
    def client(self, client_config):
        """Create client instance."""
        return CylestioClient(**client_config)
    
    def test_client_init(self, client):
        """Test client initialization."""
        assert client.api_url == "https://api.test.com"
        assert client.access_key == "test_access_key"
        assert client.timeout == 30
        assert client.max_retries == 2
        assert client._client is None
        assert client._worker_task is None
    
    @pytest.mark.asyncio
    async def test_send_events_async_empty_list(self, client):
        """Test send_events_async with empty list."""
        # Should not start worker or do anything
        await client.send_events_async([])
        assert client._worker_task is None
    
    @pytest.mark.asyncio
    async def test_send_events_async_with_events(self, client):
        """Test send_events_async with events."""
        events = [MockEvent(), MockEvent()]
        
        # Mock the internal batch sending to avoid real HTTP calls
        with patch.object(client, '_send_events_batch_internal', return_value={"success": 2, "failed": 0}) as mock_batch:
            await client.send_events_async(events)
            
            # Give the background worker a moment to process
            await asyncio.sleep(0.1)
            
            # Worker should be started
            assert client._worker_task is not None
            assert not client._worker_task.done()
            
            # Stop the worker
            await client.stop()
    
    @pytest.mark.asyncio
    async def test_start_and_stop(self, client):
        """Test starting and stopping the client."""
        # Start should create worker task
        await client.start()
        assert client._worker_task is not None
        assert not client._worker_task.done()
        
        # Stop should finish the worker
        await client.stop()
        assert client._worker_task.done()
    
    @pytest.mark.asyncio
    async def test_send_event_success(self, client):
        """Test successful event sending."""
        event = MockEvent()
        
        # Mock HTTP client and authenticator
        mock_response = MagicMock()
        mock_response.status_code = 201
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client._authenticator, 'get_jwt_token', return_value="test_jwt"), \
             patch.object(client, '_client') as mock_http_client:
            
            mock_http_client.post = AsyncMock(return_value=mock_response)
            
            result = await client._send_event(event)
            
            assert result is True
            mock_http_client.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_event_auth_failure(self, client):
        """Test event sending with auth failure."""
        event = MockEvent()
        
        # Mock authentication failure
        with patch.object(client._authenticator, 'get_jwt_token', return_value=None):
            result = await client._send_event(event)
            assert result is False
    
    @pytest.mark.asyncio
    async def test_send_event_retryable_error(self, client):
        """Test event sending with retryable error."""
        event = MockEvent()
        
        mock_response = MagicMock()
        mock_response.status_code = 429  # Rate limited
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client._authenticator, 'get_jwt_token', return_value="test_jwt"), \
             patch.object(client, '_client') as mock_http_client, \
             patch.object(client, '_calculate_backoff_delay', return_value=0.001):  # Fast retry for tests
            
            mock_http_client.post = AsyncMock(return_value=mock_response)
            
            result = await client._send_event(event)
            
            # Should retry max_retries times
            assert result is False
            assert mock_http_client.post.call_count == client.max_retries
    
    @pytest.mark.asyncio
    async def test_send_event_non_retryable_error(self, client):
        """Test event sending with non-retryable error."""
        event = MockEvent()
        
        mock_response = MagicMock()
        mock_response.status_code = 400  # Bad request
        mock_response.text = "Bad request"
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client._authenticator, 'get_jwt_token', return_value="test_jwt"), \
             patch.object(client, '_client') as mock_http_client:
            
            mock_http_client.post = AsyncMock(return_value=mock_response)
            
            result = await client._send_event(event)
            
            # Should not retry
            assert result is False
            mock_http_client.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_event_timeout_with_retry(self, client):
        """Test event sending with timeout and retry."""
        event = MockEvent()
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client._authenticator, 'get_jwt_token', return_value="test_jwt"), \
             patch.object(client, '_client') as mock_http_client, \
             patch.object(client, '_calculate_backoff_delay', return_value=0.001):
            
            mock_http_client.post = AsyncMock(side_effect=httpx.TimeoutException("Timeout"))
            
            result = await client._send_event(event)
            
            # Should retry max_retries times
            assert result is False
            assert mock_http_client.post.call_count == client.max_retries
    
    @pytest.mark.asyncio
    async def test_send_event_network_error_exhausted_retries(self, client):
        """Test event sending with network error until retries exhausted."""
        event = MockEvent()
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client._authenticator, 'get_jwt_token', return_value="test_jwt"), \
             patch.object(client, '_client') as mock_http_client, \
             patch.object(client, '_calculate_backoff_delay', return_value=0.001):
            
            mock_http_client.post = AsyncMock(side_effect=httpx.NetworkError("Network error"))
            
            result = await client._send_event(event)
            
            assert result is False
            assert mock_http_client.post.call_count == client.max_retries
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, client):
        """Test successful health check."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client, '_client') as mock_http_client:
            
            mock_http_client.get = AsyncMock(return_value=mock_response)
            
            result = await client.health_check()
            
            assert result["healthy"] is True
            assert result["status_code"] == 200
            assert "response_time_ms" in result
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, client):
        """Test failed health check."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal server error"
        
        with patch.object(client, '_initialize_client'), \
             patch.object(client, '_client') as mock_http_client:
            
            mock_http_client.get = AsyncMock(return_value=mock_response)
            
            result = await client.health_check()
            
            assert result["healthy"] is False
            assert result["status_code"] == 500
            assert "error" in result
    
    @pytest.mark.asyncio
    async def test_health_check_exception(self, client):
        """Test health check with exception."""
        with patch.object(client, '_initialize_client'), \
             patch.object(client, '_client') as mock_http_client:
            
            mock_http_client.get = AsyncMock(side_effect=httpx.NetworkError("Network error"))
            
            result = await client.health_check()
            
            assert result["healthy"] is False
            assert "error" in result
    
    @pytest.mark.asyncio
    async def test_calculate_backoff_delay(self, client):
        """Test backoff delay calculation."""
        # Test that delays increase exponentially
        delay1 = await client._calculate_backoff_delay(0)
        delay2 = await client._calculate_backoff_delay(1)
        delay3 = await client._calculate_backoff_delay(2)
        
        assert delay1 >= 1.0  # 2^0 = 1 + jitter
        assert delay2 >= 2.0  # 2^1 = 2 + jitter
        assert delay3 >= 4.0  # 2^2 = 4 + jitter
        
        # Test maximum cap
        large_delay = await client._calculate_backoff_delay(10)
        assert large_delay <= 30.0


@pytest.mark.asyncio
async def test_integration_performance():
    """Test integration with performance considerations."""
    config = {
        "enabled": True,
        "api_url": "https://api.test.com",
        "access_key": "test_key",
        "timeout": 1,
        "batch_size": 2,
        "batch_timeout": 0.01
    }
    
    interceptor = CylestioTraceInterceptor(config)
    
    # Mock the HTTP client to avoid real requests
    with patch.object(interceptor._client, '_send_events_batch_internal', return_value={"success": 10, "failed": 0}):
        # Create mock request data with multiple events
        mock_request = MagicMock()
        events = [MockEvent(EventName.LLM_CALL_START, f"session_{i}") for i in range(10)]
        request_data = LLMRequestData(request=mock_request, events=events)
        
        # This should be fast and non-blocking
        start_time = asyncio.get_event_loop().time()
        await interceptor.before_request(request_data)
        duration = asyncio.get_event_loop().time() - start_time
        
        # Should return quickly (non-blocking)
        assert duration < 0.1
        
        # Clean up
        await interceptor.cleanup()
