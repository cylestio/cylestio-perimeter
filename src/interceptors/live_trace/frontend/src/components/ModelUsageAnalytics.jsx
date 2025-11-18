import { useState } from 'react'
import { formatNumber } from '../utils/helpers'

export default function ModelUsageAnalytics({ analytics, agentId }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!analytics || !analytics.models || analytics.models.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Model Usage Analytics</h2>
        </div>
        <div className="card-content">
          <div className="text-center text-muted loading">
            No model usage data available yet
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'cost', label: 'Cost Analysis' },
    { id: 'trends', label: 'Trends' }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h2>Model Usage Analytics</h2>
      </div>
      
      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid var(--color-border-medium)',
        padding: '0 var(--space-2xl)',
        display: 'flex',
        gap: 'var(--space-sm)'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 'var(--space-md) var(--space-xl)',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid var(--color-accent-primary)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-mono)',
              transition: 'all var(--transition-fast)',
              marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card-content">
        {activeTab === 'overview' && <OverviewTab analytics={analytics} />}
        {activeTab === 'performance' && <PerformanceTab analytics={analytics} />}
        {activeTab === 'cost' && <CostTab analytics={analytics} />}
        {activeTab === 'trends' && <TrendsTab analytics={analytics} />}
      </div>
    </div>
  )
}

