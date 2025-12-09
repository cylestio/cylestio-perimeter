import type { WorkflowFindingsResponse, AnalysisSessionsResponse } from '../types/findings';

// Re-export for convenience
export type { AnalysisSession, AnalysisSessionsResponse } from '../types/findings';

// Workflow state types
export interface WorkflowState {
  workflow_id: string;
  state: 'NO_DATA' | 'STATIC_ONLY' | 'DYNAMIC_ONLY' | 'COMPLETE';
  has_static_analysis: boolean;
  has_dynamic_sessions: boolean;
  static_sessions_count: number;
  dynamic_agents_count: number;
  findings_count: number;
  open_findings_count: number;
  recommendation: string | null;
}

export interface ToolUsageSummary {
  workflow_id: string;
  total_sessions: number;
  tool_usage: Record<string, { count: number }>;
  tools_defined: number;
  tools_used: number;
  tools_unused: string[];
  coverage_percent: number;
}

export interface WorkflowCorrelation {
  workflow_id: string;
  static_findings_count: number;
  dynamic_sessions_count: number;
  dynamic_tools_used: string[];
  correlations: Array<{
    finding_id: string;
    title: string;
    severity: string;
    status: string;
    dynamically_tested: boolean;
  }>;
  recommendations: string[];
}

export interface FetchWorkflowFindingsParams {
  severity?: string;
  status?: string;
  limit?: number;
}

export const fetchWorkflowFindings = async (
  workflowId: string,
  params?: FetchWorkflowFindingsParams
): Promise<WorkflowFindingsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/workflow/${workflowId}/findings${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch workflow findings: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchAnalysisSessions = async (
  workflowId: string
): Promise<AnalysisSessionsResponse> => {
  const response = await fetch(`/api/sessions/analysis?workflow_id=${workflowId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis sessions: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchWorkflowState = async (
  workflowId: string
): Promise<WorkflowState> => {
  const response = await fetch(`/api/workflow/${workflowId}/state`);
  if (!response.ok) {
    throw new Error(`Failed to fetch workflow state: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchToolUsageSummary = async (
  workflowId: string
): Promise<ToolUsageSummary> => {
  const response = await fetch(`/api/workflow/${workflowId}/tool-usage`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tool usage: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchWorkflowCorrelation = async (
  workflowId: string
): Promise<WorkflowCorrelation> => {
  const response = await fetch(`/api/workflow/${workflowId}/correlation`);
  if (!response.ok) {
    throw new Error(`Failed to fetch correlation: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
