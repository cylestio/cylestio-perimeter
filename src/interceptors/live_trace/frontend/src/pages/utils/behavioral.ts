import type { BehavioralCluster, OutlierSession, CentroidDistance } from '@api/types/agent';
import type { ClusterNodeData } from '@domain/visualization';

/**
 * Link between nodes in the cluster visualization.
 */
export interface ClusterLink {
  source: string;
  target: string;
  type: 'outlier-to-cluster' | 'cluster-to-cluster';
  strength?: number;
}

/**
 * Result of building visualization data.
 */
export interface VisualizationData {
  nodes: ClusterNodeData[];
  links: ClusterLink[];
}

/**
 * Calculate cluster position using radial layout.
 * - Largest cluster (index 0) at center
 * - Other clusters in a ring around center
 */
const calculateClusterPosition = (
  index: number,
  total: number
): { x: number; y: number } => {
  // Center point (as percentage)
  const centerX = 50;
  const centerY = 50;

  if (index === 0) {
    // Largest cluster at center
    return { x: centerX, y: centerY };
  }

  // Other clusters in a ring around center
  const radius = 25; // percentage units
  // Add π/2 offset to rotate layout 90° (prevents horizontal alignment)
  const angle = ((index - 1) * (2 * Math.PI)) / (total - 1) + Math.PI / 2;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};

/**
 * Map node size to radius in percentage units.
 * Original used pixels (20-40px), we use % for CSS positioning.
 * In a ~400px container: sm=12px≈3%, md=20px≈5%, lg=32px≈8%
 */
const sizeToRadius: Record<string, number> = {
  sm: 3,
  md: 5,
  lg: 8,
};

/**
 * Calculate outlier position based on distance to nearest cluster.
 *
 * Original algorithm (clusterVisualization.js):
 *   distancePixels = min(120, distance * 80 + clusterRadius + 10)
 *
 * Converted to percentages (400px → 100%):
 *   distancePercent = min(30, distance * 20 + clusterRadiusPercent + 2.5)
 */
const calculateOutlierPosition = (
  outlier: OutlierSession,
  clusterNodes: ClusterNodeData[],
  indexInCluster: number,
  totalInCluster: number
): { x: number; y: number } => {
  // Find the nearest cluster
  const nearestCluster = outlier.nearest_cluster_id
    ? clusterNodes.find((c) => c.clusterId === outlier.nearest_cluster_id)
    : clusterNodes[0];

  if (!nearestCluster) {
    // Fallback to edge positioning
    return { x: 85, y: 20 + ((indexInCluster * 20) % 60) };
  }

  // Position outlier based on distance from cluster center
  // Original: distance * 80 + clusterRadius + 10, capped at 120px
  // Converted: distance * 20 + clusterRadius% + 2.5, capped at 30%
  const distance = outlier.distance_to_nearest_centroid ?? 0.5;
  const clusterRadius = sizeToRadius[nearestCluster.size] ?? 5;
  const distanceRadius = Math.min(30, distance * 20 + clusterRadius + 2.5);

  // Distribute outliers around the cluster at different angles
  // Add π/4 offset to prevent alignment at 0°
  const angle = (indexInCluster / Math.max(totalInCluster, 2)) * 2 * Math.PI + Math.PI / 4;

  return {
    x: nearestCluster.x + distanceRadius * Math.cos(angle),
    y: nearestCluster.y + distanceRadius * Math.sin(angle),
  };
};

/**
 * Transform behavioral analysis data into visualization nodes and links.
 *
 * Layout algorithm (ported from original clusterVisualization.js):
 * - Clusters: Radial layout with largest at center, others in ring
 * - Outliers: Positioned based on distance_to_nearest_centroid from their cluster
 * - Links: Connect outliers→clusters and clusters→clusters
 *
 * Each node includes metadata for tooltips and navigation:
 * - Clusters: clusterId for filtering sessions, size/percentage for display
 * - Outliers: sessionId for direct navigation, severity/causes for display
 */
export const buildVisualizationNodes = (
  clusters?: BehavioralCluster[],
  outliers?: OutlierSession[],
  centroidDistances?: CentroidDistance[]
): VisualizationData => {
  const nodes: ClusterNodeData[] = [];
  const links: ClusterLink[] = [];

  // Sort clusters by size (largest first) for radial layout
  const sortedClusters = [...(clusters ?? [])].sort((a, b) => b.size - a.size);

  // Add cluster nodes with radial positioning
  sortedClusters.forEach((cluster, idx) => {
    const position = calculateClusterPosition(idx, sortedClusters.length);

    nodes.push({
      id: cluster.cluster_id,
      x: position.x,
      y: position.y,
      size: cluster.percentage > 40 ? 'lg' : cluster.percentage > 20 ? 'md' : 'sm',
      type: 'cluster',
      label: `${cluster.cluster_id}: ${cluster.size} sessions (${cluster.percentage}%)`,
      clusterId: cluster.cluster_id,
      metadata: {
        size: cluster.size,
        percentage: cluster.percentage,
        commonTools: cluster.characteristics?.common_tools,
      },
    });
  });

  // Group outliers by their nearest cluster for angle distribution
  const outliersByCluster: Record<string, OutlierSession[]> = {};
  (outliers ?? []).forEach((outlier) => {
    const clusterId = outlier.nearest_cluster_id ?? 'unknown';
    if (!outliersByCluster[clusterId]) {
      outliersByCluster[clusterId] = [];
    }
    outliersByCluster[clusterId].push(outlier);
  });

  // Add outlier nodes with positioning based on distance
  (outliers ?? []).forEach((outlier) => {
    const clusterId = outlier.nearest_cluster_id ?? 'unknown';
    const clusterOutliers = outliersByCluster[clusterId] ?? [];
    const indexInCluster = clusterOutliers.indexOf(outlier);

    const position = calculateOutlierPosition(
      outlier,
      nodes.filter((n) => n.type === 'cluster'),
      indexInCluster,
      clusterOutliers.length
    );

    const outlierNode: ClusterNodeData = {
      id: outlier.session_id,
      x: position.x,
      y: position.y,
      size: 'sm',
      type: outlier.severity === 'critical' || outlier.severity === 'high' ? 'dangerous' : 'outlier',
      label: `Outlier: ${outlier.session_id.substring(0, 8)}... (${outlier.severity})`,
      sessionId: outlier.session_id,
      metadata: {
        severity: outlier.severity,
        primaryCauses: outlier.primary_causes,
      },
    };

    nodes.push(outlierNode);

    // Add link from outlier to nearest cluster
    if (outlier.nearest_cluster_id) {
      links.push({
        source: outlier.session_id,
        target: outlier.nearest_cluster_id,
        type: 'outlier-to-cluster',
        strength: 1.0 - (outlier.anomaly_score ?? 0.5),
      });
    } else if (nodes.length > 0) {
      // Fallback: link to first cluster
      const firstCluster = nodes.find((n) => n.type === 'cluster');
      if (firstCluster) {
        links.push({
          source: outlier.session_id,
          target: firstCluster.id,
          type: 'outlier-to-cluster',
          strength: 0.5,
        });
      }
    }
  });

  // Add cluster-to-cluster links from centroid distances
  (centroidDistances ?? []).forEach((dist) => {
    links.push({
      source: dist.from_cluster,
      target: dist.to_cluster,
      type: 'cluster-to-cluster',
      strength: dist.similarity_score,
    });
  });

  return { nodes, links };
};
