import type { DashboardResponse, ProductionReadinessResponse } from '../types/dashboard';
import type { AgentWorkflowsResponse } from '../types/agentWorkflows';

export const fetchDashboard = async (agentWorkflowId?: string | null): Promise<DashboardResponse> => {
  // Uses relative URL - in dev, Vite proxy forwards to backend
  // In production, configure your server to handle /api routes
  let url = '/api/dashboard';
  if (agentWorkflowId !== undefined && agentWorkflowId !== null) {
    // Use "unassigned" for null agent_workflow_id (agents without agent workflow)
    url += `?agent_workflow_id=${encodeURIComponent(agentWorkflowId)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  return response.json();
};

export const fetchAgentWorkflows = async (): Promise<AgentWorkflowsResponse> => {
  const response = await fetch('/api/agent-workflows');
  if (!response.ok) {
    throw new Error(`Failed to fetch agent workflows: ${response.statusText}`);
  }
  return response.json();
};

export const fetchProductionReadiness = async (workflowId: string): Promise<ProductionReadinessResponse> => {
  const response = await fetch(`/api/workflow/${encodeURIComponent(workflowId)}/production-readiness`);
  if (!response.ok) {
    throw new Error(`Failed to fetch production readiness: ${response.statusText}`);
  }
  return response.json();
};
