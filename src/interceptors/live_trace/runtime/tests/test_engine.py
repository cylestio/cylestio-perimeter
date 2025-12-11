"""Tests for InsightsEngine workflow filtering."""
import pytest

from ...store import TraceStore
from ...store.store import AgentData
from ..engine import InsightsEngine


class TestInsightsWorkflowFiltering:
    """Tests for workflow filtering in insights engine."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    @pytest.fixture
    def insights(self, store):
        """Create an InsightsEngine instance."""
        return InsightsEngine(store, {})

    def _create_agent(self, store, agent_id: str, workflow_id: str = None):
        """Helper to create an agent directly in the database."""
        agent = AgentData(agent_id, workflow_id)
        store._save_agent(agent)

    @pytest.mark.asyncio
    async def test_get_dashboard_data_filters_by_workflow(self, insights, store):
        """Test dashboard data filtered by workflow_id."""
        # Create agents with different workflows
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", "workflow-a")
        self._create_agent(store, "agent3", "workflow-b")

        # Get data filtered by workflow-a
        data = await insights.get_dashboard_data(workflow_id="workflow-a")

        assert len(data["agents"]) == 2
        assert data["workflow_id"] == "workflow-a"

    @pytest.mark.asyncio
    async def test_get_dashboard_data_unassigned_filter(self, insights, store):
        """Test dashboard data filtered to unassigned workflows."""
        # Create agents with and without workflow
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", None)  # Unassigned
        self._create_agent(store, "agent3", None)  # Unassigned

        # Get data filtered by unassigned
        data = await insights.get_dashboard_data(workflow_id="unassigned")

        assert len(data["agents"]) == 2
        assert data["workflow_id"] == "unassigned"

    @pytest.mark.asyncio
    async def test_get_dashboard_data_no_filter(self, insights, store):
        """Test dashboard data with no workflow filter returns all."""
        # Create agents with different workflows
        self._create_agent(store, "agent1", "workflow-a")
        self._create_agent(store, "agent2", "workflow-b")
        self._create_agent(store, "agent3", None)

        # Get all data (no filter)
        data = await insights.get_dashboard_data()

        assert len(data["agents"]) == 3
        assert data["workflow_id"] is None
