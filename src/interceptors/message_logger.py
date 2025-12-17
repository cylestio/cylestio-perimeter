"""Message logger interceptor for logging LLM conversations."""

import asyncio
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

logger = get_logger(__name__)

# SECURITY: Patterns for credentials that should be redacted from logs
CREDENTIAL_PATTERNS = [
    # API keys (various formats)
    (re.compile(r'(sk-[a-zA-Z0-9]{20,})', re.IGNORECASE), '[REDACTED_API_KEY]'),
    (re.compile(r'(api[_-]?key)["\s:=]+["\']?([a-zA-Z0-9_-]{20,})["\']?', re.IGNORECASE), r'\1: [REDACTED]'),
    # Bearer tokens
    (re.compile(r'(bearer\s+)([a-zA-Z0-9._-]{20,})', re.IGNORECASE), r'\1[REDACTED]'),
    # AWS credentials
    (re.compile(r'(AKIA[A-Z0-9]{16})', re.IGNORECASE), '[REDACTED_AWS_KEY]'),
    # Generic secrets
    (re.compile(r'(password|secret|token|credential)["\s:=]+["\']?([^\s"\']{8,})["\']?', re.IGNORECASE), r'\1: [REDACTED]'),
]


class MessageLoggerInterceptor(BaseInterceptor):
    """Interceptor for logging LLM messages to dedicated log files."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize message logger interceptor.

        Args:
            config: Interceptor configuration
        """
        super().__init__(config)
        self.log_dir = Path(config.get("directory", "./message_logs"))
        self.log_file = config.get("filename", "message_log.jsonl")
        self.include_system_prompts = config.get("include_system_prompts", True)
        self.include_metadata = config.get("include_metadata", True)
        self.buffer_size = config.get("buffer_size", 10)
        # SECURITY: Redact credentials by default to prevent data leakage
        self.redact_credentials = config.get("redact_credentials", True)

        # SECURITY: Create log directory with restricted permissions (owner only)
        self.log_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.log_file_path = self.log_dir / self.log_file

        # Message buffer for batch writing
        self._message_buffer = []
        self._buffer_lock = asyncio.Lock()

    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "message_logger"

    def _redact_credentials(self, data: Any) -> Any:
        """Recursively redact credentials from data.

        Args:
            data: Data to redact (dict, list, or str)

        Returns:
            Data with credentials redacted
        """
        if not self.redact_credentials:
            return data

        if isinstance(data, dict):
            return {k: self._redact_credentials(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._redact_credentials(item) for item in data]
        elif isinstance(data, str):
            result = data
            for pattern, replacement in CREDENTIAL_PATTERNS:
                result = pattern.sub(replacement, result)
            return result
        else:
            return data

    async def before_request(
        self, request_data: LLMRequestData
    ) -> Optional[LLMRequestData]:
        """Log request messages before sending to LLM.

        Args:
            request_data: Request data container

        Returns:
            None (doesn't modify request)
        """
        if not request_data.body:
            return None


        await self._log_request_message(request_data)
        return None

    async def after_response(
        self, request_data: LLMRequestData, response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Log response messages after receiving from LLM.

        Args:
            request_data: Original request data
            response_data: Response data container

        Returns:
            None (doesn't modify response)
        """
        await self._log_response_message(request_data, response_data)
        return None

    async def _log_request_message(self, request_data: LLMRequestData) -> None:
        """Log request message to buffer.

        Args:
            request_data: Request data container
        """
        try:
            # SECURITY: Redact credentials from request body before logging
            redacted_body = self._redact_credentials(request_data.body)

            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": request_data.session_id,
                "direction": "request",
                "request": redacted_body,
                "model": request_data.model,
                "provider": request_data.provider,
            }

            if self.include_metadata:
                log_entry["metadata"] = {
                    "path": request_data.request.url.path,
                    "method": request_data.request.method,
                    "is_streaming": request_data.is_streaming,
                }

            await self._add_to_buffer(log_entry)

        except Exception as e:
            logger.error(f"Error logging request message: {e}", exc_info=True)

    async def _log_response_message(
        self, request_data: LLMRequestData, response_data: LLMResponseData
    ) -> None:
        """Log response message to buffer.

        Args:
            request_data: Original request data
            response_data: Response data container
        """
        try:
            if not response_data.body:
                return

            # SECURITY: Redact credentials from response body before logging
            redacted_body = self._redact_credentials(response_data.body)

            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": request_data.session_id,
                "direction": "response",
                "response": redacted_body,
                "model": request_data.model,
                "provider": request_data.provider,
            }

            if self.include_metadata:
                log_entry["metadata"] = {
                    "status_code": response_data.status_code,
                    "duration_ms": response_data.duration_ms,
                }

            await self._add_to_buffer(log_entry)

        except Exception as e:
            logger.error(f"Error logging response message: {e}", exc_info=True)


    async def _add_to_buffer(self, log_entry: Dict[str, Any]) -> None:
        """Add log entry to buffer and flush if needed.

        Args:
            log_entry: Log entry dictionary
        """
        async with self._buffer_lock:
            self._message_buffer.append(log_entry)
            if len(self._message_buffer) >= self.buffer_size:
                await self._flush_buffer()

    async def _flush_buffer(self) -> None:
        """Flush message buffer to file."""
        if not self._message_buffer:
            return

        try:
            # SECURITY: Create file with restricted permissions (owner read/write only)
            fd = os.open(str(self.log_file_path), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            try:
                with os.fdopen(fd, "a", encoding="utf-8") as f:
                    for entry in self._message_buffer:
                        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            except Exception:
                os.close(fd)
                raise

            logger.debug(
                f"Flushed {len(self._message_buffer)} messages to {self.log_file_path}"
            )
            self._message_buffer.clear()

        except Exception as e:
            logger.error(f"Error flushing message buffer: {e}", exc_info=True)

    async def close(self) -> None:
        """Close interceptor and flush remaining buffer."""
        async with self._buffer_lock:
            await self._flush_buffer()

    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Log error information.

        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        try:
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": request_data.session_id,
                "direction": "error",
                "error_type": type(error).__name__,
                "error_message": str(error),
                "model": request_data.model,
                "provider": request_data.provider,
            }

            if self.include_metadata:
                log_entry["metadata"] = {
                    "path": request_data.request.url.path,
                    "method": request_data.request.method,
                }

            await self._add_to_buffer(log_entry)

        except Exception as e:
            logger.error(f"Error logging error message: {e}", exc_info=True)
