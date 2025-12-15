import type { 
  AgentWorkflowFindingsResponse, 
  AnalysisSessionsResponse,
  StaticSummaryResponse,
  GateStatusResponse,
  Recommendation,
  SecurityCheck,
  SECURITY_CHECK_CATEGORIES,
} from '../types/findings';

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

// Static Analysis Summary - Returns 7 security check categories
export const fetchStaticSummary = async (
  workflowId: string
): Promise<StaticSummaryResponse> => {
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

// Gate Status
export const fetchGateStatus = async (
  workflowId: string
): Promise<GateStatusResponse> => {
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

// Recommendations
export interface FetchRecommendationsParams {
  status?: string;
  severity?: string;
  category?: string;
  blocking_only?: boolean;
  limit?: number;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total_count: number;
  workflow_id: string;
}

export const fetchRecommendations = async (
  workflowId: string,
  params?: FetchRecommendationsParams
): Promise<RecommendationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.category) queryParams.set('category', params.category);
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

// Recommendation Detail with Finding and Audit Log
export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by?: string;
  performed_at: string;
  details?: {
    reason?: string;
    notes?: string;
    files_modified?: string[];
    old_status?: string;
    new_status?: string;
    fix_method?: string;
    verification_result?: string;
  };
}

export interface RecommendationDetailResponse {
  recommendation: Recommendation;
  finding: {
    finding_id: string;
    title: string;
    description?: string;
    severity: string;
    file_path?: string;
    line_start?: number;
    code_snippet?: string;
  } | null;
  audit_log: AuditLogEntry[];
}

export const fetchRecommendationDetail = async (
  recommendationId: string
): Promise<RecommendationDetailResponse> => {
  const response = await fetch(`/api/recommendations/${recommendationId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendation detail: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Start Fix - Mark recommendation as FIXING
export const startFix = async (
  recommendationId: string,
  fixedBy?: string
): Promise<{ recommendation: Recommendation; message: string }> => {
  const response = await fetch(`/api/recommendations/${recommendationId}/start-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixed_by: fixedBy }),
  });
  if (!response.ok) {
    throw new Error(`Failed to start fix: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Complete Fix - Mark recommendation as FIXED
export interface CompleteFixParams {
  fix_notes?: string;
  files_modified?: string[];
  fix_commit?: string;
  fix_method?: string;
  fixed_by?: string;
}

export const completeFix = async (
  recommendationId: string,
  params?: CompleteFixParams
): Promise<{ recommendation: Recommendation; message: string }> => {
  const response = await fetch(`/api/recommendations/${recommendationId}/complete-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  if (!response.ok) {
    throw new Error(`Failed to complete fix: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Dismiss Recommendation - Accept risk or mark as false positive
export interface DismissRecommendationParams {
  reason: string;
  dismiss_type: 'DISMISSED' | 'IGNORED';
  dismissed_by?: string;
}

export const dismissRecommendation = async (
  recommendationId: string,
  params: DismissRecommendationParams
): Promise<{ recommendation: Recommendation; message: string }> => {
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

// Phase 5: Correlation Summary
export interface CorrelationSummaryResponse {
  agent_workflow_id: string;
  validated: number;
  unexercised: number;
  runtime_only: number;
  theoretical: number;
  uncorrelated: number;
  sessions_count: number;
  is_correlated: boolean;
  message?: string;
}

export const fetchCorrelationSummary = async (
  workflowId: string
): Promise<CorrelationSummaryResponse> => {
  const response = await fetch(`/api/workflow/${workflowId}/correlation-summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch correlation summary: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// Dynamic Summary (for correlation hint card)
export interface DynamicSummaryResponse {
  workflow_id: string;
  agents_count: number;
  total_sessions: number;
  total_messages: number;
  total_tokens: number;
  total_tool_calls: number;
  total_errors: number;
  tools_used: string[];
  tools_available: string[];
  tool_coverage: number;
}

export const fetchDynamicSummary = async (
  workflowId: string
): Promise<DynamicSummaryResponse> => {
  const response = await fetch(`/api/workflow/${workflowId}/dynamic-summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dynamic summary: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
