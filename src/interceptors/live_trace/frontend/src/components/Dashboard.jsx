import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
      <div className="container">
        <h1 className="page-title">Live Trace Dashboard</h1>
        {/* Welcome Message - shown when no agents */}
        {!hasAgents && config && (
          <div className="welcome-card">
            <h2 className="welcome-title">
              Welcome to Cylestio Perimeter
            </h2>
            <p className="welcome-text">
              Your LLM proxy server is running and ready to monitor agent activity in real-time.
              Configure your agents to route requests through this proxy to see live traces, tool usage, and performance metrics.
            </p>

            <div className="config-display">
              <h3 className="text-md weight-semibold text-primary mb-md font-mono">
                Current Configuration
              </h3>
              <div className="config-item">
                <strong className="config-label">Provider:</strong>
                <code className="config-value">{config.provider_type}</code>
              </div>
              <div className="config-item mb-0">
                <strong className="config-label">Target URL:</strong>
                <code className="config-value text-xs">{config.provider_base_url}</code>
              </div>
            </div>

            <div className="alert-banner alert-banner-warning">
              <div className="alert-content">
                <h3>Configure Your Agent</h3>
                <p className="mb-sm">Set your agent's <code>base_url</code> to:</p>
                <div className="config-value font-mono weight-bold text-base">
                  http://{config.proxy_host === '0.0.0.0' ? 'localhost' : config.proxy_host}:{config.proxy_port}
                </div>
              </div>
            </div>

            <div className="alert-banner alert-banner-info">
              <div className="alert-content">
                <h3>Waiting for Agent Activity</h3>
                <p>Once your agent makes its first request, live traces will appear here automatically.</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Global Statistics - only show when we have agents */}
        {hasAgents && (
          <div className="stats-grid stats-grid-4col">
            <div className="stat-card">
              <h3>Active Sessions</h3>
              <div className="stat-value">{data.stats.active_sessions}</div>
              <div className="stat-change">{data.stats.total_sessions} total</div>
            </div>

            <div className="stat-card">
              <h3>Total Events</h3>
              <div className="stat-value">{formatNumber(data.stats.total_events)}</div>
              <div className="stat-change">{formatNumber(data.stats.events_per_minute)}/min</div>
            </div>

            <div className="stat-card">
              <h3>Avg Response</h3>
              <div className="stat-value">{formatDuration(data.stats.avg_response_time_ms)}</div>
              <div className="stat-change">all sessions</div>
            </div>

            <div className="stat-card">
              <h3>Total Tokens</h3>
              <div className="stat-value">{formatNumber(data.stats.total_tokens)}</div>
              <div className="stat-change">{data.stats.total_agents} agents</div>
            </div>
          </div>
        )}

        {/* Agents Table - only show when we have agents */}
        {hasAgents && (
        <div className="card">
          <div className="card-header">
            <h2>Agents</h2>
          </div>
          <div className="card-content">
            {data.agents && data.agents.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Agent ID</th>
                    <th>Sessions</th>
                    <th>Active</th>
                    <th>Messages</th>
                    <th>Tokens</th>
                    <th>Tools</th>
                    <th>Errors</th>
                    <th>Avg Response</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map(agent => (
                    <tr key={agent.id}>
                      <td>
                        <Link to={`/agent/${agent.id}`}>
                          {agent.id.substring(0, 16)}{agent.id.length > 16 ? '...' : ''}
                        </Link>
                      </td>
                      <td>{agent.total_sessions}</td>
                      <td>
                        {agent.active_sessions > 0 ? (
                          <span className="badge active">{agent.active_sessions}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>{formatNumber(agent.total_messages)}</td>
                      <td>{formatNumber(agent.total_tokens)}</td>
                      <td>{agent.total_tools}</td>
                      <td>
                        {agent.total_errors > 0 ? (
                          <span className="text-error">{agent.total_errors}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>{formatDuration(agent.avg_response_time_ms)}</td>
                      <td className="text-muted">{agent.last_seen_relative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-muted loading">
                <p>No agents found. Start making requests to see trace data here.</p>
              </div>
            )}
          </div>
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
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
  return value.toString()
}

function formatDuration(value) {
  if (typeof value !== 'number') return value
  if (value >= 1000) return (value / 1000).toFixed(1) + 's'
  return Math.round(value) + 'ms'
}
