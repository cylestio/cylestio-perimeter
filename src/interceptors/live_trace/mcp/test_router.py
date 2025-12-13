"""Tests for MCP Router - JSON-RPC, SSE, and session management.

Tests the MCP Streamable HTTP transport (spec 2025-03-26):
- POST /mcp: JSON-RPC requests
- GET /mcp: SSE stream for server-initiated messages  
- DELETE /mcp: Session termination
- Session management via Mcp-Session-Id header
"""
import json
import pytest
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from ..store import TraceStore
from .router import create_mcp_router


class TestMCPRouter:
    """Tests for MCP router endpoints."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    @pytest.fixture
    def client(self, store):
        """Create a test client with MCP router."""
        app = FastAPI()
        router = create_mcp_router(lambda: store)
        app.include_router(router)
        return TestClient(app)


class TestMCPInitialize(TestMCPRouter):
    """Tests for MCP initialize handshake."""

    def test_initialize_returns_protocol_version(self, client):
        """Test initialize returns correct protocol version."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })

        assert response.status_code == 200
        data = response.json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == 1
        assert "result" in data
        assert data["result"]["protocolVersion"] == "2025-03-26"

    def test_initialize_returns_server_info(self, client):
        """Test initialize returns server information."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })

        result = response.json()["result"]
        assert result["serverInfo"]["name"] == "agent-inspector"
        assert "version" in result["serverInfo"]

    def test_initialize_returns_capabilities(self, client):
        """Test initialize returns capabilities."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })

        result = response.json()["result"]
        assert "capabilities" in result
        assert "tools" in result["capabilities"]


class TestMCPToolsList(TestMCPRouter):
    """Tests for tools/list method."""

    def test_tools_list_returns_all_tools(self, client):
        """Test tools/list returns all available tools."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        })

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 2
        assert "result" in data
        assert "tools" in data["result"]
        assert len(data["result"]["tools"]) > 0

    def test_tools_list_contains_expected_tools(self, client):
        """Test tools/list contains key tools."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {}
        })

        tools = response.json()["result"]["tools"]
        tool_names = [t["name"] for t in tools]

        # Check for expected tools
        assert "get_security_patterns" in tool_names
        assert "create_analysis_session" in tool_names
        assert "store_finding" in tool_names
        assert "get_agent_workflow_state" in tool_names

    def test_tools_have_input_schema(self, client):
        """Test each tool has inputSchema defined."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {}
        })

        tools = response.json()["result"]["tools"]
        for tool in tools:
            assert "name" in tool
            assert "description" in tool
            assert "inputSchema" in tool


class TestMCPToolsCall(TestMCPRouter):
    """Tests for tools/call method."""

    def test_tools_call_get_security_patterns(self, client):
        """Test calling get_security_patterns tool."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "get_security_patterns",
                "arguments": {"context": "all"}
            }
        })

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 3
        assert "result" in data
        assert "content" in data["result"]
        assert len(data["result"]["content"]) > 0
        assert data["result"]["content"][0]["type"] == "text"

    def test_tools_call_create_session(self, client, store):
        """Test calling create_analysis_session tool."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "create_analysis_session",
                "arguments": {
                    "agent_workflow_id": "test-agent-workflow",
                    "session_type": "STATIC"
                }
            }
        })

        assert response.status_code == 200
        data = response.json()
        content = json.loads(data["result"]["content"][0]["text"])
        assert "session" in content
        assert content["session"]["agent_workflow_id"] == "test-agent-workflow"

    def test_tools_call_unknown_tool(self, client):
        """Test calling an unknown tool returns error in content."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {
                "name": "nonexistent_tool",
                "arguments": {}
            }
        })

        assert response.status_code == 200
        data = response.json()
        assert data["result"]["isError"] is True
        content = json.loads(data["result"]["content"][0]["text"])
        assert "error" in content

    def test_tools_call_with_missing_required_args(self, client):
        """Test calling tool with missing required arguments."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 6,
            "method": "tools/call",
            "params": {
                "name": "create_analysis_session",
                "arguments": {}  # Missing required agent_workflow_id
            }
        })

        assert response.status_code == 200
        data = response.json()
        assert data["result"]["isError"] is True


class TestMCPSessionManagement(TestMCPRouter):
    """Tests for MCP session management."""

    def test_new_session_id_assigned(self, client):
        """Test that a new session ID is assigned on first request."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })

        assert "Mcp-Session-Id" in response.headers
        session_id = response.headers["Mcp-Session-Id"]
        assert session_id.startswith("mcp-")

    def test_session_id_persisted(self, client):
        """Test that session ID is persisted across requests."""
        # First request - get session ID
        response1 = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        session_id = response1.headers["Mcp-Session-Id"]

        # Second request with same session ID
        response2 = client.post(
            "/mcp",
            json={
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/list",
                "params": {}
            },
            headers={"Mcp-Session-Id": session_id}
        )

        # Should return same session ID
        assert response2.headers["Mcp-Session-Id"] == session_id

    def test_delete_session(self, client):
        """Test deleting a session."""
        # Create a session
        response1 = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })
        session_id = response1.headers["Mcp-Session-Id"]

        # Delete the session
        response2 = client.delete(
            "/mcp",
            headers={"Mcp-Session-Id": session_id}
        )

        assert response2.status_code == 204

    def test_delete_nonexistent_session(self, client):
        """Test deleting a nonexistent session returns 404."""
        response = client.delete(
            "/mcp",
            headers={"Mcp-Session-Id": "nonexistent-session"}
        )

        assert response.status_code == 404


