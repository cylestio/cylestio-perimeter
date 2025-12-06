import type { FC } from 'react';
import {
  ClusterContainer,
  ClusterArea,
  ClusterNode,
  ClusterLegend,
  LegendItem,
  LegendDot,
} from './ClusterVisualization.styles';

// Types
export type ClusterNodeType = 'cluster' | 'outlier' | 'dangerous';
export type ClusterNodeSize = 'sm' | 'md' | 'lg';

export interface ClusterNodeData {
  id: string;
  x: number;
  y: number;
  size: ClusterNodeSize;
  type: ClusterNodeType;
  label?: string;
}

export interface ClusterVisualizationProps {
  nodes: ClusterNodeData[];
  height?: number;
  onNodeClick?: (node: ClusterNodeData) => void;
  showLegend?: boolean;
}

const sizeMap: Record<ClusterNodeSize, number> = {
  sm: 12,
  md: 20,
  lg: 32,
};

// Component
export const ClusterVisualization: FC<ClusterVisualizationProps> = ({
  nodes,
  height = 200,
  onNodeClick,
  showLegend = true,
}) => {
  return (
    <ClusterContainer>
      <ClusterArea $height={height}>
        {nodes.map((node) => (
          <ClusterNode
            key={node.id}
            data-testid={`cluster-node-${node.id}`}
            $x={node.x}
            $y={node.y}
            $size={sizeMap[node.size]}
            $type={node.type}
            $clickable={!!onNodeClick}
            onClick={() => onNodeClick?.(node)}
            title={node.label}
          />
        ))}
      </ClusterArea>
      {showLegend && (
        <ClusterLegend>
          <LegendItem>
            <LegendDot $type="cluster" />
            <span>Normal Cluster</span>
          </LegendItem>
          <LegendItem>
            <LegendDot $type="outlier" />
            <span>Outlier</span>
          </LegendItem>
          <LegendItem>
            <LegendDot $type="dangerous" />
            <span>Dangerous</span>
          </LegendItem>
        </ClusterLegend>
      )}
    </ClusterContainer>
  );
};
