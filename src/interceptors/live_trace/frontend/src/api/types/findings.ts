// API Types for findings and analysis sessions

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingStatus = 'OPEN' | 'FIXED' | 'IGNORED';
export type SessionType = 'STATIC' | 'DYNAMIC' | 'AUTOFIX';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

// Correlation states for static + dynamic analysis
export type CorrelationState = 'VALIDATED' | 'UNEXERCISED' | 'RUNTIME_ONLY' | 'THEORETICAL';

// Recommendation lifecycle states
export type RecommendationStatus = 'PENDING' | 'FIXING' | 'FIXED' | 'VERIFIED' | 'REOPENED' | 'DISMISSED' | 'IGNORED';

export interface FindingEvidence {
  code_snippet?: string;
  context?: string;
  data_flow?: string;
}

export interface Finding {
  finding_id: string;
  session_id: string;
  agent_id: string;
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
  
  // Enhanced fields (Phase 1)
  cvss_score?: number;
  cvss_vector?: string;
  cwe_mapping?: string[];
  mitre_atlas?: string;
  soc2_controls?: string[];
  nist_csf?: string;
  correlation_state?: CorrelationState;
  fix_recommendation?: string;
  ai_fixable?: boolean;
  function_name?: string;
  class_name?: string;
  data_flow?: string;
  fingerprint?: string;
}

// Recommendation for fixing security issues
export interface Recommendation {
  recommendation_id: string;  // REC-XXX format
  agent_id: string;
  source_type: 'STATIC' | 'DYNAMIC';
  source_check_id: string;
  source_finding_id?: string;
  
  // Classification
  severity: FindingSeverity;
  cvss_score?: number;
  cvss_vector?: string;
  owasp_llm?: string;
  cwe?: string;
  mitre_atlas?: string;
  soc2_controls?: string[];
  nist_csf?: string;
  
  // Content
  title: string;
  description?: string;
  impact?: string;
  
  // Guidance
  fix_hints?: string;
  fix_complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  requires_architectural_change?: boolean;
  
  // Location
  file_path?: string;
  line_start?: number;
  line_end?: number;
  function_name?: string;
  class_name?: string;
  code_snippet?: string;
  related_files?: string[];
  
  // Status
  status: RecommendationStatus;
  
  // Fix tracking
  fixed_by?: string;
  fixed_at?: string;
  fix_method?: 'AI_ASSISTED' | 'MANUAL';
  fix_commit?: string;
  fix_notes?: string;
  files_modified?: string[];
  
  // Verification
  verified_at?: string;
  verified_by?: string;
  verification_result?: string;
  
  // Dismissal
  dismissed_reason?: string;
  dismissed_by?: string;
  dismissed_at?: string;
  dismiss_type?: 'DISMISSED' | 'IGNORED';
  
  // Correlation
  correlation_state?: CorrelationState;
  correlation_evidence?: string;
  
  // Metadata
  fingerprint?: string;
  created_at: string;
  updated_at: string;
}

// Gate status for Production deployment
export interface GateStatus {
  gate_status: 'BLOCKED' | 'UNBLOCKED';
  blocking_count: number;
  blocking_items: {
    recommendation_id: string;
    title: string;
    severity: FindingSeverity;
  }[];
}

// Static analysis check category
export interface StaticCheckCategory {
  category_id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'INFO';
  owasp_llm?: string;
  cwe?: string;
  soc2_controls?: string[];
  findings_count: number;
  max_severity?: FindingSeverity;
  findings: Finding[];
}

// Static analysis summary response
export interface StaticAnalysisSummary {
  agent_id: string;
  last_scan?: {
    timestamp: string;
    scanned_by?: string;
    files_analyzed?: number;
    duration_ms?: number;
    session_id?: string;
  } | null;
  checks: StaticCheckCategory[];
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    info: number;
    gate_status: 'BLOCKED' | 'UNBLOCKED';
    total_findings?: number;
    uncategorized_findings?: number;
  };
}

export interface AnalysisSession {
  session_id: string;
  agent_id: string;
  agent_name?: string;
  system_prompt_id?: string;
  session_type: SessionType;
  status: SessionStatus;
  created_at: string; // ISO date string
  completed_at?: string | null; // ISO date string
  findings_count: number;
  risk_score?: number | null;
}

export interface FindingsSummary {
  agent_id: string;
  total_findings: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  open_count: number;
  fixed_count: number;
  ignored_count: number;
  latest_session?: AnalysisSession;
}

