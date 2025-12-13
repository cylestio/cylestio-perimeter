export interface APIAgentWorkflow {
  id: string | null; // null = "Unassigned"
  name: string;
  agent_count: number;
  session_count?: number;
}

export interface AgentWorkflowsResponse {
  agent_workflows: APIAgentWorkflow[];
}
