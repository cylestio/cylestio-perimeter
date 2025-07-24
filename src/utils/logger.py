"""Logging utilities for LLM Proxy Server."""
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from src.config.settings import LoggingConfig


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, default=str)


def setup_logging(config: LoggingConfig) -> None:
    """Set up logging configuration.
    
    Args:
        config: Logging configuration object
    """
    # Clear existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers = []
    
    # Set logging level
    log_level = getattr(logging, config.level.upper())
    root_logger.setLevel(log_level)
    
    # Create formatter
    if config.format == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler if specified
    if config.file:
        file_path = Path(config.file)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Parse max file size
        size_str = config.max_file_size.upper()
        if size_str.endswith("MB"):
            max_bytes = int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith("KB"):
            max_bytes = int(size_str[:-2]) * 1024
        elif size_str.endswith("GB"):
            max_bytes = int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            max_bytes = 10 * 1024 * 1024  # Default 10MB
        
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            config.file,
            maxBytes=max_bytes,
            backupCount=config.backup_count
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def log_with_context(
    logger: logging.Logger,
    level: str,
    message: str,
    **context: Any
) -> None:
    """Log a message with additional context.
    
    Args:
        logger: Logger instance
        level: Log level (debug, info, warning, error)
        message: Log message
        **context: Additional context to include in log
    """
    log_func = getattr(logger, level.lower())
    log_func(message, extra={"context": context})