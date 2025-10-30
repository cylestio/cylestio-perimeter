import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Tooltip from './Tooltip'
import AgentSidebar from './AgentSidebar'
import EvaluationProgress from './EvaluationProgress'
import { formatNumber, timeAgo, getAgentStatus, BEHAVIORAL_TOOLTIPS } from '../utils/helpers'

export default function AgentPage() {
  const { agentId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/agent/${agentId}`)
        const json = await res.json()
        if (json.error) {
          console.error('Error:', json.error)
        } else {
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch agent data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [agentId])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading agent...
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="container">
        <div className="text-center text-muted loading">
          {data?.error || 'Failed to load agent data'}
        </div>
      </div>
    )
  }

  const agent = data.agent
  const riskAnalysis = data.risk_analysis
  const status = getAgentStatus(riskAnalysis)

  // Build failed and warning check lists for display
  const failedChecks = []
  const warningChecks = []

  if (status.hasRiskData && riskAnalysis.security_report?.categories) {
    Object.values(riskAnalysis.security_report.categories).forEach(category => {
      category.checks?.forEach(check => {
        if (check.status === 'critical') {
          failedChecks.push({ ...check, categoryName: category.category_name })
        } else if (check.status === 'warning') {
          warningChecks.push({ ...check, categoryName: category.category_name })
        }
      })
    })
  }

  return (
    <>
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Agent</span>
          <span className="breadcrumb-separator">/</span>
          <strong className="text-primary">{agentId.substring(0, 16)}{agentId.length > 16 ? '...' : ''}</strong>
        </div>

        {/* Split Dashboard Layout */}
        <div className="dashboard-split">

          {/* LEFT SIDEBAR */}
          <AgentSidebar
            agent={agent}
            riskAnalysis={riskAnalysis}
          />

          {/* MAIN CONTENT AREA */}
          <div className="dashboard-main">

            {/* Evaluation Progress (when insufficient data) */}
            {status.evaluationStatus === 'INSUFFICIENT_DATA' && (
              <EvaluationProgress
                currentSessions={status.currentSessions}
                minSessionsRequired={status.minSessionsRequired}
              />
            )}

            {/* Behavioral Analysis Waiting Banner */}
            {status.hasRiskData && status.behavioralStatus === 'WAITING_FOR_COMPLETION' && (
              <div className="card mb-lg" style={{
                background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                border: '2px solid var(--color-accent-primary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div className="card-content" style={{ padding: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                    <div>
                      <div className="text-sm weight-semibold" style={{ color: 'var(--color-accent-primary)' }}>
                        Behavioral Analysis In Progress
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                        Waiting for {status.activeSessions} active session{status.activeSessions !== 1 ? 's' : ''} to complete 
                        ({status.completedSessions} of {status.totalSessions} completed). 
                        Sessions are marked complete after 30 seconds of inactivity.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Summary Card */}
            {status.hasRiskData && (
              <div className="card card-elevated">
                <div className="card-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Security & Behavioral Assessment Summary</h2>
                    <Link
                      to={`/agent/${agentId}/report`}
                      className="text-sm weight-semibold"
                      style={{
                        background: 'var(--color-accent-primary)',
                        color: 'white',
                        padding: 'var(--space-sm) var(--space-xl)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        border: '2px solid var(--color-accent-primary)',
                        transition: 'all var(--transition-base)'
                      }}
                    >
                      View Full Report →
                    </Link>
                  </div>
                </div>
                <div className="card-content">
                  {/* Overall Status Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-lg)',
                    background: status.hasCriticalIssues ? 'var(--color-critical-bg)' : 'var(--color-success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${status.hasCriticalIssues ? 'var(--color-critical-border)' : 'var(--color-success-border)'}`,
                    marginBottom: 'var(--space-2xl)'
                  }}>
                    <div>
                      <div className="text-xs text-muted mb-xs weight-semibold">OVERALL STATUS</div>
                      <div className="text-lg weight-bold font-mono" style={{
                        color: status.statusColor
                      }}>
                        {status.hasCriticalIssues ? 'ATTENTION REQUIRED' : 'ALL SYSTEMS OK'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-xs text-muted mb-xs weight-semibold">TOTAL CHECKS</div>
                      <div className="text-lg weight-bold font-mono text-primary">
                        {status.totalChecks}
                      </div>
                      <div className="text-xs text-muted">
                        {status.criticalCount} critical, {status.warningCount} warnings
                      </div>
                    </div>
                  </div>

                  {/* Failed & Warning Checks */}
                  {failedChecks.length > 0 && (
                    <div className="mb-2xl">
                      <h3 className="text-md weight-semibold text-critical mb-md font-mono">
                        Failed Checks ({failedChecks.length})
                      </h3>
                      <div style={{
                        border: '1px solid var(--color-border-medium)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden'
                      }}>
                        {failedChecks.map((check, idx) => (
                          <div key={idx} style={{
                            borderBottom: idx < failedChecks.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                            padding: 'var(--space-md) var(--space-lg)',
                            background: 'var(--color-surface)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                              <div style={{
                                fontSize: '12px',
                                minWidth: '32px',
                                textAlign: 'center',
                                fontWeight: 600,
                                color: 'var(--color-critical)'
                              }}>
                                FAIL
                              </div>
                              <div style={{ flex: 1 }}>
                                <span className="text-sm weight-medium text-critical font-mono">
                                  {check.name}
                                </span>
                                {check.value && (
                                  <span className="text-xs text-muted font-mono"> ({check.value})</span>
                                )}
                              </div>
                              <span className="badge critical">{check.categoryName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {warningChecks.length > 0 && (
                    <div className="mb-2xl">
                      <h3 className="text-md weight-semibold text-warning mb-md font-mono">
                        Warnings ({warningChecks.length})
                      </h3>
                      <div style={{
                        border: '1px solid var(--color-border-medium)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden'
                      }}>
                        {warningChecks.map((check, idx) => (
                          <div key={idx} style={{
                            borderBottom: idx < warningChecks.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                            padding: 'var(--space-md) var(--space-lg)',
                            background: 'var(--color-surface)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                              <div style={{
                                fontSize: '12px',
                                minWidth: '32px',
                                textAlign: 'center',
                                fontWeight: 600,
                                color: 'var(--color-warning)'
                              }}>
                                WARN
                              </div>
                              <div style={{ flex: 1 }}>
                                <span className="text-sm weight-medium text-warning font-mono">
                                  {check.name}
                                </span>
                                {check.value && (
                                  <span className="text-xs text-muted font-mono"> ({check.value})</span>
                                )}
                              </div>
                              <span className="badge warning">{check.categoryName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {failedChecks.length === 0 && warningChecks.length === 0 && (
                    <div className="alert-banner alert-banner-success">
                      <div className="alert-content">
                        <h3>All Checks Passed</h3>
                        <p>No critical or warning issues detected in security assessment.</p>
                      </div>
                    </div>
                  )}

                  {/* Behavioral Snapshot */}
                  {riskAnalysis?.behavioral_analysis && status.behavioralStatus === 'COMPLETE' && (
                    <div style={{
                      paddingTop: 'var(--space-2xl)',
                      marginTop: 'var(--space-2xl)',
                      borderTop: '1px solid var(--color-border-subtle)'
                    }}>
                      <div className="text-xs weight-semibold mb-lg" style={{
                        color: 'var(--color-text-secondary)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
                      }}>
                        Behavioral Snapshot
                      </div>
                      
                      {/* Active Sessions Note */}
                      {status.activeSessions > 0 && (
                        <div style={{
                          padding: 'var(--space-sm) var(--space-md)',
                          background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-accent-primary)',
                          marginBottom: 'var(--space-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)'
                        }}>
                          <div className="loading-spinner" style={{
                            width: '12px',
                            height: '12px',
                            borderWidth: '2px'
                          }}></div>
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            Based on <span className="weight-semibold">{status.completedSessions} analyzed session{status.completedSessions !== 1 ? 's' : ''}</span>
                            {' — '}
                            <span style={{ color: 'var(--color-accent-primary)' }}>{status.activeSessions} session{status.activeSessions !== 1 ? 's' : ''} still running</span>
                          </span>
                        </div>
                      )}
                      
                      {/* Show scores only if clusters formed */}
                      {riskAnalysis.behavioral_analysis.num_clusters >= 1 ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-lg)'
                        }}>
                          {/* Stability */}
                          <div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 'var(--space-xs)'
                            }}>
                              <Tooltip
                                content={BEHAVIORAL_TOOLTIPS.stability}
                                position="top"
                                delay={200}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-xs)',
                                  cursor: 'help'
                                }}>
                                  <span className="text-sm text-secondary weight-medium">Stability</span>
                                  <span style={{ opacity: 0.5, fontSize: '11px' }}>ⓘ</span>
                                </div>
                              </Tooltip>
                              <span className="font-mono text-md weight-bold text-primary">
                                {Math.round(riskAnalysis.behavioral_analysis.stability_score * 100)}%
                              </span>
                            </div>
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{
                                width: `${riskAnalysis.behavioral_analysis.stability_score * 100}%`,
                                background: 'var(--color-accent-primary)'
                              }}></div>
                            </div>
                          </div>
                          
                          {/* Predictability */}
                          <div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 'var(--space-xs)'
                            }}>
                              <Tooltip
                                content={BEHAVIORAL_TOOLTIPS.predictability}
                                position="top"
                                delay={200}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-xs)',
                                  cursor: 'help'
                                }}>
                                  <span className="text-sm text-secondary weight-medium">Predictability</span>
                                  <span style={{ opacity: 0.5, fontSize: '11px' }}>ⓘ</span>
                                </div>
                              </Tooltip>
                              <span className="font-mono text-md weight-bold text-primary">
                                {Math.round(riskAnalysis.behavioral_analysis.predictability_score * 100)}%
                              </span>
                            </div>
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{
                                width: `${riskAnalysis.behavioral_analysis.predictability_score * 100}%`,
                                background: 'var(--color-accent-primary)'
                              }}></div>
                            </div>
                          </div>
                          
                          {/* Confidence */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: 'var(--space-sm)'
                          }}>
                            <Tooltip
                              content={BEHAVIORAL_TOOLTIPS.confidence}
                              position="top"
                              delay={200}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-xs)',
                                cursor: 'help'
                              }}>
                                <span className="text-sm text-secondary weight-medium">Confidence</span>
                                <span style={{ opacity: 0.5, fontSize: '11px' }}>ⓘ</span>
                              </div>
                            </Tooltip>
                            <span className="badge" style={{
                              background: riskAnalysis.behavioral_analysis.confidence === 'high' 
                                ? 'var(--color-success-bg)' 
                                : riskAnalysis.behavioral_analysis.confidence === 'medium'
                                  ? 'var(--color-info-bg)'
                                  : 'var(--color-warning-bg)',
                              color: riskAnalysis.behavioral_analysis.confidence === 'high' 
                                ? 'var(--color-success)' 
                                : riskAnalysis.behavioral_analysis.confidence === 'medium'
                                  ? 'var(--color-info)'
                                  : 'var(--color-warning)',
                              border: `1px solid ${
                                riskAnalysis.behavioral_analysis.confidence === 'high' 
                                  ? 'var(--color-success-border)' 
                                  : riskAnalysis.behavioral_analysis.confidence === 'medium'
                                    ? 'var(--color-info-border)'
                                    : 'var(--color-warning-border)'
                              }`,
                              padding: 'var(--space-xs) var(--space-md)',
                              textTransform: 'capitalize'
                            }}>
                              {riskAnalysis.behavioral_analysis.confidence === 'high' 
                                ? 'High' 
                                : riskAnalysis.behavioral_analysis.confidence === 'medium'
                                  ? 'Medium'
                                  : 'Low'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: 'var(--space-md)',
                          background: 'var(--color-bg-elevated)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-medium)'
                        }}>
                          <div className="text-xs text-muted">
                            Behavioral scores require cluster formation. Once the agent has more sessions with similar patterns, detailed stability metrics will be available.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sessions Table */}
            <div id="sessions" className="card">
              <div className="card-header">
                <h2>Sessions ({data.sessions?.length || 0})</h2>
              </div>
              <div className="card-content">
                {data.sessions && data.sessions.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Session ID</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Messages</th>
                        <th>Tokens</th>
                        <th>Tools</th>
                        <th>Error Rate</th>
                        <th>Created</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessions.map(session => (
                        <tr key={session.id}>
                          <td>
                            <Link to={`/session/${session.id}`}>
                              {session.id.substring(0, 16)}{session.id.length > 16 ? '...' : ''}
                            </Link>
                          </td>
                          <td>
                            {session.is_active ? (
                              <span className="badge active">ACTIVE</span>
                            ) : (
                              <span className="badge inactive">COMPLETE</span>
                            )}
                          </td>
                          <td>{session.duration_minutes.toFixed(1)}m</td>
                          <td>{session.message_count}</td>
                          <td>{formatNumber(session.total_tokens)}</td>
                          <td>{session.tool_uses}</td>
                          <td>
                            {session.error_rate > 0 ? (
                              <span className={
                                session.error_rate > 20 ? 'text-error' :
                                session.error_rate > 10 ? 'text-warning' : 'text-muted'
                              }>
                                {session.error_rate.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-success">0%</span>
                            )}
                          </td>
                          <td className="text-muted">{timeAgo(session.created_at)}</td>
                          <td className="text-muted">{timeAgo(session.last_activity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-muted loading">
                    <p>No sessions found for this agent.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
