import type { AnalysisSession } from '../types/findings';
import type { DynamicSecurityCheck } from '../types/security';
import type { AgentChecksSummary } from './agentWorkflow';

// Re-export for convenience
export type { AnalysisSession };

export interface AnalysisSessionAgentData {
  agent_id: string;
  agent_name: string;
  checks: DynamicSecurityCheck[];
  summary: AgentChecksSummary;
}

export interface AnalysisSessionTotalSummary {
  critical: number;
  warnings: number;
  passed: number;
  agents_analyzed: number;
  agents_with_findings: number;
}

export interface AnalysisSessionDetailsResponse {
  session: AnalysisSession;
  agents: AnalysisSessionAgentData[];
  total_summary: AnalysisSessionTotalSummary;
}

export const fetchAnalysisSessionDetails = async (
  sessionId: string
): Promise<AnalysisSessionDetailsResponse> => {
  const response = await fetch(`/api/analysis-session/${sessionId}/details`);
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis session details: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
