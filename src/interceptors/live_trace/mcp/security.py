"""Localhost security middleware for API endpoints."""
import uuid
from typing import Optional, Set

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.utils.logger import get_logger

logger = get_logger(__name__)

ALLOWED_ORIGINS: Set[str] = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:7100",
    "http://127.0.0.1:7100",
    "http://localhost:7500",
    "http://127.0.0.1:7500",
}

ALLOWED_HOSTS: Set[str] = {
    "localhost",
    "127.0.0.1",
}


def generate_session_id() -> str:
    """Generate a session ID using full 128-bit UUID."""
    return f"mcp-{uuid.uuid4().hex}"


def validate_origin(origin: Optional[str]) -> bool:
    """Validate Origin header - allow localhost or absent (CLI tools)."""
    if origin is None:
        return True
    return origin in ALLOWED_ORIGINS


def validate_host(host: Optional[str]) -> bool:
    """Validate Host header - must be localhost."""
    if host is None:
        return False
    hostname = host.split(":")[0] if ":" in host else host
    return hostname in ALLOWED_HOSTS


class LocalhostSecurityMiddleware(BaseHTTPMiddleware):
    """Restricts API access to localhost only."""

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        needs_protection = path.startswith("/mcp") or path.startswith("/api/")
        if not needs_protection:
            return await call_next(request)

        host = request.headers.get("host")
        if not validate_host(host):
            logger.warning(f"Request rejected: invalid Host '{host}'")
            raise HTTPException(status_code=403, detail="Access denied")

        origin = request.headers.get("origin")
        if not validate_origin(origin):
            logger.warning(f"Request rejected: cross-origin from '{origin}'")
            raise HTTPException(status_code=403, detail="Cross-origin requests not allowed")

        return await call_next(request)
