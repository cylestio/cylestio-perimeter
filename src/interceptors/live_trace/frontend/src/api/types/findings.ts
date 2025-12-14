// API Types for findings and analysis sessions

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingStatus = 'OPEN' | 'FIXED' | 'IGNORED';
export type SessionType = 'STATIC' | 'DYNAMIC' | 'AUTOFIX';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface FindingEvidence {
  code_snippet?: string;
  context?: string;
}

export interface Finding {
  finding_id: string;
  session_id: string;
  agent_workflow_id: string;
  file_path: string;
  line_start?: number;
  line_end?: number;
  finding_type: string;
  severity: FindingSeverity;
  title: string;
  description?: string;
  evidence: FindingEvidence;
  owasp_mapping: string[];
  status: FindingStatus;
  created_at: string;
  updated_at: string;
}

export interface AnalysisSession {
  session_id: string;
  agent_workflow_id: string;
  agent_workflow_name?: string;
  agent_step_id?: string;
  session_type: SessionType;
  status: SessionStatus;
  created_at: string; // ISO date string
  completed_at?: string | null; // ISO date string
  findings_count: number;
  risk_score?: number | null;
}

export interface FindingsSummary {
  agent_workflow_id: string;
  total_findings: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  open_count: number;
  fixed_count: number;
  ignored_count: number;
  latest_session?: AnalysisSession;
}

// API Response Types
export interface AgentWorkflowFindingsResponse {
  findings: Finding[];
  summary: FindingsSummary;
}

export interface AnalysisSessionsResponse {
  sessions: AnalysisSession[];
  total_count: number;
}

export interface SessionFindingsResponse {
  session: AnalysisSession | null;
  findings: Finding[];
  total_count: number;
}