function OverviewTab({ analytics }) {
  const totalRequests = analytics.models.reduce((sum, m) => sum + m.requests, 0)
  
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3xl)' }}>
        {/* Model Request Distribution */}
        <div>
          <div className="text-xs weight-semibold mb-xs" style={{
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Request Distribution
          </div>
          <h3 className="text-lg weight-bold mb-lg">Model Request Distribution</h3>
          
          <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto var(--space-xl)' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {analytics.models.map((model, idx) => {
                const percent = (model.requests / totalRequests) * 100
                const colors = [
                  'var(--color-accent-primary)', 
                  'var(--color-accent-secondary)', 
                  'var(--color-accent-tertiary)',
                  '#f59e0b',
                  '#ef4444'
                ]
                const color = colors[idx % colors.length]
                
                // Calculate offset based on previous segments
                const previousPercent = analytics.models
                  .slice(0, idx)
                  .reduce((sum, m) => sum + (m.requests / totalRequests) * 100, 0)
                
                return (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke={color}
                    strokeWidth="20"
                    strokeDasharray={`${percent * 2.2} ${220 - percent * 2.2}`}
                    strokeDashoffset={`-${previousPercent * 2.2}`}
                    strokeLinecap="butt"
                  />
                )
              })}
            </svg>
            
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div className="text-3xl weight-bold font-mono" style={{ color: 'var(--color-accent-primary)' }}>
                {formatNumber(totalRequests)}
              </div>
              <div className="text-xs weight-semibold text-muted" style={{ 
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 'var(--space-xs)'
              }}>
                Requests
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-xs)',
            padding: 'var(--space-md)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)'
          }}>
            {analytics.models.map((model, idx) => {
              const percent = ((model.requests / totalRequests) * 100).toFixed(1)
              const colors = [
                'var(--color-accent-primary)', 
                'var(--color-accent-secondary)', 
                'var(--color-accent-tertiary)',
                '#f59e0b',
                '#ef4444'
              ]
              const color = colors[idx % colors.length]
              
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-md)',
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)'
                }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '2px', 
                    background: color,
                    flexShrink: 0
                  }}></div>
                  <span className="text-sm weight-medium" style={{ flex: 1 }}>{model.model}</span>
                  <span className="text-sm font-mono weight-semibold text-primary">
                    {formatNumber(model.requests)}
                  </span>
                  <span className="text-xs font-mono text-muted">
                    {percent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Model Comparison Table */}
        <div>
          <div className="text-xs weight-semibold mb-xs" style={{
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Key Metrics
          </div>
          <h3 className="text-lg weight-bold mb-lg">Model Comparison</h3>
          
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 'var(--space-sm)' }}>Model</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-sm)' }}>Requests</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-sm)' }}>Tokens</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-sm)' }}>Avg. Time</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-sm)' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {analytics.models.map((model, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 'var(--space-sm)' }} className="weight-medium">{model.model}</td>
                  <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }} className="font-mono">
                    {formatNumber(model.requests)}
                  </td>
                  <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }} className="font-mono">
                    {formatNumber(model.total_tokens)}
                  </td>
                  <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }} className="font-mono">
                    {(model.avg_response_time_ms / 1000).toFixed(2)}s
                  </td>
                  <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }} className="font-mono">
                    ${model.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PerformanceTab({ analytics }) {
  const maxResponseTime = Math.max(...analytics.models.map(m => m.avg_response_time_ms))
  const maxP95 = Math.max(...analytics.models.map(m => m.p95_response_time_ms))
  const maxValue = Math.max(maxResponseTime, maxP95)
  
  return (
    <div>
      <div className="text-xs weight-semibold mb-xs" style={{
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        Performance Metrics
      </div>
      <h3 className="text-lg weight-bold mb-md">Response Time Comparison</h3>
      <div className="text-sm text-muted mb-2xl">Average and P95 response times by model</div>
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: 'var(--space-2xl)',
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'var(--color-accent-primary)', 
            borderRadius: 'var(--radius-sm)' 
          }}></div>
          <span className="text-sm weight-medium">Avg Response Time (ms)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'var(--color-accent-secondary)', 
            borderRadius: 'var(--radius-sm)' 
          }}></div>
          <span className="text-sm weight-medium">p95 Response Time (ms)</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'space-around',
        gap: 'var(--space-lg)',
        minHeight: '320px',
        padding: 'var(--space-2xl)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: 'var(--space-xl)'
      }}>
        {analytics.models.map((model, idx) => {
          const avgHeight = Math.max((model.avg_response_time_ms / maxValue) * 100, 5)
          const p95Height = Math.max((model.p95_response_time_ms / maxValue) * 100, 5)
          
          return (
            <div key={idx} style={{ 
              flex: 1,
              maxWidth: '120px',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 'var(--space-md)'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--space-sm)', 
                alignItems: 'flex-end',
                height: '240px',
                width: '100%',
                justifyContent: 'center'
              }}>
                {/* Average bar */}
                <div style={{
                  width: '36px',
                  height: `${avgHeight}%`,
                  background: 'linear-gradient(180deg, var(--color-accent-primary) 0%, #0e7490 100%)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  position: 'relative',
                  transition: 'all var(--transition-base)',
                  boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)',
                  cursor: 'pointer'
                }} title={`Avg: ${model.avg_response_time_ms.toFixed(0)}ms`}>
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-accent-primary)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap'
                  }}>
                    {(model.avg_response_time_ms / 1000).toFixed(1)}s
                  </div>
                </div>
                
                {/* P95 bar */}
                <div style={{
                  width: '36px',
                  height: `${p95Height}%`,
                  background: 'linear-gradient(180deg, var(--color-accent-secondary) 0%, #6d28d9 100%)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  position: 'relative',
                  transition: 'all var(--transition-base)',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                  cursor: 'pointer'
                }} title={`P95: ${model.p95_response_time_ms.toFixed(0)}ms`}>
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-accent-secondary)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap'
                  }}>
                    {(model.p95_response_time_ms / 1000).toFixed(1)}s
                  </div>
                </div>
              </div>
              
              {/* Model name */}
              <div className="text-xs weight-semibold text-center font-mono" style={{ 
                width: '100%',
                wordBreak: 'break-word',
                lineHeight: '1.3',
                color: 'var(--color-text-secondary)'
              }}>
                {model.model}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CostTab({ analytics }) {
  const totalCost = analytics.token_summary.total_cost
  const maxCost = Math.max(...analytics.models.map(m => m.cost))
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
        <div>
          <div className="text-xs weight-semibold mb-xs" style={{
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Cost Breakdown
          </div>
          <h3 className="text-lg weight-bold mb-xs">Cost Analysis</h3>
          <div className="text-sm text-muted">Total cost and cost efficiency by model</div>
        </div>
        {analytics.token_summary.pricing_last_updated && (
          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'right'
            }}>
              <span style={{ fontWeight: 'var(--weight-medium)' }}>Pricing updated:</span>
              <br />
              <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                {new Date(analytics.token_summary.pricing_last_updated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Cost metrics */}
      <div style={{ marginBottom: 'var(--space-3xl)', marginTop: 'var(--space-2xl)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2xl) var(--space-3xl)',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-warning-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div className="text-xs weight-semibold mb-xs" style={{ 
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#92400e'
            }}>
              TOTAL COST
            </div>
            <div className="text-4xl weight-bold font-mono" style={{ color: 'var(--color-warning)' }}>
              ${totalCost.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-xs weight-semibold mb-xs" style={{ 
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#92400e'
            }}>
              COST PER 1K TOKENS
            </div>
            <div className="text-2xl weight-bold font-mono" style={{ color: '#d97706' }}>
              ${((totalCost / analytics.token_summary.total_tokens) * 1000).toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Cost by model */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {analytics.models.map((model, idx) => {
          const costPercent = (model.cost / maxCost) * 100
          const costPer1k = (model.cost / model.total_tokens) * 1000
          
          return (
            <div key={idx} style={{
              padding: 'var(--space-lg) var(--space-xl)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-medium)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-base)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-sm)'
              }}>
                <div style={{ flex: 1 }}>
                  <div className="text-md weight-bold font-mono" style={{ marginBottom: 'var(--space-xs)' }}>
                    {model.model}
                  </div>
                  <div className="text-xs text-muted font-mono">
                    {formatNumber(model.total_tokens)} tokens · {formatNumber(model.requests)} requests
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xl weight-bold font-mono" style={{ color: 'var(--color-warning)' }}>
                    ${model.cost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted font-mono">
                    ${costPer1k.toFixed(4)} per 1K
                  </div>
                </div>
              </div>
              
              <div style={{
                height: '8px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--color-border-subtle)',
                marginTop: 'var(--space-md)'
              }}>
                <div style={{
                  width: `${costPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-warning) 0%, #f59e0b 100%)',
                  transition: 'width var(--transition-slow)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrendsTab({ analytics }) {
  const [granularity, setGranularity] = useState('daily') // 'daily' only for now (hourly would need backend support)
  
  if (!analytics.timeline || analytics.timeline.length === 0) {
    return (
      <div className="text-center text-muted loading">
        No trend data available yet. Trends will appear as the agent processes more sessions over time.
      </div>
    )
  }

  // Sort timeline data, keeping "unknown" dates at the end
  const validTimeline = [...analytics.timeline]
    .filter(t => t.date && t.date !== 'unknown')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  
  // If no valid dates, show all data including "unknown"
  const timelineToShow = validTimeline.length > 0 ? validTimeline : analytics.timeline
  
  if (timelineToShow.length === 0) {
    return (
      <div className="text-center text-muted loading">
        Timeline data is being collected. Check back soon!
      </div>
    )
  }

  // Get date range
  const dateRange = timelineToShow.length > 0 ? {
    start: new Date(timelineToShow[0].date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }),
    end: new Date(timelineToShow[timelineToShow.length - 1].date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  } : null

  const maxRequests = Math.max(...timelineToShow.map(t => t.requests), 1)
  const maxTokens = Math.max(...timelineToShow.map(t => t.tokens), 1)
  const totalCost = timelineToShow.reduce((sum, t) => {
    // Calculate cost for this day's tokens
    const dayCost = (t.input_tokens / 1_000_000) * 3 + (t.output_tokens / 1_000_000) * 15
    return sum + dayCost
  }, 0)
  
  return (
    <div>
      {/* Header with granularity controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <div className="text-xs weight-semibold mb-xs" style={{
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Historical Data
          </div>
          <h3 className="text-lg weight-bold mb-xs">Model Usage Trends</h3>
          {dateRange && (
            <div className="text-sm text-muted">
              {dateRange.start} - {dateRange.end}
            </div>
          )}
        </div>
        
      </div>
      
      {/* Summary metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-3xl)'
      }}>
        <div style={{
          padding: 'var(--space-lg)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}>
          <div className="text-xs text-muted mb-xs weight-semibold">TOTAL REQUESTS</div>
          <div className="text-2xl weight-bold font-mono text-primary">
            {formatNumber(timelineToShow.reduce((sum, t) => sum + t.requests, 0))}
          </div>
          <div className="text-xs text-muted mt-xs">
            Avg {Math.round(timelineToShow.reduce((sum, t) => sum + t.requests, 0) / timelineToShow.length)} per day
          </div>
        </div>
        <div style={{
          padding: 'var(--space-lg)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}>
          <div className="text-xs text-muted mb-xs weight-semibold">TOTAL TOKENS</div>
          <div className="text-2xl weight-bold font-mono text-primary">
            {formatNumber(timelineToShow.reduce((sum, t) => sum + t.tokens, 0))}
          </div>
          <div className="text-xs text-muted mt-xs">
            Avg {formatNumber(Math.round(timelineToShow.reduce((sum, t) => sum + t.tokens, 0) / timelineToShow.length))} per day
          </div>
        </div>
      </div>
      
      {/* Combined Trend Chart */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)'
        }}>
          <div>
            <h4 className="text-md weight-bold">Usage Trends</h4>
            <div className="text-xs text-muted">Requests and token consumption over time</div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-lg)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ 
                width: '20px', 
                height: '3px', 
                background: 'var(--color-accent-primary)',
                borderRadius: '2px'
              }}></div>
              <span className="text-xs weight-medium">Requests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ 
                width: '20px', 
                height: '3px', 
                background: 'var(--color-accent-secondary)',
                borderRadius: '2px'
              }}></div>
              <span className="text-xs weight-medium">Tokens</span>
            </div>
          </div>
        </div>

        <div style={{ 
          minHeight: '400px',
          padding: 'var(--space-2xl) var(--space-3xl) var(--space-2xl) 60px',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          position: 'relative'
        }}>
          {/* Chart container */}
          <div style={{ position: 'relative', width: '100%', height: '320px' }}>
            <svg width="100%" height="100%" viewBox="0 0 1000 320" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="requestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="tokenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent-secondary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--color-accent-secondary)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={320 - (percent * 3.2)}
                  x2="1000"
                  y2={320 - (percent * 3.2)}
                  stroke="var(--color-border-subtle)"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  opacity="0.5"
                />
              ))}

              {/* Requests area and line */}
              {timelineToShow.length > 1 && (
                <>
                  <path
                    d={
                      timelineToShow.map((point, idx) => {
                        const x = (idx / (timelineToShow.length - 1)) * 1000
                        const y = 320 - ((point.requests / maxRequests) * 290)
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ') + ` L 1000 320 L 0 320 Z`
                    }
                    fill="url(#requestGradient)"
                  />
                  
                  <path
                    d={
                      timelineToShow.map((point, idx) => {
                        const x = (idx / (timelineToShow.length - 1)) * 1000
                        const y = 320 - ((point.requests / maxRequests) * 290)
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')
                    }
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Tokens area and line */}
              {timelineToShow.length > 1 && (
                <>
                  <path
                    d={
                      timelineToShow.map((point, idx) => {
                        const x = (idx / (timelineToShow.length - 1)) * 1000
                        const y = 320 - ((point.tokens / maxTokens) * 290)
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ') + ` L 1000 320 L 0 320 Z`
                    }
                    fill="url(#tokenGradient)"
                  />
                  
                  <path
                    d={
                      timelineToShow.map((point, idx) => {
                        const x = (idx / (timelineToShow.length - 1)) * 1000
                        const y = 320 - ((point.tokens / maxTokens) * 290)
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')
                    }
                    fill="none"
                    stroke="var(--color-accent-secondary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Data points for requests */}
              {timelineToShow.map((point, idx) => {
                const x = (idx / (timelineToShow.length - 1)) * 1000
                const y = 320 - ((point.requests / maxRequests) * 290)
                return (
                  <g key={`req-${idx}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="white"
                      stroke="var(--color-accent-primary)"
                      strokeWidth="3"
                    />
                  </g>
                )
              })}

              {/* Data points for tokens */}
              {timelineToShow.map((point, idx) => {
                const x = (idx / (timelineToShow.length - 1)) * 1000
                const y = 320 - ((point.tokens / maxTokens) * 290)
                return (
                  <g key={`tok-${idx}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="white"
                      stroke="var(--color-accent-secondary)"
                      strokeWidth="3"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Left Y-axis labels (Requests) */}
            <div style={{
              position: 'absolute',
              left: '-50px',
              top: '0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-end'
            }}>
              {[100, 75, 50, 25, 0].map((percent) => (
                <div key={percent} className="text-xs font-mono" style={{ color: 'var(--color-accent-primary)' }}>
                  {Math.round(maxRequests * percent / 100)}
                </div>
              ))}
            </div>

            {/* Right Y-axis labels (Tokens) */}
            <div style={{
              position: 'absolute',
              right: '-60px',
              top: '0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              {[100, 75, 50, 25, 0].map((percent) => (
                <div key={percent} className="text-xs font-mono" style={{ color: 'var(--color-accent-secondary)' }}>
                  {formatNumber(Math.round(maxTokens * percent / 100))}
                </div>
              ))}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: 'var(--space-lg)',
            paddingLeft: '0',
            paddingRight: '0'
          }}>
            {timelineToShow.map((point, idx) => {
              let formattedDate = 'Today'
              if (point.date && point.date !== 'unknown') {
                try {
                  formattedDate = new Date(point.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })
                } catch (e) {
                  formattedDate = point.date
                }
              }
              return (
                <div key={idx} className="text-xs weight-semibold font-mono text-center" style={{
                  color: 'var(--color-text-secondary)'
                }}>
                  {formattedDate}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

