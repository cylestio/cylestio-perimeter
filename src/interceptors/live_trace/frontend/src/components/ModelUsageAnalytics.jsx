import { useState } from 'react'
import { formatNumber } from '../utils/helpers'

export default function ModelUsageAnalytics({ analytics, agentId }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!analytics || !analytics.models || analytics.models.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>📈 Model Usage Analytics</h2>
        </div>
        <div className="card-content">
          <div className="text-center text-muted" style={{ padding: 'var(--space-4xl)' }}>
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
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: '16px', height: '16px', background: '#93c5fd', borderRadius: 'var(--radius-sm)' }}></div>
          <span className="text-sm weight-medium">Response Time (ms)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: '16px', height: '16px', background: '#c4b5fd', borderRadius: 'var(--radius-sm)' }}></div>
          <span className="text-sm weight-medium">p95 Response Time (ms)</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: 'var(--space-3xl)',
        height: '300px',
        padding: '0 var(--space-2xl)',
        marginBottom: 'var(--space-xl)'
      }}>
        {analytics.models.map((model, idx) => {
          const avgHeight = (model.avg_response_time_ms / maxValue) * 100
          const p95Height = (model.p95_response_time_ms / maxValue) * 100
          
          return (
            <div key={idx} style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--space-xs)', 
                alignItems: 'flex-end',
                height: '250px'
              }}>
                {/* Average bar */}
                <div style={{
                  width: '40px',
                  height: `${avgHeight}%`,
                  background: '#93c5fd',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  position: 'relative',
                  transition: 'all var(--transition-base)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {model.avg_response_time_ms.toFixed(0)}ms
                  </div>
                </div>
                
                {/* P95 bar */}
                <div style={{
                  width: '40px',
                  height: `${p95Height}%`,
                  background: '#c4b5fd',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  position: 'relative',
                  transition: 'all var(--transition-base)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {model.p95_response_time_ms.toFixed(0)}ms
                  </div>
                </div>
              </div>
              
              {/* Model name */}
              <div className="text-xs weight-medium text-center" style={{ 
                maxWidth: '100px',
                wordWrap: 'break-word'
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
      <div className="text-xs weight-semibold mb-xs" style={{
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        Cost Breakdown
      </div>
      <h3 className="text-lg weight-bold mb-md">Cost Analysis</h3>
      <div className="text-sm text-muted mb-2xl">Total cost and cost efficiency by model</div>
      
      {/* Cost metrics */}
      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--space-xl)',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-warning-border)'
        }}>
          <div style={{ flex: 1 }}>
            <div className="text-xs text-muted mb-xs weight-semibold">TOTAL COST</div>
            <div className="text-3xl weight-bold font-mono" style={{ color: 'var(--color-warning)' }}>
              ${totalCost.toFixed(2)}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div className="text-xs text-muted mb-xs weight-semibold">COST PER 1K TOKENS</div>
            <div className="text-xl weight-bold font-mono" style={{ color: 'var(--color-warning)' }}>
              ${((totalCost / analytics.token_summary.total_tokens) * 1000).toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Cost by model */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {analytics.models.map((model, idx) => {
          const costPercent = (model.cost / maxCost) * 100
          const costPer1k = (model.cost / model.total_tokens) * 1000
          
          return (
            <div key={idx} style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-medium)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 'var(--space-md)'
              }}>
                <div>
                  <div className="text-md weight-semibold">{model.model}</div>
                  <div className="text-xs text-muted">
                    {formatNumber(model.total_tokens)} tokens across {formatNumber(model.requests)} requests
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-lg weight-bold font-mono" style={{ color: 'var(--color-warning)' }}>
                    ${model.cost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted">
                    ${costPer1k.toFixed(4)} per 1K
                  </div>
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill warning" 
                  style={{ width: `${costPercent}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-muted" style={{ 
        marginTop: 'var(--space-2xl)',
        padding: 'var(--space-md)',
        background: 'var(--color-bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        fontStyle: 'italic'
      }}>
        * Total Cost uses square root scale to display both large and small values effectively
      </div>
    </div>
  )
}

function TrendsTab({ analytics }) {
  if (!analytics.timeline || analytics.timeline.length === 0) {
    return (
      <div className="text-center text-muted" style={{ padding: 'var(--space-4xl)' }}>
        No trend data available yet
      </div>
    )
  }

  const maxRequests = Math.max(...analytics.timeline.map(t => t.requests))
  const maxTokens = Math.max(...analytics.timeline.map(t => t.tokens))
  
  return (
    <div>
      <div className="text-xs weight-semibold mb-xs" style={{
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        Historical Data
      </div>
      <h3 className="text-lg weight-bold mb-md">Model Usage Trends</h3>
      <div className="text-sm text-muted mb-2xl">Request volumes and costs over time</div>
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: 'var(--space-2xl)',
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: '16px', height: '4px', background: '#93c5fd', borderRadius: 'var(--radius-sm)' }}></div>
          <span className="text-sm weight-medium">Requests</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: '16px', height: '4px', background: '#10b981', borderRadius: 'var(--radius-sm)' }}></div>
          <span className="text-sm weight-medium">Cost ($)</span>
        </div>
      </div>

      {/* Simple line chart visualization */}
      <div style={{ 
        height: '200px',
        position: 'relative',
        padding: 'var(--space-lg)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)'
      }}>
        {analytics.timeline.map((point, idx) => (
          <div key={idx} style={{
            position: 'absolute',
            left: `${(idx / (analytics.timeline.length - 1)) * 90 + 5}%`,
            bottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '8px',
              height: `${(point.requests / maxRequests) * 150}px`,
              background: '#93c5fd',
              borderRadius: 'var(--radius-sm)',
              margin: '0 auto var(--space-xs)',
              minHeight: '4px'
            }}></div>
            <div className="text-xs text-muted font-mono" style={{
              transform: 'rotate(-45deg)',
              transformOrigin: 'center',
              width: '60px',
              marginLeft: '-26px'
            }}>
              {point.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

