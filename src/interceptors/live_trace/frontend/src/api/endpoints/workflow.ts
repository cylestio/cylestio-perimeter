import type { 
  WorkflowFindingsResponse, 
  AnalysisSessionsResponse,
  RecommendationsResponse,
  GateStatus,
  Recommendation,
  RecommendationStatus,
  FindingSeverity,
  StaticAnalysisSummary,
} from '../types/findings';

// Re-export for convenience
export type { AnalysisSession, AnalysisSessionsResponse } from '../types/findings';

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

// Security Checks Types
export interface WorkflowSecurityCheck {
  check_id: string;
  agent_id: string;
  workflow_id?: string;
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
  checks: WorkflowSecurityCheck[];
  latest_check_at?: string;
  summary: AgentChecksSummary;
}

export interface WorkflowSecurityChecksSummary {
  total_checks: number;
  passed: number;
  warnings: number;
  critical: number;
  agents_analyzed: number;
}

export interface WorkflowSecurityChecksResponse {
  workflow_id: string;
  agents: AgentSecurityData[];
  total_summary: WorkflowSecurityChecksSummary;
}

export const fetchWorkflowSecurityChecks = async (
  workflowId: string
): Promise<WorkflowSecurityChecksResponse> => {
  const response = await fetch(`/api/workflow/${workflowId}/security-checks`);
  if (!response.ok) {
    throw new Error(`Failed to fetch security checks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// ==================== Recommendations API ====================

export interface FetchRecommendationsParams {
  status?: RecommendationStatus;
  severity?: FindingSeverity;
  blocking_only?: boolean;
  limit?: number;
}

export const fetchRecommendations = async (
  workflowId: string,
  params?: FetchRecommendationsParams
): Promise<RecommendationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.blocking_only) queryParams.set('blocking_only', 'true');
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/workflow/${workflowId}/recommendations${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchRecommendationDetail = async (
  recommendationId: string
): Promise<{ recommendation: Recommendation; finding?: Record<string, unknown> }> => {
  const response = await fetch(`/api/recommendations/${recommendationId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendation: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchGateStatus = async (workflowId: string): Promise<GateStatus> => {
  const response = await fetch(`/api/workflow/${workflowId}/gate-status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gate status: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

/**
 * Fetch static analysis summary with categorized checks and gate status.
 * Returns findings grouped into 5 security categories.
 */
export const fetchStaticSummary = async (workflowId: string): Promise<StaticAnalysisSummary> => {
  const response = await fetch(`/api/workflow/${workflowId}/static-summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch static summary: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export interface DismissRecommendationParams {
  reason: string;
  dismiss_type?: 'DISMISSED' | 'IGNORED';
}

export const dismissRecommendation = async (
  recommendationId: string,
  params: DismissRecommendationParams
): Promise<{ recommendation: Recommendation }> => {
  const response = await fetch(`/api/recommendations/${recommendationId}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to dismiss recommendation: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Import AuditLogEntry from types
import type { AuditLogEntry } from '../types/findings';

// Re-export for convenience
export type { AuditLogEntry };

export interface AuditLogResponse {
  audit_log: AuditLogEntry[];
  total_count: number;
}

export const fetchRecommendationAuditLog = async (
  recommendationId: string,
  limit: number = 100
): Promise<AuditLogResponse> => {
  const response = await fetch(
    `/api/recommendations/${recommendationId}/audit-log?limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch audit log: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchWorkflowAuditLog = async (
  workflowId: string,
  limit: number = 100
): Promise<AuditLogResponse> => {
  const response = await fetch(
    `/api/workflow/${workflowId}/audit-log?limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch audit log: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// IDE Connection Status Types
export interface IdeConnection {
  connection_id: string;
  ide_type: string;
  workflow_id?: string;
  host?: string;
  user?: string;
  workspace_path?: string;
  model?: string;
  is_active: boolean;
  is_developing: boolean;
  connected_at: string;
  last_heartbeat: string;
  last_seen_relative?: string;
}

export interface IdeConnectionStatus {
  is_connected: boolean;
  is_developing: boolean;
  connected_ide?: IdeConnection;
  all_connections: IdeConnection[];
}

export const fetchIdeStatus = async (
  workflowId?: string
): Promise<IdeConnectionStatus> => {
  const url = workflowId
    ? `/api/ide/status?workflow_id=${workflowId}`
    : '/api/ide/status';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch IDE status: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
