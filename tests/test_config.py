"""Tests for configuration module."""
import tempfile
from pathlib import Path

import pytest

# Unit tests are currently disabled; focusing on integration coverage
# pytestmark = pytest.mark.skip(reason="Unit tests temporarily disabled")
import yaml

from src.config.settings import LLMConfig, Settings, load_settings


class TestLLMConfig:
    """Test LLMConfig model."""
    
    def test_valid_config(self):
        """Test valid LLM configuration."""
        config = LLMConfig(
            base_url="https://api.openai.com",
            type="openai",
            api_key="sk-test"
        )
        assert config.base_url == "https://api.openai.com"
        assert config.type == "openai"
        assert config.api_key == "sk-test"
        assert config.timeout == 30
        assert config.max_retries == 3
    
    def test_base_url_validation(self):
        """Test base URL validation."""
        # Should strip trailing slash
        config = LLMConfig(
            base_url="https://api.openai.com/",
            type="openai"
        )
        assert config.base_url == "https://api.openai.com"
        
        # Should require http/https
        with pytest.raises(ValueError):
            LLMConfig(
                base_url="api.openai.com",
                type="openai"
            )


class TestSettings:
    """Test Settings model."""
    
    def test_minimal_settings(self):
        """Test minimal settings configuration."""
        settings = Settings(
            llm={
                "base_url": "https://api.openai.com",
                "type": "openai"
            }
        )
        assert settings.llm.base_url == "https://api.openai.com"
        assert settings.llm.type == "openai"
        # Default settings
        assert settings.server.port == 4000
        assert settings.server.host == "127.0.0.1"
        assert len(settings.interceptors) == 0
    
    def test_from_yaml(self, tmp_path):
        """Test loading settings from YAML."""
        config_data = {
            "llm": {
                "base_url": "https://api.openai.com",
                "type": "openai",
                "api_key": "sk-test"
            },
            "server": {
                "port": 8080
            },
            "interceptors": [
                {
                    "type": "printer",
                    "enabled": True,
                    "config": {
                        "log_requests": True
                    }
                }
            ]
        }
        
        config_file = tmp_path / "config.yaml"
        with open(config_file, "w") as f:
            yaml.dump(config_data, f)
        
        settings = Settings.from_yaml(str(config_file))
        assert settings.llm.base_url == "https://api.openai.com"
        assert settings.llm.api_key == "sk-test"
        assert settings.server.port == 8080
        assert len(settings.interceptors) == 1
        assert settings.interceptors[0].type == "printer"
    
    def test_merge_cli_args(self):
        """Test merging CLI arguments."""
        settings = Settings(
            llm={
                "base_url": "https://api.openai.com",
                "type": "openai"
            }
        )
        
        updated = settings.merge_cli_args(
            port=9000,
            api_key="sk-new-key",
            log_level="DEBUG"
        )
        
        assert updated.server.port == 9000
        assert updated.llm.api_key == "sk-new-key"
        assert updated.logging.level == "DEBUG"
        # Original should not change
        assert settings.server.port == 4000
        assert settings.llm.api_key is None


class TestLoadSettings:
    """Test load_settings function."""
    
    def test_cli_only(self):
        """Test loading settings from CLI arguments only."""
        settings = load_settings(
            base_url="https://api.openai.com",
            type="openai",
            port=8080
        )
        assert settings.llm.base_url == "https://api.openai.com"
        assert settings.llm.type == "openai"
        assert settings.server.port == 8080
    
    def test_config_file_with_overrides(self, tmp_path):
        """Test loading from config file with CLI overrides."""
        config_data = {
            "llm": {
                "base_url": "https://api.openai.com",
                "type": "openai",
                "api_key": "sk-config"
            },
            "server": {
                "port": 3000
            }
        }
        
        config_file = tmp_path / "config.yaml"
        with open(config_file, "w") as f:
            yaml.dump(config_data, f)
        
        settings = load_settings(
            config_file=str(config_file),
            port=9999,
            api_key="sk-cli"
        )
        
        assert settings.llm.base_url == "https://api.openai.com"
        assert settings.llm.api_key == "sk-cli"  # CLI override
        assert settings.server.port == 9999  # CLI override