// API Response Types
export interface AgentFindingsResponse {
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

// Recommendations response
export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total_count: number;
  summary: {
    by_status: Record<RecommendationStatus, number>;
    by_severity: Record<FindingSeverity, number>;
  };
}

// Audit log entry
export interface AuditLogEntry {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  reason?: string;
  performed_by?: string;
  performed_at: string;
  metadata?: Record<string, unknown>;
}

// Framework badge display info
export interface FrameworkMapping {
  owasp_llm?: string;
  owasp_llm_name?: string;
  cwe?: string;
  cwe_name?: string;
  mitre_atlas?: string;
  soc2_controls?: string[];
  nist_csf?: string;
  cvss_score?: number;
  cvss_vector?: string;
}

// Static check categories (5 categories from spec)
export const STATIC_CHECK_CATEGORIES = {
  PROMPT_SECURITY: {
    id: 'PROMPT_SECURITY',
    name: 'Prompt Security',
    owasp_llm: 'LLM01',
    finding_types: ['PROMPT_INJECT_DIRECT', 'PROMPT_INJECT_INDIRECT', 'PROMPT_SYSTEM_LEAK', 'PROMPT_JAILBREAK', 'PROMPT_TEMPLATE'],
  },
  TOOL_SECURITY: {
    id: 'TOOL_SECURITY',
    name: 'Tool & Function Security',
    owasp_llm: 'LLM08',
    finding_types: ['TOOL_DANGEROUS_UNRESTRICTED', 'TOOL_INPUT_UNVALIDATED', 'TOOL_NO_TIMEOUT', 'TOOL_NO_RATE_LIMIT', 'TOOL_PRIV_ESCALATION', 'TOOL_NO_CONFIRM'],
  },
  DATA_SECURITY: {
    id: 'DATA_SECURITY',
    name: 'Data & Secrets',
    owasp_llm: 'LLM06',
    finding_types: ['SECRET_API_KEY', 'SECRET_PASSWORD', 'SECRET_TOKEN', 'DATA_PII_CODE', 'DATA_PII_LOGS', 'DATA_UNSAFE_SERIAL', 'DATA_CONTEXT_LEAK'],
  },
  SUPPLY_CHAIN: {
    id: 'SUPPLY_CHAIN',
    name: 'Model & Supply Chain',
    owasp_llm: 'LLM05',
    finding_types: ['MODEL_UNPINNED', 'SUPPLY_CVE', 'API_INSECURE', 'API_NO_AUTH', 'API_SSRF'],
  },
  BOUNDARIES: {
    id: 'BOUNDARIES',
    name: 'Behavioral Boundaries',
    owasp_llm: 'LLM08/LLM09',
    finding_types: ['BOUNDARY_NO_GUARDRAILS', 'BOUNDARY_INFINITE_LOOP', 'BOUNDARY_NO_HUMAN_GATE', 'BOUNDARY_NO_FALLBACK', 'BOUNDARY_AUTO_UNRESTRICTED'],
  },
} as const;

// Helper to get category for a finding type
export function getCategoryForFindingType(findingType: string): keyof typeof STATIC_CHECK_CATEGORIES | null {
  for (const [categoryId, category] of Object.entries(STATIC_CHECK_CATEGORIES)) {
    if (category.finding_types.some(t => findingType.startsWith(t.split('_')[0]))) {
      return categoryId as keyof typeof STATIC_CHECK_CATEGORIES;
    }
  }
  return null;
}

// CVSS severity color mapping
export function getCvssSeverityColor(score: number | undefined): string {
  if (score === undefined) return 'gray';
  if (score >= 9.0) return 'red';      // Critical
  if (score >= 7.0) return 'orange';   // High
  if (score >= 4.0) return 'yellow';   // Medium
  if (score >= 0.1) return 'blue';     // Low
  return 'gray';                        // Info
}

// Correlation badge info
export function getCorrelationBadgeInfo(state: CorrelationState | undefined): { label: string; color: string; icon: string } {
  switch (state) {
    case 'VALIDATED':
      return { label: 'Validated', color: 'red', icon: '🔴' };
    case 'UNEXERCISED':
      return { label: 'Unexercised', color: 'gray', icon: '📋' };
    case 'RUNTIME_ONLY':
      return { label: 'Runtime Only', color: 'blue', icon: '🔵' };
    case 'THEORETICAL':
      return { label: 'Theoretical', color: 'light', icon: '📚' };
    default:
      return { label: 'Unknown', color: 'gray', icon: '❓' };
  }
}
