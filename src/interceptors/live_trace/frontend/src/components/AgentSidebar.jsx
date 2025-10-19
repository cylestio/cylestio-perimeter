import { Link } from 'react-router-dom'
import InfoCard from './InfoCard'
import { formatNumber, timeAgo } from '../utils/helpers'

export default function AgentSidebar({
  agent,
  riskAnalysis,
  hasRiskData,
  hasCriticalIssues,
}) {
  return (
    <div className="dashboard-sidebar">
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
      {hasRiskData && riskAnalysis.security_report && (
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
            color: hasCriticalIssues ? 'var(--color-critical)' : 'var(--color-success)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700
          }}>
            {hasCriticalIssues ? 'WARNING' : 'OK'}
          </div>
          <div className="text-md" style={{
            color: hasCriticalIssues ? 'var(--color-critical)' : 'var(--color-success)',
            fontWeight: 600
          }}>
            {hasCriticalIssues ? 'Attention Required' : 'All Systems OK'}
          </div>
        </div>
      )}

      {/* Quick Metrics */}
      <div>
        <h3 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
          QUICK METRICS
        </h3>
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
    </div>
  )
}
