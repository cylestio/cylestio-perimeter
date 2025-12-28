// API Types for /api/agent/:id endpoint

export interface SecurityCheck {
  check_id: string;
  name: string;
  description?: string;
  status: 'passed' | 'warning' | 'critical';
  value?: string | number;
  evidence?: unknown;
  recommendations?: string[];
}

export interface SecurityCategory {
  category_id?: string;
  category_name: string;
  description?: string;
  highest_severity?: string;
  critical_checks: number;
  warning_checks: number;
  checks?: SecurityCheck[];
  metrics?: Record<string, number | string>;
  tools?: Array<{ name: string; count: number }>;
}

export interface SecurityReport {
  categories: Record<string, SecurityCategory>;
  overall_status: string;
  last_updated: string;
}

export interface BehavioralClusterCharacteristics {
  avg_tokens?: number;
  avg_tool_calls?: number;
  avg_messages?: number;
  avg_duration?: number;
  common_tools?: string[];
}

export interface BehavioralCluster {
  cluster_id: string;
  size: number;
  percentage: number;
  confidence: 'high' | 'medium' | 'low';
  insights: string;
  characteristics: BehavioralClusterCharacteristics;
}

export interface OutlierSession {
  session_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  primary_causes: string[];
  distance_to_nearest_centroid?: number;
  anomaly_score?: number;
  nearest_cluster_id?: string;
}

export interface CentroidDistance {
  from_cluster: string;
  to_cluster: string;
  distance: number;
  similarity_score: number;
}

export interface BehavioralAnalysis {
  num_clusters: number;
  num_outliers: number;
  stability_score: number;
  predictability_score: number;
  confidence: 'high' | 'medium' | 'low';
  interpretation?: string;
  clusters?: BehavioralCluster[];
  outliers?: OutlierSession[];
  centroid_distances?: CentroidDistance[];
}

export interface RiskAnalysisSummary {
  current_sessions: number;
  min_sessions_required: number;
  sessions_needed: number;
  total_sessions: number;
  completed_sessions: number;
  active_sessions: number;
  behavioral_status: 'WAITING_FOR_COMPLETION' | 'COMPLETE' | 'INSUFFICIENT_DATA';
  behavioral_message?: string;
  pii_disabled?: boolean;
}

export interface RiskAnalysis {
  evaluation_status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'ERROR';
  security_report?: SecurityReport;
  behavioral_analysis?: BehavioralAnalysis;
  summary?: RiskAnalysisSummary;
  error?: string;
}

export interface TokenUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  avg_tokens_per_session: number;
}

export interface ModelUsage {
  model: string;
  count: number;
  percentage: number;
}

export interface ToolUsageItem {
  tool_name: string;
  total_calls: number;
  success_rate: number;
  avg_duration_ms: number;
}

// Timeline data point for time-series charts
export interface TimelineDataPoint {
  date: string;
  requests: number;
  tokens: number;
  input_tokens: number;
  output_tokens: number;
}

// Tool timeline data point
export interface ToolTimelinePoint {
  date: string;
  tools: Record<string, { executions: number; avg_duration_ms: number }>;
}

// Token summary from backend analytics
export interface TokenSummary {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  models_used: number;
  pricing_last_updated: string | null;
}

// Model analytics data
export interface ModelAnalytics {
  model: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  errors: number;
  cost: number;
}

// Tool analytics data
export interface ToolAnalytics {
  tool: string;
  executions: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  failures: number;
  successes: number;
  failure_rate: number;
}

// Full analytics response from backend
export interface AgentAnalytics {
  token_summary: TokenSummary;
  models: ModelAnalytics[];
  tools: ToolAnalytics[];
  timeline: TimelineDataPoint[];
  tool_timeline: ToolTimelinePoint[];
  // Legacy fields for backward compatibility
  token_usage?: TokenUsage;
  model_usage?: ModelUsage[];
  tool_usage?: ToolUsageItem[];
}

export interface AgentSession {
  id: string;
  is_active: boolean;
  duration_minutes: number;
  message_count: number;
  total_tokens: number;
  tool_uses: number;
  error_rate: number;
  created_at: string;
  last_activity: string;
}

export interface AgentDetail {
  id: string;
  total_sessions: number;
  total_messages: number;
  total_tokens: number;
  total_tools: number;
  total_errors: number;
  unique_tools: number;
  available_tools: string[];
  used_tools: string[];
  tool_usage_details: Record<string, number>;
  tools_utilization_percent: number;
  avg_response_time_ms: number;
  avg_messages_per_session: number;
  avg_duration_minutes: number;
  first_seen: string;
  last_seen: string;
  pii_disabled?: boolean;
}

export interface AgentResponse {
  agent: AgentDetail;
  risk_analysis: RiskAnalysis;
  analytics: AgentAnalytics;
}
