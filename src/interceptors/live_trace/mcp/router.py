"""MCP FastAPI router implementing the Model Context Protocol.

Implements Streamable HTTP transport (MCP spec 2025-03-26):
- POST /mcp: JSON-RPC requests
- GET /mcp: SSE stream for server-initiated messages
- Session management via Mcp-Session-Id header
"""
import asyncio
import json
from typing import Any, Callable, Dict, Optional

from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from src.utils.logger import get_logger

from .handlers import call_tool
from .security import generate_session_id
from .tools import MCP_TOOLS

logger = get_logger(__name__)

# JSON-RPC 2.0 error codes
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INTERNAL_ERROR = -32603

# Active sessions for session management
_sessions: Dict[str, Dict[str, Any]] = {}


def _jsonrpc_response(request_id: Any, result: Any) -> Dict[str, Any]:
    """Create a JSON-RPC 2.0 success response."""
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def _jsonrpc_error(request_id: Any, code: int, message: str) -> Dict[str, Any]:
    """Create a JSON-RPC 2.0 error response."""
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def _get_or_create_session(session_id: Optional[str]) -> str:
    """Get existing session or create new one."""
    if session_id and session_id in _sessions:
        return session_id
    new_id = generate_session_id()
    _sessions[new_id] = {"created": asyncio.get_event_loop().time()}
    return new_id


def create_mcp_router(get_store: Callable[[], Any]) -> APIRouter:
    """Create the MCP router with store access.

    Args:
        get_store: Callable that returns the TraceStore instance

    Returns:
        FastAPI router for MCP endpoints
    """
    router = APIRouter(tags=["MCP"])

    def _add_session_header(response: Response, session_id: str) -> Response:
        """Add session ID header to response."""
        response.headers["Mcp-Session-Id"] = session_id
        return response

    @router.post("/mcp")
    async def mcp_endpoint(request: Request):
        """MCP JSON-RPC endpoint implementing Streamable HTTP transport.

        Per MCP spec 2025-03-26:
        - Returns application/json for all operations
        - Manages sessions via Mcp-Session-Id header
        """
        # Get or create session
        incoming_session = request.headers.get("Mcp-Session-Id")
        session_id = _get_or_create_session(incoming_session)

        try:
            body = await request.json()
        except Exception as e:
            resp = JSONResponse(_jsonrpc_error(None, PARSE_ERROR, f"Parse error: {e}"))
            return _add_session_header(resp, session_id)

        method = body.get("method")
        params = body.get("params", {})
        request_id = body.get("id")

        # Handle initialize - MCP handshake
        if method == "initialize":
            resp = JSONResponse(_jsonrpc_response(request_id, {
                "protocolVersion": "2025-03-26",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "agent-inspector", "version": "1.0.0"}
            }))
            return _add_session_header(resp, session_id)

        # Handle notifications/initialized - client ready signal (per MCP spec)
        # Notifications don't require a response, return 204 No Content
        elif method == "notifications/initialized":
            return _add_session_header(Response(status_code=204), session_id)

        # Handle tools/list - Return available tools
        elif method == "tools/list":
            resp = JSONResponse(_jsonrpc_response(request_id, {"tools": MCP_TOOLS}))
            return _add_session_header(resp, session_id)

        # Handle tools/call - Execute a tool
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            try:
                store = get_store()

                # Auto-track IDE activity: update last_seen for any tool with agent_workflow_id
                agent_workflow_id = arguments.get("agent_workflow_id")
                if agent_workflow_id:
                    store.update_workflow_last_seen(agent_workflow_id)

                result = call_tool(tool_name, arguments, store)
                resp = JSONResponse(_jsonrpc_response(request_id, {
                    "content": [{"type": "text", "text": json.dumps(result)}],
                    "isError": "error" in result
                }))
            except Exception as e:
                logger.error(f"MCP tool error: {e}")
                resp = JSONResponse(_jsonrpc_response(request_id, {
                    "content": [{"type": "text", "text": json.dumps({"error": str(e)})}],
                    "isError": True
                }))
            return _add_session_header(resp, session_id)

        # Unknown method
        else:
            resp = JSONResponse(_jsonrpc_error(request_id, METHOD_NOT_FOUND, f"Method not found: {method}"))
            return _add_session_header(resp, session_id)

    @router.delete("/mcp")
    async def mcp_delete_session(request: Request):
        """Terminate an MCP session.

        Per MCP spec 2025-03-26, clients can explicitly terminate sessions.
        """
        session_id = request.headers.get("Mcp-Session-Id")
        if session_id and session_id in _sessions:
            del _sessions[session_id]
            logger.info(f"MCP session terminated: {session_id}")
            return Response(status_code=204)
        return Response(status_code=404)

    # SSE endpoint for server-initiated messages (Streamable HTTP spec)
    @router.get("/mcp")
    async def mcp_sse_endpoint(request: Request):
        """MCP SSE endpoint for server-to-client streaming.

        Per MCP spec 2025-03-26, GET opens an SSE stream for:
        - Server-initiated notifications
        - Keepalive pings
        - Stream resumability via Last-Event-ID
        """
        # Get or create session
        incoming_session = request.headers.get("Mcp-Session-Id")
        session_id = _get_or_create_session(incoming_session)

        # Check for stream resumption
        last_event_id = request.headers.get("Last-Event-ID")
        if last_event_id:
            logger.info(f"MCP SSE resuming from event: {last_event_id}")

        async def event_generator():
            event_id = 0

            # Send initial connection message with session
            yield {
                "id": str(event_id),
                "event": "endpoint",
                "data": json.dumps({
                    "endpoint": "/mcp",
                    "session_id": session_id
                })
            }
            event_id += 1

            # Keep connection alive with periodic pings
            while True:
                if await request.is_disconnected():
                    logger.info(f"MCP SSE client disconnected (session: {session_id})")
                    break

                # Send keepalive ping every 30 seconds
                yield {
                    "id": str(event_id),
                    "event": "ping",
                    "data": json.dumps({"time": asyncio.get_event_loop().time()})
                }
                event_id += 1
                await asyncio.sleep(30)

        return EventSourceResponse(
            event_generator(),
            headers={"Mcp-Session-Id": session_id}
        )

    return router
