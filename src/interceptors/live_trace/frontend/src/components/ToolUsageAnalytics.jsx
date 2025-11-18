import { useState } from 'react'
import { formatNumber } from '../utils/helpers'

export default function ToolUsageAnalytics({ analytics }) {
  const [activeTab, setActiveTab] = useState('usage')

  if (!analytics || !analytics.tools || analytics.tools.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Tool Usage Analysis</h2>
        </div>
        <div className="card-content">
          <div className="text-center text-muted" style={{ padding: 'var(--space-4xl)' }}>
            No tool usage data available yet
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'usage', label: 'Tool Usage' },
    { id: 'slow', label: 'Slow Tools' },
    { id: 'trends', label: 'Execution Trends' }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h2>Tool Usage Analysis</h2>
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
        {activeTab === 'usage' && <UsageTab analytics={analytics} />}
        {activeTab === 'slow' && <SlowToolsTab analytics={analytics} />}
        {activeTab === 'trends' && <TrendsTab analytics={analytics} />}
      </div>
    </div>
  )
}

function UsageTab({ analytics }) {
  const totalExecutions = analytics.tools.reduce((sum, t) => sum + t.executions, 0)
  const maxExecutions = Math.max(...analytics.tools.map(t => t.executions))
  
  return (
    <div>
      <div className="text-xs weight-semibold mb-xs" style={{
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        Execution Frequency
      </div>
      <h3 className="text-lg weight-bold mb-lg">Tool Execution Frequency</h3>
      
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '200px' }}>Tool Name</th>
            <th>Executions</th>
            <th style={{ width: '100px', textAlign: 'right' }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {analytics.tools.map((tool, idx) => {
            const percent = (tool.executions / maxExecutions) * 100
            const colors = ['#93c5fd', '#c4b5fd', '#a7f3d0', '#fde68a', '#fca5a5', 
                           '#94a3b8', '#a78bfa', '#86efac', '#fcd34d', '#fb923c']
            const color = colors[idx % colors.length]
            
            return (
              <tr key={idx}>
                <td className="weight-medium">{tool.tool}</td>
                <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 'var(--space-md)'
                  }}>
                    <div style={{ 
                      flex: 1,
                      height: '24px',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: color,
                        transition: 'width var(--transition-base)'
                      }}></div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }} className="font-mono weight-bold text-primary">
                  {tool.executions}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SlowToolsTab({ analytics }) {
  // Sort tools by average duration
  const sortedTools = [...analytics.tools]
    .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
  
  // Check if we have any duration data
  const hasDurationData = sortedTools.some(t => t.avg_duration_ms > 0)
  
  if (sortedTools.length === 0) {
    return (
      <div className="text-center text-muted loading">
        No tool data available yet
      </div>
    )
  }

  // If no duration data, show tools sorted by executions instead
  const displayTools = hasDurationData ? sortedTools : [...analytics.tools].sort((a, b) => b.executions - a.executions)
  const maxValue = hasDurationData 
    ? Math.max(...displayTools.map(t => t.avg_duration_ms), 1)
    : Math.max(...displayTools.map(t => t.executions), 1)
  
  return (
    <div>
      <div className="text-xs weight-semibold mb-xs" style={{
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        Performance Analysis
      </div>
      <h3 className="text-lg weight-bold mb-md">Tool Performance Overview</h3>
      <div className="text-sm text-muted mb-2xl">
        {hasDurationData ? 'Average execution times and failure rates' : 'Tool execution frequency (duration data not available)'}
      </div>
      
      {!hasDurationData && (
        <div style={{
          padding: 'var(--space-md)',
          background: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-2xl)',
          color: 'var(--color-warning)'
        }}>
          <div className="text-sm weight-semibold mb-xs">Duration Data Missing</div>
          <div className="text-xs">
            Tool execution times are not being tracked. Make sure tool events include <code style={{
              padding: '2px 4px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)'
            }}>tool.duration_ms</code> attribute. Showing execution frequency instead.
          </div>
        </div>
      )}
      
      {/* Performance comparison chart */}
      <div style={{ 
        padding: 'var(--space-3xl) var(--space-2xl)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: 'var(--space-3xl)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--space-xl)'
        }}>
          {displayTools.map((tool, idx) => {
            const value = hasDurationData ? tool.avg_duration_ms : tool.executions
            const widthPercent = (value / maxValue) * 100
            const colors = hasDurationData ? [
              '#ef4444', // red - slowest
              '#f59e0b', // amber
              '#eab308', // yellow
              '#84cc16', // lime
              '#22c55e'  // green - fastest
            ] : [
              '#6366f1', // indigo - most used
              '#8b5cf6', // violet
              '#a855f7', // purple
              '#c084fc', // light purple
              '#d8b4fe'  // lightest purple
            ]
            const colorIdx = Math.min(Math.floor((idx / displayTools.length) * colors.length), colors.length - 1)
            const color = colors[colorIdx]
            
            return (
              <div key={idx}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-xs)',
                  alignItems: 'baseline'
                }}>
                  <span className="text-sm weight-semibold">{tool.tool}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'baseline' }}>
                    <span className="text-xs text-muted">
                      {tool.executions} calls
                    </span>
                    <span className={`text-sm font-mono weight-bold ${tool.failure_rate > 10 ? 'text-error' : 'text-primary'}`}>
                      {hasDurationData ? `${(tool.avg_duration_ms / 1000).toFixed(2)}s` : `${tool.executions} execs`}
                    </span>
                  </div>
                </div>
                <div style={{
                  height: '40px',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-subtle)',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${widthPercent}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                    transition: 'width var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 'var(--space-md)',
                    gap: 'var(--space-md)'
                  }}>
                    {hasDurationData && widthPercent > 20 && (
                      <span className="text-xs weight-semibold font-mono" style={{ color: 'white' }}>
                        Max: {(tool.max_duration_ms / 1000).toFixed(2)}s
                      </span>
                    )}
                    {tool.failure_rate > 0 && widthPercent > 40 && (
                      <span className="text-xs weight-semibold" style={{ 
                        color: 'white',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {tool.failure_rate.toFixed(1)}% fail
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 'var(--space-lg)' 
      }}>
        {hasDurationData ? (
          <>
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div className="text-xs text-muted mb-xs weight-semibold">SLOWEST TOOL</div>
              <div className="text-lg weight-bold font-mono text-error mb-xs">
                {(displayTools[0].avg_duration_ms / 1000).toFixed(2)}s
              </div>
              <div className="text-sm text-primary">{displayTools[0].tool}</div>
            </div>
            
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div className="text-xs text-muted mb-xs weight-semibold">FASTEST TOOL</div>
              <div className="text-lg weight-bold font-mono text-success mb-xs">
                {(displayTools[displayTools.length - 1].avg_duration_ms / 1000).toFixed(2)}s
              </div>
              <div className="text-sm text-primary">{displayTools[displayTools.length - 1].tool}</div>
            </div>
            
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div className="text-xs text-muted mb-xs weight-semibold">AVG PERFORMANCE</div>
              <div className="text-lg weight-bold font-mono text-primary mb-xs">
                {(displayTools.reduce((sum, t) => sum + t.avg_duration_ms, 0) / displayTools.length / 1000).toFixed(2)}s
              </div>
              <div className="text-sm text-muted">Across all tools</div>
            </div>
          </>
        ) : (
          <>
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div className="text-xs text-muted mb-xs weight-semibold">MOST USED TOOL</div>
              <div className="text-lg weight-bold font-mono text-primary mb-xs">
                {displayTools[0].executions}
              </div>
              <div className="text-sm text-primary">{displayTools[0].tool}</div>
            </div>
            
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div className="text-xs text-muted mb-xs weight-semibold">TOTAL EXECUTIONS</div>
              <div className="text-lg weight-bold font-mono text-primary mb-xs">
                {displayTools.reduce((sum, t) => sum + t.executions, 0)}
              </div>
              <div className="text-sm text-muted">All tools combined</div>
            </div>
            
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div className="text-xs text-muted mb-xs weight-semibold">TOOLS TRACKED</div>
              <div className="text-lg weight-bold font-mono text-primary mb-xs">
                {displayTools.length}
              </div>
              <div className="text-sm text-muted">Unique tools</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TrendsTab({ analytics }) {
  const [selectedTools, setSelectedTools] = useState(
    analytics.tools.slice(0, Math.min(3, analytics.tools.length)).map(t => t.tool)
  )
  
  // Check if we have tool timeline data
  if (!analytics.tool_timeline || analytics.tool_timeline.length === 0) {
    return (
      <div className="text-center text-muted loading">
        Tool timeline data is being collected. Check back soon!
      </div>
    )
  }

  // Sort timeline and filter valid dates
  const validTimeline = [...analytics.tool_timeline]
    .filter(t => t.date && t.date !== 'unknown')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  
  if (validTimeline.length === 0) {
    return (
      <div className="text-center text-muted loading">
        Tool timeline data is being collected. Check back soon!
      </div>
    )
  }

  // Get date range
  const dateRange = {
    start: new Date(validTimeline[0].date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }),
    end: new Date(validTimeline[validTimeline.length - 1].date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444'  // red
  ]
  
  const toggleTool = (toolName) => {
    if (selectedTools.includes(toolName)) {
      setSelectedTools(selectedTools.filter(t => t !== toolName))
    } else if (selectedTools.length < 3) {
      setSelectedTools([...selectedTools, toolName])
    }
  }

  // Calculate max executions for scaling
  const maxExecutions = Math.max(...validTimeline.map(day => 
    Math.max(...selectedTools.map(tool => day.tools[tool]?.executions || 0))
  ), 1)
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <div className="text-xs weight-semibold mb-xs" style={{
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Historical Data
          </div>
          <h3 className="text-lg weight-bold mb-xs">Tool Execution Trends</h3>
          {dateRange && (
            <div className="text-sm text-muted">
              {dateRange.start} - {dateRange.end}
            </div>
          )}
        </div>
      </div>

      {/* Tool selection */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-lg)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)'
      }}>
        {analytics.tools.map((tool, idx) => {
          const isSelected = selectedTools.includes(tool.tool)
          const colorIdx = selectedTools.indexOf(tool.tool)
          const color = colorIdx >= 0 ? colors[colorIdx] : '#d1d5db'
          
          return (
            <button
              key={idx}
              onClick={() => toggleTool(tool.tool)}
              disabled={!isSelected && selectedTools.length >= 3}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: 'var(--space-xs) var(--space-md)',
                background: isSelected ? 'white' : 'transparent',
                border: `2px solid ${isSelected ? color : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: !isSelected && selectedTools.length >= 3 ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: isSelected ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                color: isSelected ? color : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
                opacity: !isSelected && selectedTools.length >= 3 ? 0.4 : 1
              }}
            >
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%',
                background: isSelected ? color : 'transparent',
                border: `2px solid ${isSelected ? color : 'var(--color-border-subtle)'}`
              }}></div>
              {tool.tool}
              {isSelected && ' ×'}
            </button>
          )
        })}
      </div>

      {/* Trend chart */}
      {selectedTools.length > 0 ? (
        <div style={{ 
          minHeight: '400px',
          padding: 'var(--space-2xl) var(--space-3xl) var(--space-2xl) 60px',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', width: '100%', height: '320px' }}>
            <svg width="100%" height="100%" viewBox="0 0 1000 320" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                {selectedTools.map((tool, idx) => (
                  <linearGradient key={`gradient-${idx}`} id={`toolGradient${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors[idx]} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={colors[idx]} stopOpacity="0.02" />
                  </linearGradient>
                ))}
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

              {/* Draw lines and areas for each selected tool */}
              {selectedTools.map((toolName, toolIdx) => {
                const color = colors[toolIdx]
                
                return (
                  <g key={toolName}>
                    {/* Area fill */}
                    <path
                      d={
                        validTimeline.map((day, idx) => {
                          const x = (idx / (validTimeline.length - 1)) * 1000
                          const executions = day.tools[toolName]?.executions || 0
                          const y = 320 - ((executions / maxExecutions) * 290)
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ') + ` L 1000 320 L 0 320 Z`
                      }
                      fill={`url(#toolGradient${toolIdx})`}
                    />
                    
                    {/* Line */}
                    <path
                      d={
                        validTimeline.map((day, idx) => {
                          const x = (idx / (validTimeline.length - 1)) * 1000
                          const executions = day.tools[toolName]?.executions || 0
                          const y = 320 - ((executions / maxExecutions) * 290)
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ')
                      }
                      fill="none"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {validTimeline.map((day, idx) => {
                      const x = (idx / (validTimeline.length - 1)) * 1000
                      const executions = day.tools[toolName]?.executions || 0
                      const y = 320 - ((executions / maxExecutions) * 290)
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="white"
                          stroke={color}
                          strokeWidth="3"
                        />
                      )
                    })}
                  </g>
                )
              })}
            </svg>

            {/* Y-axis labels */}
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
                <div key={percent} className="text-xs font-mono text-muted">
                  {Math.round(maxExecutions * percent / 100)}
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
            {validTimeline.map((day, idx) => {
              const formattedDate = new Date(day.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })
              return (
                <div key={idx} className="text-xs weight-semibold font-mono text-center" style={{
                  color: 'var(--color-text-secondary)'
                }}>
                  {formattedDate}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-2xl)',
            marginTop: 'var(--space-2xl)',
            padding: 'var(--space-md)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)'
          }}>
            {selectedTools.map((tool, idx) => (
              <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <div style={{
                  width: '20px',
                  height: '3px',
                  background: colors[idx],
                  borderRadius: '2px'
                }}></div>
                <span className="text-xs weight-medium">{tool}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-muted" style={{ 
          padding: 'var(--space-4xl)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)'
        }}>
          <div className="text-md weight-medium mb-xs" style={{ color: 'var(--color-text-secondary)' }}>
            No Tools Selected
          </div>
          <div className="text-sm">Select up to 3 tools above to view execution trends</div>
        </div>
      )}
    </div>
  )
}

