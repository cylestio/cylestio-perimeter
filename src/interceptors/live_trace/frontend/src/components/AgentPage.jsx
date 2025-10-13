import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

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
        <div className="text-center text-muted" style={{ padding: '40px' }}>
          Loading agent...
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="container">
        <div className="text-center text-muted" style={{ padding: '40px' }}>
          {data?.error || 'Failed to load agent data'}
        </div>
      </div>
    )
  }

  const agent = data.agent

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>🔍 Agent Details</h1>
          <nav className="nav">
            <Link to="/">Dashboard</Link>
            <a href="/api/stats" target="_blank">API</a>
          </nav>
        </div>
      </div>

      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link to="/" className="text-muted">Dashboard</Link>
          {' / '}
          <strong>{agentId.substring(0, 16)}{agentId.length > 16 ? '...' : ''}</strong>
        </div>

        {/* Agent Overview */}
        <div className="card">
          <div className="card-header">
            <h2>🤖 Agent Overview</h2>
          </div>
          <div className="card-content">
            <div className="stats-grid">
              <div>
                <strong>Full Agent ID</strong><br />
                <span className="text-muted" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {agent.id}
                </span>
              </div>
              <div>
                <strong>First Seen</strong><br />
                <span className="text-muted">{timeAgo(agent.first_seen)}</span>
              </div>
              <div>
                <strong>Last Seen</strong><br />
                <span className="text-muted">{timeAgo(agent.last_seen)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sessions</h3>
            <div className="stat-value">{agent.total_sessions}</div>
            <div className="stat-change">lifetime sessions</div>
          </div>

          <div className="stat-card">
            <h3>Total Messages</h3>
            <div className="stat-value">{formatNumber(agent.total_messages)}</div>
            <div className="stat-change">{agent.avg_messages_per_session?.toFixed(1)} avg per session</div>
          </div>

          <div className="stat-card">
            <h3>Total Tokens</h3>
            <div className="stat-value">{formatNumber(agent.total_tokens)}</div>
            <div className="stat-change">across all sessions</div>
          </div>

          <div className="stat-card">
            <h3>Avg Response Time</h3>
            <div className="stat-value">{formatDuration(agent.avg_response_time_ms)}</div>
            <div className="stat-change">{agent.total_tools} tool uses</div>
          </div>
        </div>

        {/* Risk Report Section */}
        <div className="card">
          <div className="card-header">
            <h2>⚠️ Risk Report</h2>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Tools Utilization */}
              <div style={{
                padding: '20px',
                background: '#fafafa',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                  🔧 Tools Utilization
                </h3>
                {agent.available_tools && agent.available_tools.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {agent.used_tools.length} of {agent.available_tools.length} tools used
                        </span>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: agent.tools_utilization_percent === 100 ? '#10b981' :
                                 agent.tools_utilization_percent >= 50 ? '#f59e0b' : '#ef4444'
                        }}>
                          {agent.tools_utilization_percent}%
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${agent.tools_utilization_percent}%`,
                          height: '100%',
                          background: agent.tools_utilization_percent === 100 ? '#10b981' :
                                     agent.tools_utilization_percent >= 50 ? '#f59e0b' : '#ef4444',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                    {agent.tools_utilization_percent < 100 && (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '4px',
                        padding: '10px',
                        fontSize: '12px',
                        color: '#92400e'
                      }}>
                        <strong>💡 Recommendation:</strong> Consider narrowing down the available tools exposed to the agent to improve efficiency and reduce attack surface.
                      </div>
                    )}
                    {agent.tools_utilization_percent === 100 && (
                      <div style={{
                        background: '#d1fae5',
                        border: '1px solid #10b981',
                        borderRadius: '4px',
                        padding: '10px',
                        fontSize: '12px',
                        color: '#065f46'
                      }}>
                        <strong>✅ Excellent:</strong> All available tools are being utilized effectively.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                    No tool data available yet
                  </div>
                )}
              </div>

              {/* Behaviour Consistency and Stability */}
              <div style={{
                padding: '20px',
                background: '#fafafa',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                  📊 Behaviour Consistency & Stability
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '140px',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚧</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Coming Soon</div>
                  <div style={{ fontSize: '12px', textAlign: 'center' }}>
                    Analysis of agent behavior patterns<br />and stability metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Available Tools */}
          {agent.available_tools && agent.available_tools.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2>🛠️ Available Tools ({agent.available_tools.length})</h2>
              </div>
              <div className="card-content">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {agent.available_tools.sort().map(tool => (
                    <span
                      key={tool}
                      style={{
                        background: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#4b5563'
                      }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Used Tools */}
          {agent.used_tools && agent.used_tools.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2>✅ Tools Used ({agent.used_tools.length})</h2>
              </div>
              <div className="card-content">
                {agent.tool_usage_details && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(agent.tool_usage_details)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([tool, count]) => (
                          <div
                            key={tool}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 0'
                            }}
                          >
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4b5563' }}>
                              {tool}
                            </span>
                            <span
                              style={{
                                background: '#6366f1',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '2px',
                                fontSize: '10px',
                                fontWeight: 600
                              }}
                            >
                              {count}×
                            </span>
                          </div>
                        ))}
                    </div>
                    {Object.keys(agent.tool_usage_details).length > 10 && (
                      <div className="text-muted" style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px' }}>
                        ... and {Object.keys(agent.tool_usage_details).length - 10} more
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sessions Table */}
        <div className="card">
          <div className="card-header">
            <h2>📋 Sessions ({data.sessions?.length || 0})</h2>
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
                          <span
                            className={
                              session.error_rate > 20
                                ? 'text-error'
                                : session.error_rate > 10
                                ? 'text-warning'
                                : 'text-muted'
                            }
                          >
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
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                <p>No sessions found for this agent.</p>
              </div>
            )}
          </div>
        </div>
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

function timeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}
