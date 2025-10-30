import { Link } from 'react-router-dom'
import InfoCard from './InfoCard'
import { formatNumber, timeAgo, getAgentStatus } from '../utils/helpers'

export default function AgentSidebar({
  agent,
  riskAnalysis,
}) {
  const status = getAgentStatus(riskAnalysis)
  return (
    <div className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Agent Identity Card */}
      <InfoCard
        title="Agent Identity"
        primaryLabel="AGENT ID"
        primaryValue={agent.id}
        stats={[
          { label: 'FIRST SEEN', value: timeAgo(agent.first_seen) },
          { label: 'LAST SEEN', value: timeAgo(agent.last_seen) }
        ]}
      />

      {/* Risk Score Hero (if available) */}
      {status.hasRiskData && (
        <div className="risk-hero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
            <div className="risk-label">Overall Status</div>
            <Link
              to={`/agent/${agent.id}/report`}
              className="text-xs weight-semibold"
              style={{
                color: 'var(--color-accent-primary)',
                textDecoration: 'none',
                opacity: 0.9
              }}
            >
              Full Report →
            </Link>
          </div>
          <div className="risk-score-large" style={{
            color: status.statusColor,
            fontSize: 'var(--text-xl)',
            fontWeight: 700
          }}>
            {status.statusText}
          </div>
          <div className="text-md" style={{
            fontWeight: 600
          }}>
            {status.hasCriticalIssues || status.hasWarnings ? (
              <>
                {status.criticalCount > 0 && (
                  <span style={{ color: 'var(--color-critical)' }}>
                    {status.criticalCount} Critical
                  </span>
                )}
                {status.criticalCount > 0 && status.warningCount > 0 && (
                  <span style={{ color: 'var(--color-text-muted)' }}> | </span>
                )}
                {status.warningCount > 0 && (
                  <span style={{ color: 'var(--color-warning)' }}>
                    {status.warningCount} Warning{status.warningCount !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--color-success)' }}>All Systems OK</span>
            )}
          </div>
        </div>
      )}

      {/* PII Detection Unavailable Warning */}
      {riskAnalysis?.summary?.pii_disabled && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: '1px solid #F59E0B',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
            <div style={{ fontSize: '16px' }}>⚠️</div>
            <div>
              <div className="text-xs weight-semibold" style={{ color: '#92400E', marginBottom: '2px' }}>
                PII Detection Unavailable
              </div>
              <div className="text-xs" style={{ color: '#78350F', lineHeight: 1.4 }}>
                {riskAnalysis.summary.pii_disabled_reason || 'Model download failed'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <div className="stat-card-compact" style={{ flex: 1, padding: 'var(--space-sm) var(--space-md)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-xs)' }}>Sessions</h3>
            </div>
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>{agent.total_sessions}</div>
          </div>
          <div className="stat-card-compact" style={{ flex: 1, padding: 'var(--space-sm) var(--space-md)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-xs)' }}>Messages</h3>
            </div>
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>{formatNumber(agent.total_messages)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <div className="stat-card-compact" style={{ flex: 1, padding: 'var(--space-sm) var(--space-md)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-xs)' }}>Tokens</h3>
            </div>
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>{formatNumber(agent.total_tokens)}</div>
          </div>
          <div className="stat-card-compact" style={{ flex: 1, padding: 'var(--space-sm) var(--space-md)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-xs)' }}>Tools</h3>
            </div>
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>{agent.total_tools}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
