import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Tooltip from './Tooltip'
import AgentSidebar from './AgentSidebar'
import EvaluationProgress from './EvaluationProgress'
import ClusterVisualization from './ClusterVisualization'
import {
  formatNumber,
  getScoreClass,
  getSeverityBg,
  getSeverityBorder,
  getCategoryIcon,
  getCategoryHeaderColor,
  getCategoryBorderColor,
  getCheckStatusClass,
  getAgentStatus
} from '../utils/helpers'

// Component to display PII findings with clickable sessions
function PIIFindingsDisplay({ evidence }) {
  const [expandedSessions, setExpandedSessions] = useState({})

  const detailedFindings = evidence.detailed_findings || []

  // Group findings by session with entity type breakdown
  const sessionsList = evidence.findings_by_session
    ? Object.entries(evidence.findings_by_session)
        .map(([sessionId, count]) => {
          // Get findings for this session
          const sessionFindings = detailedFindings.filter(f => f.session_id === sessionId)

          // Calculate entity type breakdown
          const entityBreakdown = sessionFindings.reduce((acc, finding) => {
            acc[finding.entity_type] = (acc[finding.entity_type] || 0) + 1
            return acc
          }, {})

          return {
            sessionId,
            count,
            entityBreakdown,
            findings: sessionFindings
          }
        })
        .sort((a, b) => b.count - a.count)
    : []

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }))
  }

  return (
    <div>
      {/* Summary Stats Box */}
      <div style={{
        padding: 'var(--space-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-md)',
        border: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2xl)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>
            <span className="text-xs text-muted">Total Findings</span>
            <span className="text-md weight-bold text-primary font-mono"> {evidence.total_findings || 0}</span>
          </span>
          {evidence.high_confidence_count > 0 && (
            <span>
              <span className="text-xs text-muted">High Confidence</span>
              <span className="text-md weight-bold font-mono" style={{ color: 'var(--color-critical)' }}>
                {' '}{evidence.high_confidence_count}
              </span>
            </span>
          )}
          {evidence.medium_confidence_count > 0 && (
            <span>
              <span className="text-xs text-muted">Medium Confidence</span>
              <span className="text-md weight-bold font-mono" style={{ color: 'var(--color-warning)' }}>
                {' '}{evidence.medium_confidence_count}
              </span>
            </span>
          )}
          <span>
            <span className="text-xs text-muted">Sessions with PII</span>
            <span className="text-md weight-bold text-primary font-mono"> {sessionsList.length}</span>
          </span>
        </div>
      </div>

      {/* Entity Type Badges */}
      {evidence.findings_by_type && Object.keys(evidence.findings_by_type).length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {Object.entries(evidence.findings_by_type).map(([entityType, count]) => (
              <span
                key={entityType}
                className="font-mono"
                style={{
                  padding: '4px 8px',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-medium)',
                  fontSize: '12px'
                }}
              >
                {entityType}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sessions Section */}
      {sessionsList.length > 0 && (
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
            SESSIONS WITH PII ({sessionsList.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {sessionsList.map(({ sessionId, entityBreakdown, findings }) => {
              const isExpanded = expandedSessions[sessionId]

              return (
                <div
                  key={sessionId}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-medium)'
                  }}
                >
                  {/* Session Header */}
                  <div
                    style={{
                      padding: 'var(--space-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-md)'
                    }}
                  >
                    <Link to={`/session/${sessionId}`} className="text-sm font-mono" style={{ flex: 1 }}>
                      {sessionId.substring(0, 32)}...
                    </Link>

                    {/* Entity Type Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                      {Object.entries(entityBreakdown).map(([entityType, entityCount]) => (
                        <span
                          key={entityType}
                          className="font-mono"
                          style={{
                            padding: '2px 6px',
                            background: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-medium)',
                            fontSize: '11px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {entityCount} {entityType}
                        </span>
                      ))}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleSession(sessionId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 'var(--space-xs)',
                        color: 'var(--color-text-muted)',
                        fontSize: '12px'
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {/* Expanded Findings Table */}
                  {isExpanded && findings.length > 0 && (
                    <div style={{
                      padding: '0 var(--space-md) var(--space-md) var(--space-md)',
                      borderTop: '1px solid var(--color-border-subtle)'
                    }}>
                      <table style={{
                        width: '100%',
                        fontSize: '11px',
                        borderCollapse: 'collapse'
                      }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                            <th className="text-xs text-muted weight-semibold font-mono" style={{ textAlign: 'left', padding: 'var(--space-xs) var(--space-sm)' }}>
                              Entity Type
                            </th>
                            <th className="text-xs text-muted weight-semibold font-mono" style={{ textAlign: 'left', padding: 'var(--space-xs) var(--space-sm)' }}>
                              Confidence
                            </th>
                            <th className="text-xs text-muted weight-semibold font-mono" style={{ textAlign: 'left', padding: 'var(--space-xs) var(--space-sm)' }}>
                              Location
                            </th>
                            <th className="text-xs text-muted weight-semibold font-mono" style={{ textAlign: 'left', padding: 'var(--space-xs) var(--space-sm)' }}>
                              Text
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {findings.map((finding, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < findings.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                              <td className="text-xs font-mono" style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                                <span
                                  style={{
                                    padding: '2px 4px',
                                    background: 'var(--color-accent-bg)',
                                    color: 'var(--color-accent-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '10px'
                                  }}
                                >
                                  {finding.entity_type}
                                </span>
                              </td>
                              <td className="text-xs font-mono" style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                                <span
                                  style={{
                                    padding: '2px 4px',
                                    background: finding.score >= 0.8 ? 'var(--color-critical-bg)' :
                                      finding.score >= 0.5 ? 'var(--color-warning-bg)' : 'var(--color-bg-secondary)',
                                    color: finding.score >= 0.8 ? 'var(--color-critical)' :
                                      finding.score >= 0.5 ? 'var(--color-warning)' : 'var(--color-text-muted)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '10px'
                                  }}
                                >
                                  {(finding.score * 100).toFixed(0)}%
                                </span>
                              </td>
                              <td className="text-xs text-muted font-mono" style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                                {finding.event_location}
                              </td>
                              <td className="text-xs text-muted font-mono" style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                                "{finding.text.length > 30 ? finding.text.substring(0, 30) + '...' : finding.text}"
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgentReportPage() {
  const { agentId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedChecks, setExpandedChecks] = useState({})

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
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading report...
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="container">
        <div className="text-center text-muted loading">
          {data?.error || 'Failed to load agent data'}
        </div>
      </div>
    )
  }

  const agent = data.agent
  const riskAnalysis = data.risk_analysis
  const status = getAgentStatus(riskAnalysis)

  const toggleCheck = (checkId) => {
    setExpandedChecks(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }))
  }

  const getCheckTooltipContent = (check) => {
    return check.description || 'Security check'
  }

  return (
    <>
      <div className="container">
        <h1 className="page-title">Full Report</h1>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/agent/${agentId}`}>{agentId.substring(0, 16)}{agentId.length > 16 ? '...' : ''}</Link>
          <span className="breadcrumb-separator">/</span>
          <strong className="text-primary">Report</strong>
        </div>

        {/* Split Dashboard Layout */}
        <div className="dashboard-split">

          {/* LEFT SIDEBAR */}
          <AgentSidebar
            agent={agent}
            riskAnalysis={riskAnalysis}
          />

          {/* MAIN CONTENT AREA */}
          <div className="dashboard-main">

            {/* Evaluation Progress (when insufficient data) */}
            {status.evaluationStatus === 'INSUFFICIENT_DATA' && (
              <EvaluationProgress
                currentSessions={status.currentSessions}
                minSessionsRequired={status.minSessionsRequired}
              />
            )}

            {/* Security Assessment Categories */}
            {status.hasRiskData && riskAnalysis.security_report?.categories && (
              <>
                {Object.entries(riskAnalysis.security_report.categories).map(([categoryId, category]) => (
                  <div key={categoryId} className="card mb-lg">
                    {/* Category Header */}
                    <div className="card-header" style={{
                      background: getCategoryHeaderColor(category.highest_severity),
                      borderBottom: `2px solid ${getCategoryBorderColor(category.highest_severity)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="text-md weight-semibold text-primary mb-0">
                          {getCategoryIcon(categoryId)} {category.category_name}
                        </h3>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                          <span className="text-xs text-muted font-mono">
                            {category.passed_checks}/{category.total_checks} passed
                          </span>
                          {category.critical_checks > 0 && (
                            <span className="badge critical">
                              {category.critical_checks} critical
                            </span>
                          )}
                          {category.warning_checks > 0 && (
                            <span className="badge warning">
                              {category.warning_checks} warnings
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted mt-xs">{category.description}</div>
                    </div>

                    <div className="card-content">
                      {/* Metrics Section - Pill/Badge Style */}
                      {category.metrics && Object.keys(category.metrics).length > 0 && (
                        <div style={{ marginBottom: 'var(--space-2xl)' }}>
                          <div style={{
                            display: 'flex',
                            gap: 'var(--space-md)',
                            alignItems: 'stretch',
                            flexWrap: 'wrap'
                          }}>
                            {categoryId === 'ENVIRONMENT' && (
                              <>
                                <div style={{
                                  border: '1px solid var(--color-border-subtle)',
                                  background: 'var(--color-bg-elevated)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--space-md)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--space-xs)'
                                }}>
                                  <span className="text-xs text-muted weight-semibold">Model</span>
                                  <span className="text-sm font-mono" style={{ wordBreak: 'break-word' }}>
                                    {category.metrics.model || 'N/A'}
                                  </span>
                                </div>
                                <div style={{
                                  border: '1px solid var(--color-border-subtle)',
                                  background: 'var(--color-bg-elevated)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--space-md)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--space-xs)'
                                }}>
                                  <span className="text-xs text-muted weight-semibold">Avg. Tools Coverage</span>
                                  <span className="text-sm font-mono">
                                    {category.metrics.avg_tools_coverage?.toFixed(2) || '0.00'}
                                  </span>
                                </div>
                                <div style={{
                                  border: '1px solid var(--color-border-subtle)',
                                  background: 'var(--color-bg-elevated)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--space-md)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--space-xs)'
                                }}>
                                  <span className="text-xs text-muted weight-semibold">Avg. Tool Calls</span>
                                  <span className="text-sm font-mono">
                                    {category.metrics.avg_tool_calls?.toFixed(1) || '0.0'}
                                  </span>
                                </div>
                              </>
                            )}
                            {categoryId === 'RESOURCE_MANAGEMENT' && (
                              <>
                                <div style={{
                                  border: '1px solid var(--color-border-subtle)',
                                  background: 'var(--color-bg-elevated)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--space-md)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--space-xs)'
                                }}>
                                  <span className="text-xs text-muted weight-semibold">Avg. Tokens</span>
                                  <span className="text-sm font-mono">
                                    {formatNumber(category.metrics.avg_tokens || 0)}
                                  </span>
                                </div>
                                <div style={{
                                  border: '1px solid var(--color-border-subtle)',
                                  background: 'var(--color-bg-elevated)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: 'var(--space-md)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--space-xs)'
                                }}>
                                  <span className="text-xs text-muted weight-semibold">Avg. Session Duration</span>
                                  <span className="text-sm font-mono">
                                    {category.metrics.avg_duration_minutes?.toFixed(1) || '0.0'} min
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}


                      {/* Tools Section - Only for Environment & Supply Chain */}
                      {categoryId === 'ENVIRONMENT' && agent.available_tools && agent.available_tools.length > 0 && (
                        <div style={{ marginTop: 'var(--space-2xl)' }}>
                          <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
                            TOOLS ({agent.available_tools.length})
                          </h4>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 'var(--space-xs)',
                            alignItems: 'center'
                          }}>
                            {(() => {
                              // Sort tools: used by count descending, then unused alphabetically
                              const usedTools = agent.available_tools
                                .filter(tool => (agent.tool_usage_details?.[tool] || 0) > 0)
                                .sort((a, b) => {
                                  const countA = agent.tool_usage_details?.[a] || 0
                                  const countB = agent.tool_usage_details?.[b] || 0
                                  return countB - countA // descending
                                })

                              const unusedTools = agent.available_tools
                                .filter(tool => (agent.tool_usage_details?.[tool] || 0) === 0)
                                .sort()

                              return [...usedTools, ...unusedTools]
                            })().map(tool => {
                              const usageCount = agent.tool_usage_details?.[tool] || 0
                              const isUsed = usageCount > 0

                              return (
                                <span
                                  key={tool}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isUsed ? 'var(--color-info-bg)' : 'var(--color-bg-elevated)',
                                    border: `1px solid ${isUsed ? 'var(--color-accent-cyan)' : 'var(--color-border-subtle)'}`,
                                    fontSize: '12px'
                                  }}
                                >
                                  <span
                                    className="font-mono"
                                    style={{
                                      color: isUsed ? 'var(--color-accent-cyan)' : 'var(--color-text-muted)',
                                      fontWeight: isUsed ? 600 : 500
                                    }}
                                  >
                                    {tool}
                                  </span>
                                  {isUsed ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '24px',
                                        height: '18px',
                                        padding: '2px 5px',
                                        borderRadius: '3px',
                                        background: '#1e40af',
                                        fontSize: '10px',
                                        color: 'white',
                                        fontWeight: 700,
                                        lineHeight: 1
                                      }}
                                    >
                                      {usageCount}×
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                      }}
                                    >
                                      unused
                                    </span>
                                  )}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Report Checks Section */}
                      {category.checks && category.checks.length > 0 && (
                        <div style={{ marginTop: 'var(--space-2xl)' }}>
                          <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
                            REPORT CHECKS
                          </h4>
                          <div>
                            {category.checks.map((check) => {
                              const hasDetails = check.status !== 'passed' && (
                                (check.recommendations && check.recommendations.length > 0) ||
                                check.description
                              )
                              const isExpanded = expandedChecks[check.check_id]

                              return (
                                <div key={check.check_id} style={{
                                  borderBottom: '1px solid var(--color-border-subtle)',
                                  padding: 'var(--space-md) 0'
                                }}>
                                  <div
                                    onClick={() => hasDetails && toggleCheck(check.check_id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--space-lg)',
                                      cursor: hasDetails ? 'pointer' : 'default'
                                    }}
                                  >
                                    {/* Status Icon */}
                                    <div style={{
                                      fontSize: '12px',
                                      minWidth: '32px',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      color: check.status === 'passed' ? 'var(--color-success)' :
                                        check.status === 'warning' ? 'var(--color-warning)' : 'var(--color-critical)'
                                    }}>
                                      {check.status === 'passed' ? 'OK' : check.status === 'warning' ? 'WARN' : 'FAIL'}
                                    </div>

                                    {/* Check Name */}
                                    <div style={{ flex: 1 }}>
                                      <Tooltip
                                        content={getCheckTooltipContent(check)}
                                        position="right"
                                        delay={200}
                                      >
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 'var(--space-sm)'
                                        }}>
                                          <span className={`text-sm weight-medium ${getCheckStatusClass(check.status)} font-mono`}>
                                            {check.name}
                                          </span>
                                          {check.value && (
                                            <span className="text-xs text-muted font-mono">({check.value})</span>
                                          )}
                                        </div>
                                      </Tooltip>
                                    </div>

                                    {/* Status Badge */}
                                    {check.status !== 'passed' && (
                                      <span className={`badge ${check.status}`}>
                                        {check.status}
                                      </span>
                                    )}

                                    {/* Expand/Collapse Indicator */}
                                    {hasDetails && (
                                      <div className="text-xs text-muted">
                                        {isExpanded ? '▼' : '▶'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Accordion Details */}
                                  {hasDetails && isExpanded && (
                                    <div style={{
                                      marginTop: 'var(--space-md)',
                                      marginLeft: 'var(--space-4xl)',
                                      padding: 'var(--space-lg)',
                                      background: 'var(--color-bg-elevated)',
                                      borderRadius: 'var(--radius-md)',
                                      border: '1px solid var(--color-border-medium)'
                                    }}>
                                      {check.description && (
                                        <div className="text-sm text-muted mb-md">
                                          {check.description}
                                        </div>
                                      )}

                                      {check.evidence && Object.keys(check.evidence).length > 0 && (
                                        <div className="mt-md">
                                          {/* Special rendering for PII Detection check */}
                                          {check.check_id === 'PII_001_DETECTION' && check.evidence.detailed_findings ? (
                                            <PIIFindingsDisplay evidence={check.evidence} />
                                          ) : (
                                            <div className="monospace-content text-xs">
                                              {JSON.stringify(check.evidence, null, 2).split('\n').slice(0, 5).join('\n')}
                                              {JSON.stringify(check.evidence, null, 2).split('\n').length > 5 && '...'}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Recommendations - skip for PII_001_DETECTION */}
                                      {check.check_id !== 'PII_001_DETECTION' && check.recommendations && check.recommendations.length > 0 && (
                                        <div className="mt-md">
                                          <div className="text-sm weight-semibold text-primary mb-xs">
                                            Recommendations:
                                          </div>
                                          <ul className="text-xs text-muted" style={{ margin: 0, paddingLeft: 'var(--space-xl)' }}>
                                            {check.recommendations.map((rec, i) => (
                                              <li key={i} style={{ marginBottom: 'var(--space-xs)' }}>{rec}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Behavioral Insights Section */}
            {status.hasRiskData && riskAnalysis.behavioral_analysis && (
              <div id="behavioral" className="card mb-lg">
                {/* Category Header */}
                <div className="card-header" style={{
                  background: 'var(--color-info-bg)',
                  borderBottom: '2px solid var(--color-info-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="text-md weight-semibold text-primary mb-0">
                      Behavioral Insights
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                      <span className="text-xs text-muted font-mono">
                        {riskAnalysis.behavioral_analysis.num_clusters} clusters • {riskAnalysis.behavioral_analysis.num_outliers} outliers
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-xs">
                    Behavioral pattern analysis using MinHash clustering and outlier detection
                  </div>
                </div>

                <div className="card-content">
                  {/* Behavioral Scores Section - Only show if clusters formed */}
                  {riskAnalysis.behavioral_analysis.num_clusters >= 1 ? (
                    <div style={{ marginBottom: 'var(--space-2xl)' }}>
                      <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
                        BEHAVIORAL SCORES
                      </h4>
                      <div style={{
                        display: 'flex',
                        gap: 'var(--space-md)',
                        alignItems: 'stretch',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          border: '1px solid var(--color-border-subtle)',
                          background: 'var(--color-bg-elevated)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-xs)',
                          flex: '1',
                          minWidth: '200px'
                        }}>
                          <span className="text-xs text-muted weight-semibold">Stability Score</span>
                          <span className="text-sm font-mono">
                            {(riskAnalysis.behavioral_analysis.stability_score * 100).toFixed(0)}%
                          </span>
                          <div className="progress-bar-container">
                            <div
                              className={`progress-bar-fill ${getScoreClass(riskAnalysis.behavioral_analysis.stability_score)}`}
                              style={{ width: `${riskAnalysis.behavioral_analysis.stability_score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div style={{
                          border: '1px solid var(--color-border-subtle)',
                          background: 'var(--color-bg-elevated)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-xs)',
                          flex: '1',
                          minWidth: '200px'
                        }}>
                          <span className="text-xs text-muted weight-semibold">Predictability Score</span>
                          <span className="text-sm font-mono">
                            {(riskAnalysis.behavioral_analysis.predictability_score * 100).toFixed(0)}%
                          </span>
                          <div className="progress-bar-container">
                            <div
                              className={`progress-bar-fill ${getScoreClass(riskAnalysis.behavioral_analysis.predictability_score)}`}
                              style={{ width: `${riskAnalysis.behavioral_analysis.predictability_score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      marginBottom: 'var(--space-2xl)',
                      padding: 'var(--space-lg)',
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-medium)'
                    }}>
                      <div className="text-sm text-muted">
                        Behavioral scores require cluster formation. Once the agent has more sessions with similar patterns, clustering will occur and detailed stability metrics will be available.
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  <div className="text-sm text-muted mb-2xl" style={{
                    padding: 'var(--space-lg)',
                    background: 'var(--color-bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-medium)'
                  }}>
                    {riskAnalysis.behavioral_analysis.interpretation}
                  </div>

                  {/* Cluster Visualization - Only show if clusters exist */}
                  {riskAnalysis.behavioral_analysis.num_clusters >= 1 && (
                    <div style={{ marginBottom: 'var(--space-2xl)' }}>
                      <ClusterVisualization behavioralAnalysis={riskAnalysis.behavioral_analysis} />
                    </div>
                  )}

                  {/* Outlier Sessions */}
                  {riskAnalysis.behavioral_analysis.outliers &&
                    riskAnalysis.behavioral_analysis.outliers.length > 0 && (
                      <div style={{ marginTop: 'var(--space-2xl)' }}>
                        <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
                          OUTLIER SESSIONS ({riskAnalysis.behavioral_analysis.num_outliers})
                        </h4>
                        {riskAnalysis.behavioral_analysis.outliers.map((outlier) => (
                          <div key={outlier.session_id} className="card mb-md" style={{
                            background: getSeverityBg(outlier.severity),
                            border: `2px solid ${getSeverityBorder(outlier.severity)}`
                          }}>
                            <div className="card-content">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <Link to={`/session/${outlier.session_id}`} className="text-sm font-mono">
                                  {outlier.session_id.substring(0, 32)}...
                                </Link>
                                <span className={`badge ${outlier.severity}`}>
                                  {outlier.severity}
                                </span>
                              </div>
                              {outlier.primary_causes && outlier.primary_causes.length > 0 && (
                                <div className="text-xs text-muted">
                                  <strong>Causes:</strong>
                                  <ul style={{ margin: 'var(--space-xs) 0 0 0', paddingLeft: 'var(--space-xl)' }}>
                                    {outlier.primary_causes.slice(0, 2).map((cause, i) => (
                                      <li key={i} style={{ marginBottom: 'var(--space-xs)' }}>{cause}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Behavioral Clusters */}
                  {riskAnalysis.behavioral_analysis.clusters &&
                    riskAnalysis.behavioral_analysis.clusters.length > 0 && (
                      <div style={{ marginTop: 'var(--space-2xl)' }}>
                        <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
                          BEHAVIORAL CLUSTERS ({riskAnalysis.behavioral_analysis.num_clusters})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                          {riskAnalysis.behavioral_analysis.clusters.map((cluster) => (
                            <div
                              key={cluster.cluster_id}
                              className="card"
                              style={{
                                border: cluster.confidence === 'low'
                                  ? '1px dashed var(--color-border-medium)'
                                  : '1px solid var(--color-border-medium)',
                                opacity: cluster.confidence === 'low' ? 0.9 : 1
                              }}
                            >
                              <div className="card-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span className="text-sm weight-semibold text-primary font-mono">
                                      {cluster.cluster_id}
                                    </span>
                                    {cluster.confidence === 'low' && (
                                      <span className="badge warning" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                        LOW CONFIDENCE
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs weight-bold" style={{ color: 'var(--color-accent-purple)' }}>
                                    {cluster.size} sessions ({cluster.percentage}%)
                                  </span>
                                </div>
                                <div className="text-xs text-muted mb-sm">
                                  {cluster.insights}
                                </div>
                                {cluster.characteristics.common_tools && cluster.characteristics.common_tools.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)' }}>
                                    {cluster.characteristics.common_tools.slice(0, 3).map((tool) => (
                                      <span key={tool} className="tool-name-badge text-xs">
                                        {tool}
                                      </span>
                                    ))}
                                    {cluster.characteristics.common_tools.length > 3 && (
                                      <span className="text-xs text-muted">
                                        +{cluster.characteristics.common_tools.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
