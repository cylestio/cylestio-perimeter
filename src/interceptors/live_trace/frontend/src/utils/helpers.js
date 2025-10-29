// Utility helper functions for the live trace frontend

// Minimum sessions required for risk analysis (must match backend value)
export const MIN_SESSIONS_FOR_RISK_ANALYSIS = 5

// Behavioral analysis tooltip texts (shared across components)
export const BEHAVIORAL_TOOLTIPS = {
  stability: "Share of sessions in the dominant pattern, adjusted for purity. Higher = the agent routinely follows the expected flow.",
  predictability: "Estimated chance a new session stays in-bounds (not an outlier).",
  confidence: "Strength of the estimate based on sample size and pattern purity. Add more sessions to raise confidence."
}

export function formatNumber(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M'
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K'
  return value.toString()
}

export function formatDuration(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000) return (value / 1000).toFixed(0) + 's'
  return Math.round(value) + 'ms'
}

export function timeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export function getScoreClass(score) {
  if (score >= 0.8) return 'success'
  if (score >= 0.6) return 'warning'
  return 'critical'
}

export function getSeverityBg(severity) {
  switch (severity) {
    case 'critical': return 'var(--color-critical-bg)'
    case 'high': return 'var(--color-warning-bg)'
    case 'medium': return 'var(--color-info-bg)'
    case 'low':
    default: return 'var(--color-bg-elevated)'
  }
}

export function getSeverityBorder(severity) {
  switch (severity) {
    case 'critical': return 'var(--color-critical)'
    case 'high': return 'var(--color-warning)'
    case 'medium': return 'var(--color-info)'
    case 'low':
    default: return 'var(--color-border-medium)'
  }
}

export function getSeverityColor(severity) {
  // All outliers use red-orange spectrum for visibility
  switch (severity?.toLowerCase()) {
    case 'critical':
      return '#dc2626'  // Dark red (Tailwind red-600)
    case 'high':
      return '#ef4444'  // Red (Tailwind red-500)
    case 'medium':
      return '#f97316'  // Orange (Tailwind orange-500)
    case 'low':
    default:
      return '#fb923c'  // Light orange (Tailwind orange-400)
  }
}

export function getCategoryIcon(categoryId) {
  // Return empty string - no icons needed
  return ''
}

export function getCategoryHeaderColor(severity) {
  switch (severity) {
    case 'critical': return 'var(--color-critical-bg)'
    case 'warning': return 'var(--color-warning-bg)'
    case 'passed':
    default: return 'var(--color-success-bg)'
  }
}

export function getCategoryBorderColor(severity) {
  switch (severity) {
    case 'critical': return 'var(--color-critical-border)'
    case 'warning': return 'var(--color-warning-border)'
    case 'passed':
    default: return 'var(--color-success-border)'
  }
}

export function getCheckStatusClass(status) {
  switch (status) {
    case 'passed': return 'text-success'
    case 'warning': return 'text-warning'
    case 'critical': return 'text-error'
    default: return 'text-muted'
  }
}

export function getAgentStatus(riskAnalysis) {
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
      statusColor: 'var(--color-text-muted)',
      evaluationStatus: null
    }
  }

  const evaluationStatus = riskAnalysis.evaluation_status

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
      statusColor: 'var(--color-text-muted)',
      evaluationStatus,
      currentSessions: riskAnalysis.summary?.current_sessions || 0,
      minSessionsRequired: riskAnalysis.summary?.min_sessions_required || MIN_SESSIONS_FOR_RISK_ANALYSIS,
      sessionsNeeded: riskAnalysis.summary?.sessions_needed || 0
    }
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
      statusColor: 'var(--color-critical)',
      evaluationStatus,
      error: riskAnalysis.error
    }
  }

  // Handle complete analysis
  const hasRiskData = evaluationStatus === 'COMPLETE' && riskAnalysis.security_report && riskAnalysis.behavioral_analysis

  if (!hasRiskData) {
    return {
      hasRiskData: false,
      hasCriticalIssues: false,
      hasWarnings: false,
      criticalCount: 0,
      warningCount: 0,
      totalChecks: 0,
      statusText: 'No Data',
      statusColor: 'var(--color-text-muted)',
      evaluationStatus
    }
  }

  // Count critical issues and warnings across all categories
  let criticalCount = 0
  let warningCount = 0
  let totalChecks = 0

  if (riskAnalysis.security_report?.categories) {
    Object.values(riskAnalysis.security_report.categories).forEach(category => {
      if (category.checks) {
        totalChecks += category.checks.length
        category.checks.forEach(check => {
          if (check.status === 'critical') {
            criticalCount++
          } else if (check.status === 'warning') {
            warningCount++
          }
        })
      }
    })
  }

  const hasCriticalIssues = criticalCount > 0
  const hasWarnings = warningCount > 0

  return {
    hasRiskData: true,
    hasCriticalIssues,
    hasWarnings,
    criticalCount,
    warningCount,
    totalChecks,
    statusText: hasCriticalIssues ? 'ATTENTION REQUIRED' : 'OK',
    statusColor: hasCriticalIssues ? 'var(--color-critical)' : 'var(--color-success)',
    evaluationStatus
  }
}
