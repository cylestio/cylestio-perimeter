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
        <div className="text-center text-muted" style={{ padding: '40px' }}>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <div className="text-center text-muted" style={{ padding: '40px' }}>
          Failed to load dashboard data
        </div>
      </div>
    )
  }

  const hasAgents = data.agents && data.agents.length > 0

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>🔍 Live Trace Dashboard</h1>
          <nav className="nav">
            <Link to="/" className="active">Dashboard</Link>
            <a href="/api/stats" target="_blank">API</a>
          </nav>
        </div>
      </div>

      <div className="container">
        {/* Welcome Message - shown when no agents */}
        {!hasAgents && config && (
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: '#1e40af', marginBottom: '16px', fontSize: '24px' }}>
              👋 Welcome to Cylestio Perimeter
            </h2>
            <p style={{ color: '#1e3a8a', marginBottom: '24px', fontSize: '16px', lineHeight: '1.6' }}>
              Your LLM proxy server is running and ready to monitor agent activity in real-time.
              Configure your agents to route requests through this proxy to see live traces, tool usage, and performance metrics.
            </p>

            <div style={{
              background: 'white',
              borderRadius: '6px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#1e40af', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                📋 Current Configuration
              </h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#374151', minWidth: '140px' }}>Provider:</strong>
                  <code style={{
                    background: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    color: '#6366f1',
                    fontFamily: 'monospace'
                  }}>
                    {config.provider_type}
                  </code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#374151', minWidth: '140px' }}>Target URL:</strong>
                  <code style={{
                    background: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    color: '#6366f1',
                    fontFamily: 'monospace',
                    fontSize: '13px'
                  }}>
                    {config.provider_base_url}
                  </code>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#92400e', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                🔧 Configure Your Agent
              </h3>
              <p style={{ color: '#78350f', marginBottom: '12px', fontSize: '14px' }}>
                Set your agent's <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '3px' }}>base_url</code> to:
              </p>
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '15px',
                color: '#92400e',
                fontWeight: 600
              }}>
                http://{config.proxy_host === '0.0.0.0' ? 'localhost' : config.proxy_host}:{config.proxy_port}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#166534'
            }}>
              <div style={{ fontSize: '20px' }}>⏱️</div>
              <div>
                <strong>Waiting for agent activity...</strong><br />
                <span style={{ fontSize: '13px', color: '#15803d' }}>
                  Once your agent makes its first request, live traces will appear here automatically.
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Latest Active Session Banner */}
        {data.latest_session && (
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            padding: '16px 20px',
            marginBottom: '16px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                🔴 LATEST ACTIVE SESSION
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'monospace' }}>
                {data.latest_session.id.substring(0, 16)}...
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>
                Agent: {data.latest_session.agent_id.substring(0, 12)}... • {data.latest_session.message_count} messages • {data.latest_session.duration_minutes.toFixed(1)}m
              </div>
            </div>
            <Link
              to={`/session/${data.latest_session.id}`}
              style={{
                background: 'white',
                color: '#4f46e5',
                padding: '8px 16px',
                borderRadius: '3px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              View Live →
            </Link>
          </div>
        )}

        {/* Global Statistics - only show when we have agents */}
        {hasAgents && (
          <div className="stats-grid">
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
            <h2>🤖 Agents</h2>
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
              <div className="text-center text-muted" style={{ padding: '24px' }}>
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
            <h2>📋 Recent Sessions</h2>
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
              <div className="text-center text-muted" style={{ padding: '24px' }}>
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
