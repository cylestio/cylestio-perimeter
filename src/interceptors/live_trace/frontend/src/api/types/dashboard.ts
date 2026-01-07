// API Types for /api/dashboard endpoint

export interface AnalysisSummary {
  failed_checks: number;
  warnings: number;
  behavioral: {
    stability: number;
    predictability: number;
    confidence: string;
  };
  action_required: boolean;
  completed_sessions: number;
  active_sessions: number;
  total_sessions: number;
}

export interface APIAgent {
  id: string;
  id_short: string;
  agent_workflow_id: string | null;
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_messages: number;
  total_tokens: number;
  total_tools: number;
  unique_tools: number;
  total_errors: number;
  avg_response_time_ms: number;
  last_seen: string;
  last_seen_relative: string;
  risk_status: 'evaluating' | 'ok';
  current_sessions: number;
  min_sessions_required: number;
  analysis_summary?: AnalysisSummary;
}

export interface APISession {
  id: string;
  id_short: string;
  agent_id: string;
  agent_id_short: string;
  created_at: string;
  last_activity: string;
  last_activity_relative: string;
  duration_minutes: number;
  is_active: boolean;
  is_completed: boolean;
  status: string;
  message_count: number;
  tool_uses: number;
  errors: number;
  total_tokens: number;
  error_rate: number;
}

export interface LatestSession {
  id: string;
  agent_id: string;
  message_count: number;
  duration_minutes: number;
  is_active: boolean;
  last_activity: string;
}

// Findings summary embedded in analysis stage (subset of full FindingsSummary)
export interface StageFindingsSummary {
  total: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
}

export type AnalysisStageStatus = 'pending' | 'running' | 'completed';

// Sessions progress for dynamic analysis
export interface SessionsProgress {
  current: number;
  required: number;
  agents_ready: number;
  agents_total: number;
}

// Analysis stage with embedded findings
export interface AnalysisStage {
  status: AnalysisStageStatus;
  findings: StageFindingsSummary | null;
  sessions_progress?: SessionsProgress | null;
}

// Unified security analysis object
export interface SecurityAnalysis {
  static: AnalysisStage;
  dynamic: AnalysisStage;
  recommendations: AnalysisStage;
}

export interface DashboardResponse {
  agents: APIAgent[];
  sessions_count: number;
  latest_session: LatestSession;
  last_updated: string;
  refresh_interval: number;
  security_analysis?: SecurityAnalysis;
}

// Production Readiness - Single source of truth for security status
export type ProductionReadinessStatus = 'pending' | 'running' | 'completed';

export interface AnalysisStatus {
  status: ProductionReadinessStatus;
  critical_count: number;
  session_id: string | null;
}

export interface GateInfo {
  is_blocked: boolean;
  blocking_count: number;
  state: 'BLOCKED' | 'OPEN';
}

export interface ProductionReadinessResponse {
  workflow_id: string;
  static_analysis: AnalysisStatus;
  dynamic_analysis: AnalysisStatus;
  gate: GateInfo;
}
