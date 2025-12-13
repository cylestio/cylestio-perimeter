// Agent represents a top-level project grouping that contains System Prompts
export interface APIAgent {
  id: string | null; // null = "Unassigned"
  name: string;
  system_prompt_count?: number;
  session_count?: number;
}

export interface AgentsResponse {
  agents: APIAgent[];
}
