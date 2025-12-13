"""Tests for InsightsEngine agent filtering."""
import pytest

from ...store import TraceStore
from ...store.store import AgentData
from ..engine import InsightsEngine


class TestInsightsAgentFiltering:
    """Tests for agent filtering in insights engine."""

    @pytest.fixture
    def store(self):
        """Create an in-memory store for testing."""
        return TraceStore(storage_mode="memory")

    @pytest.fixture
    def insights(self, store):
        """Create an InsightsEngine instance."""
        return InsightsEngine(store, {})

    def _create_system_prompt(self, store, system_prompt_id: str, agent_id: str = None):
        """Helper to create a system prompt directly in the database."""
        agent = AgentData(system_prompt_id, agent_id)
        store._save_agent(agent)

    @pytest.mark.asyncio
    async def test_get_dashboard_data_filters_by_agent(self, insights, store):
        """Test dashboard data filtered by agent_id."""
        # Create system prompts with different agents
        self._create_system_prompt(store, "sp1", "agent-a")
        self._create_system_prompt(store, "sp2", "agent-a")
        self._create_system_prompt(store, "sp3", "agent-b")

        # Get data filtered by agent-a
        data = await insights.get_dashboard_data(agent_id="agent-a")

        assert len(data["agents"]) == 2
        assert data["agent_id"] == "agent-a"

    @pytest.mark.asyncio
    async def test_get_dashboard_data_unassigned_filter(self, insights, store):
        """Test dashboard data filtered to unassigned agent."""
        # Create system prompts with and without agent
        self._create_system_prompt(store, "sp1", "agent-a")
        self._create_system_prompt(store, "sp2", None)  # Unassigned
        self._create_system_prompt(store, "sp3", None)  # Unassigned

        # Get data filtered by unassigned
        data = await insights.get_dashboard_data(agent_id="unassigned")

        assert len(data["agents"]) == 2
        assert data["agent_id"] == "unassigned"

    @pytest.mark.asyncio
    async def test_get_dashboard_data_no_filter(self, insights, store):
        """Test dashboard data with no agent filter returns all."""
        # Create system prompts with different agents
        self._create_system_prompt(store, "sp1", "agent-a")
        self._create_system_prompt(store, "sp2", "agent-b")
        self._create_system_prompt(store, "sp3", None)

        # Get all data (no filter)
        data = await insights.get_dashboard_data()

        assert len(data["agents"]) == 3
        assert data["agent_id"] is None
