"""Tests for Cylestio trace interceptor."""
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
        assert interceptor.api_url == "https://api.cylestio.test"
        assert interceptor.access_key == "test_key"
        assert interceptor.timeout == 5
    
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
        """Test that api_url defaults to https://api.cylestio.com when not provided."""
        config = {"access_key": "test_key"}
        interceptor = CylestioTraceInterceptor(config)
        
        assert interceptor.api_url == "https://api.cylestio.com"
        assert interceptor.access_key == "test_key"
    
    def test_custom_api_url(self):
        """Test that custom api_url is used when provided."""
        config = {
            "api_url": "https://custom.api.com",
            "access_key": "test_key"
        }
        interceptor = CylestioTraceInterceptor(config)
        
        assert interceptor.api_url == "https://custom.api.com"
        assert interceptor.access_key == "test_key"
    
    def test_missing_access_key_raises_error(self):
        """Test that missing access_key raises ValueError."""
        config = {"api_url": "https://api.cylestio.com"}
        
        # Ensure env var is not set for this test
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        if "CYLESTIO_ACCESS_KEY" in os.environ:
            del os.environ["CYLESTIO_ACCESS_KEY"]
        
        try:
            with pytest.raises(ValueError, match="Cylestio interceptor requires access_key"):
                CylestioTraceInterceptor(config)
        finally:
            # Restore original env var if it existed
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
    
    def test_empty_config_with_default_api_url(self):
        """Test that empty config except access_key works with default api_url."""
        config = {"access_key": "test_key"}
        interceptor = CylestioTraceInterceptor(config)
        
        assert interceptor.api_url == "https://api.cylestio.com"
        assert interceptor.access_key == "test_key"
        assert interceptor.timeout == 10  # default timeout
    
    def test_access_key_from_environment_variable(self):
        """Test that access_key is read from CYLESTIO_ACCESS_KEY env var when not in config."""
        config = {}
        
        # Set environment variable
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        os.environ["CYLESTIO_ACCESS_KEY"] = "env_test_key"
        
        try:
            interceptor = CylestioTraceInterceptor(config)
            assert interceptor.api_url == "https://api.cylestio.com"  # default
            assert interceptor.access_key == "env_test_key"  # from env
            assert interceptor.timeout == 10  # default
        finally:
            # Clean up environment variable
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
            elif "CYLESTIO_ACCESS_KEY" in os.environ:
                del os.environ["CYLESTIO_ACCESS_KEY"]
    
    def test_config_access_key_overrides_environment_variable(self):
        """Test that access_key in config takes precedence over env var."""
        config = {"access_key": "config_key"}
        
        # Set environment variable
        original_env = os.environ.get("CYLESTIO_ACCESS_KEY")
        os.environ["CYLESTIO_ACCESS_KEY"] = "env_test_key"
        
        try:
            interceptor = CylestioTraceInterceptor(config)
            assert interceptor.access_key == "config_key"  # config takes precedence
        finally:
            # Clean up environment variable
            if original_env is not None:
                os.environ["CYLESTIO_ACCESS_KEY"] = original_env
            elif "CYLESTIO_ACCESS_KEY" in os.environ:
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
        
        with patch.object(interceptor, '_send_events_background') as mock_send:
            result = await interceptor.before_request(request_data)
            
        assert result is None
        mock_send.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_before_request_with_events(self, interceptor, mock_request_data):
        """Test before_request with events."""
        with patch.object(interceptor, '_send_events_background') as mock_send:
            result = await interceptor.before_request(mock_request_data)
        
        assert result is None
        mock_send.assert_called_once_with(mock_request_data.events)
    
    @pytest.mark.asyncio
    async def test_after_response_with_events(self, interceptor, mock_request_data, mock_response_data):
        """Test after_response with events."""
        with patch.object(interceptor, '_send_events_background') as mock_send:
            result = await interceptor.after_response(mock_request_data, mock_response_data)
        
        assert result is None
        mock_send.assert_called_once_with(mock_response_data.events)
    
    @pytest.mark.asyncio
    async def test_on_error(self, interceptor, mock_request_data):
        """Test on_error method."""
        error = Exception("Test error")
        
        # Should not raise any exceptions
        await interceptor.on_error(mock_request_data, error)
    
    def test_send_events_background_no_events(self, interceptor):
        """Test _send_events_background with empty events list."""
        with patch('asyncio.create_task') as mock_task:
            interceptor._send_events_background([])
        
        mock_task.assert_not_called()
    
    def test_send_events_background_creates_task(self, interceptor):
        """Test _send_events_background creates background task."""
        events = [MockEvent()]
        
        # Create a mock task to avoid unawaited coroutine warnings
        mock_task_instance = MagicMock()
        
        with patch('asyncio.create_task', return_value=mock_task_instance) as mock_task:
            interceptor._send_events_background(events)
        
        mock_task.assert_called_once()
        # Verify the task was created with a coroutine
        call_args = mock_task.call_args[0]
        assert len(call_args) == 1
        # The first argument should be a coroutine - clean it up to avoid warnings
        coro = call_args[0]
        if hasattr(coro, 'close'):
            coro.close()
    
    def test_send_events_background_task_creation_failure(self, interceptor, caplog):
        """Test _send_events_background handles task creation failure."""
        events = [MockEvent()]
        
        def mock_create_task(coro):
            # Close the coroutine to avoid warnings
            if hasattr(coro, 'close'):
                coro.close()
            raise RuntimeError("Task creation failed")
        
        with patch('asyncio.create_task', side_effect=mock_create_task):
            interceptor._send_events_background(events)
        
        assert "Failed to create background batch task" in caplog.text
    
    def test_send_event_background_creates_task(self, interceptor):
        """Test _send_event_background creates background task."""
        event = MockEvent()
        
        # Create a mock task to avoid unawaited coroutine warnings
        mock_task_instance = MagicMock()
        
        with patch('asyncio.create_task', return_value=mock_task_instance) as mock_task:
            interceptor._send_event_background(event)
        
        mock_task.assert_called_once()
        # Verify the task was created with a coroutine
        call_args = mock_task.call_args[0]
        assert len(call_args) == 1
        # The first argument should be a coroutine - clean it up to avoid warnings
        coro = call_args[0]
        if hasattr(coro, 'close'):
            coro.close()


