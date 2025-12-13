"""Tests for InsightsEngine agent workflow filtering."""
import pytest

from ...store import TraceStore
from ...store.store import AgentData
from ..engine import InsightsEngine


class TestInsightsAgentWorkflowFiltering:
    """Tests for agent workflow filtering in insights engine."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    @pytest.fixture
    def insights(self, store):
        """Create an InsightsEngine instance."""
        return InsightsEngine(store, {})

    def _create_agent(self, store, agent_id: str, agent_workflow_id: str = None):
        """Helper to create an agent directly in the database."""
        agent = AgentData(agent_id, agent_workflow_id)
        store._save_agent(agent)

    @pytest.mark.asyncio
    async def test_get_dashboard_data_filters_by_agent_workflow(self, insights, store):
        """Test dashboard data filtered by agent_workflow_id."""
        # Create agents with different agent workflows
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", "agent-workflow-a")
        self._create_agent(store, "agent3", "agent-workflow-b")

        # Get data filtered by agent-workflow-a
        data = await insights.get_dashboard_data(agent_workflow_id="agent-workflow-a")

        assert len(data["agents"]) == 2
        assert data["agent_workflow_id"] == "agent-workflow-a"

    @pytest.mark.asyncio
    async def test_get_dashboard_data_unassigned_filter(self, insights, store):
        """Test dashboard data filtered to unassigned agent workflows."""
        # Create agents with and without agent workflow
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", None)  # Unassigned
        self._create_agent(store, "agent3", None)  # Unassigned

        # Get data filtered by unassigned
        data = await insights.get_dashboard_data(agent_workflow_id="unassigned")

        assert len(data["agents"]) == 2
        assert data["agent_workflow_id"] == "unassigned"

    @pytest.mark.asyncio
    async def test_get_dashboard_data_no_filter(self, insights, store):
        """Test dashboard data with no agent workflow filter returns all."""
        # Create agents with different agent workflows
        self._create_agent(store, "agent1", "agent-workflow-a")
        self._create_agent(store, "agent2", "agent-workflow-b")
        self._create_agent(store, "agent3", None)

        # Get all data (no filter)
        data = await insights.get_dashboard_data()

        assert len(data["agents"]) == 3
        assert data["agent_workflow_id"] is None
