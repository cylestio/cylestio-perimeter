import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Tooltip from './Tooltip'
import AgentSidebar from './AgentSidebar'
import {
  formatNumber,
  timeAgo,
  getScoreClass,
  getSeverityBg,
  getSeverityBorder,
  getCategoryIcon,
  getCategoryHeaderColor,
  getCategoryBorderColor,
  getCheckStatusClass
} from '../utils/helpers'

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
  const hasRiskData = riskAnalysis && riskAnalysis.evaluation_status === 'COMPLETE'

  // Calculate critical issues
  let hasCriticalIssues = false
  if (hasRiskData && riskAnalysis.security_report?.categories) {
    Object.values(riskAnalysis.security_report.categories).forEach(category => {
      category.checks?.forEach(check => {
        if (check.status === 'critical') {
          hasCriticalIssues = true
        }
      })
    })
  }

  const toggleCheck = (checkId) => {
    setExpandedChecks(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }))
  }

  const getCheckTooltipContent = (check) => {
    let content = check.description || 'Security check'

    if (check.remediation_difficulty) {
      content += `\n\nDifficulty: ${check.remediation_difficulty}`
    }

    if (check.estimated_effort_hours) {
      content += ` (${check.estimated_effort_hours}h)`
    }

    return content
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
            hasRiskData={hasRiskData}
            hasCriticalIssues={hasCriticalIssues}
          />

          {/* MAIN CONTENT AREA */}
          <div className="dashboard-main">

            {/* Critical Alert Banner */}
            {hasCriticalIssues && (
              <div className="alert-banner alert-banner-critical">
                <div className="alert-content">
                  <h3>Critical Security Issues Detected</h3>
                  <p>This agent has {Object.values(riskAnalysis.security_report.categories)
                    .reduce((sum, cat) => sum + cat.critical_checks, 0)} critical security check(s) that require immediate attention.</p>
                </div>
              </div>
            )}

            {/* Security Assessment Section */}
            {hasRiskData && riskAnalysis.security_report && riskAnalysis.security_report.categories && (
              <div id="security" className="card">
                <div className="card-header">
                  <h2>Security Assessment Report</h2>
                </div>
                <div className="card-content">
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

                      {/* Checklist */}
                      <div className="card-content">
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

                                  {check.recommendations && check.recommendations.length > 0 && (
                                    <div className="mb-md">
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

                                  {check.evidence && Object.keys(check.evidence).length > 0 && (
                                    <div className="mt-md">
                                      <div className="text-sm weight-semibold text-primary mb-xs">
                                        Evidence:
                                      </div>
                                      <div className="monospace-content text-xs">
                                        {JSON.stringify(check.evidence, null, 2).split('\n').slice(0, 5).join('\n')}
                                        {JSON.stringify(check.evidence, null, 2).split('\n').length > 5 && '...'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Behavioral Insights Section */}
            {hasRiskData && riskAnalysis.behavioral_analysis && (
              <div id="behavioral" className="card">
                <div className="card-header">
                  <h2>Behavioral Insights</h2>
                </div>
                <div className="card-content">

                  {/* Behavior Scores */}
                  <div className="stats-grid-2col mb-2xl">
                    <div>
                      <div className="text-xs text-muted mb-xs font-mono">STABILITY SCORE</div>
                      <div className="stat-value text-lg mb-sm">
                        {(riskAnalysis.behavioral_analysis.stability_score * 100).toFixed(0)}%
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill ${getScoreClass(riskAnalysis.behavioral_analysis.stability_score)}`}
                          style={{ width: `${riskAnalysis.behavioral_analysis.stability_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-xs font-mono">PREDICTABILITY SCORE</div>
                      <div className="stat-value text-lg mb-sm">
                        {(riskAnalysis.behavioral_analysis.predictability_score * 100).toFixed(0)}%
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill ${getScoreClass(riskAnalysis.behavioral_analysis.predictability_score)}`}
                          style={{ width: `${riskAnalysis.behavioral_analysis.predictability_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted mb-2xl" style={{
                    padding: 'var(--space-lg)',
                    background: 'var(--color-bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-medium)'
                  }}>
                    {riskAnalysis.behavioral_analysis.interpretation}
                  </div>

                  {/* Outlier Sessions */}
                  {riskAnalysis.behavioral_analysis.outliers &&
                   riskAnalysis.behavioral_analysis.outliers.length > 0 && (
                    <div className="mb-2xl">
                      <h3 className="text-md weight-semibold text-primary mb-lg font-mono">
                        Outlier Sessions ({riskAnalysis.behavioral_analysis.num_outliers})
                      </h3>
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
                    <div>
                      <h3 className="text-md weight-semibold text-primary mb-lg font-mono">
                        Behavioral Clusters ({riskAnalysis.behavioral_analysis.num_clusters})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {riskAnalysis.behavioral_analysis.clusters.map((cluster) => (
                          <div key={cluster.cluster_id} className="card">
                            <div className="card-content">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <span className="text-sm weight-semibold text-primary font-mono">
                                  {cluster.cluster_id}
                                </span>
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

            {/* Tools Utilization Section */}
            <div id="tools" className="card">
              <div className="card-header">
                <h2>Tools Utilization Analysis</h2>
              </div>
              <div className="card-content">
                {agent.available_tools && agent.available_tools.length > 0 ? (
                  <>
                    <div className="mb-2xl">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <span className="text-sm text-muted font-mono">
                          {agent.used_tools.length} of {agent.available_tools.length} tools used
                        </span>
                        <span className="stat-value text-2xl" style={{
                          color: agent.tools_utilization_percent === 100 ? 'var(--color-success)' :
                                 agent.tools_utilization_percent >= 50 ? 'var(--color-warning)' : 'var(--color-critical)'
                        }}>
                          {agent.tools_utilization_percent}%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill ${
                            agent.tools_utilization_percent === 100 ? 'success' :
                            agent.tools_utilization_percent >= 50 ? 'warning' : 'critical'
                          }`}
                          style={{ width: `${agent.tools_utilization_percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {agent.tools_utilization_percent < 100 && (
                      <div className="alert-banner alert-banner-warning mb-2xl">
                        <div className="alert-content">
                          <h3>Recommendation</h3>
                          <p>Consider narrowing down the available tools exposed to the agent to improve efficiency and reduce attack surface.</p>
                        </div>
                      </div>
                    )}

                    {agent.tools_utilization_percent === 100 && (
                      <div className="alert-banner alert-banner-success mb-2xl">
                        <div className="alert-content">
                          <h3>Excellent</h3>
                          <p>All available tools are being utilized effectively.</p>
                        </div>
                      </div>
                    )}

                    {/* Tools List */}
                    <div>
                      <h3 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
                        TOOLS ({agent.available_tools.length})
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-sm)' }}>
                        {agent.available_tools.sort().map(tool => {
                          const usageCount = agent.tool_usage_details?.[tool] || 0
                          const isUsed = usageCount > 0

                          return (
                            <div
                              key={tool}
                              className="stat-card-compact"
                              style={{
                                background: isUsed ? 'var(--color-info-bg)' : 'var(--color-bg-elevated)',
                                borderLeftColor: isUsed ? 'var(--color-accent-cyan)' : 'var(--color-border-medium)'
                              }}
                            >
                              <span className="text-xs font-mono" style={{
                                color: isUsed ? 'var(--color-accent-cyan)' : 'var(--color-text-muted)',
                                fontWeight: isUsed ? 500 : 400
                              }}>
                                {tool}
                              </span>
                              {isUsed ? (
                                <span className="badge info">
                                  {usageCount}×
                                </span>
                              ) : (
                                <span className="badge inactive text-xs">
                                  unused
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted loading">
                    No tool data available yet
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
