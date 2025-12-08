import type { DashboardResponse } from '../types/dashboard';
import type { WorkflowsResponse } from '../types/workflows';

export const fetchDashboard = async (workflowId?: string | null): Promise<DashboardResponse> => {
  // Uses relative URL - in dev, Vite proxy forwards to backend
  // In production, configure your server to handle /api routes
  let url = '/api/dashboard';
  if (workflowId !== undefined && workflowId !== null) {
    // Use "unassigned" for null workflow_id (agents without workflow)
    url += `?workflow_id=${encodeURIComponent(workflowId)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  return response.json();
};

export const fetchWorkflows = async (): Promise<WorkflowsResponse> => {
  const response = await fetch('/api/workflows');
  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.statusText}`);
  }
  return response.json();
};
