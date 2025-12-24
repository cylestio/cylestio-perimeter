/**
 * Code Analysis Types
 *
 * Types for developer insights from static analysis.
 * Includes health scores, developer findings, and code quality metrics.
 */

import type { Finding, FindingSeverity, FindingStatus } from './findings';

// ============================================================================
// Developer Category Types
// ============================================================================

/**
 * Developer finding categories.
 * These categorize code quality issues that affect agent reliability.
 */
export type DevCategory = 'AVAILABILITY' | 'RELIABILITY' | 'INEFFICIENCY';

/**
 * Category metadata for display.
 */
export interface DevCategoryInfo {
  id: DevCategory;
  name: string;
  description: string;
  icon: string;
}

/**
 * The three developer finding categories.
 */
export const DEV_CATEGORIES: DevCategoryInfo[] = [
  {
    id: 'AVAILABILITY',
    name: 'Availability',
    description: 'Network resilience, retry logic, timeout handling, fallback mechanisms',
    icon: 'RefreshCcw',
  },
  {
    id: 'RELIABILITY',
    name: 'Reliability',
    description: 'Error handling, output validation, tool configuration quality',
    icon: 'CheckCircle',
  },
  {
    id: 'INEFFICIENCY',
    name: 'Efficiency',
    description: 'Resource usage, token optimization, loop bounds, memory management',
    icon: 'Zap',
  },
];

// ============================================================================
// Developer Finding Types
// ============================================================================

/**
 * Developer finding - extends base Finding with developer-specific fields.
 */
export interface DeveloperFinding extends Finding {
  /** Developer category: AVAILABILITY, RELIABILITY, or INEFFICIENCY */
  dev_category: DevCategory;
  /** Health score impact (0-100 penalty) */
  health_impact: number;
  /** Stable identifier for tracking across scans */
  code_fingerprint?: string;
  /** When first detected */
  first_detected_scan?: string;
  /** When last seen */
  last_seen_scan?: string;
  /** If resolved, which scan resolved it */
  resolved_scan?: string;
}

// ============================================================================
// Health Score Types
// ============================================================================

/**
 * Health trend direction indicator.
 */
export type HealthTrend = 'improving' | 'declining' | 'stable';

/**
 * Dimension breakdown for health score.
 */
export interface HealthDimensions {
  security: number;
  availability: number;
  reliability: number;
  efficiency: number;
}

/**
 * Issue counts by dimension.
 */
export interface IssueCounts {
  security: number;
  availability: number;
  reliability: number;
  efficiency: number;
}

/**
 * Comprehensive health score with dimension breakdown.
 */
export interface HealthScore {
  /** Overall health score (0-100) */
  overall: number;
  /** Individual dimension scores */
  dimensions: HealthDimensions;
  /** Issue counts per dimension */
  issue_counts: IssueCounts;
  /** Trend direction based on recent history */
  trend: HealthTrend;
  /** Percentage change from previous period */
  trend_delta: number;
  /** Timestamp of calculation */
  calculated_at: string;
  /** Suggested next improvement */
  suggested_improvement?: {
    dimension: keyof HealthDimensions;
    potential_gain: number;
    action: string;
  };
}

// ============================================================================
// Code Analysis Response Types
// ============================================================================

/**
 * Category summary within code analysis.
 */
export interface CodeCategorySummary {
  category: DevCategory;
  total_findings: number;
  by_severity: Record<FindingSeverity, number>;
  by_status: Record<FindingStatus, number>;
  health_penalty: number;
  findings: DeveloperFinding[];
}

/**
 * Response from get_code_analysis endpoint.
 */
export interface CodeAnalysisResponse {
  workflow_id: string;
  /** Health score breakdown */
  health_score: HealthScore;
  /** Findings grouped by developer category */
  categories: CodeCategorySummary[];
  /** Total developer findings */
  total_findings: number;
  /** Open findings only */
  open_findings: number;
  /** Correlation summary if dynamic data available */
  correlation_summary?: {
    has_correlation: boolean;
    runs_analyzed: number;
    validated_count: number;
    unexercised_count: number;
  };
  /** Last analysis timestamp */
  last_analyzed?: string;
}

// ============================================================================
// Health Trend Types
// ============================================================================

/**
 * Single health snapshot for trend visualization.
 */
export interface HealthSnapshot {
  timestamp: string;
  overall_health: number;
  security_score?: number;
  availability_score?: number;
  reliability_score?: number;
  efficiency_score?: number;
  source: 'static' | 'dynamic' | 'correlation';
  milestone?: string;
}

/**
 * Response from get_health_trend endpoint.
 */
export interface HealthTrendResponse {
  workflow_id: string;
  snapshots: HealthSnapshot[];
  period_days: number;
  trend: HealthTrend;
  start_health: number;
  end_health: number;
  delta: number;
}

// ============================================================================
// Scan Comparison Types
// ============================================================================

/**
 * Finding change between scans.
 */
export interface FindingChange {
  finding: DeveloperFinding;
  change_type: 'new' | 'fixed' | 'unchanged' | 'severity_changed';
  previous_severity?: FindingSeverity;
}

/**
 * Response from get_scan_comparison endpoint.
 */
export interface ScanComparisonResponse {
  workflow_id: string;
  current_scan_id: string;
  previous_scan_id?: string;
  new_findings: DeveloperFinding[];
  fixed_findings: DeveloperFinding[];
  unchanged_count: number;
  health_delta: number;
  current_health: number;
  previous_health?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get category info by ID.
 */
export function getCategoryInfo(categoryId: DevCategory): DevCategoryInfo | undefined {
  return DEV_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * Calculate category health penalty from findings.
 */
export function calculateCategoryPenalty(findings: DeveloperFinding[]): number {
  return findings.reduce((sum, f) => sum + (f.health_impact || 0), 0);
}

/**
 * Get severity color for health score.
 */
export function getHealthColor(score: number): 'green' | 'orange' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
}

/**
 * Group findings by developer category.
 */
export function groupFindingsByCategory(
  findings: DeveloperFinding[]
): Record<DevCategory, DeveloperFinding[]> {
  const grouped: Record<DevCategory, DeveloperFinding[]> = {
    AVAILABILITY: [],
    RELIABILITY: [],
    INEFFICIENCY: [],
  };

  for (const finding of findings) {
    if (finding.dev_category && finding.dev_category in grouped) {
      grouped[finding.dev_category].push(finding);
    }
  }

  return grouped;
}

/**
 * Check if a finding is a developer finding (vs security).
 */
export function isDeveloperFinding(finding: Finding): finding is DeveloperFinding {
  return 'dev_category' in finding && finding.dev_category !== undefined;
}
