import type { AgentStepResponse } from '../types/agentStep';

export const fetchAgentStep = async (agentStepId: string): Promise<AgentStepResponse> => {
  const response = await fetch(`/api/agent-step/${agentStepId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent step: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
