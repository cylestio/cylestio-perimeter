import type { BehavioralCluster, OutlierSession } from '@api/types/agent';
import type { ClusterNodeData } from '@domain/visualization';

/**
 * Transform behavioral analysis data into visualization nodes for ClusterVisualization.
 * - Cluster nodes are spread horizontally in the left portion (15-65% x range)
 * - Outlier nodes are placed on the right side (70-95% x range)
 * - Node size is determined by cluster percentage (>40% = lg, >20% = md, else sm)
 * - Outliers with critical/high severity are marked as 'dangerous', otherwise 'outlier'
 *
 * Each node includes metadata for tooltips and navigation:
 * - Clusters: clusterId for filtering sessions, size/percentage for display
 * - Outliers: sessionId for direct navigation, severity/causes for display
 */
export const buildVisualizationNodes = (
  clusters?: BehavioralCluster[],
  outliers?: OutlierSession[]
): ClusterNodeData[] => {
  const nodes: ClusterNodeData[] = [];

  // Add cluster nodes - spread horizontally in left portion
  clusters?.forEach((cluster, idx) => {
    nodes.push({
      id: cluster.cluster_id,
      x: 15 + ((idx * 25) % 50),
      y: 30 + ((idx * 15) % 40),
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

  // Add outlier nodes - place on right side
  outliers?.forEach((outlier, idx) => {
    nodes.push({
      id: outlier.session_id,
      x: 70 + ((idx * 10) % 25),
      y: 20 + ((idx * 20) % 60),
      size: 'sm',
      type: outlier.severity === 'critical' || outlier.severity === 'high' ? 'dangerous' : 'outlier',
      label: `Outlier: ${outlier.session_id.substring(0, 8)}... (${outlier.severity})`,
      sessionId: outlier.session_id,
      metadata: {
        severity: outlier.severity,
        primaryCauses: outlier.primary_causes,
      },
    });
  });

  return nodes;
};
