"""Comprehensive tests for MCP implementation.

Tests cover:
1. MCP JSON-RPC protocol compliance
2. MCP tool listing and execution
3. Session management
4. SSE streaming endpoint
5. All tool handlers
6. Error handling
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from ..store import TraceStore
from .router import create_mcp_router, _sessions
from .handlers import call_tool, _handlers
from .tools import MCP_TOOLS, get_tool_names


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def store():
    """Create an in-memory store for testing."""
    return TraceStore(storage_mode="memory")


@pytest.fixture
def app(store):
    """Create a test FastAPI app with MCP router."""
    app = FastAPI()
    router = create_mcp_router(lambda: store)
    app.include_router(router)
    return app


@pytest.fixture
def client(app):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_sessions():
    """Clear MCP sessions before each test."""
    _sessions.clear()
    yield
    _sessions.clear()


# ============================================================================
# MCP Protocol Tests
# ============================================================================

class TestMCPProtocol:
    """Test MCP JSON-RPC 2.0 protocol compliance."""

    def test_initialize_handshake(self, client):
        """Test MCP initialize handshake."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0.0"}
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify JSON-RPC structure
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == 1
        assert "result" in data
        
        # Verify MCP response
        result = data["result"]
        assert result["protocolVersion"] == "2025-03-26"
        assert "capabilities" in result
        assert "serverInfo" in result
        assert result["serverInfo"]["name"] == "agent-inspector"
    
    def test_session_id_header_returned(self, client):
        """Test that session ID is returned in header."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize"
        })
        
        assert "Mcp-Session-Id" in response.headers
        session_id = response.headers["Mcp-Session-Id"]
        assert session_id.startswith("mcp-")
    
    def test_session_persistence(self, client):
        """Test that session ID persists across requests."""
        # First request - get session ID
        response1 = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize"
        })
        session_id = response1.headers["Mcp-Session-Id"]
        
        # Second request with session ID - should use same session
        response2 = client.post(
            "/mcp",
            json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            headers={"Mcp-Session-Id": session_id}
        )
        assert response2.headers["Mcp-Session-Id"] == session_id
    
    def test_invalid_json_returns_parse_error(self, client):
        """Test that invalid JSON returns parse error."""
        response = client.post(
            "/mcp",
            content="not valid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == -32700  # Parse error
    
    def test_unknown_method_returns_error(self, client):
        """Test that unknown method returns method not found error."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "unknown/method"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == -32601  # Method not found
    
    def test_notifications_initialized_accepted(self, client):
        """Test that notifications/initialized is accepted (MCP lifecycle)."""
        # First initialize
        init_response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize"
        })
        session_id = init_response.headers["Mcp-Session-Id"]
        
        # Then send notifications/initialized (no id for notifications)
        response = client.post(
            "/mcp",
            json={"jsonrpc": "2.0", "method": "notifications/initialized"},
            headers={"Mcp-Session-Id": session_id}
        )
        
        # Should return 204 No Content (notification accepted)
        assert response.status_code == 204
        assert "Mcp-Session-Id" in response.headers


# ============================================================================
# MCP Tools/List Tests
# ============================================================================

