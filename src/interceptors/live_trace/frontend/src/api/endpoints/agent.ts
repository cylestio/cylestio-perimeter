import type { AgentResponse } from '../types/agent';

export const fetchAgent = async (agentId: string): Promise<AgentResponse> => {
  const response = await fetch(`/api/agent/${agentId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
