"""Tests for IDE connection functionality in live trace store and MCP handlers."""
import time
import tempfile
import os
from unittest.mock import MagicMock, patch

import pytest

from src.interceptors.live_trace.store.store import TraceStore
from src.interceptors.live_trace.mcp.handlers import (
    handle_register_ide_connection,
    handle_ide_heartbeat,
    handle_disconnect_ide,
    handle_get_ide_connection_status,
)


class TestTraceStoreIDEConnection:
    """Test cases for TraceStore IDE connection methods."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        # Cleanup temp file
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_register_ide_connection_basic(self, store):
        """Test basic IDE connection registration."""
        connection = store.register_ide_connection(
            connection_id="ide_test123",
            ide_type="cursor",
        )
        
        assert connection["connection_id"] == "ide_test123"
        assert connection["ide_type"] == "cursor"
        assert connection["is_active"] is True
        assert connection["is_developing"] is False
        assert connection["connected_at"] is not None
        assert connection["last_heartbeat"] is not None

    def test_register_ide_connection_with_all_params(self, store):
        """Test IDE connection registration with all parameters."""
        connection = store.register_ide_connection(
            connection_id="ide_full123",
            ide_type="claude-code",
            agent_workflow_id="test-agent",
            host="test-host",
            user="test-user",
            workspace_path="/path/to/workspace",
            model="claude-opus-4.5",
            metadata={"extra": "data"},
        )
        
        assert connection["connection_id"] == "ide_full123"
        assert connection["ide_type"] == "claude-code"
        assert connection["agent_workflow_id"] == "test-agent"
        assert connection["host"] == "test-host"
        assert connection["user"] == "test-user"
        assert connection["workspace_path"] == "/path/to/workspace"
        assert connection["model"] == "claude-opus-4.5"
        assert connection["is_active"] is True

    def test_get_ide_connection(self, store):
        """Test retrieving an IDE connection by ID."""
        # Register a connection
        store.register_ide_connection(
            connection_id="ide_get123",
            ide_type="cursor",
            agent_workflow_id="my-agent",
        )
        
        # Retrieve it
        connection = store.get_ide_connection("ide_get123")
        
        assert connection is not None
        assert connection["connection_id"] == "ide_get123"
        assert connection["ide_type"] == "cursor"
        assert connection["agent_workflow_id"] == "my-agent"

    def test_get_ide_connection_not_found(self, store):
        """Test retrieving a non-existent IDE connection."""
        connection = store.get_ide_connection("nonexistent")
        assert connection is None

    def test_get_ide_connections_filter_by_workflow(self, store):
        """Test filtering IDE connections by workflow."""
        # Register connections for different workflows
        store.register_ide_connection(
            connection_id="ide_workflow1",
            ide_type="cursor",
            agent_workflow_id="agent-a",
        )
        store.register_ide_connection(
            connection_id="ide_workflow2",
            ide_type="cursor",
            agent_workflow_id="agent-b",
        )
        
        # Filter by workflow
        connections = store.get_ide_connections(agent_workflow_id="agent-a")
        
        assert len(connections) == 1
        assert connections[0]["connection_id"] == "ide_workflow1"

    def test_get_ide_connections_filter_by_ide_type(self, store):
        """Test filtering IDE connections by IDE type."""
        store.register_ide_connection(
            connection_id="ide_cursor1",
            ide_type="cursor",
        )
        store.register_ide_connection(
            connection_id="ide_claude1",
            ide_type="claude-code",
        )
        
        # Filter by IDE type
        connections = store.get_ide_connections(ide_type="cursor")
        
        assert len(connections) == 1
        assert connections[0]["connection_id"] == "ide_cursor1"

    def test_update_ide_heartbeat(self, store):
        """Test updating IDE heartbeat."""
        # Register a connection
        store.register_ide_connection(
            connection_id="ide_heartbeat1",
            ide_type="cursor",
        )
        
        # Update heartbeat
        connection = store.update_ide_heartbeat(
            connection_id="ide_heartbeat1",
            is_developing=True,
        )
        
        assert connection is not None
        assert connection["is_developing"] is True

    def test_update_ide_heartbeat_with_workflow(self, store):
        """Test updating IDE heartbeat with workflow change."""
        store.register_ide_connection(
            connection_id="ide_heartbeat2",
            ide_type="cursor",
            agent_workflow_id="agent-a",
        )
        
        # Update heartbeat with new workflow
        connection = store.update_ide_heartbeat(
            connection_id="ide_heartbeat2",
            is_developing=False,
            agent_workflow_id="agent-b",
        )
        
        assert connection is not None
        assert connection["agent_workflow_id"] == "agent-b"

    def test_update_ide_heartbeat_not_found(self, store):
        """Test updating heartbeat for non-existent connection."""
        connection = store.update_ide_heartbeat(
            connection_id="nonexistent",
            is_developing=True,
        )
        assert connection is None

    def test_disconnect_ide(self, store):
        """Test disconnecting an IDE."""
        store.register_ide_connection(
            connection_id="ide_disconnect1",
            ide_type="cursor",
        )
        
        # Disconnect
        connection = store.disconnect_ide("ide_disconnect1")
        
        assert connection is not None
        assert connection["is_active"] is False
        assert connection["is_developing"] is False
        assert connection["disconnected_at"] is not None

    def test_disconnect_ide_not_found(self, store):
        """Test disconnecting non-existent connection."""
        connection = store.disconnect_ide("nonexistent")
        assert connection is None

    def test_get_ide_connection_status_not_connected(self, store):
        """Test getting status when no IDE is connected."""
        status = store.get_ide_connection_status(agent_workflow_id="nonexistent")
        
        assert status["is_connected"] is False
        assert status["is_developing"] is False

    def test_get_ide_connection_status_connected(self, store):
        """Test getting status when IDE is connected."""
        store.register_ide_connection(
            connection_id="ide_status1",
            ide_type="cursor",
            agent_workflow_id="my-agent",
            model="claude-opus-4.5",
        )
        
        status = store.get_ide_connection_status(agent_workflow_id="my-agent")
        
        assert status["is_connected"] is True
        assert status["has_ever_connected"] is True
        assert status["connected_ide"] is not None
        assert status["connected_ide"]["ide_type"] == "cursor"
        assert status["connected_ide"]["model"] == "claude-opus-4.5"

    def test_get_ide_connection_status_developing(self, store):
        """Test getting status when actively developing."""
        store.register_ide_connection(
            connection_id="ide_status2",
            ide_type="cursor",
            agent_workflow_id="my-agent",
        )
        store.update_ide_heartbeat(
            connection_id="ide_status2",
            is_developing=True,
        )
        
        status = store.get_ide_connection_status(agent_workflow_id="my-agent")
        
        assert status["is_connected"] is True
        assert status["is_developing"] is True

    def test_get_ide_connection_status_has_ever_connected(self, store):
        """Test has_ever_connected flag persists after disconnect."""
        store.register_ide_connection(
            connection_id="ide_status3",
            ide_type="cursor",
            agent_workflow_id="my-agent",
        )
        
        # Disconnect
        store.disconnect_ide("ide_status3")
        
        status = store.get_ide_connection_status(agent_workflow_id="my-agent")
        
        # Should not be currently connected, but has_ever_connected should be true
        assert status["is_connected"] is False
        assert status["has_ever_connected"] is True
        # connected_ide should still have the most recent connection
        assert status["connected_ide"] is not None

    def test_connection_with_model_field(self, store):
        """Test that model field is properly stored and retrieved."""
        store.register_ide_connection(
            connection_id="ide_model1",
            ide_type="cursor",
            model="gpt-4o",
        )
        
        connection = store.get_ide_connection("ide_model1")
        assert connection["model"] == "gpt-4o"

    def test_multiple_connections_same_workflow(self, store):
        """Test multiple connections for the same workflow."""
        store.register_ide_connection(
            connection_id="ide_multi1",
            ide_type="cursor",
            agent_workflow_id="shared-agent",
        )
        store.register_ide_connection(
            connection_id="ide_multi2",
            ide_type="claude-code",
            agent_workflow_id="shared-agent",
        )
        
        connections = store.get_ide_connections(agent_workflow_id="shared-agent")
        
        assert len(connections) == 2


class TestMCPIDEHandlers:
    """Test cases for MCP IDE connection handlers."""

    @pytest.fixture
    def mock_store(self):
        """Create a mock store for testing handlers."""
        store = MagicMock()
        return store

    def test_register_ide_connection_success(self, mock_store):
        """Test successful IDE registration via handler."""
        mock_store.register_ide_connection.return_value = {
            "connection_id": "ide_test123",
            "ide_type": "cursor",
            "agent_workflow_id": "my-agent",
            "is_active": True,
            "is_developing": False,
        }
        
        result = handle_register_ide_connection(
            {"ide_type": "cursor", "agent_workflow_id": "my-agent"},
            mock_store,
        )
        
        assert "connection" in result
        assert result["connection"]["ide_type"] == "cursor"
        assert "dashboard_url" in result
        mock_store.register_ide_connection.assert_called_once()

    def test_register_ide_connection_missing_ide_type(self, mock_store):
        """Test registration without ide_type."""
        result = handle_register_ide_connection({}, mock_store)
        
        assert "error" in result
        assert "ide_type is required" in result["error"]
        mock_store.register_ide_connection.assert_not_called()

    def test_register_ide_connection_invalid_ide_type(self, mock_store):
        """Test registration with invalid ide_type."""
        result = handle_register_ide_connection(
            {"ide_type": "vscode"},
            mock_store,
        )
        
        assert "error" in result
        assert "Invalid ide_type" in result["error"]
        mock_store.register_ide_connection.assert_not_called()

    def test_register_ide_connection_with_model(self, mock_store):
        """Test registration with model parameter."""
        mock_store.register_ide_connection.return_value = {
            "connection_id": "ide_model123",
            "ide_type": "cursor",
            "model": "claude-opus-4.5",
            "is_active": True,
        }
        
        result = handle_register_ide_connection(
            {
                "ide_type": "cursor",
                "model": "claude-opus-4.5",
                "agent_workflow_id": "test",
                "workspace_path": "/path",
            },
            mock_store,
        )
        
        assert "connection" in result
        # Verify model was passed to store
        call_args = mock_store.register_ide_connection.call_args
        assert call_args.kwargs.get("model") == "claude-opus-4.5"

    def test_ide_heartbeat_success(self, mock_store):
        """Test successful heartbeat."""
        mock_store.update_ide_heartbeat.return_value = {
            "connection_id": "ide_hb123",
            "is_developing": True,
        }
        
        result = handle_ide_heartbeat(
            {"connection_id": "ide_hb123", "is_developing": True},
            mock_store,
        )
        
        assert "connection" in result
        assert result["status"] == "actively developing"
        mock_store.update_ide_heartbeat.assert_called_once()

    def test_ide_heartbeat_missing_connection_id(self, mock_store):
        """Test heartbeat without connection_id."""
        result = handle_ide_heartbeat({}, mock_store)
        
        assert "error" in result
        assert "connection_id is required" in result["error"]

    def test_ide_heartbeat_connection_not_found(self, mock_store):
        """Test heartbeat for non-existent connection."""
        mock_store.update_ide_heartbeat.return_value = None
        
        result = handle_ide_heartbeat(
            {"connection_id": "nonexistent"},
            mock_store,
        )
        
        assert "error" in result
        assert "not found" in result["error"]

    def test_disconnect_ide_success(self, mock_store):
        """Test successful disconnect."""
        mock_store.disconnect_ide.return_value = {
            "connection_id": "ide_disc123",
            "is_active": False,
        }
        
        result = handle_disconnect_ide(
            {"connection_id": "ide_disc123"},
            mock_store,
        )
        
        assert "connection" in result
        assert "disconnected" in result["message"].lower()

    def test_disconnect_ide_missing_connection_id(self, mock_store):
        """Test disconnect without connection_id."""
        result = handle_disconnect_ide({}, mock_store)
        
        assert "error" in result
        assert "connection_id is required" in result["error"]

    def test_disconnect_ide_not_found(self, mock_store):
        """Test disconnect for non-existent connection."""
        mock_store.disconnect_ide.return_value = None
        
        result = handle_disconnect_ide(
            {"connection_id": "nonexistent"},
            mock_store,
        )
        
        assert "error" in result
        assert "not found" in result["error"]

    def test_get_ide_connection_status_connected(self, mock_store):
        """Test getting status when connected."""
        mock_store.get_ide_connection_status.return_value = {
            "is_connected": True,
            "is_developing": False,
            "has_ever_connected": True,
            "connected_ide": {
                "ide_type": "cursor",
                "last_seen_relative": "just now",
            },
        }
        
        result = handle_get_ide_connection_status(
            {"agent_workflow_id": "my-agent"},
            mock_store,
        )
        
        assert result["is_connected"] is True
        assert "✅" in result["message"]

    def test_get_ide_connection_status_developing(self, mock_store):
        """Test getting status when developing."""
        mock_store.get_ide_connection_status.return_value = {
            "is_connected": True,
            "is_developing": True,
            "has_ever_connected": True,
            "connected_ide": {
                "ide_type": "cursor",
                "last_seen_relative": "just now",
            },
        }
        
        result = handle_get_ide_connection_status(
            {"agent_workflow_id": "my-agent"},
            mock_store,
        )
        
        assert result["is_developing"] is True
        assert "🔥" in result["message"]

    def test_get_ide_connection_status_not_connected(self, mock_store):
        """Test getting status when not connected."""
        mock_store.get_ide_connection_status.return_value = {
            "is_connected": False,
            "is_developing": False,
            "has_ever_connected": False,
            "connected_ide": None,
        }
        
        result = handle_get_ide_connection_status(
            {"agent_workflow_id": "my-agent"},
            mock_store,
        )
        
        assert result["is_connected"] is False
        assert "❌" in result["message"]


class TestIDEConnectionIntegration:
    """Integration tests for IDE connection flow."""

    @pytest.fixture
    def store(self):
        """Create a TraceStore with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        
        store = TraceStore(db_path=db_path)
        yield store
        
        # Cleanup temp file
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_full_connection_lifecycle(self, store):
        """Test complete IDE connection lifecycle."""
        # 1. Register
        result = handle_register_ide_connection(
            {
                "ide_type": "cursor",
                "agent_workflow_id": "test-agent",
                "workspace_path": "/path/to/project",
                "model": "claude-opus-4.5",
            },
            store,
        )
        assert "connection" in result
        connection_id = result["connection"]["connection_id"]
        
        # 2. Check status - should be connected
        status = handle_get_ide_connection_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        assert status["is_connected"] is True
        assert status["has_ever_connected"] is True
        
        # 3. Send heartbeat with developing=True
        heartbeat = handle_ide_heartbeat(
            {"connection_id": connection_id, "is_developing": True},
            store,
        )
        assert heartbeat["status"] == "actively developing"
        
        # 4. Check status - should be developing
        status = handle_get_ide_connection_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        assert status["is_developing"] is True
        
        # 5. Send heartbeat with developing=False
        heartbeat = handle_ide_heartbeat(
            {"connection_id": connection_id, "is_developing": False},
            store,
        )
        assert heartbeat["status"] == "connected"
        
        # 6. Disconnect
        disconnect = handle_disconnect_ide(
            {"connection_id": connection_id},
            store,
        )
        assert disconnect["connection"]["is_active"] is False
        
        # 7. Check status - not connected but has_ever_connected
        status = handle_get_ide_connection_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        assert status["is_connected"] is False
        assert status["has_ever_connected"] is True

    def test_reconnection_flow(self, store):
        """Test reconnecting after disconnect."""
        # First connection
        result1 = handle_register_ide_connection(
            {"ide_type": "cursor", "agent_workflow_id": "test-agent"},
            store,
        )
        connection_id1 = result1["connection"]["connection_id"]
        
        # Disconnect
        handle_disconnect_ide({"connection_id": connection_id1}, store)
        
        # New connection
        result2 = handle_register_ide_connection(
            {"ide_type": "cursor", "agent_workflow_id": "test-agent"},
            store,
        )
        connection_id2 = result2["connection"]["connection_id"]
        
        # Should be different connection IDs
        assert connection_id1 != connection_id2
        
        # Status should show connected
        status = handle_get_ide_connection_status(
            {"agent_workflow_id": "test-agent"},
            store,
        )
        assert status["is_connected"] is True

    def test_claude_code_ide_type(self, store):
        """Test claude-code IDE type works correctly."""
        result = handle_register_ide_connection(
            {
                "ide_type": "claude-code",
                "agent_workflow_id": "test-agent",
                "model": "claude-sonnet-4",
            },
            store,
        )
        
        assert "connection" in result
        assert result["connection"]["ide_type"] == "claude-code"
        assert "claude-code" in result["message"]
