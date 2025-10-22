/**
 * Cluster Visualization Data Transformation
 *
 * Pure functions to transform behavioral analysis data into visualization-ready format.
 * Uses a simple radial layout algorithm for positioning clusters and outliers.
 */

import { getSeverityColor } from './helpers'

/**
 * Calculate dynamic viewBox to fit all nodes with padding
 *
 * @param {Array} nodes - Array of node objects with x, y, radius properties
 * @returns {Object} { x, y, width, height } - ViewBox parameters
 */
function calculateViewBox(nodes) {
  if (!nodes || nodes.length === 0) {
    return { x: 0, y: 0, width: 400, height: 300 }
  }

  const padding = 30

  // Find bounds including node radius
  const xs = nodes.map(n => n.x)
  const ys = nodes.map(n => n.y)
  const radii = nodes.map(n => n.radius || 0)

  const minX = Math.min(...xs.map((x, i) => x - radii[i])) - padding
  const maxX = Math.max(...xs.map((x, i) => x + radii[i])) + padding
  const minY = Math.min(...ys.map((y, i) => y - radii[i])) - padding
  const maxY = Math.max(...ys.map((y, i) => y + radii[i])) + padding

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Main entry point: Prepare visualization data from behavioral analysis
 *
 * @param {Object} behavioralAnalysis - Behavioral analysis data from backend
 * @returns {Object} { nodes: [], links: [], viewBox: {} } - Visualization data
 */
export function prepareClusterVisualizationData(behavioralAnalysis) {
  if (!behavioralAnalysis) {
    return { nodes: [], links: [], viewBox: { x: 0, y: 0, width: 400, height: 300 } }
  }

  const clusters = behavioralAnalysis.clusters || []
  const outliers = behavioralAnalysis.outliers || []
  const centroidDistances = behavioralAnalysis.centroid_distances || []

  // Generate nodes
  const clusterNodes = generateClusterNodes(clusters)
  const outlierNodes = generateOutlierNodes(outliers, clusterNodes)

  const allNodes = [...clusterNodes, ...outlierNodes]

  // Generate links (outlier-to-cluster and cluster-to-cluster)
  const links = generateLinks(outlierNodes, clusterNodes, centroidDistances)

  // Calculate dynamic viewBox to fit all nodes
  const viewBox = calculateViewBox(allNodes)

  return {
    nodes: allNodes,
    links,
    viewBox
  }
}

/**
 * Generate cluster nodes with positions and metadata
 *
 * @param {Array} clusters - Array of cluster objects
 * @returns {Array} Cluster nodes with position and display properties
 */
function generateClusterNodes(clusters) {
  if (!clusters || clusters.length === 0) {
    return []
  }

  // Sort clusters by size (largest first)
  const sortedClusters = [...clusters].sort((a, b) => b.size - a.size)

  // Calculate positions using radial layout
  return sortedClusters.map((cluster, index) => {
    const position = calculateClusterPosition(index, sortedClusters.length)

    return {
      id: cluster.cluster_id,
      type: 'cluster',
      label: cluster.cluster_id,
      size: cluster.size,
      percentage: cluster.percentage,
      confidence: cluster.confidence || 'normal',
      x: position.x,
      y: position.y,
      radius: calculateClusterRadius(cluster.size, sortedClusters),
      color: getClusterColor(index),
      characteristics: cluster.characteristics,
      insights: cluster.insights
    }
  })
}

/**
 * Generate outlier nodes with positions relative to nearest cluster
 *
 * @param {Array} outliers - Array of outlier objects
 * @param {Array} clusterNodes - Already positioned cluster nodes
 * @returns {Array} Outlier nodes with position and display properties
 */
function generateOutlierNodes(outliers, clusterNodes) {
  if (!outliers || outliers.length === 0) {
    return []
  }

  // Group outliers by their nearest cluster for proper angle distribution
  const outliersByCluster = {}
  outliers.forEach((outlier) => {
    const clusterId = outlier.nearest_cluster_id || 'unknown'
    if (!outliersByCluster[clusterId]) {
      outliersByCluster[clusterId] = []
    }
    outliersByCluster[clusterId].push(outlier)
  })

  return outliers.map((outlier, globalIndex) => {
    // Position based on actual distance to nearest centroid if available
    let position
    if (outlier.nearest_cluster_id && outlier.distance_to_nearest_centroid !== undefined) {
      const clusterId = outlier.nearest_cluster_id
      const clusterOutliers = outliersByCluster[clusterId]
      const indexInCluster = clusterOutliers.indexOf(outlier)

      position = calculateOutlierPositionByDistance(
        outlier,
        clusterNodes,
        indexInCluster,
        clusterOutliers.length
      )
    } else {
      // Fallback to ring positioning
      position = calculateOutlierPosition(globalIndex, outliers.length, clusterNodes)
    }

    return {
      id: outlier.session_id,
      type: 'outlier',
      label: `Outlier ${globalIndex + 1}`,
      sessionId: outlier.session_id,
      severity: outlier.severity,
      anomalyScore: outlier.anomaly_score,
      nearestClusterId: outlier.nearest_cluster_id,
      distanceToNearest: outlier.distance_to_nearest_centroid,
      x: position.x,
      y: position.y,
      radius: 8, // Fixed size for outliers
      color: getSeverityColor(outlier.severity),
      primaryCauses: outlier.primary_causes || []
    }
  })
}

/**
 * Generate links between outliers and clusters, and between clusters
 *
 * @param {Array} outlierNodes - Positioned outlier nodes
 * @param {Array} clusterNodes - Positioned cluster nodes
 * @param {Array} centroidDistances - Distances between cluster centroids (from backend)
 * @returns {Array} Link objects connecting nodes
 */
function generateLinks(outlierNodes, clusterNodes, centroidDistances = []) {
  const links = []

  // Outlier to nearest cluster links
  if (outlierNodes && outlierNodes.length > 0 && clusterNodes && clusterNodes.length > 0) {
    outlierNodes.forEach(outlier => {
      // Use actual nearest cluster if available
      let nearestCluster
      if (outlier.nearestClusterId) {
        nearestCluster = clusterNodes.find(c => c.id === outlier.nearestClusterId)
      }

      // Fallback to spatial nearest
      if (!nearestCluster) {
        nearestCluster = findNearestCluster(outlier, clusterNodes)
      }

      if (nearestCluster) {
        links.push({
          source: outlier.id,
          target: nearestCluster.id,
          type: 'outlier-to-cluster',
          distance: outlier.distanceToNearest || 0.5,
          strength: 1.0 - (outlier.anomalyScore || 0.5)
        })
      }
    })
  }

  // Cluster to cluster links (if we have centroid distances)
  if (centroidDistances && centroidDistances.length > 0) {
    centroidDistances.forEach(dist => {
      links.push({
        source: dist.from_cluster,
        target: dist.to_cluster,
        type: 'cluster-to-cluster',
        distance: dist.distance,
        similarity: dist.similarity_score
      })
    })
  }

  return links
}

/**
 * Calculate cluster position using radial layout
 *
 * @param {number} index - Cluster index (0 = largest, most central)
 * @param {number} total - Total number of clusters
 * @returns {Object} { x, y } position
 */
function calculateClusterPosition(index, total) {
  // Center point
  const centerX = 200
  const centerY = 150

  if (index === 0) {
    // Largest cluster at center
    return { x: centerX, y: centerY }
  }

  // Other clusters in a ring around center
  const radius = 80
  // Add π/2 offset to rotate layout 90° (prevents horizontal alignment)
  // This places clusters vertically for 2-cluster case
  const angle = (index - 1) * (2 * Math.PI / (total - 1)) + Math.PI / 2

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  }
}

