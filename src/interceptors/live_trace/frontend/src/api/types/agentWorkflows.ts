export interface APIAgentWorkflow {
  id: string | null; // null = "Unassigned"
  name: string;
  agent_count: number;
  session_count?: number;
  // Finding counts
  findings_total: number;
  findings_open: number;
  // Recommendation counts
  recommendations_total: number;
  recommendations_pending: number;
  // Last activity timestamp (ISO format)
  last_activity: string | null;
  // Gate status
  gate_status: 'OPEN' | 'BLOCKED';
  is_blocked: boolean;
}

export interface AgentWorkflowsResponse {
  agent_workflows: APIAgentWorkflow[];
}