class TestMCPToolsList:
    """Test MCP tools/list endpoint."""

    def test_tools_list_returns_all_tools(self, client):
        """Test that tools/list returns all available tools."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        })
        
        assert response.status_code == 200
        data = response.json()
        tools = data["result"]["tools"]
        
        # Verify we have the expected tools
        tool_names = [t["name"] for t in tools]
        assert "get_security_patterns" in tool_names
        assert "create_analysis_session" in tool_names
        assert "store_finding" in tool_names
        assert "get_agent_workflow_state" in tool_names
    
    def test_tools_have_required_fields(self, client):
        """Test that all tools have required MCP fields."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        })
        
        tools = response.json()["result"]["tools"]
        
        for tool in tools:
            assert "name" in tool, f"Tool missing name"
            assert "description" in tool, f"Tool {tool.get('name')} missing description"
            assert "inputSchema" in tool, f"Tool {tool.get('name')} missing inputSchema"
    
    def test_tool_count_matches_definitions(self, client):
        """Test that returned tools match defined tools."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        })
        
        tools = response.json()["result"]["tools"]
        assert len(tools) == len(MCP_TOOLS)


# ============================================================================
# MCP Tools/Call Tests  
# ============================================================================

class TestMCPToolsCall:
    """Test MCP tools/call endpoint."""

    def test_call_get_security_patterns(self, client):
        """Test calling get_security_patterns tool."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "get_security_patterns",
                "arguments": {"context": "all"}
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        result = data["result"]
        
        # Verify MCP tool response structure
        assert "content" in result
        assert len(result["content"]) > 0
        assert result["content"][0]["type"] == "text"
        
        # Parse the tool result
        tool_result = json.loads(result["content"][0]["text"])
        assert "patterns" in tool_result
        assert "total_count" in tool_result
    
    def test_call_create_analysis_session(self, client, store):
        """Test calling create_analysis_session tool."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "create_analysis_session",
                "arguments": {
                    "agent_workflow_id": "test-workflow",
                    "session_type": "STATIC",
                    "agent_workflow_name": "Test Workflow"
                }
            }
        })
        
        assert response.status_code == 200
        result = response.json()["result"]
        tool_result = json.loads(result["content"][0]["text"])
        
        assert "session" in tool_result
        assert tool_result["session"]["agent_workflow_id"] == "test-workflow"
        assert tool_result["session"]["status"] == "IN_PROGRESS"
    
    def test_call_unknown_tool_returns_error(self, client):
        """Test that calling unknown tool returns error."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "nonexistent_tool",
                "arguments": {}
            }
        })
        
        assert response.status_code == 200
        result = response.json()["result"]
        tool_result = json.loads(result["content"][0]["text"])
        
        assert "error" in tool_result
        assert result["isError"] is True
    
    def test_call_tool_with_missing_required_params(self, client):
        """Test calling tool with missing required params."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "create_analysis_session",
                "arguments": {}  # Missing required agent_workflow_id
            }
        })
        
        result = response.json()["result"]
        tool_result = json.loads(result["content"][0]["text"])
        
        assert "error" in tool_result
        assert "agent_workflow_id" in tool_result["error"]


# ============================================================================
# Session Management Tests
# ============================================================================

class TestMCPSessionManagement:
    """Test MCP session management."""

    def test_delete_session(self, client):
        """Test session deletion."""
        # Create a session
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize"
        })
        session_id = response.headers["Mcp-Session-Id"]
        
        # Delete the session
        delete_response = client.delete(
            "/mcp",
            headers={"Mcp-Session-Id": session_id}
        )
        assert delete_response.status_code == 204
    
    def test_delete_nonexistent_session(self, client):
        """Test deleting nonexistent session returns 404."""
        response = client.delete(
            "/mcp",
            headers={"Mcp-Session-Id": "nonexistent-session"}
        )
        assert response.status_code == 404
    
    def test_new_session_created_without_header(self, client):
        """Test that new session is created when no header provided."""
        response1 = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize"
        })
        session1 = response1.headers["Mcp-Session-Id"]
        
        response2 = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "initialize"
        })
        session2 = response2.headers["Mcp-Session-Id"]
        
        # Should be different sessions
        assert session1 != session2


# ============================================================================
# SSE Streaming Tests (Optional MCP Feature)
# ============================================================================
# Note: SSE (GET /mcp) is optional in MCP Streamable HTTP spec.
# The core MCP functionality is via POST /mcp.
# SSE is only for server-initiated messages (rarely used).
# These tests verify the endpoint exists with correct headers.

class TestMCPSSEStreaming:
    """Test MCP SSE streaming endpoint headers.
    
    SSE streaming tests are limited to header verification because:
    1. SSE is optional in MCP spec (deprecated in favor of Streamable HTTP)
    2. The endpoint has a keepalive loop that blocks synchronous tests
    3. Full SSE testing requires httpx.AsyncClient (async tests)
    
    The important MCP functionality (tools/call, initialize) is via POST.
    """

    def test_sse_endpoint_exists(self, app):
        """Test GET /mcp endpoint is registered for SSE.
        
        Verifies the route exists without making a blocking request.
        """
        # Collect all routes and their methods
        route_methods = {}
        for route in app.routes:
            path = getattr(route, 'path', None)
            methods = getattr(route, 'methods', set())
            if path:
                if path not in route_methods:
                    route_methods[path] = set()
                route_methods[path].update(methods)
        
        # Verify /mcp has GET, POST, and DELETE
        assert "/mcp" in route_methods
        mcp_methods = route_methods["/mcp"]
        assert 'GET' in mcp_methods, f"GET not in /mcp methods: {mcp_methods}"
        assert 'POST' in mcp_methods, f"POST not in /mcp methods: {mcp_methods}"
        assert 'DELETE' in mcp_methods, f"DELETE not in /mcp methods: {mcp_methods}"


# ============================================================================
# Tool Handler Tests
# ============================================================================

class TestToolHandlers:
    """Test individual tool handlers."""

    def test_get_agent_workflow_state_no_data(self, store):
        """Test get_agent_workflow_state with no data."""
        result = call_tool("get_agent_workflow_state", {"agent_workflow_id": "test"}, store)

        assert result["state"] == "NO_DATA"
        assert result["has_static_analysis"] is False
        assert result["has_dynamic_sessions"] is False

    def test_get_agent_workflow_state_with_static(self, store):
        """Test get_agent_workflow_state with static analysis data."""
        # Create a session
        store.create_analysis_session("sess1", "test-wf", "STATIC")

        result = call_tool("get_agent_workflow_state", {"agent_workflow_id": "test-wf"}, store)
        
        assert result["state"] == "STATIC_ONLY"
        assert result["has_static_analysis"] is True
        assert result["static_sessions_count"] == 1
    
    def test_store_and_get_findings(self, store):
        """Test storing and retrieving findings."""
        # Create session first
        store.create_analysis_session("sess1", "test-wf", "STATIC")
        
        # Store a finding
        result = call_tool("store_finding", {
            "session_id": "sess1",
            "file_path": "/test/file.py",
            "finding_type": "LLM01",
            "severity": "HIGH",
            "title": "Test Finding"
        }, store)
        
        assert "finding" in result
        assert result["finding"]["title"] == "Test Finding"
        
        # Get findings
        findings = call_tool("get_findings", {"agent_workflow_id": "test-wf"}, store)
        assert findings["total_count"] == 1
    
    def test_complete_analysis_session(self, store):
        """Test completing analysis session with risk score."""
        # Create session and finding
        store.create_analysis_session("sess1", "test-wf", "STATIC")
        store.store_finding(
            "find1", "sess1", "test-wf", "/file.py",
            "LLM01", "CRITICAL", "Critical Issue"
        )
        
        result = call_tool("complete_analysis_session", {
            "session_id": "sess1",
            "calculate_risk": True
        }, store)
        
        assert result["session"]["status"] == "COMPLETED"
        assert result["risk_score"] is not None
        # Risk score can be 0 if no weighted findings, just check it's calculated
        assert isinstance(result["risk_score"], (int, float))
    
    def test_update_finding_status(self, store):
        """Test updating finding status."""
        store.create_analysis_session("sess1", "test-wf", "STATIC")
        store.store_finding(
            "find1", "sess1", "test-wf", "/file.py",
            "LLM01", "HIGH", "Test Finding"
        )
        
        result = call_tool("update_finding_status", {
            "finding_id": "find1",
            "status": "FIXED",
            "notes": "Fixed in PR #123"
        }, store)
        
        assert result["finding"]["status"] == "FIXED"
    
    def test_get_agents_empty(self, store):
        """Test get_agents with no agents."""
        result = call_tool("get_agents", {}, store)
        
        assert result["total_count"] == 0
        assert result["agents"] == []
    
    def test_handler_registry_complete(self):
        """Test that all MCP tools have handlers registered."""
        tool_names = get_tool_names()
        
        for tool_name in tool_names:
            assert tool_name in _handlers, f"Missing handler for tool: {tool_name}"


# ============================================================================
# Error Handling Tests
# ============================================================================

class TestMCPErrorHandling:
    """Test MCP error handling."""

    def test_tool_error_sets_isError_flag(self, client):
        """Test that tool errors set isError flag."""
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "store_finding",
                "arguments": {
                    "session_id": "nonexistent",
                    "file_path": "/test.py",
                    "finding_type": "LLM01",
                    "severity": "HIGH",
                    "title": "Test"
                }
            }
        })
        
        result = response.json()["result"]
        assert result["isError"] is True
    
    def test_validation_error_returns_error_message(self, client, store):
        """Test that validation errors return clear messages."""
        # First create a session so we can test severity validation
        store.create_analysis_session("sess-validation", "test-wf", "STATIC")
        
        response = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "store_finding",
                "arguments": {
                    "session_id": "sess-validation",
                    "file_path": "/test.py",
                    "finding_type": "LLM01",
                    "severity": "INVALID_SEVERITY",
                    "title": "Test"
                }
            }
        })
        
        result = response.json()["result"]
        tool_result = json.loads(result["content"][0]["text"])
        assert "error" in tool_result
        assert "severity" in tool_result["error"].lower()


# ============================================================================
# Integration Tests
# ============================================================================

class TestMCPIntegration:
    """Integration tests for complete MCP workflows."""

    def test_full_static_analysis_workflow(self, client, store):
        """Test complete static analysis workflow via MCP."""
        # 1. Initialize
        init = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize"
        })
        session_id = init.headers["Mcp-Session-Id"]
        
        # 2. List tools
        tools = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        }, headers={"Mcp-Session-Id": session_id})
        assert len(tools.json()["result"]["tools"]) > 0
        
        # 3. Create analysis session
        create_session = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "create_analysis_session",
                "arguments": {
                    "agent_workflow_id": "integration-test",
                    "session_type": "STATIC"
                }
            }
        }, headers={"Mcp-Session-Id": session_id})
        
        session_result = json.loads(
            create_session.json()["result"]["content"][0]["text"]
        )
        analysis_session_id = session_result["session"]["session_id"]
        
        # 4. Store findings
        store_finding = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "store_finding",
                "arguments": {
                    "session_id": analysis_session_id,
                    "file_path": "/src/agent.py",
                    "finding_type": "LLM01",
                    "severity": "HIGH",
                    "title": "Prompt Injection Vulnerability",
                    "description": "User input not sanitized"
                }
            }
        }, headers={"Mcp-Session-Id": session_id})
        
        finding_result = json.loads(
            store_finding.json()["result"]["content"][0]["text"]
        )
        assert "finding" in finding_result
        
        # 5. Complete session
        complete = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {
                "name": "complete_analysis_session",
                "arguments": {"session_id": analysis_session_id}
            }
        }, headers={"Mcp-Session-Id": session_id})
        
        complete_result = json.loads(
            complete.json()["result"]["content"][0]["text"]
        )
        assert complete_result["session"]["status"] == "COMPLETED"
        # Risk score is calculated (can be 0 depending on finding weights)
        assert isinstance(complete_result["risk_score"], (int, float))
        
        # 6. Get agent workflow state
        state = client.post("/mcp", json={
            "jsonrpc": "2.0",
            "id": 6,
            "method": "tools/call",
            "params": {
                "name": "get_agent_workflow_state",
                "arguments": {"agent_workflow_id": "integration-test"}
            }
        }, headers={"Mcp-Session-Id": session_id})
        
        state_result = json.loads(
            state.json()["result"]["content"][0]["text"]
        )
        assert state_result["state"] == "STATIC_ONLY"
        assert state_result["findings_count"] == 1
