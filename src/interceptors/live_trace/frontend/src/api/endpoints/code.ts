/**
 * Code Analysis API Endpoints
 *
 * Endpoints for developer insights and health score data.
 */

import type {
  HealthScore,
  CodeAnalysisResponse,
  HealthTrendResponse,
  ScanComparisonResponse,
  DevCategory,
} from '../types/code';

// Re-export types for convenience
export type {
  HealthScore,
  CodeAnalysisResponse,
  HealthTrendResponse,
  ScanComparisonResponse,
  DevCategory,
  DeveloperFinding,
  CodeCategorySummary,
  HealthSnapshot,
} from '../types/code';

/**
 * Fetch health score for a workflow.
 */
export async function fetchHealthScore(workflowId: string): Promise<HealthScore> {
  const response = await fetch(`/api/agent-workflow/${workflowId}/health-score`);
  if (!response.ok) {
    throw new Error(`Failed to fetch health score: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return mapHealthScoreResponse(data);
}

/**
 * Fetch code analysis with developer findings.
 */
export interface FetchCodeAnalysisParams {
  category?: DevCategory;
  includeCorrelation?: boolean;
  status?: string;
}

export async function fetchCodeAnalysis(
  workflowId: string,
  params?: FetchCodeAnalysisParams
): Promise<CodeAnalysisResponse> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set('category', params.category);
  if (params?.includeCorrelation) queryParams.set('include_correlation', 'true');
  if (params?.status) queryParams.set('status', params.status);

  const queryString = queryParams.toString();
  const url = `/api/agent-workflow/${workflowId}/code-analysis${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch code analysis: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return mapCodeAnalysisResponse(data, workflowId);
}

/**
 * Fetch health trend history.
 */
export interface FetchHealthTrendParams {
  days?: number;
  source?: 'static' | 'dynamic' | 'correlation';
}

export async function fetchHealthTrend(
  workflowId: string,
  params?: FetchHealthTrendParams
): Promise<HealthTrendResponse> {
  const queryParams = new URLSearchParams();
  if (params?.days) queryParams.set('days', String(params.days));
  if (params?.source) queryParams.set('source', params.source);

  const queryString = queryParams.toString();
  const url = `/api/agent-workflow/${workflowId}/health-trend${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch health trend: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return mapHealthTrendResponse(data, workflowId);
}

/**
 * Fetch scan comparison between two scans.
 * If no scan IDs provided, compares latest scan to previous.
 */
export async function fetchScanComparison(
  workflowId: string,
  currentScanId?: string,
  previousScanId?: string
): Promise<ScanComparisonResponse> {
  const queryParams = new URLSearchParams();
  if (currentScanId) queryParams.set('current_scan', currentScanId);
  if (previousScanId) queryParams.set('previous_scan', previousScanId);

  const queryString = queryParams.toString();
  const url = `/api/agent-workflow/${workflowId}/scan-comparison${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch scan comparison: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return mapScanComparisonResponse(data, workflowId);
}

// ============================================================================
// Response Mappers
// ============================================================================

function mapHealthScoreResponse(data: Record<string, unknown>): HealthScore {
  return {
    overall: (data.overall as number) ?? 100,
    dimensions: {
      security: (data.dimensions as Record<string, number>)?.security ?? 100,
      availability: (data.dimensions as Record<string, number>)?.availability ?? 100,
      reliability: (data.dimensions as Record<string, number>)?.reliability ?? 100,
      efficiency: (data.dimensions as Record<string, number>)?.efficiency ?? 100,
    },
    issue_counts: {
      security: (data.issue_counts as Record<string, number>)?.security ?? 0,
      availability: (data.issue_counts as Record<string, number>)?.availability ?? 0,
      reliability: (data.issue_counts as Record<string, number>)?.reliability ?? 0,
      efficiency: (data.issue_counts as Record<string, number>)?.efficiency ?? 0,
    },
    trend: (data.trend as HealthScore['trend']) ?? 'stable',
    trend_delta: (data.trend_delta as number) ?? 0,
    calculated_at: (data.calculated_at as string) ?? new Date().toISOString(),
    suggested_improvement: data.suggested_improvement as HealthScore['suggested_improvement'],
  };
}

function mapCodeAnalysisResponse(
  data: Record<string, unknown>,
  workflowId: string
): CodeAnalysisResponse {
  const categories = (data.categories as Record<string, unknown>[]) ?? [];

  return {
    workflow_id: workflowId,
    health_score: mapHealthScoreResponse(data.health_score as Record<string, unknown> ?? {}),
    categories: categories.map((cat) => ({
      category: cat.category as DevCategory,
      total_findings: (cat.total_findings as number) ?? 0,
      by_severity: (cat.by_severity as Record<string, number>) ?? {},
      by_status: (cat.by_status as Record<string, number>) ?? {},
      health_penalty: (cat.health_penalty as number) ?? 0,
      findings: (cat.findings as Record<string, unknown>[])?.map(mapDeveloperFinding) ?? [],
    })),
    total_findings: (data.total_findings as number) ?? 0,
    open_findings: (data.open_findings as number) ?? 0,
    correlation_summary: data.correlation_summary as CodeAnalysisResponse['correlation_summary'],
    last_analyzed: data.last_analyzed as string | undefined,
  };
}

function mapDeveloperFinding(data: Record<string, unknown>): import('../types/code').DeveloperFinding {
  return {
    finding_id: data.finding_id as string,
    session_id: data.session_id as string,
    agent_workflow_id: data.agent_workflow_id as string,
    source_type: data.source_type as 'STATIC' | 'DYNAMIC',
    category: data.category as import('../types/findings').SecurityCheckCategory,
    file_path: data.file_path as string,
    line_start: data.line_start as number | undefined,
    line_end: data.line_end as number | undefined,
    finding_type: data.finding_type as string,
    severity: data.severity as import('../types/findings').FindingSeverity,
    cvss_score: data.cvss_score as number | undefined,
    title: data.title as string,
    description: data.description as string | undefined,
    evidence: (data.evidence as import('../types/findings').FindingEvidence) ?? {},
    owasp_mapping: (data.owasp_mapping as string[]) ?? [],
    cwe: data.cwe as string | undefined,
    soc2_controls: data.soc2_controls as string[] | undefined,
    recommendation_id: data.recommendation_id as string | undefined,
    status: (data.status as import('../types/findings').FindingStatus) ?? 'OPEN',
    correlation_state: data.correlation_state as import('../types/findings').CorrelationState | undefined,
    correlation_evidence: data.correlation_evidence as import('../types/findings').CorrelationEvidence | undefined,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    // Developer-specific fields
    dev_category: data.dev_category as DevCategory,
    health_impact: (data.health_impact as number) ?? 0,
    code_fingerprint: data.code_fingerprint as string | undefined,
    first_detected_scan: data.first_detected_scan as string | undefined,
    last_seen_scan: data.last_seen_scan as string | undefined,
    resolved_scan: data.resolved_scan as string | undefined,
  };
}

function mapHealthTrendResponse(
  data: Record<string, unknown>,
  workflowId: string
): HealthTrendResponse {
  const snapshots = (data.snapshots as Record<string, unknown>[]) ?? [];

  return {
    workflow_id: workflowId,
    snapshots: snapshots.map((snap) => ({
      timestamp: snap.timestamp as string,
      overall_health: snap.overall_health as number,
      security_score: snap.security_score as number | undefined,
      availability_score: snap.availability_score as number | undefined,
      reliability_score: snap.reliability_score as number | undefined,
      efficiency_score: snap.efficiency_score as number | undefined,
      source: (snap.source as 'static' | 'dynamic' | 'correlation') ?? 'static',
      milestone: snap.milestone as string | undefined,
    })),
    period_days: (data.period_days as number) ?? 30,
    trend: (data.trend as HealthTrendResponse['trend']) ?? 'stable',
    start_health: (data.start_health as number) ?? 100,
    end_health: (data.end_health as number) ?? 100,
    delta: (data.delta as number) ?? 0,
  };
}

function mapScanComparisonResponse(
  data: Record<string, unknown>,
  workflowId: string
): ScanComparisonResponse {
  return {
    workflow_id: workflowId,
    current_scan_id: data.current_scan_id as string,
    previous_scan_id: data.previous_scan_id as string | undefined,
    new_findings: ((data.new_findings as Record<string, unknown>[]) ?? []).map(mapDeveloperFinding),
    fixed_findings: ((data.fixed_findings as Record<string, unknown>[]) ?? []).map(mapDeveloperFinding),
    unchanged_count: (data.unchanged_count as number) ?? 0,
    health_delta: (data.health_delta as number) ?? 0,
    current_health: (data.current_health as number) ?? 100,
    previous_health: data.previous_health as number | undefined,
  };
}
