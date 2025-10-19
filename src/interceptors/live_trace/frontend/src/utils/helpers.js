// Utility helper functions for the live trace frontend

export function formatNumber(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
  return value.toString()
}

export function formatDuration(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000) return (value / 1000).toFixed(1) + 's'
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
