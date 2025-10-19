import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Timeline from './Timeline'
import InfoCard from './InfoCard'
import { formatNumber } from '../utils/helpers'

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
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading session...
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="container">
        <div className="loading text-muted">
          {data?.error || 'Failed to load session data'}
        </div>
      </div>
    )
  }

  const session = data.session

  return (
    <>
      <div className="container">
        <h1 className="page-title">Session Details</h1>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/agent/${session.agent_id}`}>
            {session.agent_id.substring(0, 16)}{session.agent_id.length > 16 ? '...' : ''}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <strong className="text-primary">{sessionId.substring(0, 16)}{sessionId.length > 16 ? '...' : ''}</strong>
        </div>

        {/* Three-column layout */}
        <div className="session-layout">
          {/* LEFT COLUMN: Session Info */}
          <div className="session-left">
            <InfoCard
              title="Session Info"
              primaryLabel="SESSION ID"
              primaryValue={sessionId}
              stats={[
                {
                  label: 'AGENT ID',
                  badge: (
                    <Link to={`/agent/${session.agent_id}`} className="text-xs font-mono">
                      {session.agent_id}
                    </Link>
                  )
                },
                {
                  label: 'STATUS',
                  badge: session.is_active ? (
                    <span className="badge active">ACTIVE</span>
                  ) : (
                    <span className="badge inactive">COMPLETE</span>
                  )
                },
                {
                  label: 'DURATION',
                  value: `${session.duration_minutes.toFixed(1)} minutes`
                }
              ]}
            />

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
                <div className="stat-change">LLM exchanges</div>
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
                <div className="stat-change">
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
                <h2>Event Timeline ({data.events?.length || 0} events)</h2>
              </div>
              <div className="card-content">
                {data.timeline && data.timeline.length > 0 ? (
                  <Timeline timeline={data.timeline} />
                ) : (
                  <div className="loading text-muted">
                    <p>No events found for this session.</p>
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
