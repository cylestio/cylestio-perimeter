"""HTTP recorder interceptor for recording raw HTTP traffic for replay."""

import asyncio
import json
import os
import stat
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from src.proxy.interceptor_base import BaseInterceptor, LLMRequestData, LLMResponseData
from src.utils.logger import get_logger

logger = get_logger(__name__)

# SECURITY: Headers that may contain sensitive credentials - these are redacted by default
SENSITIVE_HEADERS = frozenset([
    'authorization',
    'x-api-key',
    'api-key',
    'x-auth-token',
    'x-access-token',
    'cookie',
    'set-cookie',
    'proxy-authorization',
    'www-authenticate',
    'x-amz-security-token',
    'x-csrf-token',
])


class HttpRecorderInterceptor(BaseInterceptor):
    """Interceptor for recording raw HTTP requests and responses sequentially for offline replay."""

    def __init__(self, config: dict[str, Any]):
        """Initialize HTTP recorder interceptor.

        Args:
            config: Interceptor configuration
        """
        super().__init__(config)
        self.output_dir = Path(config.get("output_dir", "./http_recordings"))
        self.max_events_per_file = config.get("max_events_per_file", 100)
        self.include_headers = config.get("include_headers", True)
        self.include_timing = config.get("include_timing", True)
        self.max_body_size_mb = config.get("max_body_size_mb", 100)
        # SECURITY: Redact sensitive headers by default to prevent credential leakage
        self.redact_sensitive_headers = config.get("redact_sensitive_headers", True)

        # Create output directory with restricted permissions (owner only)
        self.output_dir.mkdir(parents=True, exist_ok=True, mode=0o700)

        # File management
        self._current_file_number = self._get_next_file_number()
        self._current_event_count = 0
        self._file_lock = asyncio.Lock()

        logger.info(f"HTTP Recorder initialized: output_dir={self.output_dir}, max_events_per_file={self.max_events_per_file}")

    @property
    def name(self) -> str:
        """Return the name of this interceptor."""
        return "http_recorder"

    def _filter_headers(self, headers: dict) -> dict:
        """Filter headers to redact sensitive values.

        Args:
            headers: Original headers dictionary

        Returns:
            Filtered headers with sensitive values redacted
        """
        if not self.redact_sensitive_headers:
            return dict(headers)

        filtered = {}
        for key, value in headers.items():
            if key.lower() in SENSITIVE_HEADERS:
                # Redact but preserve header presence for debugging
                filtered[key] = "[REDACTED]"
            else:
                filtered[key] = value
        return filtered

    async def before_request(
        self, request_data: LLMRequestData
    ) -> Optional[LLMRequestData]:
        """Record raw HTTP request data.

        Args:
            request_data: Request data container

        Returns:
            None (doesn't modify request)
        """
        if not request_data.request:
            return None

        try:
            # Get raw request body
            request_body = await self._get_request_body(request_data.request)

            # Check body size limit
            if self._exceeds_size_limit(request_body):
                logger.warning("Request body size exceeds limit, truncating recording")
                request_body = f"[TRUNCATED - size exceeds {self.max_body_size_mb}MB]".encode()

            # Create request record
            # SECURITY: Filter sensitive headers before recording
            headers = {}
            if self.include_headers:
                headers = self._filter_headers(dict(request_data.request.headers))

            request_record = {
                "type": "request",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method": request_data.request.method,
                "url": str(request_data.request.url),
                "path": request_data.request.url.path,
                "query": str(request_data.request.url.query) if request_data.request.url.query else None,
                "headers": headers,
                "body": self._encode_body(request_body),
                "session_id": request_data.session_id,
                "provider": request_data.provider,
                "model": request_data.model,
                "is_streaming": request_data.is_streaming
            }

            if self.include_timing:
                request_record["start_time"] = time.time()

            # Write to file immediately
            await self._write_event(request_record)

            logger.debug(f"Recorded HTTP request: {request_data.request.method} {request_data.request.url.path}")

        except Exception as e:
            logger.error(f"Error recording HTTP request: {e}", exc_info=True)

        return None

    async def after_response(
        self, request_data: LLMRequestData, response_data: LLMResponseData
    ) -> Optional[LLMResponseData]:
        """Record raw HTTP response data.

        Args:
            request_data: Original request data
            response_data: Response data container

        Returns:
            None (doesn't modify response)
        """
        try:
            # Get response body
            response_body = await self._get_response_body(response_data.response)

            # Check body size limit
            if self._exceeds_size_limit(response_body):
                logger.warning("Response body size exceeds limit, truncating recording")
                response_body = f"[TRUNCATED - size exceeds {self.max_body_size_mb}MB]".encode()

            # Create response record
            # SECURITY: Filter sensitive headers before recording
            headers = {}
            if self.include_headers:
                headers = self._filter_headers(dict(response_data.response.headers))

            response_record = {
                "type": "response",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status_code": response_data.status_code,
                "headers": headers,
                "body": self._encode_body(response_body),
                "duration_ms": response_data.duration_ms
            }

            if self.include_timing:
                response_record["end_time"] = time.time()

            # Write to file immediately
            await self._write_event(response_record)

            logger.debug(f"Recorded HTTP response: {response_data.status_code}")

        except Exception as e:
            logger.error(f"Error recording HTTP response: {e}", exc_info=True)

        return None

    async def on_error(self, request_data: LLMRequestData, error: Exception) -> None:
        """Record error information.

        Args:
            request_data: Original request data
            error: The exception that occurred
        """
        try:
            error_record = {
                "type": "error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error_type": type(error).__name__,
                "error_message": str(error),
                "method": request_data.request.method if request_data.request else None,
                "path": request_data.request.url.path if request_data.request else None
            }

            await self._write_event(error_record)

        except Exception as e:
            logger.error(f"Error recording HTTP error: {e}", exc_info=True)

    async def _write_event(self, event: dict[str, Any]) -> None:
        """Write a single event to the current file.

        Args:
            event: Event data to write
        """
        async with self._file_lock:
            try:
                # Check if we need to rotate to a new file
                if self._current_event_count >= self.max_events_per_file:
                    self._current_file_number += 1
                    self._current_event_count = 0
                    logger.info(f"Rotating to new recording file: {self._current_file_number:03d}")

                # Get current file path
                file_path = self.output_dir / f"recording_{self._current_file_number:03d}.jsonl"

                # SECURITY: Create file with restricted permissions (owner read/write only)
                # Use os.open with explicit mode to ensure secure permissions
                is_new_file = not file_path.exists()
                fd = os.open(str(file_path), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
                try:
                    with os.fdopen(fd, 'a', encoding='utf-8') as f:
                        f.write(json.dumps(event, ensure_ascii=False) + '\n')
                except Exception:
                    os.close(fd)
                    raise

                self._current_event_count += 1
                logger.debug(f"Wrote event to {file_path} (count: {self._current_event_count})")

            except Exception as e:
                logger.error(f"Error writing event to file: {e}", exc_info=True)

    def _get_next_file_number(self) -> int:
        """Get the next available file number.

        Returns:
            Next file number to use
        """
        existing_files = list(self.output_dir.glob("recording_*.jsonl"))
        if not existing_files:
            return 1

        # Extract numbers from existing files and get the highest
        numbers = []
        for file_path in existing_files:
            try:
                # Extract number from filename like "recording_001.jsonl"
                number_str = file_path.stem.split('_')[1]
                numbers.append(int(number_str))
            except (IndexError, ValueError):
                continue

        if numbers:
            # Start from the last file, count its events
            last_number = max(numbers)
            last_file = self.output_dir / f"recording_{last_number:03d}.jsonl"

            # Count existing events in the last file
            try:
                with open(last_file, encoding='utf-8') as f:
                    event_count = sum(1 for _ in f)

                # If the last file has space, continue with it
                if event_count < self.max_events_per_file:
                    self._current_event_count = event_count
                    return last_number
                else:
                    # Last file is full, start a new one
                    return last_number + 1
            except Exception:
                # If we can't read the file, start a new one
                return last_number + 1

        return 1

    async def _get_request_body(self, request) -> bytes:
        """Get raw request body bytes.

        Args:
            request: FastAPI Request object

        Returns:
            Request body as bytes
        """
        try:
            # The request body might have already been read in middleware
            if hasattr(request, '_body') and request._body:
                body = request._body
                return body if isinstance(body, bytes) else b""

            # Otherwise, read it (this might be empty if already consumed)
            body = await request.body()
            return body if body and isinstance(body, bytes) else b""
        except Exception as e:
            logger.debug(f"Could not read request body: {e}")
            return b""

    async def _get_response_body(self, response) -> bytes:
        """Get raw response body bytes.

        Args:
            response: FastAPI Response object

        Returns:
            Response body as bytes
        """
        try:
            if hasattr(response, 'body') and response.body:
                if isinstance(response.body, bytes):
                    return response.body
                elif isinstance(response.body, str):
                    return response.body.encode('utf-8')

            # Try to get from content
            if hasattr(response, 'content') and response.content:
                if isinstance(response.content, bytes):
                    return response.content
                elif isinstance(response.content, str):
                    return response.content.encode('utf-8')

            return b""
        except Exception as e:
            logger.debug(f"Could not read response body: {e}")
            return b""

    def _encode_body(self, body_bytes: bytes) -> dict[str, Any]:
        """Encode body bytes for JSON serialization.

        Args:
            body_bytes: Raw body bytes

        Returns:
            Dictionary with body information
        """
        if not body_bytes:
            return {"size": 0, "content": None}

        try:
            # Try to decode as UTF-8 text first
            text_content = body_bytes.decode('utf-8')

            # Try to parse as JSON for better readability
            try:
                json_content = json.loads(text_content)
                return {
                    "size": len(body_bytes),
                    "type": "json",
                    "content": json_content
                }
            except json.JSONDecodeError:
                # Not JSON, store as text
                return {
                    "size": len(body_bytes),
                    "type": "text",
                    "content": text_content
                }
        except UnicodeDecodeError:
            # Binary content, encode as base64
            import base64
            return {
                "size": len(body_bytes),
                "type": "binary",
                "content": base64.b64encode(body_bytes).decode('ascii')
            }

    def _exceeds_size_limit(self, body_bytes: bytes) -> bool:
        """Check if body exceeds size limit.

        Args:
            body_bytes: Body bytes to check

        Returns:
            True if size limit is exceeded
        """
        if not body_bytes or not isinstance(body_bytes, bytes):
            return False

        max_size_bytes = self.max_body_size_mb * 1024 * 1024
        return len(body_bytes) > max_size_bytes

    async def close(self) -> None:
        """Close interceptor and finalize current recording file."""
        async with self._file_lock:
            logger.info(f"HTTP Recorder closed. Final file: recording_{self._current_file_number:03d}.jsonl with {self._current_event_count} events")
