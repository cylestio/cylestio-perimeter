import type { FC, ReactNode } from 'react';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  ClusterContainer,
  ClusterArea,
  NodeWrapper,
  ClusterNodeCircle,
  ClusterLegend,
  LegendItem,
  LegendDot,
  SvgCanvas,
  SvgLink,
  TooltipWrapper,
  TooltipHeader,
  TooltipIndicator,
  TooltipLabel,
  TooltipTitle,
  TooltipDivider,
  TooltipRow,
  TooltipRowLabel,
  TooltipRowValue,
  TooltipSeverity,
  TooltipCause,
  TooltipTags,
  TooltipTag,
  TooltipFooter,
} from './ClusterVisualization.styles';

// Types
export type ClusterNodeType = 'cluster' | 'outlier' | 'dangerous';
export type ClusterNodeSize = 'sm' | 'md' | 'lg';

export interface ClusterNodeMetadata {
  size?: number;
  percentage?: number;
  severity?: string;
  primaryCauses?: string[];
  commonTools?: string[];
}

export interface ClusterNodeData {
  id: string;
  x: number;
  y: number;
  size: ClusterNodeSize;
  type: ClusterNodeType;
  label?: string;
  clusterId?: string;
  sessionId?: string;
  metadata?: ClusterNodeMetadata;
}

export interface ClusterLink {
  source: string;
  target: string;
  type: 'outlier-to-cluster' | 'cluster-to-cluster';
  strength?: number;
}

export interface ClusterVisualizationProps {
  nodes: ClusterNodeData[];
  links?: ClusterLink[];
  height?: number;
  onNodeClick?: (node: ClusterNodeData) => void;
  showLegend?: boolean;
}

const sizeMap: Record<ClusterNodeSize, number> = {
  sm: 12,
  md: 20,
  lg: 32,
};

/**
 * Get the type label for display.
 */
const getTypeLabel = (type: ClusterNodeType): string => {
  switch (type) {
    case 'cluster':
      return 'Cluster';
    case 'outlier':
      return 'Outlier Session';
    case 'dangerous':
      return 'High Risk Session';
    default:
      return 'Node';
  }
};

/**
 * Truncate session ID for display.
 */
const formatSessionId = (sessionId: string): string => {
  if (sessionId.length <= 12) return sessionId;
  return `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}`;
};

/**
 * Build rich tooltip content based on node type and metadata.
 */
const buildTooltipContent = (node: ClusterNodeData, hasClickHandler: boolean): ReactNode => {
  const typeLabel = getTypeLabel(node.type);

  // Cluster tooltip
  if (node.type === 'cluster') {
    const size = node.metadata?.size ?? 0;
    const percentage = node.metadata?.percentage ?? 0;
    const tools = node.metadata?.commonTools ?? [];

    return (
      <TooltipWrapper $type="cluster">
        <TooltipHeader>
          <TooltipIndicator $type="cluster" />
          <TooltipLabel $type="cluster">{typeLabel}</TooltipLabel>
        </TooltipHeader>
        <TooltipTitle>Normal Behavioral Pattern</TooltipTitle>
        <TooltipRow>
          <TooltipRowLabel>Sessions</TooltipRowLabel>
          <TooltipRowValue>{size}</TooltipRowValue>
        </TooltipRow>
        <TooltipRow>
          <TooltipRowLabel>Coverage</TooltipRowLabel>
          <TooltipRowValue>{percentage.toFixed(0)}%</TooltipRowValue>
        </TooltipRow>
        {tools.length > 0 && (
          <>
            <TooltipDivider />
            <TooltipRowLabel>Common Tools</TooltipRowLabel>
            <TooltipTags>
              {tools.slice(0, 3).map((tool) => (
                <TooltipTag key={tool}>{tool}</TooltipTag>
              ))}
              {tools.length > 3 && <TooltipTag>+{tools.length - 3}</TooltipTag>}
            </TooltipTags>
          </>
        )}
        {hasClickHandler && <TooltipFooter>Click to view sessions</TooltipFooter>}
      </TooltipWrapper>
    );
  }

  // Outlier / Dangerous session tooltip
  const severity = (node.metadata?.severity ?? 'unknown') as
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'
    | 'unknown';
  const causes = node.metadata?.primaryCauses ?? [];
  const primaryCause = causes[0] ?? 'Behavioral anomaly detected';

  return (
    <TooltipWrapper $type={node.type}>
      <TooltipHeader>
        <TooltipIndicator $type={node.type} />
        <TooltipLabel $type={node.type}>{typeLabel}</TooltipLabel>
      </TooltipHeader>
      {node.sessionId && (
        <TooltipTitle>{formatSessionId(node.sessionId)}</TooltipTitle>
      )}
      <TooltipRow>
        <TooltipRowLabel>Severity</TooltipRowLabel>
        <TooltipSeverity $severity={severity}>{severity}</TooltipSeverity>
      </TooltipRow>
      <TooltipDivider />
      <TooltipRowLabel>Primary Cause</TooltipRowLabel>
      <TooltipCause>{primaryCause}</TooltipCause>
      {causes.length > 1 && (
        <TooltipCause style={{ marginTop: '2px', opacity: 0.7 }}>
          +{causes.length - 1} more issue{causes.length > 2 ? 's' : ''}
        </TooltipCause>
      )}
      {hasClickHandler && <TooltipFooter>Click to investigate</TooltipFooter>}
    </TooltipWrapper>
  );
};


// Component
export const ClusterVisualization: FC<ClusterVisualizationProps> = ({
  nodes,
  links = [],
  height = 200,
  onNodeClick,
  showLegend = true,
}) => {
  // Create a map of node positions for link rendering
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <ClusterContainer>
      <ClusterArea $height={height}>
        {/* SVG layer for links only */}
        <SvgCanvas>
          {links.map((link) => {
            const sourceNode = nodeMap.get(link.source);
            const targetNode = nodeMap.get(link.target);

            if (!sourceNode || !targetNode) return null;

            const isClusterLink = link.type === 'cluster-to-cluster';
            const opacity = isClusterLink ? (link.strength ?? 0.5) * 0.6 + 0.2 : 0.4;
            const strokeWidth = isClusterLink ? 2 : 1;
            const dashArray = isClusterLink ? undefined : '4,4';

            return (
              <SvgLink
                key={`${link.source}-${link.target}`}
                x1={`${sourceNode.x}%`}
                y1={`${sourceNode.y}%`}
                x2={`${targetNode.x}%`}
                y2={`${targetNode.y}%`}
                $type={link.type}
                $opacity={opacity}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
              />
            );
          })}
        </SvgCanvas>

        {/* Node layer with div-based circles for proper theme colors */}
        {nodes.map((node) => (
          <NodeWrapper key={node.id} $x={node.x} $y={node.y}>
            <Tooltip content={buildTooltipContent(node, !!onNodeClick)} position="top" delay={100}>
              <ClusterNodeCircle
                data-testid={`cluster-node-${node.id}`}
                $size={sizeMap[node.size]}
                $type={node.type}
                $clickable={!!onNodeClick}
                onClick={() => onNodeClick?.(node)}
              />
            </Tooltip>
          </NodeWrapper>
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
