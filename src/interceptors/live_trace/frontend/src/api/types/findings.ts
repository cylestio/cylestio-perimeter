// API Types for findings and analysis sessions

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingStatus = 'OPEN' | 'FIXED' | 'IGNORED' | 'ADDRESSED' | 'DISMISSED' | 'RESOLVED';
export type SessionType = 'STATIC' | 'DYNAMIC' | 'AUTOFIX';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';
export type CheckStatus = 'PASS' | 'FAIL' | 'INFO';
export type GateStatus = 'BLOCKED' | 'OPEN';

// The 7 Security Check Categories
export type SecurityCheckCategory =
  | 'PROMPT'    // Prompt Security (LLM01)
  | 'OUTPUT'    // Output Security (LLM02)
  | 'TOOL'      // Tool Security (LLM07, LLM08)
  | 'DATA'      // Data & Secrets (LLM06)
  | 'MEMORY'    // Memory & Context
  | 'SUPPLY'    // Supply Chain (LLM05)
  | 'BEHAVIOR'; // Behavioral Boundaries (LLM08, LLM09)

export interface SecurityCheckCategoryInfo {
  category_id: SecurityCheckCategory;
  name: string;
  description: string;
  owasp_llm: string[];
  examples: string[];
}

// The 7 security check categories configuration
export const SECURITY_CHECK_CATEGORIES: SecurityCheckCategoryInfo[] = [
  {
    category_id: 'PROMPT',
    name: 'Prompt Security',
    description: 'Prompt injection, jailbreak, unsafe prompt construction',
    owasp_llm: ['LLM01'],
    examples: ['User input in system prompt', 'Missing sanitization', 'Jailbreak vectors', 'Prompt leakage'],
  },
  {
    category_id: 'OUTPUT',
    name: 'Output Security',
    description: 'Insecure output handling, downstream injection',
    owasp_llm: ['LLM02'],
    examples: ['Agent output used in SQL/commands', 'XSS via agent response', 'Unescaped output rendering'],
  },
  {
    category_id: 'TOOL',
    name: 'Tool Security',
    description: 'Dangerous tools, missing permissions, plugin design',
    owasp_llm: ['LLM07', 'LLM08'],
    examples: ['Shell exec without constraints', 'File access', 'DB queries', 'Insecure plugin interfaces'],
  },
  {
    category_id: 'DATA',
    name: 'Data & Secrets',
    description: 'Secrets, PII, sensitive data exposure',
    owasp_llm: ['LLM06'],
    examples: ['Hardcoded API keys', 'PII in prompts', 'Logging sensitive data', 'Credential exposure'],
  },
  {
    category_id: 'MEMORY',
    name: 'Memory & Context',
    description: 'RAG security, context injection, conversation history',
    owasp_llm: [],
    examples: ['Poisoned embeddings', 'Context window manipulation', 'Insecure conversation storage'],
  },
  {
    category_id: 'SUPPLY',
    name: 'Supply Chain',
    description: 'Dependencies, model sources, external resources',
    owasp_llm: ['LLM05'],
    examples: ['Unpinned models', 'Unsafe dependencies', 'External prompt sources'],
  },
  {
    category_id: 'BEHAVIOR',
    name: 'Behavioral Boundaries',
    description: 'Unbounded operations, excessive agency, oversight',
    owasp_llm: ['LLM08', 'LLM09'],
    examples: ['Infinite loops', 'No token limits', 'Unrestricted tool calls', 'Missing approval gates'],
  },
];

export interface FindingEvidence {
  code_snippet?: string;
  context?: string;
}

// Correlation states for Phase 5
export type CorrelationState = 'VALIDATED' | 'UNEXERCISED' | 'RUNTIME_ONLY' | 'THEORETICAL';

export interface CorrelationEvidence {
  tool_calls?: number;
  session_count?: number;
  runtime_observations?: string;
  [key: string]: string | number | undefined;
}

export interface Finding {
  finding_id: string;
  session_id: string;
  agent_workflow_id: string;
  source_type?: 'STATIC' | 'DYNAMIC';
  category?: SecurityCheckCategory;
  file_path: string;
  line_start?: number;
  line_end?: number;
  finding_type: string;
  severity: FindingSeverity;
  cvss_score?: number;
  title: string;
  description?: string;
  evidence: FindingEvidence;
  owasp_mapping: string[];
  cwe?: string;
  soc2_controls?: string[];
  recommendation_id?: string;
  status: FindingStatus;
  // Phase 5: Correlation fields
  correlation_state?: CorrelationState;
  correlation_evidence?: CorrelationEvidence;
  created_at: string;
  updated_at: string;
}

export interface AnalysisSession {
  session_id: string;
  agent_workflow_id: string;
  agent_workflow_name?: string;
  agent_id?: string;
  session_type: SessionType;
  status: SessionStatus;
  created_at: string; // ISO date string
  completed_at?: string | null; // ISO date string
  findings_count: number;
  risk_score?: number | null;
  sessions_analyzed?: number | null; // Number of runtime sessions analyzed in this scan
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

// Security Check Result - represents one of 7 categories
export interface SecurityCheck {
  category_id: SecurityCheckCategory;
  name: string;
  status: CheckStatus;  // PASS, FAIL, INFO
  owasp_llm: string[];
  findings_count: number;  // Total findings (all statuses)
  open_count?: number;     // Only OPEN findings
  max_severity: FindingSeverity | null;
  findings: Finding[];
}

// Static Summary Response with 7 check categories
export interface StaticSummaryScan {
  timestamp: string;
  scanned_by?: string | null;
  files_analyzed?: number | null;
  duration_ms?: number | null;
  session_id: string;
}

export interface StaticSummaryChecks {
  total_checks: number;
  passed: number;
  failed: number;
  info: number;
  gate_status: GateStatus;
}

// Scan history entry with findings breakdown
export interface ScanHistoryEntry {
  session_id: string;
  created_at: string;
  status: string;
  session_type: string;
  findings_count: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Historical findings summary
export interface HistoricalSummary {
  total_resolved: number;
  fixed: number;
  resolved: number;
  dismissed: number;
}

export interface StaticSummaryResponse {
  workflow_id: string;
  last_scan: StaticSummaryScan | null;
  checks: SecurityCheck[];
  summary: StaticSummaryChecks;
  recommendations_count: number;
  severity_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scan_history?: ScanHistoryEntry[];
  historical_summary?: HistoricalSummary;
}

// Recommendation types (from Phase 1)
export type RecommendationStatus =
  | 'PENDING'
  | 'FIXING'
  | 'FIXED'
  | 'VERIFIED'
  | 'DISMISSED'
  | 'IGNORED'
  | 'RESOLVED';

export interface Recommendation {
  recommendation_id: string;
  workflow_id: string;
  source_type: 'STATIC' | 'DYNAMIC';
  source_finding_id: string;
  category: SecurityCheckCategory;
  severity: FindingSeverity;
  cvss_score?: number;
  owasp_llm?: string;
  cwe?: string;
  soc2_controls?: string[];
  title: string;
  description?: string;
  impact?: string;
  fix_hints?: string;
  fix_complexity?: string;
  file_path?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  status: RecommendationStatus;
  fixed_by?: string;
  fixed_at?: string;
  fix_notes?: string;
  files_modified?: string[];
  created_at: string;
  updated_at: string;
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
