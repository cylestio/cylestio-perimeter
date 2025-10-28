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
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: 'var(--space-xl)',
              marginBottom: 'var(--space-3xl)'
            }}>
              {data.agents.map(agent => (
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
                    borderLeft: '3px solid var(--color-accent-primary)',
                    padding: 'var(--space-xl)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-secondary)'
                    e.currentTarget.style.transform = 'translateY(-6px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}>
                    <div className="card-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        flex: 1
                      }}>
                        <div className="font-mono text-md weight-bold text-primary" style={{
                          wordBreak: 'break-all'
                        }}>
                          {agent.id.substring(0, 20)}{agent.id.length > 20 ? '...' : ''}
                        </div>
                      </div>
                      {agent.risk_status === 'ok' && (
                        <span className="badge" style={{
                          marginLeft: 'var(--space-md)',
                          background: 'var(--color-success-bg)',
                          color: 'var(--color-success)',
                          border: '1px solid var(--color-success-border)'
                        }}>
                          OK
                        </span>
                      )}
                      {agent.risk_status === 'warning' && (
                        <span className="badge" style={{
                          marginLeft: 'var(--space-md)',
                          background: 'var(--color-warning-bg)',
                          color: 'var(--color-warning)',
                          border: '1px solid var(--color-warning-border)'
                        }}>
                          WARNING
                        </span>
                      )}
                      {agent.risk_status === 'evaluating' && (
                        <span className="badge" style={{
                          marginLeft: 'var(--space-md)',
                          background: 'var(--color-info-bg)',
                          color: 'var(--color-accent-primary)',
                          border: '1px solid var(--color-info-border)'
                        }}>
                          EVALUATING
                        </span>
                      )}
                    </div>
                    <div className="card-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-muted weight-semibold mb-xs">SESSIONS</div>
                            <div className="font-mono text-lg weight-bold" style={{ color: 'var(--color-accent-primary)' }}>
                              {agent.total_sessions}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-muted weight-semibold mb-xs">USED TOOLS</div>
                            <div className="font-mono text-lg weight-bold" style={{ color: 'var(--color-accent-primary)' }}>
                              {agent.unique_tools}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-muted weight-semibold mb-xs">AVG TOKENS</div>
                            <div className="font-mono text-lg weight-bold" style={{ color: 'var(--color-accent-primary)' }}>
                              {agent.total_sessions > 0 ? formatNumber(Math.round(agent.total_tokens / agent.total_sessions)) : 0}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: 'var(--space-md)',
                          paddingTop: 'var(--space-md)',
                          borderTop: '1px solid var(--color-border-subtle)'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-muted weight-semibold mb-xs">TOTAL TOKENS</div>
                            <div className="font-mono text-sm text-secondary">
                              {formatNumber(agent.total_tokens)}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-muted weight-semibold mb-xs">ERRORS</div>
                            <div className="font-mono text-sm" style={{
                              color: agent.total_errors > 0 ? 'var(--color-critical)' : 'var(--color-text-muted)'
                            }}>
                              {agent.total_errors}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-muted weight-semibold mb-xs">AVG RESPONSE</div>
                            <div className="font-mono text-sm text-secondary">
                              {formatDuration(agent.avg_response_time_ms)}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                          paddingTop: 'var(--space-sm)'
                        }}>
                          Last seen: {agent.last_seen_relative}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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