/**
 * Calculate outlier position based on actual distance to nearest centroid
 *
 * @param {Object} outlier - Outlier object with nearest_cluster_id and distance_to_nearest_centroid
 * @param {Array} clusterNodes - Cluster nodes
 * @param {number} index - Outlier index
 * @param {number} total - Total number of outliers
 * @returns {Object} { x, y } position
 */
function calculateOutlierPositionByDistance(outlier, clusterNodes, index, total) {
  // Find the nearest cluster
  const nearestCluster = clusterNodes.find(c => c.id === outlier.nearest_cluster_id)

  if (!nearestCluster) {
    // Fallback to ring positioning
    return calculateOutlierPosition(index, total, clusterNodes)
  }

  // Position outlier at distance from cluster center
  // Scale: 0.0 distance = at center, 1.0 distance = far away
  // Use distance * 80 pixels as base, plus cluster radius
  // Cap at 120px to prevent overflow
  const distancePixels = Math.min(120, (outlier.distance_to_nearest_centroid || 0.5) * 80 + nearestCluster.radius + 10)

  // Distribute outliers around the cluster at different angles
  // Add π/4 offset and ensure we don't divide by total when total=1
  // This prevents outliers from aligning at 0° (horizontal right)
  const angle = (index / Math.max(total, 2)) * 2 * Math.PI + Math.PI / 4

  return {
    x: nearestCluster.x + distancePixels * Math.cos(angle),
    y: nearestCluster.y + distancePixels * Math.sin(angle)
  }
}