class TestMCPJSONRPCProtocol(TestMCPRouter):
    """Tests for JSON-RPC 2.0 protocol compliance."""

    def test_response_includes_jsonrpc_version(self, client):
        """Test response includes jsonrpc 2.0 version."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        })

        data = response.json()
        assert data["jsonrpc"] == "2.0"

    def test_response_includes_request_id(self, client):
        """Test response includes the same request ID."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 42,
            "method": "initialize",
            "params": {}
        })

        data = response.json()
        assert data["id"] == 42

    def test_method_not_found_error(self, client):
        """Test unknown method returns METHOD_NOT_FOUND error."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "unknown/method",
            "params": {}
        })

        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == -32601  # METHOD_NOT_FOUND

    def test_parse_error_on_invalid_json(self, client):
        """Test invalid JSON returns PARSE_ERROR."""
        response = client.post(
            "/mcp",
            content="not valid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == -32700  # PARSE_ERROR

    def test_notifications_initialized_returns_204(self, client):
        """Test notifications/initialized returns 204 No Content."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        })

        # Notifications should return 204 No Content
        assert response.status_code == 204


class TestMCPSSEEndpoint(TestMCPRouter):
    """Tests for MCP SSE (Server-Sent Events) endpoint.
    
    Note: SSE (GET /mcp) is optional in MCP Streamable HTTP spec.
    The core MCP functionality is via POST /mcp. These tests verify
    the endpoint is registered correctly without blocking on streaming.
    """

    def test_sse_route_is_registered(self, client, store):
        """Test GET /mcp route is registered for SSE."""
        # Create the app and check routes
        app = FastAPI()
        router = create_mcp_router(lambda: store)
        app.include_router(router)
        
        # Verify GET /mcp route exists
        get_routes = [
            r for r in app.routes 
            if hasattr(r, 'path') and r.path == "/mcp" 
            and hasattr(r, 'methods') and 'GET' in r.methods
        ]
        assert len(get_routes) == 1, "GET /mcp route should be registered"


class TestMCPToolIntegration(TestMCPRouter):
    """Integration tests for MCP tools through the router."""

    def test_full_analysis_workflow(self, client, store):
        """Test a full analysis workflow through MCP."""
        # 1. Create session
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "create_analysis_session",
                "arguments": {
                    "agent_workflow_id": "integration-test",
                    "session_type": "STATIC"
                }
            }
        })

        content = json.loads(response.json()["result"]["content"][0]["text"])
        session_id = content["session"]["session_id"]

        # 2. Store a finding
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "store_finding",
                "arguments": {
                    "session_id": session_id,
                    "file_path": "/test/file.py",
                    "finding_type": "LLM01",
                    "severity": "HIGH",
                    "title": "Test Finding"
                }
            }
        })

        assert response.status_code == 200
        content = json.loads(response.json()["result"]["content"][0]["text"])
        assert "finding" in content

        # 3. Get findings
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "get_findings",
                "arguments": {"agent_workflow_id": "integration-test"}
            }
        })

        content = json.loads(response.json()["result"]["content"][0]["text"])
        assert content["total_count"] == 1

        # 4. Complete session
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "complete_analysis_session",
                "arguments": {"session_id": session_id}
            }
        })

        content = json.loads(response.json()["result"]["content"][0]["text"])
        assert content["session"]["status"] == "COMPLETED"

    def test_agent_workflow_state_tool(self, client, store):
        """Test get_agent_workflow_state tool."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "get_agent_workflow_state",
                "arguments": {"agent_workflow_id": "new-agent-workflow"}
            }
        })

        content = json.loads(response.json()["result"]["content"][0]["text"])
        assert content["state"] == "NO_DATA"
        assert "recommendation" in content
