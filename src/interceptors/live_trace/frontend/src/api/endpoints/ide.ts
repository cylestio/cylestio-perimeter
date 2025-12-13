/**
 * IDE connection API endpoints
 */

import type { IDEConnectionStatus, IDEConnectionsResponse } from '../types/ide';

const API_BASE = '/api';

/**
 * Fetch IDE connection status for an agent
 */
export async function fetchIDEConnectionStatus(agentId?: string): Promise<IDEConnectionStatus> {
  const params = new URLSearchParams();
  if (agentId) {
    params.append('agent_id', agentId);
  }

  const url = `${API_BASE}/ide/status${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch IDE connection status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch IDE connections list
 */
export async function fetchIDEConnections(options?: {
  agentId?: string;
  ideType?: string;
  activeOnly?: boolean;
  limit?: number;
}): Promise<IDEConnectionsResponse> {
  const params = new URLSearchParams();
  
  if (options?.agentId) {
    params.append('agent_id', options.agentId);
  }
  if (options?.ideType) {
    params.append('ide_type', options.ideType);
  }
  if (options?.activeOnly !== undefined) {
    params.append('active_only', String(options.activeOnly));
  }
  if (options?.limit) {
    params.append('limit', String(options.limit));
  }

  const url = `${API_BASE}/ide/connections${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch IDE connections: ${response.statusText}`);
  }

  return response.json();
}
