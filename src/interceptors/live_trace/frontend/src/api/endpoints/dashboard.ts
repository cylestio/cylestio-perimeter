import type { DashboardResponse } from '../types/dashboard';
import type { AgentsResponse } from '../types/agents';

export const fetchDashboard = async (agentId?: string | null): Promise<DashboardResponse> => {
  // Uses relative URL - in dev, Vite proxy forwards to backend
  // In production, configure your server to handle /api routes
  let url = '/api/dashboard';
  if (agentId !== undefined && agentId !== null) {
    // Use "unassigned" for null agent_id (system prompts without agent)
    url += `?agent_id=${encodeURIComponent(agentId)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  return response.json();
};

export const fetchAgents = async (): Promise<AgentsResponse> => {
  const response = await fetch('/api/agents');
  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }
  const data = await response.json();
  return { agents: data.agents || [] };
};
