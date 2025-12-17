/**
 * Formatting utilities for names, initials, and display strings
 */

/**
 * Generate two-letter initials from an ID or name string.
 * Handles hyphenated IDs (e.g., "prompt-a8b9ef35309f" -> "PA")
 * and regular names (e.g., "Customer Agent" -> "CA")
 */
export const getInitials = (input: string): string => {
  if (!input) return '??';

  // Check if it's a hyphenated ID
  const parts = input.split('-');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Check if it's a space-separated name
  const words = input.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Fall back to first two characters
  return input.substring(0, 2).toUpperCase();
};

/**
 * Format a hyphenated ID into a readable name.
 * e.g., "prompt-a8b9ef35309f" -> "Prompt A8b9ef35309f"
 * e.g., "ant-math-agent-v7" -> "Ant Math"
 */
export const formatAgentName = (id: string): string => {
  if (!id) return '';

  return id
    .split('-')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

/**
 * Format a number with K/M suffix for compact display.
 * e.g., 1500 -> "1.5K", 1000000 -> "1M"
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toString();
};

/**
 * Format cost in USD with appropriate precision.
 * e.g., 0.0001 -> "$0.0001", 1.234 -> "$1.23", 0 -> "$0.00"
 */
export const formatCost = (cost: number): string => {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
};

/**
 * Format latency in milliseconds to human-readable string.
 * e.g., 150 -> "150ms", 1500 -> "1.5s", 65000 -> "1m 5s"
 */
export const formatLatency = (ms: number): string => {
  if (ms === 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
};

/**
 * Format throughput as sessions per hour.
 * e.g., 2.5 -> "2.5/hr", 0.1 -> "0.1/hr"
 */
export const formatThroughput = (sessionsPerHour: number): string => {
  if (sessionsPerHour === 0) return '0/hr';
  if (sessionsPerHour < 0.1) return '<0.1/hr';
  return `${sessionsPerHour.toFixed(1)}/hr`;
};

/**
 * Format tokens with K/M suffix for display.
 * Alias for formatCompactNumber with explicit naming.
 */
export const formatTokens = formatCompactNumber;

/**
 * Format duration in minutes to a human-readable string.
 * e.g., 0.5 -> "<1m", 45 -> "45m", 90 -> "1h 30m"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calculate duration in minutes between two ISO date strings.
 * Returns null if either date is invalid or missing.
 */
export const getDurationMinutes = (
  startIso: string | null | undefined,
  endIso: string | null | undefined
): number | null => {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return (end.getTime() - start.getTime()) / 60000;
};

/**
 * Format an ISO date string to a readable date/time.
 * e.g., "2025-12-11T08:58:32.324156+00:00" -> "Dec 11, 8:58 AM"
 */
export const formatDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Extract agent name from analysis session ID.
 * e.g., "analysis_ant-math-agent-v8_20251211_085832" -> "ant-math-agent-v8"
 */
export const extractAgentFromSessionId = (sessionId: string): string | null => {
  if (!sessionId) return null;
  // Format: analysis_<agent-name>_<date>_<time>
  const match = sessionId.match(/^analysis_(.+?)_\d{8}_\d{6}$/);
  return match ? match[1] : null;
};

/**
 * Format a timestamp to a relative time string.
 * e.g., "just now", "5m ago", "2h ago", "3d ago"
 */
export const timeAgo = (timestamp: string | Date | number | null | undefined): string => {
  if (!timestamp) return '-';
  const now = new Date();
  const then = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(then.getTime())) return '-';

  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

/**
 * Format a timestamp to an absolute date/time string for tooltip display.
 * e.g., "Dec 11, 2025, 8:58:32 AM"
 */
export const formatAbsoluteDateTime = (timestamp: string | Date | number | null | undefined): string => {
  if (!timestamp) return '-';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Constants
export const MIN_SESSIONS_FOR_RISK_ANALYSIS = 1;

export const BEHAVIORAL_TOOLTIPS = {
  stability:
    'Share of sessions in the dominant pattern, adjusted for purity. Higher = the agent routinely follows the expected flow.',
  predictability:
    'Estimated chance a new session stays in-bounds (not an outlier).',
  confidence:
    'Strength of the estimate based on sample size and pattern purity. Add more sessions to raise confidence.',
};

// Agent status types
export interface AgentStatus {
  hasRiskData: boolean;
  hasCriticalIssues: boolean;
  hasWarnings: boolean;
  criticalCount: number;
  warningCount: number;
  totalChecks: number;
  statusText: string;
  statusColor: string;
  evaluationStatus: string | null;
  currentSessions?: number;
  minSessionsRequired?: number;
  sessionsNeeded?: number;
  error?: string;
  totalSessions?: number;
  completedSessions?: number;
  activeSessions?: number;
  behavioralStatus?: string;
  behavioralMessage?: string;
}

/**
 * Calculate the status of an agent from risk analysis data.
 */
export const getAgentStatus = (riskAnalysis: {
  evaluation_status?: string;
  summary?: {
    current_sessions?: number;
    min_sessions_required?: number;
    sessions_needed?: number;
    total_sessions?: number;
    completed_sessions?: number;
    active_sessions?: number;
    behavioral_status?: string;
    behavioral_message?: string;
    pii_disabled?: boolean;
  };
  security_report?: {
    categories?: Record<
      string,
      {
        category_name?: string;
        checks?: Array<{
          status: string;
          name: string;
          value?: string | number;
        }>;
      }
    >;
  };
  behavioral_analysis?: {
    num_clusters?: number;
    stability_score?: number;
    predictability_score?: number;
    confidence?: string;
  };
  error?: string;
} | null): AgentStatus => {
  // Return default status when no risk analysis available
  if (!riskAnalysis) {
    return {
      hasRiskData: false,
      hasCriticalIssues: false,
      hasWarnings: false,
      criticalCount: 0,
      warningCount: 0,
      totalChecks: 0,
      statusText: 'No Data',
      statusColor: 'var(--color-white-50)',
      evaluationStatus: null,
    };
  }

  const evaluationStatus = riskAnalysis.evaluation_status;

  // Handle insufficient data case
  if (evaluationStatus === 'INSUFFICIENT_DATA') {
    return {
      hasRiskData: false,
      hasCriticalIssues: false,
      hasWarnings: false,
      criticalCount: 0,
      warningCount: 0,
      totalChecks: 0,
      statusText: 'Evaluating',
      statusColor: 'var(--color-white-50)',
      evaluationStatus,
      currentSessions: riskAnalysis.summary?.current_sessions || 0,
      minSessionsRequired:
        riskAnalysis.summary?.min_sessions_required || MIN_SESSIONS_FOR_RISK_ANALYSIS,
      sessionsNeeded: riskAnalysis.summary?.sessions_needed || 0,
    };
  }

  // Handle error case
  if (evaluationStatus === 'ERROR') {
    return {
      hasRiskData: false,
      hasCriticalIssues: false,
      hasWarnings: false,
      criticalCount: 0,
      warningCount: 0,
      totalChecks: 0,
      statusText: 'Error',
      statusColor: 'var(--color-red)',
      evaluationStatus,
      error: riskAnalysis.error,
    };
  }

  // Handle complete or partial analysis
  const hasRiskData =
    (evaluationStatus === 'COMPLETE' || evaluationStatus === 'PARTIAL') &&
    !!riskAnalysis.security_report;

  if (!hasRiskData) {
    return {
      hasRiskData: false,
      hasCriticalIssues: false,
      hasWarnings: false,
      criticalCount: 0,
      warningCount: 0,
      totalChecks: 0,
      statusText: 'No Data',
      statusColor: 'var(--color-white-50)',
      evaluationStatus: evaluationStatus || null,
    };
  }

  // Count critical issues and warnings across all categories
  let criticalCount = 0;
  let warningCount = 0;
  let totalChecks = 0;

  if (riskAnalysis.security_report?.categories) {
    Object.values(riskAnalysis.security_report.categories).forEach((category) => {
      if (category.checks) {
        totalChecks += category.checks.length;
        category.checks.forEach((check) => {
          if (check.status === 'critical') {
            criticalCount++;
          } else if (check.status === 'warning') {
            warningCount++;
          }
        });
      }
    });
  }

  const hasCriticalIssues = criticalCount > 0;
  const hasWarnings = warningCount > 0;

  return {
    hasRiskData: true,
    hasCriticalIssues,
    hasWarnings,
    criticalCount,
    warningCount,
    totalChecks,
    statusText: hasCriticalIssues ? 'ATTENTION REQUIRED' : 'OK',
    statusColor: hasCriticalIssues ? 'var(--color-red)' : 'var(--color-green)',
    evaluationStatus: evaluationStatus || null,
    totalSessions: riskAnalysis.summary?.total_sessions || 0,
    completedSessions: riskAnalysis.summary?.completed_sessions || 0,
    activeSessions: riskAnalysis.summary?.active_sessions || 0,
    behavioralStatus: riskAnalysis.summary?.behavioral_status,
    behavioralMessage: riskAnalysis.summary?.behavioral_message,
  };
};
