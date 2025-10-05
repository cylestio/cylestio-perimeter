import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Timeline from './Timeline'

export default function SessionPage() {
  const { sessionId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        const json = await res.json()
        if (json.error) {
          console.error('Error:', json.error)
        } else {
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch session data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [sessionId])

  if (loading) {
    return (
      <div className="container">
        <div className="text-center text-muted" style={{ padding: '40px' }}>
          Loading session...
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="container">
        <div className="text-center text-muted" style={{ padding: '40px' }}>
          {data?.error || 'Failed to load session data'}
        </div>
      </div>
    )
  }

  const session = data.session
  const utilizationPct = session.available_tools && session.available_tools.length > 0
    ? Math.round((Object.keys(session.tool_usage_details || {}).length / session.available_tools.length) * 100)
    : 0

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>🔍 Session Details</h1>
          <nav className="nav">
            <Link to="/">Dashboard</Link>
            <a href="/api/stats" target="_blank">API</a>
          </nav>
        </div>
      </div>

      <div className="container full-width">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link to="/" className="text-muted">Dashboard</Link>
          {' / '}
          <Link to={`/agent/${session.agent_id}`} className="text-muted">
            {session.agent_id.substring(0, 16)}{session.agent_id.length > 16 ? '...' : ''}
          </Link>
          {' / '}
          <strong>{sessionId.substring(0, 16)}{sessionId.length > 16 ? '...' : ''}</strong>
        </div>

        {/* Three-column layout */}
        <div className="session-layout">
          {/* LEFT COLUMN: Session Info */}
          <div className="session-left">
            <div className="card">
              <div className="card-header">
                <h2>📊 Session Info</h2>
              </div>
              <div className="card-content">
                <div style={{ marginBottom: '12px' }}>
                  <strong>Session ID</strong><br />
                  <span className="text-muted" style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                    {sessionId}
                  </span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Agent ID</strong><br />
                  <Link to={`/agent/${session.agent_id}`} className="text-muted" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                    {session.agent_id}
                  </Link>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Status</strong><br />
                  {session.is_active ? (
                    <span className="badge active">ACTIVE</span>
                  ) : (
                    <span className="badge inactive">COMPLETE</span>
                  )}
                </div>
                <div>
                  <strong>Duration</strong><br />
                  <span className="text-muted">{session.duration_minutes.toFixed(1)} minutes</span>
                </div>
              </div>
            </div>

            {/* Session Metrics */}
            <div className="stat-card-compact">
              <div>
                <h3>Total Events</h3>
              </div>
              <div className="stat-value">{session.total_events}</div>
            </div>

            <div className="stat-card-compact">
              <div>
                <h3>Messages</h3>
                <div className="stat-change" style={{ fontSize: '10px', color: '#6b7280' }}>
                  LLM exchanges
                </div>
              </div>
              <div className="stat-value">{session.message_count}</div>
            </div>

            <div className="stat-card-compact">
              <div>
                <h3>Total Tokens</h3>
              </div>
              <div className="stat-value">{formatNumber(session.total_tokens)}</div>
            </div>

            <div className="stat-card-compact">
              <div>
                <h3>Tool Uses</h3>
                <div className="stat-change" style={{ fontSize: '10px', color: '#6b7280' }}>
                  {session.errors > 0 ? (
                    <span className="text-error">{session.errors} errors</span>
                  ) : (
                    'no errors'
                  )}
                </div>
              </div>
              <div className="stat-value">{session.tool_uses}</div>
            </div>
          </div>

          {/* CENTER COLUMN: Event Timeline */}
          <div className="session-center">
            <div className="card">
              <div className="card-header">
                <h2>🕐 Event Timeline ({data.events?.length || 0} events)</h2>
              </div>
              <div className="card-content">
                {data.timeline && data.timeline.length > 0 ? (
                  <Timeline timeline={data.timeline} />
                ) : (
                  <div className="text-center text-muted" style={{ padding: '40px' }}>
                    <p>No events found for this session.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Recommendations */}
          <div className="session-right">
            <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
              <div className="card-content" style={{ padding: '12px 16px' }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'white' }}>📊 Recommendations</h2>
              </div>
            </div>

            {/* Tool Utilization */}
            {session.available_tools && session.available_tools.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2>🔧 Tool Utilization</h2>
                </div>
                <div className="card-content">
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#4b5563' }}>
                        {Object.keys(session.tool_usage_details || {}).length} of {session.available_tools.length} tools used
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>
                        {utilizationPct}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${utilizationPct}%`, background: '#6366f1', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>

                  {utilizationPct < 30 && (
                    <div style={{ background: '#fef3c7', borderLeft: '3px solid #f59e0b', padding: '10px', marginTop: '12px', fontSize: '11px', color: '#92400e', borderRadius: '3px' }}>
                      <strong>Low Utilization</strong><br />
                      Consider reviewing available tools to optimize agent capabilities.
                    </div>
                  )}

                  {utilizationPct > 80 && (
                    <div style={{ background: '#d1fae5', borderLeft: '3px solid #10b981', padding: '10px', marginTop: '12px', fontSize: '11px', color: '#065f46', borderRadius: '3px' }}>
                      <strong>Excellent!</strong><br />
                      High tool utilization indicates efficient agent behavior.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Placeholder for future recommendations */}
            <div className="card" style={{ border: '2px dashed #e5e7eb' }}>
              <div className="card-content" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💡</div>
                <div style={{ fontSize: '12px' }}>More recommendations coming soon</div>
              </div>
            </div>
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