/**
 * Calculate outlier position in outer ring (fallback)
 *
 * @param {number} index - Outlier index
 * @param {number} total - Total number of outliers
 * @param {Array} clusterNodes - Cluster nodes (for reference)
 * @returns {Object} { x, y } position
 */
function calculateOutlierPosition(index, total, clusterNodes) {
  // Center point
  const centerX = 200
  const centerY = 150

  // Outliers in outer ring
  const radius = 120
  const angle = index * (2 * Math.PI / total)

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  }
}

/**
 * Calculate cluster radius based on session count
 *
 * @param {number} size - Number of sessions in cluster
 * @param {Array} allClusters - All clusters (for normalization)
 * @returns {number} Radius in pixels
 */
function calculateClusterRadius(size, allClusters) {
  const minRadius = 20
  const maxRadius = 40

  const maxSize = Math.max(...allClusters.map(c => c.size))
  const minSize = Math.min(...allClusters.map(c => c.size))

  if (maxSize === minSize) {
    return (minRadius + maxRadius) / 2
  }

  // Linear interpolation
  const normalized = (size - minSize) / (maxSize - minSize)
  return minRadius + normalized * (maxRadius - minRadius)
}

/**
 * Find nearest cluster to an outlier
 *
 * @param {Object} outlier - Outlier node
 * @param {Array} clusters - Cluster nodes
 * @returns {Object} Nearest cluster node
 */
function findNearestCluster(outlier, clusters) {
  if (clusters.length === 1) {
    return clusters[0]
  }

  let nearest = clusters[0]
  let minDistance = distance(outlier, clusters[0])

  clusters.slice(1).forEach(cluster => {
    const d = distance(outlier, cluster)
    if (d < minDistance) {
      minDistance = d
      nearest = cluster
    }
  })

  return nearest
}

/**
 * Calculate Euclidean distance between two nodes
 *
 * @param {Object} node1 - First node with x, y
 * @param {Object} node2 - Second node with x, y
 * @returns {number} Distance
 */
function distance(node1, node2) {
  const dx = node1.x - node2.x
  const dy = node1.y - node2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Get color for cluster based on index
 *
 * @param {number} index - Cluster index
 * @returns {string} CSS color value
 */
function getClusterColor(index) {
  const colors = [
    'var(--color-accent-cyan)',      // Primary cluster
    'var(--color-accent-purple)',    // Secondary cluster
    'var(--color-accent-tertiary)',  // Tertiary cluster
    'var(--color-info)',             // Additional clusters
  ]

  return colors[index % colors.length]
}
