"""MCP Security module implementing CSRF protection.

Security features:
- Origin header validation to prevent CSRF attacks from malicious websites
- Host header validation to prevent host header injection
- Secure session ID generation with full 128-bit entropy

Security model:
- Requests WITH Origin header: Must be from localhost (browser requests)
- Requests WITHOUT Origin header: Allowed (CLI tools, MCP clients)
- This blocks the attack vector where malicious websites use JavaScript
  to send requests to localhost MCP endpoints.
"""
import secrets
import uuid
from typing import Optional, Set

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Allowed origins for CSRF protection (localhost only)
# Requests from browsers will have Origin header - we only allow localhost
ALLOWED_ORIGINS: Set[str] = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:7100",
    "http://127.0.0.1:7100",
    "http://localhost:7500",
    "http://127.0.0.1:7500",
}

# Allowed hosts for Host header validation
ALLOWED_HOSTS: Set[str] = {
    "localhost",
    "127.0.0.1",
}


def generate_session_id() -> str:
    """Generate a cryptographically secure session ID.

    Uses full 128-bit UUID4 for security instead of truncated IDs.
    This prevents session ID brute-forcing attacks.

    Returns:
        Full UUID session ID prefixed with 'mcp-'
    """
    return f"mcp-{uuid.uuid4().hex}"


def validate_origin(origin: Optional[str]) -> bool:
    """Validate the Origin header for CSRF protection.

    The key insight: browser requests from malicious websites will have
    an Origin header with the attacker's domain. Local CLI tools and
    same-origin requests don't send Origin headers.

    Args:
        origin: Origin header value from request

    Returns:
        True if origin is allowed or absent, False otherwise
    """
    # No Origin header = same-origin or non-browser request (allowed)
    # This is safe because:
    # 1. Same-origin browser requests don't include Origin
    # 2. CLI tools (curl, MCP clients) don't send Origin
    # 3. Cross-origin browser requests ALWAYS include Origin
    if origin is None:
        return True

    # Check against allowed localhost origins
    return origin in ALLOWED_ORIGINS


def validate_host(host: Optional[str]) -> bool:
    """Validate the Host header to prevent host header attacks.

    Only allows localhost connections. This ensures the server
    only responds to requests explicitly targeting localhost.

    Args:
        host: Host header value from request

    Returns:
        True if host is localhost, False otherwise
    """
    if host is None:
        return False

    # Extract hostname without port
    hostname = host.split(":")[0] if ":" in host else host

    return hostname in ALLOWED_HOSTS


class MCPSecurityMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces security for MCP endpoints.

    Protects against CSRF attacks by:
    1. Validating Host header (must be localhost)
    2. Validating Origin header (if present, must be localhost)

    This blocks malicious websites from using JavaScript to call
    the MCP endpoints, while still allowing legitimate local access
    from CLI tools and the dashboard.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method

        # Protect MCP and API endpoints from cross-origin requests
        # Static assets and health checks are excluded
        needs_protection = path.startswith("/mcp") or path.startswith("/api/")

        if not needs_protection:
            return await call_next(request)

        # Validate Host header - must be localhost
        host = request.headers.get("host")
        if not validate_host(host):
            logger.warning(f"MCP request rejected: invalid Host header '{host}'")
            raise HTTPException(
                status_code=403,
                detail="Access denied - only localhost connections allowed"
            )

        # Validate Origin header (CSRF protection)
        # If Origin is present, it must be from localhost
        # If Origin is absent, request is from CLI/same-origin (allowed)
        origin = request.headers.get("origin")
        if not validate_origin(origin):
            logger.warning(
                f"MCP request rejected: cross-origin request from '{origin}'. "
                "This could be a CSRF attack from a malicious website."
            )
            raise HTTPException(
                status_code=403,
                detail="Cross-origin requests not allowed - possible CSRF attack"
            )

        return await call_next(request)
