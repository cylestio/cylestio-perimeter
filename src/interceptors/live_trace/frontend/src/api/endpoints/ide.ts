/**
 * IDE activity API endpoints
 *
 * Activity is tracked automatically when any MCP tool with agent_workflow_id is called.
 */

import type { IDEConnectionStatus } from '../types/ide';

const API_BASE = '/api';

/**
 * Fetch IDE activity status for an agent workflow
 *
 * @param agentWorkflowId - The workflow ID (required)
 * @returns Status with has_activity, last_seen, and optional IDE metadata
 */
export async function fetchIDEConnectionStatus(
  agentWorkflowId: string
): Promise<IDEConnectionStatus> {
  const url = `${API_BASE}/ide/status?agent_workflow_id=${encodeURIComponent(agentWorkflowId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch IDE status: ${response.statusText}`);
  }

  return response.json();
}