class TestCylestioClient:
    """Test cases for CylestioClient."""
    
    @pytest.fixture
    def client_config(self):
        """Client configuration."""
        return {
            "api_url": "https://api.cylestio.test",
            "access_key": "test_key",
            "timeout": 5,
            "max_retries": 2
        }
    
    @pytest.fixture
    async def client(self, client_config):
        """Create client instance."""
        client = CylestioClient(**client_config)
        async with client:
            yield client
    
    def test_client_init(self, client_config):
        """Test client initialization."""
        client = CylestioClient(**client_config)
        
        assert client.api_url == "https://api.cylestio.test"
        assert client.access_key == "test_key"
        assert client.timeout == 5
        assert client.max_retries == 2
    
    @pytest.mark.asyncio
    async def test_client_context_manager(self, client_config):
        """Test client context manager."""
        client = CylestioClient(**client_config)
        
        async with client:
            assert client._client is not None
        
        assert client._client is None  # Client reference cleared
    
    @pytest.mark.asyncio
    async def test_send_event_success(self, client):
        """Test successful event sending."""
        event = MockEvent()
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        
        with patch.object(client._client, 'post', return_value=mock_response) as mock_post:
            with patch.object(client._authenticator, 'get_jwt_token', return_value='fake_token'):
                result = await client.send_event(event)
        
        assert result is True
        mock_post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_event_auth_failure(self, client):
        """Test event sending with authentication failure."""
        event = MockEvent()
        
        with patch.object(client._authenticator, 'get_jwt_token', return_value=None):
            result = await client.send_event(event)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_send_event_retryable_error(self, client):
        """Test event sending with retryable errors."""
        event = MockEvent()
        
        # First attempt fails with 429, second succeeds
        mock_responses = [
            MagicMock(status_code=429, text="Rate limited"),
            MagicMock(status_code=200)
        ]
        
        with patch.object(client._client, 'post', side_effect=mock_responses):
            with patch.object(client._authenticator, 'get_jwt_token', return_value='fake_token'):
                with patch('asyncio.sleep'):  # Skip actual sleep
                    result = await client.send_event(event)
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_send_event_non_retryable_error(self, client):
        """Test event sending with non-retryable error."""
        event = MockEvent()
        
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad request"
        
        with patch.object(client._client, 'post', return_value=mock_response):
            with patch.object(client._authenticator, 'get_jwt_token', return_value='fake_token'):
                result = await client.send_event(event)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_send_event_timeout_with_retry(self, client):
        """Test event sending with timeout and retry."""
        event = MockEvent()
        
        # First attempt times out, second succeeds
        side_effects = [
            httpx.TimeoutException("Request timeout"),
            MagicMock(status_code=200)
        ]
        
        with patch.object(client._client, 'post', side_effect=side_effects):
            with patch.object(client._authenticator, 'get_jwt_token', return_value='fake_token'):
                with patch('asyncio.sleep'):  # Skip actual sleep
                    result = await client.send_event(event)
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_send_event_network_error_exhausted_retries(self, client):
        """Test event sending with network error exhausting retries."""
        event = MockEvent()
        
        with patch.object(client._client, 'post', side_effect=httpx.NetworkError("Network error")):
            with patch.object(client._authenticator, 'get_jwt_token', return_value='fake_token'):
                with patch('asyncio.sleep'):  # Skip actual sleep
                    result = await client.send_event(event)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_send_events_batch_empty(self, client):
        """Test batch sending with empty list."""
        result = await client.send_events_batch([])
        
        assert result["success"] == 0
        assert result["failed"] == 0
        assert result["duration_ms"] == 0
    
    @pytest.mark.asyncio
    async def test_send_events_batch_mixed_results(self, client):
        """Test batch sending with mixed success/failure results."""
        events = [MockEvent(EventName.LLM_CALL_START, f"session_{i}") for i in range(3)]
        
        # Mock different outcomes for each event
        with patch.object(client, '_send_single_event_with_context', side_effect=[True, False, True]):
            result = await client.send_events_batch(events)
        
        assert result["success"] == 2
        assert result["failed"] == 1
        assert "duration_ms" in result
    
    @pytest.mark.asyncio
    async def test_send_events_batch_with_exceptions(self, client):
        """Test batch sending with exceptions."""
        events = [MockEvent(EventName.LLM_CALL_START, f"session_{i}") for i in range(2)]
        
        # One succeeds, one raises exception
        with patch.object(client, '_send_single_event_with_context', side_effect=[True, Exception("Test error")]):
            result = await client.send_events_batch(events)
        
        assert result["success"] == 1
        assert result["failed"] == 1
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, client):
        """Test successful health check."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        
        with patch.object(client._client, 'get', return_value=mock_response):
            result = await client.health_check()
        
        assert result["healthy"] is True
        assert result["status_code"] == 200
        assert "response_time_ms" in result
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, client):
        """Test failed health check."""
        mock_response = MagicMock()
        mock_response.status_code = 503
        mock_response.text = "Service unavailable"
        
        with patch.object(client._client, 'get', return_value=mock_response):
            result = await client.health_check()
        
        assert result["healthy"] is False
        assert result["status_code"] == 503
        assert "Service unavailable" in result["error"]
    
    @pytest.mark.asyncio
    async def test_health_check_exception(self, client):
        """Test health check with exception."""
        with patch.object(client._client, 'get', side_effect=httpx.NetworkError("Network error")):
            result = await client.health_check()
        
        assert result["healthy"] is False
        assert "Network error" in result["error"]
        assert "response_time_ms" in result
    
    def test_calculate_backoff_delay(self, client_config):
        """Test backoff delay calculation."""
        client = CylestioClient(**client_config)
        
        # Test different attempt numbers
        delay_0 = asyncio.run(client._calculate_backoff_delay(0))
        delay_1 = asyncio.run(client._calculate_backoff_delay(1))
        delay_2 = asyncio.run(client._calculate_backoff_delay(2))
        
        # Should be exponential with jitter
        assert 1.0 <= delay_0 <= 3.0  # 2^0 = 1, with 10-30% jitter
        assert 2.0 <= delay_1 <= 6.0  # 2^1 = 2, with 10-30% jitter
        assert 4.0 <= delay_2 <= 12.0  # 2^2 = 4, with 10-30% jitter
        
        # Very high attempt should be capped at 30 seconds
        delay_high = asyncio.run(client._calculate_backoff_delay(10))
        assert delay_high <= 30.0
    
    @pytest.mark.asyncio
    async def test_client_not_initialized_error(self):
        """Test client methods when not initialized."""
        client = CylestioClient("https://api.test", "key")
        
        # Should raise RuntimeError when not in context manager
        with pytest.raises(RuntimeError, match="Client not initialized"):
            await client.send_event(MockEvent())
        
        with pytest.raises(RuntimeError, match="Client not initialized"):
            await client.health_check()
    
    @pytest.mark.asyncio
    async def test_shared_client_pool(self, client_config):
        """Test shared client pool functionality."""
        # Clear any existing clients
        CylestioClient._shared_clients.clear()
        
        client1 = CylestioClient(**client_config)
        client2 = CylestioClient(**client_config)
        
        async with client1:
            async with client2:
                # Both should use the same shared client
                assert client1._client is client2._client
                assert len(CylestioClient._shared_clients) == 1
        
        # Cleanup
        await CylestioClient.cleanup_shared_clients()
        assert len(CylestioClient._shared_clients) == 0


@pytest.mark.asyncio
async def test_integration_performance():
    """Integration test for performance under load."""
    config = {
        "enabled": True,
        "api_url": "https://api.cylestio.test",
        "access_key": "test_key",
        "timeout": 1  # Short timeout for test
    }
    
    interceptor = CylestioTraceInterceptor(config)
    
    # Create many events to test background processing
    events = [MockEvent(EventName.LLM_CALL_START, f"session_{i}") for i in range(100)]
    
    mock_request = MagicMock()
    request_data = LLMRequestData(request=mock_request, events=events)
    
    start_time = asyncio.get_event_loop().time()
    
    # This should return immediately due to background processing
    result = await interceptor.before_request(request_data)
    
    duration = asyncio.get_event_loop().time() - start_time
    
    assert result is None
    assert duration < 0.1  # Should complete very quickly due to background tasks


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


