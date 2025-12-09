export interface APIWorkflow {
  id: string | null; // null = "Unassigned"
  name: string;
  agent_count: number;
  session_count?: number;
}

export interface WorkflowsResponse {
  workflows: APIWorkflow[];
}
