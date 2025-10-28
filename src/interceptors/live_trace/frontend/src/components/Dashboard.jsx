import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import WelcomeCard from './WelcomeCard'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard')
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const json = await res.json()
        setConfig(json)
      } catch (error) {
        console.error('Failed to fetch config:', error)
      }
    }

    fetchData()
    fetchConfig()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <div className="loading text-muted">
          Failed to load dashboard data
        </div>
      </div>
    )
  }

  const hasAgents = data.agents && data.agents.length > 0

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
      <div className="container">
        {/* Welcome Message - shown when no agents */}
        {!hasAgents && <WelcomeCard config={config} />}

        {/* Latest Active Session Banner */}
        {data.latest_session && (
          <div className="card card-elevated mb-2xl" style={{
            background: 'linear-gradient(135deg, var(--color-accent-secondary) 0%, var(--color-accent-primary) 100%)',
            border: '2px solid var(--color-accent-primary)'
          }}>
            <div className="card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="text-xs weight-semibold mb-sm" style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    letterSpacing: '0.08em'
                  }}>
                    LATEST ACTIVE SESSION
                  </div>
                  <div className="text-lg weight-bold font-mono mb-sm" style={{ color: 'white' }}>
                    {data.latest_session.id.substring(0, 16)}...
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Agent: {data.latest_session.agent_id.substring(0, 12)}... • {data.latest_session.message_count} messages • {data.latest_session.duration_minutes.toFixed(1)}m
                  </div>
                </div>
                <Link
                  to={`/session/${data.latest_session.id}`}
                  className="text-md weight-semibold"
                  style={{
                    background: 'white',
                    color: 'var(--color-accent-secondary)',
                    padding: 'var(--space-md) var(--space-xl)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    border: '2px solid white'
                  }}
                >
                  View Live →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Agents Cards - only show when we have agents */}
        {hasAgents && (
        <div>
          <h2 className="text-lg weight-bold font-mono mb-xl" style={{ letterSpacing: '-0.01em' }}>
            Agents
          </h2>
          {data.agents && data.agents.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
              gap: 'var(--space-xl)',
              marginBottom: 'var(--space-3xl)'
            }}>
              {data.agents.map(agent => {
                // Determine priority badge (highest priority only)
                const getPriorityBadge = () => {
                  if (agent.analysis_summary?.action_required) {
                    return {
                      label: 'ACTION REQUIRED',
                      bg: 'var(--color-critical-bg)',
                      color: 'var(--color-critical)',
                      border: 'var(--color-critical-border)'
                    }
                  }
                  if (agent.risk_status === 'warning') {
                    return {
                      label: 'WARNING',
                      bg: 'var(--color-warning-bg)',
                      color: 'var(--color-warning)',
                      border: 'var(--color-warning-border)'
                    }
                  }
                  if (agent.risk_status === 'ok') {
                    return {
                      label: 'OK',
                      bg: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      border: 'var(--color-success-border)'
                    }
                  }
                  return null
                }
                
                const priorityBadge = getPriorityBadge()
                
                return (
                  <Link
                    key={agent.id}
                    to={`/agent/${agent.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="card" style={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      marginBottom: 0,
                      boxShadow: 'var(--shadow-md)',
                      borderLeft: `4px solid ${
                        agent.analysis_summary?.action_required 
                          ? 'var(--color-critical)' 
                          : agent.risk_status === 'warning' 
                            ? 'var(--color-warning)' 
                            : 'var(--color-accent-primary)'
                      }`,
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-secondary)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    }}>
                      {/* Priority Badge at Top */}
                      {priorityBadge && (
                        <div style={{
                          background: priorityBadge.bg,
                          borderBottom: `1px solid ${priorityBadge.border}`,
                          padding: 'var(--space-xs) var(--space-lg)',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--weight-bold)',
                            color: priorityBadge.color,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.05em'
                          }}>
                            {priorityBadge.label}
                          </span>
                        </div>
                      )}
                      
                      {/* Agent Header */}
                      <div style={{
                        padding: 'var(--space-lg) var(--space-xl)'
                      }}>
                        <div className="font-mono text-md weight-bold text-primary" style={{
                          wordBreak: 'break-all',
                          marginBottom: 'var(--space-xs)'
                        }}>
                          {agent.id.substring(0, 26)}{agent.id.length > 26 ? '...' : ''}
                        </div>
                        <div className="text-xs text-muted">
                          Last seen: {agent.last_seen_relative}
                        </div>
                      </div>
                      
                      {/* Main Metrics Grid */}
                      <div style={{ 
                        padding: 'var(--space-md) var(--space-xl) var(--space-lg)',
                        borderBottom: '1px solid var(--color-border-subtle)'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 'var(--space-lg)'
                        }}>
                          <div>
                            <div className="text-xs text-muted weight-semibold mb-xs" style={{ letterSpacing: '0.05em' }}>
                              SESSIONS
                            </div>
                            <div className="font-mono text-2xl weight-bold" style={{ 
                              color: 'var(--color-accent-primary)',
                              lineHeight: 1.1
                            }}>
                              {agent.total_sessions}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted weight-semibold mb-xs" style={{ letterSpacing: '0.05em' }}>
                              USED TOOLS
                            </div>
                            <div className="font-mono text-2xl weight-bold" style={{ 
                              color: 'var(--color-accent-primary)',
                              lineHeight: 1.1
                            }}>
                              {agent.unique_tools}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted weight-semibold mb-xs" style={{ letterSpacing: '0.05em' }}>
                              AVG TOKENS
                            </div>
                            <div className="font-mono text-2xl weight-bold" style={{ 
                              color: 'var(--color-accent-primary)',
                              lineHeight: 1.1
                            }}>
                              {agent.total_sessions > 0 ? formatNumber(Math.round(agent.total_tokens / agent.total_sessions)) : 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Analysis Summary Section */}
                      {agent.total_sessions < agent.min_sessions_required ? (
                        <div style={{
                          padding: 'var(--space-xl)',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-sm)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-secondary)'
                          }}>
                            <div className="loading-spinner" style={{
                              width: '12px',
                              height: '12px',
                              borderWidth: '2px'
                            }}></div>
                            <span>Analyzing... <span className="font-mono weight-semibold">({agent.total_sessions}/{agent.min_sessions_required})</span></span>
                          </div>
                        </div>
                      ) : agent.analysis_summary ? (
                        <div style={{ padding: 'var(--space-xl)' }}>
                          {/* Security Assessment */}
                          <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <div className="text-xs weight-semibold mb-md" style={{
                              color: 'var(--color-text-secondary)',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase'
                            }}>
                              Security Assessment
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 'var(--space-xl)'
                            }}>
                              <div>
                                <div className="text-xs text-muted mb-xs">Failed Checks</div>
                                <div className="font-mono weight-bold" style={{
                                  fontSize: '28px',
                                  lineHeight: 1,
                                  color: agent.analysis_summary.failed_checks > 0 ? 'var(--color-critical)' : 'var(--color-success)'
                                }}>
                                  {agent.analysis_summary.failed_checks}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted mb-xs">Warnings</div>
                                <div className="font-mono weight-bold" style={{
                                  fontSize: '28px',
                                  lineHeight: 1,
                                  color: agent.analysis_summary.warnings > 0 ? 'var(--color-warning)' : 'var(--color-success)'
                                }}>
                                  {agent.analysis_summary.warnings}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Behavioral Snapshot */}
                          {agent.analysis_summary.behavioral && (
                            <div style={{
                              paddingTop: 'var(--space-xl)',
                              borderTop: '1px solid var(--color-border-subtle)'
                            }}>
                              <div className="text-xs weight-semibold mb-md" style={{
                                color: 'var(--color-text-secondary)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase'
                              }}>
                                Behavioral Snapshot
                              </div>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-md)'
                              }}>
                                {/* Stability */}
                                <div>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 'var(--space-xs)'
                                  }}>
                                    <span className="text-sm text-secondary weight-medium">Stability</span>
                                    <span className="font-mono text-md weight-bold text-primary">
                                      {Math.round(agent.analysis_summary.behavioral.stability * 100)}%
                                    </span>
                                  </div>
                                  <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{
                                      width: `${agent.analysis_summary.behavioral.stability * 100}%`,
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
                                    <span className="text-sm text-secondary weight-medium">Predictability</span>
                                    <span className="font-mono text-md weight-bold text-primary">
                                      {Math.round(agent.analysis_summary.behavioral.predictability * 100)}%
                                    </span>
                                  </div>
                                  <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{
                                      width: `${agent.analysis_summary.behavioral.predictability * 100}%`,
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
                                  <span className="text-sm text-secondary weight-medium">Confidence</span>
                                  <span className="badge" style={{
                                    background: agent.analysis_summary.behavioral.confidence === 'high' 
                                      ? 'var(--color-success-bg)' 
                                      : agent.analysis_summary.behavioral.confidence === 'medium'
                                        ? 'var(--color-info-bg)'
                                        : 'var(--color-warning-bg)',
                                    color: agent.analysis_summary.behavioral.confidence === 'high' 
                                      ? 'var(--color-success)' 
                                      : agent.analysis_summary.behavioral.confidence === 'medium'
                                        ? 'var(--color-info)'
                                        : 'var(--color-warning)',
                                    border: `1px solid ${
                                      agent.analysis_summary.behavioral.confidence === 'high' 
                                        ? 'var(--color-success-border)' 
                                        : agent.analysis_summary.behavioral.confidence === 'medium'
                                          ? 'var(--color-info-border)'
                                          : 'var(--color-warning-border)'
                                    }`,
                                    padding: 'var(--space-xs) var(--space-md)'
                                  }}>
                                    {agent.analysis_summary.behavioral.confidence === 'high' 
                                      ? 'High' 
                                      : agent.analysis_summary.behavioral.confidence === 'medium'
                                        ? 'Medium'
                                        : 'Low'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-muted loading">
              <p>No agents found. Start making requests to see trace data here.</p>
            </div>
          )}
        </div>
        )}

        {/* Recent Sessions - only show when we have agents */}
        {hasAgents && (
        <div className="card">
          <div className="card-header">
            <h2>Recent Sessions</h2>
          </div>
          <div className="card-content">
            {data.sessions && data.sessions.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Messages</th>
                    <th>Tokens</th>
                    <th>Tools</th>
                    <th>Errors</th>
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
                        <Link to={`/agent/${session.agent_id}`}>
                          {session.agent_id.substring(0, 16)}{session.agent_id.length > 16 ? '...' : ''}
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
                        {session.errors > 0 ? (
                          <span className="text-error">{session.errors}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td className="text-muted">{session.last_activity_relative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted loading">
                <p>No sessions found. Start making requests to see session data here.</p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </>
  )
}

function formatNumber(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M'
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K'
  return value.toString()
}

function formatDuration(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000) return (value / 1000).toFixed(0) + 's'
  return Math.round(value) + 'ms'
}
