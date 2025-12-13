import type { 
  AgentFindingsResponse, 
  AnalysisSessionsResponse,
  RecommendationsResponse,
  GateStatus,
  Recommendation,
  RecommendationStatus,
  FindingSeverity,
  StaticAnalysisSummary,
} from '../types/findings';
import type { AgentResponse } from '../types/agent';

// Re-export for convenience
export type { AnalysisSession, AnalysisSessionsResponse } from '../types/findings';

/**
 * Fetch system prompt details by ID
 */
export const fetchSystemPrompt = async (systemPromptId: string): Promise<AgentResponse> => {
  const response = await fetch(`/api/system-prompt/${systemPromptId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch system prompt: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export interface FetchAgentFindingsParams {
  severity?: string;
  status?: string;
  limit?: number;
}

export const fetchAgentFindings = async (
  agentId: string,
  params?: FetchAgentFindingsParams
): Promise<AgentFindingsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/agent/${agentId}/findings${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent findings: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const fetchAnalysisSessions = async (
  agentId: string
): Promise<AnalysisSessionsResponse> => {
  const response = await fetch(`/api/sessions/analysis?agent_id=${agentId}`);
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
export interface AgentSecurityCheck {
  check_id: string;
  system_prompt_id: string;
  agent_id?: string;
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

export interface SystemPromptChecksSummary {
  total: number;
  passed: number;
  warnings: number;
  critical: number;
}

export interface SystemPromptSecurityData {
  system_prompt_id: string;
  system_prompt_name: string;
  checks: AgentSecurityCheck[];
  latest_check_at?: string;
  summary: SystemPromptChecksSummary;
}

export interface AgentSecurityChecksSummary {
  total_checks: number;
  passed: number;
  warnings: number;
  critical: number;
  system_prompts_analyzed: number;
}

export interface AgentSecurityChecksResponse {
  agent_id: string;
  system_prompts: SystemPromptSecurityData[];
  total_summary: AgentSecurityChecksSummary;
}

export const fetchAgentSecurityChecks = async (
  agentId: string
): Promise<AgentSecurityChecksResponse> => {
  const response = await fetch(`/api/agent/${agentId}/security-checks`);
  if (!response.ok) {
    throw new Error(`Failed to fetch security checks: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return {
    agent_id: data.agent_id,
    system_prompts: data.system_prompts || [],
    total_summary: data.total_summary,
  };
};

// ==================== Recommendations API ====================

export interface FetchRecommendationsParams {
  status?: RecommendationStatus;
  severity?: FindingSeverity;
  blocking_only?: boolean;
  limit?: number;
}

export const fetchRecommendations = async (
  agentId: string,
  params?: FetchRecommendationsParams
): Promise<RecommendationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.blocking_only) queryParams.set('blocking_only', 'true');
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/agent/${agentId}/recommendations${queryString ? '?' + queryString : ''}`;

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

export const fetchGateStatus = async (agentId: string): Promise<GateStatus> => {
  const response = await fetch(`/api/agent/${agentId}/gate-status`);
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
export const fetchStaticSummary = async (agentId: string): Promise<StaticAnalysisSummary> => {
  const response = await fetch(`/api/agent/${agentId}/static-summary`);
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

export const fetchAgentAuditLog = async (
  agentId: string,
  limit: number = 100
): Promise<AuditLogResponse> => {
  const response = await fetch(
    `/api/agent/${agentId}/audit-log?limit=${limit}`
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
  agent_id?: string;
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
  agentId?: string
): Promise<IdeConnectionStatus> => {
  const url = agentId
    ? `/api/ide/status?agent_id=${agentId}`
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

// ==================== Behavioral Analysis API ====================

export interface BehavioralAnalysisData {
  system_prompt_id?: string;
  stability_score: number;
  predictability_score: number;
  num_outliers: number;
  total_sessions: number;
  interpretation?: string;
  outlier_sessions?: string[];
}

export interface AgentBehavioralAnalysisResponse {
  agent_id: string;
  has_data: boolean;
  system_prompts_analyzed: number;
  aggregate: {
    stability_score: number;
    predictability_score: number;
    total_outliers: number;
    total_sessions: number;
  };
  by_system_prompt: BehavioralAnalysisData[];
}

export const fetchAgentBehavioralAnalysis = async (
  agentId: string
): Promise<AgentBehavioralAnalysisResponse> => {
  const response = await fetch(`/api/agent/${agentId}/behavioral-analysis`);
  if (!response.ok) {
    throw new Error(`Failed to fetch behavioral analysis: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

// ==================== Phase 4.5: Dynamic Analysis Status & Trigger ====================

export interface SystemPromptAnalysisStatus {
  system_prompt_id: string;
  display_name?: string;
  unanalyzed_sessions: number;
  last_analyzed_at?: string;
  last_sessions_analyzed: number;
}

export interface DynamicAnalysisStatus {
  agent_id: string;
  is_running: boolean;
  can_trigger: boolean;
  total_unanalyzed_sessions: number;
  total_active_sessions: number;  // Sessions still in progress (not yet completed)
  system_prompts: SystemPromptAnalysisStatus[];
  system_prompts_total: number;
  system_prompts_with_new_sessions: number;
  last_analysis?: {
    session_id: string;
    completed_at: string;
    sessions_analyzed: number;
    issues_found: number;
  };
  ui_status: 'never_analyzed' | 'running' | 'has_new_sessions' | 'up_to_date' | 'sessions_in_progress';
}

export interface TriggerAnalysisResponse {
  status: 'triggered' | 'already_running' | 'no_new_sessions' | 'error';
  message: string;
  agent_id: string;
  sessions_to_analyze?: number;
  system_prompts_triggered?: number;
  note?: string;
}

/**
 * Fetch dynamic analysis status for an agent.
 * Phase 4.5: Returns unanalyzed session counts and analysis history.
 */
export const fetchDynamicAnalysisStatus = async (
  agentId: string
): Promise<DynamicAnalysisStatus> => {
  const response = await fetch(`/api/agent/${agentId}/dynamic-analysis-status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dynamic analysis status: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

/**
 * Trigger dynamic analysis for an agent.
 * Phase 4.5: On-demand analysis of unanalyzed sessions only (incremental).
 */
export const triggerDynamicAnalysis = async (
  agentId: string
): Promise<TriggerAnalysisResponse> => {
  const response = await fetch(`/api/agent/${agentId}/trigger-dynamic-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger dynamic analysis: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
