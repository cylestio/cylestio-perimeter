"""Configuration management for LLM Proxy Server."""
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ServerConfig(BaseModel):
    """Server configuration."""

    port: int = Field(default=4000, ge=1, le=65535)
    host: str = Field(default="127.0.0.1")  # Localhost only for security (use 0.0.0.0 to expose)
    workers: int = Field(default=1, ge=1)


class LLMConfig(BaseModel):
    """LLM provider configuration."""
    
    base_url: str = Field(..., description="Base URL of target LLM API")
    type: str = Field(..., description="LLM provider type (openai, anthropic, etc.)")
    api_key: Optional[str] = Field(default=None, description="API key to inject into requests")
    timeout: int = Field(default=30, ge=1, description="Request timeout in seconds")
    max_retries: int = Field(default=3, ge=0, description="Maximum number of retries")
    
    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: str) -> str:
        """Ensure base URL is properly formatted."""
        v = v.rstrip("/")
        if not v.startswith(("http://", "https://")):
            raise ValueError("base_url must start with http:// or https://")
        return v


class InterceptorConfig(BaseModel):
    """Individual interceptor configuration."""
    
    type: str = Field(..., description="Interceptor identifier")
    enabled: bool = Field(default=True, description="Enable/disable interceptor")
    config: Dict[str, Any] = Field(default_factory=dict, description="Type-specific configuration")


class LoggingConfig(BaseModel):
    """Logging configuration."""
    
    level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    format: str = Field(default="text", pattern="^(text|json)$")
    file: Optional[str] = Field(default=None, description="Optional log file path")
    max_file_size: str = Field(default="10MB", description="Maximum log file size")
    backup_count: int = Field(default=5, ge=0, description="Number of backup files to keep")




class LiveTraceConfig(BaseModel):
    """Live trace global configuration."""
    
    session_completion_timeout: int = Field(
        default=30, 
        ge=1,
        description="Seconds of inactivity before marking session as completed"
    )
    completion_check_interval: int = Field(
        default=10,
        ge=1, 
        description="Seconds between checking for completed sessions"
    )


class Settings(BaseModel):
    """Main settings configuration."""
    
    server: ServerConfig = Field(default_factory=ServerConfig)
    llm: LLMConfig
    interceptors: List[InterceptorConfig] = Field(default_factory=list)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    live_trace: Optional[LiveTraceConfig] = Field(default=None, description="Live trace global configuration")
    
    @classmethod
    def from_yaml(cls, config_path: str) -> "Settings":
        """Load settings from YAML file."""
        path = Path(config_path)
        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        
        # Handle environment variable substitution
        data = cls._substitute_env_vars(data)
        
        return cls(**data)
    
    @staticmethod
    def _substitute_env_vars(data: Any) -> Any:
        """Recursively substitute environment variables in config."""
        if isinstance(data, dict):
            return {k: Settings._substitute_env_vars(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [Settings._substitute_env_vars(item) for item in data]
        elif isinstance(data, str) and data.startswith("${") and data.endswith("}"):
            env_var = data[2:-1]
            return os.environ.get(env_var, data)
        return data
    
    def merge_cli_args(self, **kwargs) -> "Settings":
        """Merge CLI arguments with existing settings."""
        # Create a dict from current settings
        current = self.model_dump()
        
        # Apply CLI overrides
        if "base_url" in kwargs and kwargs["base_url"]:
            current["llm"]["base_url"] = kwargs["base_url"]
        if "type" in kwargs and kwargs["type"]:
            current["llm"]["type"] = kwargs["type"]
        if "api_key" in kwargs and kwargs["api_key"]:
            current["llm"]["api_key"] = kwargs["api_key"]
        if "port" in kwargs and kwargs["port"]:
            current["server"]["port"] = kwargs["port"]
        if "host" in kwargs and kwargs["host"]:
            current["server"]["host"] = kwargs["host"]
        if "log_level" in kwargs and kwargs["log_level"]:
            current["logging"]["level"] = kwargs["log_level"]
        
        return Settings(**current)


def load_settings(
    config_file: Optional[str] = None,
    **cli_overrides
) -> Settings:
    """Load settings from config file and CLI arguments.
    
    Args:
        config_file: Path to YAML configuration file
        **cli_overrides: CLI argument overrides
        
    Returns:
        Merged settings object
    """
    if config_file:
        settings = Settings.from_yaml(config_file)
        settings = settings.merge_cli_args(**cli_overrides)
    else:
        # Build from CLI args only
        llm_config = {
            "base_url": cli_overrides.get("base_url"),
            "type": cli_overrides.get("type"),
        }
        if "api_key" in cli_overrides:
            llm_config["api_key"] = cli_overrides["api_key"]
        
        settings_dict = {"llm": llm_config}
        
        # Add optional server settings
        if "port" in cli_overrides or "host" in cli_overrides:
            settings_dict["server"] = {}
            if "port" in cli_overrides:
                settings_dict["server"]["port"] = cli_overrides["port"]
            if "host" in cli_overrides:
                settings_dict["server"]["host"] = cli_overrides["host"]
        
        # Add logging settings
        if "log_level" in cli_overrides:
            settings_dict["logging"] = {"level": cli_overrides["log_level"]}
        
        settings = Settings(**settings_dict)
    
    return settings