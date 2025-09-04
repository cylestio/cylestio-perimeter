"""Tests for CylestioTraceInterceptor."""
import os
import pytest
from src.interceptors.cylestio_trace.interceptor import CylestioTraceInterceptor


class TestCylestioTraceInterceptor:
    """Test CylestioTraceInterceptor configuration."""
    
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