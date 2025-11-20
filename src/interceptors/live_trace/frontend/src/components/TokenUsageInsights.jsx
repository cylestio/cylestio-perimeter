import { useMemo } from 'react'
import { formatNumber } from '../utils/helpers'

export default function TokenUsageInsights({ analytics }) {
  if (!analytics || !analytics.token_summary) {
    return null
  }

  const { token_summary } = analytics

  // Calculate percentages for pie chart
  const inputPercent = token_summary.total_tokens > 0
    ? (token_summary.input_tokens / token_summary.total_tokens * 100).toFixed(1)
    : 0
  const outputPercent = token_summary.total_tokens > 0
    ? (token_summary.output_tokens / token_summary.total_tokens * 100).toFixed(1)
    : 0

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Token Usage Insights</h2>
        {token_summary.pricing_last_updated && (
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}>
            <span>Pricing updated:</span>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>
              {new Date(token_summary.pricing_last_updated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        )}
      </div>
      <div className="card-content">
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-3xl)'
        }}>
          {/* Total Tokens */}
          <div className="stat-card">
            <h3>Total Tokens</h3>
            <div className="stat-value">{formatNumber(token_summary.total_tokens)}</div>
            <div className="stat-change">Across all models</div>
          </div>

          {/* Estimated Cost */}
          <div className="stat-card" style={{ borderLeftColor: 'var(--color-warning)' }}>
            <h3>Estimated Cost</h3>
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {token_summary.total_cost > 0 ? `$${token_summary.total_cost.toFixed(2)}` : '-'}
            </div>
            <div className="stat-change">
              {token_summary.total_cost > 0 ? 'Based on API pricing' : 'Pricing unavailable'}
            </div>
          </div>

          {/* Models Used */}
          <div className="stat-card" style={{ borderLeftColor: 'var(--color-accent-secondary)' }}>
            <h3>Models Used</h3>
            <div className="stat-value" style={{ color: 'var(--color-accent-secondary)' }}>
              {token_summary.models_used}
            </div>
            <div className="stat-change">Active in this period</div>
          </div>
        </div>

        {/* Token Distribution - Improved Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(400px, 1fr) minmax(500px, 1.2fr)', 
          gap: 'var(--space-4xl)',
          alignItems: 'start'
        }}>
          {/* Pie Chart */}
          <div>
            <div className="text-xs weight-semibold mb-xs" style={{
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Distribution by Type
            </div>
            <h3 className="text-lg weight-bold mb-lg">Input vs Output Tokens</h3>
            
            <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="var(--color-bg-tertiary)"
                  strokeWidth="15"
                />
                
                {/* Input tokens segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="var(--color-accent-primary)"
                  strokeWidth="15"
                  strokeDasharray={`${inputPercent * 2.2} ${220 - inputPercent * 2.2}`}
                  strokeLinecap="butt"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(8, 145, 178, 0.3))' }}
                />
                
                {/* Output tokens segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="var(--color-accent-secondary)"
                  strokeWidth="15"
                  strokeDasharray={`${outputPercent * 2.2} ${220 - outputPercent * 2.2}`}
                  strokeDashoffset={`-${inputPercent * 2.2}`}
                  strokeLinecap="butt"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' }}
                />
              </svg>
              
              {/* Center text */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div className="text-3xl weight-bold font-mono" style={{ color: 'var(--color-accent-primary)' }}>
                  {formatNumber(token_summary.total_tokens)}
                </div>
                <div className="text-xs weight-semibold text-muted" style={{ 
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginTop: 'var(--space-xs)'
                }}>
                  Total
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-md)',
              marginTop: 'var(--space-2xl)',
              padding: 'var(--space-md)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <div style={{ padding: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '2px',
                    background: 'var(--color-accent-primary)'
                  }}></div>
                  <div className="text-xs weight-semibold text-muted" style={{ 
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Input Tokens
                  </div>
                </div>
                <div className="text-lg weight-bold font-mono text-primary">
                  {formatNumber(token_summary.input_tokens)}
                </div>
                <div className="text-xs text-muted font-mono">
                  {inputPercent}% of total
                </div>
              </div>
              
              <div style={{ padding: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '2px',
                    background: 'var(--color-accent-secondary)'
                  }}></div>
                  <div className="text-xs weight-semibold text-muted" style={{ 
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Output Tokens
                  </div>
                </div>
                <div className="text-lg weight-bold font-mono text-primary">
                  {formatNumber(token_summary.output_tokens)}
                </div>
                <div className="text-xs text-muted font-mono">
                  {outputPercent}% of total
                </div>
              </div>
            </div>
          </div>

          {/* Token Usage by Model */}
          <div>
            <div className="text-xs weight-semibold mb-xs" style={{
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Model Breakdown
            </div>
            <h3 className="text-lg weight-bold mb-lg">Token Usage by Model</h3>
            
            {analytics.models && analytics.models.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {analytics.models.slice(0, 5).map((model, idx) => {
                  const modelPercent = (model.total_tokens / token_summary.total_tokens * 100).toFixed(1)
                  return (
                    <div key={idx}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-xs)'
                      }}>
                        <span className="text-sm weight-medium">{model.model}</span>
                        <span className="text-sm font-mono text-primary weight-bold">
                          {formatNumber(model.total_tokens)}
                        </span>
                      </div>
                      <div style={{
                        height: '32px',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: '1px solid var(--color-border-subtle)',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          width: `${modelPercent}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${idx === 0 ? 'var(--color-accent-primary)' : 'var(--color-accent-secondary)'}, ${idx === 0 ? '#0e7490' : '#6d28d9'})`,
                          transition: 'width var(--transition-slow)',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 'var(--space-sm)'
                        }}>
                          {modelPercent > 15 && (
                            <span className="text-xs weight-semibold font-mono" style={{ color: 'white' }}>
                              {modelPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: 'var(--space-xs)'
                      }}>
                        <span className="text-xs text-muted font-mono">
                          {formatNumber(model.input_tokens)} in
                        </span>
                        <span className="text-xs text-muted font-mono">
                          {formatNumber(model.output_tokens)} out
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted" style={{ padding: 'var(--space-xl)' }}>
                No model data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

