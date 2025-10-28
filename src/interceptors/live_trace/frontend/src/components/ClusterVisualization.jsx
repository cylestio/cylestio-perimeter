import { useState } from 'react'
import { prepareClusterVisualizationData } from '../utils/clusterVisualization'
import { getSeverityColor } from '../utils/helpers'

/**
 * ClusterVisualization Component
 *
 * Displays a visual representation of behavioral clusters and outliers
 * using an SVG-based radial layout.
 */
export default function ClusterVisualization({ behavioralAnalysis }) {
  const [hoveredNode, setHoveredNode] = useState(null)

  if (!behavioralAnalysis || !behavioralAnalysis.clusters || behavioralAnalysis.clusters.length === 0) {
    return null
  }

  const { nodes, links, viewBox: vb } = prepareClusterVisualizationData(behavioralAnalysis)

  if (nodes.length === 0) {
    return null
  }

  const viewBox = `${vb.x} ${vb.y} ${vb.width} ${vb.height}`

  return (
    <div className="cluster-viz-container">
      <h4 className="text-xs text-muted weight-semibold mb-md font-mono" style={{ letterSpacing: '0.08em' }}>
        CLUSTER VISUALIZATION
      </h4>

      <div style={{
        position: 'relative',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        {/* SVG Canvas */}
        <svg
          width="100%"
          height="auto"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{
            maxWidth: '400px',
            maxHeight: '300px',
            margin: '0 auto'
          }}
        >
          {/* Links (draw first, so they're behind nodes) */}
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source)
            const targetNode = nodes.find(n => n.id === link.target)

            if (!sourceNode || !targetNode) return null

            const isClusterLink = link.type === 'cluster-to-cluster'

            // Style based on link type
            const strokeWidth = isClusterLink ? (link.similarity * 2 + 0.5) : 1
            // Use outlier's severity color for outlier links
            const strokeColor = isClusterLink ? 'var(--color-accent-primary)' : sourceNode.color
            const opacity = isClusterLink ? (link.similarity * 0.4 + 0.1) : 0.5
            const dashArray = isClusterLink ? 'none' : '2,2'

            return (
              <g key={`link-${index}`}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  opacity={opacity}
                />
                {/* Distance label for cluster links (on hover) */}
                {isClusterLink && hoveredNode && (hoveredNode === link.source || hoveredNode === link.target) && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--color-accent-primary)"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    style={{
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    d={Math.round(link.distance * 100)}%
                  </text>
                )}
                {/* Distance label for outlier links (on hover) */}
                {!isClusterLink && hoveredNode === link.source && link.distance !== undefined && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={sourceNode.color}
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    style={{
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    d={Math.round(link.distance * 100)}%
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isHovered = hoveredNode === node.id
            const isCluster = node.type === 'cluster'

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={node.color}
                  fillOpacity={isCluster ? (node.confidence === 'low' ? 0.10 : 0.15) : 0.7}
                  stroke={node.color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={node.confidence === 'low' ? '3,2' : 'none'}
                  style={{
                    transition: 'all var(--transition-base)'
                  }}
                />

                {/* Label */}
                {isCluster && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={node.color}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    style={{
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {node.label.replace('cluster_', '')}
                  </text>
                )}

                {/* Hover highlight ring */}
                {isHovered && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius + 5}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1"
                    opacity="0.3"
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip (shows on hover) */}
        {hoveredNode && (
          <NodeTooltip node={nodes.find(n => n.id === hoveredNode)} />
        )}

        {/* Legend */}
        <ClusterLegend
          hasClusters={nodes.some(n => n.type === 'cluster')}
          hasOutliers={nodes.some(n => n.type === 'outlier')}
          outlierSeverities={[...new Set(nodes.filter(n => n.type === 'outlier').map(n => n.severity))]}
        />
      </div>
    </div>
  )
}

/**
 * NodeTooltip Component
 *
 * Displays detailed information about the hovered node
 */
function NodeTooltip({ node }) {
  if (!node) return null

  const isCluster = node.type === 'cluster'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-medium)',
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--space-md)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.5
    }}>
      {isCluster ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-xs)'
          }}>
            <span className="font-mono weight-semibold" style={{ color: node.color }}>
              {node.label}
            </span>
            {node.confidence === 'low' && (
              <span className="badge warning" style={{ fontSize: '8px', padding: '1px 4px' }}>
                LOW
              </span>
            )}
            <span className="text-muted">
              {node.size} sessions ({node.percentage}%)
            </span>
          </div>

          {node.characteristics?.common_tools && node.characteristics.common_tools.length > 0 && (
            <div className="text-muted">
              Tools: {node.characteristics.common_tools.slice(0, 3).join(', ')}
              {node.characteristics.common_tools.length > 3 && ` +${node.characteristics.common_tools.length - 3}`}
            </div>
          )}

          {node.insights && (
            <div className="text-muted" style={{ marginTop: 'var(--space-xs)', fontStyle: 'italic' }}>
              {node.insights}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-xs)'
          }}>
            <span className="font-mono weight-semibold" style={{ color: node.color }}>
              {node.label}
            </span>
            <span className={`badge ${node.severity}`} style={{ fontSize: '9px' }}>
              {node.severity}
            </span>
          </div>

          <div className="text-muted font-mono" style={{ fontSize: '10px', marginBottom: 'var(--space-xs)' }}>
            {node.sessionId.substring(0, 24)}...
          </div>

          <div className="text-muted">
            Anomaly score: {(node.anomalyScore * 100).toFixed(0)}%
          </div>

          {node.distanceToNearest !== undefined && node.distanceToNearest > 0 && (
            <div className="text-muted" style={{ marginTop: 'var(--space-xs)' }}>
              Distance to {node.nearestClusterId}: {Math.round(node.distanceToNearest * 100)}%
            </div>
          )}

          {node.primaryCauses && node.primaryCauses.length > 0 && (
            <div className="text-muted" style={{ marginTop: 'var(--space-xs)' }}>
              {node.primaryCauses[0]}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * ClusterLegend Component
 *
 * Shows what different visual elements represent
 */
function ClusterLegend({ hasClusters, hasOutliers, outlierSeverities }) {
  return (
    <div style={{
      display: 'flex',
      gap: 'var(--space-lg)',
      paddingTop: 'var(--space-sm)',
      borderTop: '1px solid var(--color-border-subtle)',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-muted)'
    }}>
      {/* Cluster legend */}
      {hasClusters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <svg width="16" height="16">
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="var(--color-accent-cyan)"
              fillOpacity="0.15"
              stroke="var(--color-accent-cyan)"
              strokeWidth="1.5"
            />
          </svg>
          <span className="font-mono">Clusters</span>
        </div>
      )}

      {/* Outlier legend */}
      {hasOutliers && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Show colored dots for each severity level */}
          {outlierSeverities.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              {outlierSeverities.map((severity) => (
                <svg width="16" height="16" key={severity}>
                  <circle
                    cx="8"
                    cy="8"
                    r="4"
                    fill={getSeverityColor(severity)}
                    fillOpacity="0.7"
                    stroke={getSeverityColor(severity)}
                    strokeWidth="1.5"
                  />
                </svg>
              ))}
            </div>
          ) : (
            <svg width="16" height="16">
              <circle
                cx="8"
                cy="8"
                r="4"
                fill="var(--color-text-muted)"
                fillOpacity="0.7"
                stroke="var(--color-text-muted)"
                strokeWidth="1.5"
              />
            </svg>
          )}
          <span className="font-mono">Outliers</span>

          {/* Severity indicators */}
          {outlierSeverities.length > 0 && (
            <span style={{ marginLeft: 'var(--space-xs)' }}>
              ({outlierSeverities.map((sev, i) => (
                <span key={sev}>
                  {i > 0 && ', '}
                  <span className={`badge ${sev}`} style={{ fontSize: '9px', padding: '2px 4px' }}>
                    {sev}
                  </span>
                </span>
              ))})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
