import { Link } from 'react-router-dom'
import InfoCard from './InfoCard'
import Tooltip from './Tooltip'
import { formatNumber, formatDuration, timeAgo, getAgentStatus } from '../utils/helpers'

export default function AgentSidebar({
  agent,
  riskAnalysis,
  statistics,
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
          <div className="text-xs weight-semibold" style={{ color: '#92400E' }}>
            PII Detection Unavailable
          </div>
        </div>
      )}

      {/* Quick Metrics - Categorized */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

        {/* Sessions */}
        <div className="stat-card-compact" style={{ padding: 'var(--space-md) var(--space-xl)' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}>
            Sessions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            <div style={{ textAlign: 'center', minWidth: '60px' }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-xs)'
              }}>
                Total
              </div>
              <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                {agent.total_sessions}
              </div>
            </div>
            {statistics && (
              <Tooltip content="Average session duration" position="top" delay={200}>
                <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    Avg Time
                  </div>
                  <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                    {statistics.avg_session_time_minutes > 0 ? `${statistics.avg_session_time_minutes}m` : 'N/A'}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Tools */}
        <div className="stat-card-compact" style={{ padding: 'var(--space-md) var(--space-xl)' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}>
            Tools
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            <div style={{ textAlign: 'center', minWidth: '60px' }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-xs)'
              }}>
                Total
              </div>
              <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                {agent.total_tools}
              </div>
            </div>
            {statistics && (
              <Tooltip content="Average tool calls per session" position="top" delay={200}>
                <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    Per Session
                  </div>
                  <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                    {statistics.avg_tool_calls_per_session}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* LLM Response Time */}
        {statistics && (
          <div className="stat-card-compact" style={{ padding: 'var(--space-md) var(--space-xl)' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}>
              LLM Response Time
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  Avg
                </div>
                <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                  {statistics.avg_response_time_ms > 0 ? formatDuration(statistics.avg_response_time_ms) : 'N/A'}
                </div>
              </div>
              <Tooltip content="95th percentile - 95% of requests complete faster than this" position="top" delay={200}>
                <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    P95
                  </div>
                  <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                    {statistics.p95_response_time_ms > 0 ? formatDuration(statistics.p95_response_time_ms) : 'N/A'}
                  </div>
                </div>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Tokens */}
        <div className="stat-card-compact" style={{ padding: 'var(--space-md) var(--space-xl)' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}>
            Tokens
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            <div style={{ textAlign: 'center', minWidth: '60px' }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-xs)'
              }}>
                Total
              </div>
              <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                {formatNumber(agent.total_tokens)}
              </div>
            </div>
            {statistics && (
              <Tooltip content="Average tokens per session" position="top" delay={200}>
                <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    Per Session
                  </div>
                  <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                    {formatNumber(statistics.avg_tokens_per_session)}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="stat-card-compact" style={{ padding: 'var(--space-md) var(--space-xl)' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}>
            Messages
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            <div style={{ textAlign: 'center', minWidth: '60px' }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-xs)'
              }}>
                Total
              </div>
              <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                {formatNumber(agent.total_messages)}
              </div>
            </div>
            {statistics && (
              <Tooltip content="Average messages per session" position="top" delay={200}>
                <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    Per Session
                  </div>
                  <div className="stat-value" style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                    {statistics.avg_messages_per_session.toFixed(1)}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
