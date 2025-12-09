"""MCP FastAPI router implementing the Model Context Protocol."""
import json
from typing import Any, Callable, Dict

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.utils.logger import get_logger

from .handlers import call_tool
from .tools import MCP_TOOLS

logger = get_logger(__name__)

# JSON-RPC 2.0 error codes
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INTERNAL_ERROR = -32603


def _jsonrpc_response(request_id: Any, result: Any) -> Dict[str, Any]:
    """Create a JSON-RPC 2.0 success response."""
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def _jsonrpc_error(request_id: Any, code: int, message: str) -> Dict[str, Any]:
    """Create a JSON-RPC 2.0 error response."""
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def create_mcp_router(get_store: Callable[[], Any]) -> APIRouter:
    """Create the MCP router with store access.

    Args:
        get_store: Callable that returns the TraceStore instance

    Returns:
        FastAPI router for MCP endpoints
    """
    router = APIRouter(tags=["MCP"])

    @router.post("/mcp")
    async def mcp_endpoint(request: Request):
        """MCP JSON-RPC endpoint for Claude Code integration.

        Implements the Model Context Protocol over HTTP.
        Supports: initialize, tools/list, tools/call
        """
        try:
            body = await request.json()
        except Exception as e:
            return JSONResponse(_jsonrpc_error(None, PARSE_ERROR, f"Parse error: {e}"))

        method = body.get("method")
        params = body.get("params", {})
        request_id = body.get("id")

        # Handle initialize - MCP handshake
        if method == "initialize":
            return JSONResponse(_jsonrpc_response(request_id, {
                "protocolVersion": "2025-03-26",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "agent-inspector", "version": "1.0.0"}
            }))

        # Handle tools/list - Return available tools
        elif method == "tools/list":
            return JSONResponse(_jsonrpc_response(request_id, {"tools": MCP_TOOLS}))

        # Handle tools/call - Execute a tool
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            try:
                store = get_store()
                result = call_tool(tool_name, arguments, store)
                return JSONResponse(_jsonrpc_response(request_id, {
                    "content": [{"type": "text", "text": json.dumps(result)}],
                    "isError": "error" in result
                }))
            except Exception as e:
                logger.error(f"MCP tool error: {e}")
                return JSONResponse(_jsonrpc_response(request_id, {
                    "content": [{"type": "text", "text": json.dumps({"error": str(e)})}],
                    "isError": True
                }))

        # Unknown method
        else:
            return JSONResponse(_jsonrpc_error(request_id, METHOD_NOT_FOUND, f"Method not found: {method}"))

    return router
