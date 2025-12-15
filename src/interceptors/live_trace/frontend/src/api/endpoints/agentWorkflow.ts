import type { AgentWorkflowFindingsResponse, AnalysisSessionsResponse } from '../types/findings';

// Re-export for convenience
export type { AnalysisSession, AnalysisSessionsResponse } from '../types/findings';

export interface FetchAgentWorkflowFindingsParams {
  severity?: string;
  status?: string;
  limit?: number;
}

export const fetchAgentWorkflowFindings = async (
  agentWorkflowId: string,
  params?: FetchAgentWorkflowFindingsParams
): Promise<AgentWorkflowFindingsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/agent-workflow/${agentWorkflowId}/findings${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent workflow findings: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchAnalysisSessions = async (
  agentWorkflowId: string
): Promise<AnalysisSessionsResponse> => {
  const response = await fetch(`/api/sessions/analysis?agent_workflow_id=${agentWorkflowId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis sessions: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Security Checks Types
export interface AgentWorkflowSecurityCheck {
  check_id: string;
  agent_id: string;
  agent_workflow_id?: string;
  analysis_session_id: string;
  category_id: string;
  check_type: string;
  status: 'passed' | 'warning' | 'critical';
  title: string;
  description?: string;
  value?: string;
  evidence?: Record<string, unknown>;
  recommendations?: string[];
  created_at: string;
}

export interface AgentChecksSummary {
  total: number;
  passed: number;
  warnings: number;
  critical: number;
}

export interface AgentSecurityData {
  agent_id: string;
  agent_name: string;
  checks: AgentWorkflowSecurityCheck[];
  latest_check_at?: string;
  summary: AgentChecksSummary;
}

export interface AgentWorkflowSecurityChecksSummary {
  total_checks: number;
  passed: number;
  warnings: number;
  critical: number;
  agents_analyzed: number;
}

export interface AgentWorkflowSecurityChecksResponse {
  agent_workflow_id: string;
  agents: AgentSecurityData[];
  total_summary: AgentWorkflowSecurityChecksSummary;
}

export const fetchAgentWorkflowSecurityChecks = async (
  agentWorkflowId: string
): Promise<AgentWorkflowSecurityChecksResponse> => {
  const response = await fetch(`/api/agent-workflow/${agentWorkflowId}/security-checks`);
  if (!response.ok) {
    throw new Error(`Failed to fetch security checks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
