import { useState } from 'react'
import { formatNumber } from '../utils/helpers'

export default function ToolUsageAnalytics({ analytics }) {
  const [activeTab, setActiveTab] = useState('usage')

  if (!analytics || !analytics.tools || analytics.tools.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>🔧 Tool Usage Analysis</h2>
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
  // Define threshold for "slow" tools (in milliseconds)
  const SLOW_THRESHOLD_MS = 5000 // 5 seconds
  
  // Filter and sort tools by average duration
  const sortedTools = [...analytics.tools]
    .filter(t => t.avg_duration_ms > 0)
    .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
  
  return (
    <div>
      <div className="text-xs weight-semibold mb-xs" style={{
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        Performance Analysis
      </div>
      <h3 className="text-lg weight-bold mb-lg">Tools with Execution Times Above Thresholds</h3>
      
      {sortedTools.length > 0 ? (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Tool Name</th>
              <th style={{ textAlign: 'left' }}>Type</th>
              <th style={{ textAlign: 'right' }}>Avg Duration</th>
              <th style={{ textAlign: 'right' }}>Max Duration</th>
              <th style={{ textAlign: 'right' }}>Call Count</th>
              <th style={{ textAlign: 'right' }}>Failure Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedTools.map((tool, idx) => {
              const isVerySlow = tool.avg_duration_ms > SLOW_THRESHOLD_MS
              const hasFails = tool.failure_rate > 0
              
              return (
                <tr key={idx} style={{
                  background: isVerySlow ? 'var(--color-critical-bg)' : 'transparent'
                }}>
                  <td className="weight-medium">{tool.tool}</td>
                  <td>
                    <span className="badge" style={{
                      background: 'var(--color-accent-primary)',
                      color: 'white'
                    }}>
                      External
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`font-mono weight-semibold ${isVerySlow ? 'text-error' : ''}`}>
                      {(tool.avg_duration_ms / 1000).toFixed(2)}s
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-mono">
                    {(tool.max_duration_ms / 1000).toFixed(2)}s
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-mono">
                    {tool.executions}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`font-mono ${
                      tool.failure_rate > 50 ? 'text-error' : 
                      tool.failure_rate > 10 ? 'text-warning' : 
                      'text-success'
                    }`}>
                      {tool.failure_rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center text-muted" style={{ padding: 'var(--space-4xl)' }}>
          No slow tools detected
        </div>
      )}

      {sortedTools.length > 0 && (
        <div style={{
          marginTop: 'var(--space-2xl)',
          padding: 'var(--space-lg)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-medium)'
        }}>
          <h4 className="text-sm weight-semibold mb-sm">Performance Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)' }}>
            <div>
              <div className="text-xs text-muted">Slowest Tool</div>
              <div className="text-md weight-semibold font-mono text-primary">
                {sortedTools[0].tool}
              </div>
              <div className="text-xs text-muted">
                {(sortedTools[0].avg_duration_ms / 1000).toFixed(2)}s avg
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Highest Failure Rate</div>
              <div className="text-md weight-semibold font-mono text-warning">
                {Math.max(...sortedTools.map(t => t.failure_rate)).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Total Tools Analyzed</div>
              <div className="text-md weight-semibold font-mono text-primary">
                {sortedTools.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrendsTab({ analytics }) {
  const [selectedTools, setSelectedTools] = useState(
    analytics.tools.slice(0, 5).map(t => t.tool)
  )
  
  const colors = {
    0: '#6366f1', // indigo
    1: '#8b5cf6', // violet
    2: '#10b981', // emerald
    3: '#f59e0b', // amber
    4: '#ef4444'  // red
  }
  
  const toggleTool = (toolName) => {
    if (selectedTools.includes(toolName)) {
      setSelectedTools(selectedTools.filter(t => t !== toolName))
    } else if (selectedTools.length < 5) {
      setSelectedTools([...selectedTools, toolName])
    }
  }
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <div className="text-xs weight-semibold mb-xs" style={{
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Comparative Analysis
          </div>
          <h3 className="text-lg weight-bold mb-xs">Tool Executions by Tool</h3>
          <div className="text-sm text-muted">Select up to 5 tools to compare</div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            style={{
              background: 'var(--color-accent-primary)',
              color: 'white',
              border: 'none',
              padding: 'var(--space-xs) var(--space-md)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            Aggregated
          </button>
          <button
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-medium)',
              padding: 'var(--space-xs) var(--space-md)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            By Tool
          </button>
        </div>
      </div>

      {/* Legend with tool selection */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-2xl)',
        padding: 'var(--space-lg)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)'
      }}>
        {analytics.tools.slice(0, 10).map((tool, idx) => {
          const isSelected = selectedTools.includes(tool.tool)
          const colorIdx = selectedTools.indexOf(tool.tool)
          const color = colorIdx >= 0 ? colors[colorIdx] : '#d1d5db'
          
          return (
            <button
              key={idx}
              onClick={() => toggleTool(tool.tool)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: 'var(--space-xs) var(--space-md)',
                background: isSelected ? 'var(--color-surface)' : 'transparent',
                border: `1px solid ${isSelected ? color : 'var(--color-border-medium)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: isSelected ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
                opacity: !isSelected && selectedTools.length >= 5 ? 0.5 : 1
              }}
              disabled={!isSelected && selectedTools.length >= 5}
            >
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%',
                background: color,
                border: isSelected ? 'none' : '2px solid var(--color-border-medium)'
              }}></div>
              {tool.tool}
              {isSelected && ' ×'}
            </button>
          )
        })}
      </div>

      {/* Simple visualization */}
      <div style={{
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2xl)'
      }}>
        {selectedTools.length > 0 ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {selectedTools.map((toolName, idx) => {
              const tool = analytics.tools.find(t => t.tool === toolName)
              const maxExec = Math.max(...selectedTools.map(t => 
                analytics.tools.find(tool => tool.tool === t)?.executions || 0
              ))
              const percent = (tool.executions / maxExec) * 100
              
              return (
                <div key={idx}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    <span className="text-sm weight-medium">{toolName}</span>
                    <span className="text-sm font-mono weight-bold text-primary">
                      {tool.executions} executions
                    </span>
                  </div>
                  <div style={{
                    height: '20px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: colors[idx],
                      transition: 'width var(--transition-base)'
                    }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-muted text-center" style={{ padding: 'var(--space-2xl)' }}>
            <div className="text-md weight-medium mb-xs" style={{ color: 'var(--color-text-secondary)' }}>
              No Tools Selected
            </div>
            <div className="text-sm">Select tools above to view execution trends</div>
          </div>
        )}
      </div>

      {/* Add more tools section */}
      {analytics.tools.length > 10 && (
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-md)',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <div className="text-xs text-muted">
            <strong>Add more tools to compare:</strong>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-sm)',
            justifyContent: 'center'
          }}>
            {analytics.tools.slice(10).map((tool, idx) => (
              <button
                key={idx}
                onClick={() => toggleTool(tool.tool)}
                disabled={selectedTools.length >= 5 && !selectedTools.includes(tool.tool)}
                style={{
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  opacity: selectedTools.length >= 5 && !selectedTools.includes(tool.tool) ? 0.5 : 1
                }}
              >
                {tool.tool} ({tool.executions})
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedTools.length === 0 && (
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          background: 'var(--color-info-bg)',
          border: '1px solid var(--color-info-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-info)'
        }}>
          <div className="text-sm weight-semibold mb-xs">No tools selected</div>
          <div className="text-xs">Click on tool names above to select up to 5 tools for comparison</div>
        </div>
      )}
    </div>
  )
}

