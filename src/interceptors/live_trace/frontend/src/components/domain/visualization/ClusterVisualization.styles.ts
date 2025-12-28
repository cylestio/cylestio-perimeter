import styled, { css, keyframes } from 'styled-components';

import type { ClusterNodeType } from './ClusterVisualization';

export const ClusterContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

interface ClusterAreaProps {
  $height: number;
}

export const ClusterArea = styled.div<ClusterAreaProps>`
  position: relative;
  height: ${({ $height }) => $height}px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.surface2} 0%,
    ${({ theme }) => theme.colors.surface3} 100%
  );
`;

// SVG Canvas for links and nodes
export const SvgCanvas = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export type LinkType = 'cluster-to-cluster' | 'outlier-to-cluster';

interface SvgLinkProps {
  $type: LinkType;
  $opacity: number;
}

export const SvgLink = styled.line<SvgLinkProps>`
  opacity: ${({ $opacity }) => $opacity};
  transition: opacity ${({ theme }) => theme.transitions.base};

  ${({ $type, theme }) =>
    $type === 'cluster-to-cluster' &&
    css`
      stroke: ${theme.colors.cyan};
    `}

  ${({ $type, theme }) =>
    $type === 'outlier-to-cluster' &&
    css`
      stroke: ${theme.colors.white30};
    `}
`;

interface NodeWrapperProps {
  $x: number;
  $y: number;
}

export const NodeWrapper = styled.div<NodeWrapperProps>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  transform: translate(-50%, -50%);
  z-index: 1;
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px currentColor;
  }
  50% {
    box-shadow: 0 0 16px currentColor;
  }
`;

interface ClusterNodeCircleProps {
  $size: number;
  $type: ClusterNodeType;
  $clickable?: boolean;
}

export const ClusterNodeCircle = styled.div<ClusterNodeCircleProps>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  transition: transform ${({ theme }) => theme.transitions.fast};

  ${({ $type, theme }) =>
    $type === 'cluster' &&
    css`
      border: 2px solid ${theme.colors.cyan};
      background: ${theme.colors.cyanSoft};
    `}

  ${({ $type, theme }) =>
    $type === 'outlier' &&
    css`
      background: ${theme.colors.orange};
    `}

  ${({ $type, theme }) =>
    $type === 'dangerous' &&
    css`
      background: ${theme.colors.red};
      color: ${theme.colors.red};
      animation: ${glowPulse} 2s ease-in-out infinite;
    `}

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        transform: scale(1.2);
      }
    `}
`;

export const ClusterLegend = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

interface LegendDotProps {
  $type: ClusterNodeType;
}

export const LegendDot = styled.div<LegendDotProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;

  ${({ $type, theme }) =>
    $type === 'cluster' &&
    css`
      border: 2px solid ${theme.colors.cyan};
      background: ${theme.colors.cyanSoft};
    `}

  ${({ $type, theme }) =>
    $type === 'outlier' &&
    css`
      background: ${theme.colors.orange};
    `}

  ${({ $type, theme }) =>
    $type === 'dangerous' &&
    css`
      background: ${theme.colors.red};
    `}
`;

// Rich Tooltip Styles
interface TooltipWrapperProps {
  $type: ClusterNodeType;
}

export const TooltipWrapper = styled.div<TooltipWrapperProps>`
  min-width: 180px;
  max-width: 260px;

  ${({ $type, theme }) =>
    $type === 'dangerous' &&
    css`
      border-left: 2px solid ${theme.colors.red};
      padding-left: ${theme.spacing[2]};
      margin-left: -${theme.spacing[2]};
    `}
`;

export const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

interface TooltipIndicatorProps {
  $type: ClusterNodeType;
}

export const TooltipIndicator = styled.div<TooltipIndicatorProps>`
  width: ${({ theme }) => theme.spacing[2]};
  height: ${({ theme }) => theme.spacing[2]};
  border-radius: 50%;
  flex-shrink: 0;

  ${({ $type, theme }) =>
    $type === 'cluster' &&
    css`
      border: 2px solid ${theme.colors.cyan};
      background: ${theme.colors.cyanSoft};
    `}

  ${({ $type, theme }) =>
    $type === 'outlier' &&
    css`
      background: ${theme.colors.orange};
    `}

  ${({ $type, theme }) =>
    $type === 'dangerous' &&
    css`
      background: ${theme.colors.red};
      box-shadow: 0 0 6px ${theme.colors.red};
    `}
`;

interface TooltipLabelProps {
  $type: ClusterNodeType;
}

export const TooltipLabel = styled.span<TooltipLabelProps>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${({ $type, theme }) =>
    $type === 'cluster' &&
    css`
      color: ${theme.colors.cyan};
    `}

  ${({ $type, theme }) =>
    $type === 'outlier' &&
    css`
      color: ${theme.colors.orange};
    `}

  ${({ $type, theme }) =>
    $type === 'dangerous' &&
    css`
      color: ${theme.colors.red};
    `}
`;

export const TooltipTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white90};
  margin-bottom: 6px;
`;

export const TooltipDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderSubtle};
  margin: ${({ theme }) => theme.spacing[2]} 0;
`;

export const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: 2px 0;
`;

export const TooltipRowLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const TooltipRowValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white80};
  font-weight: 500;
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

interface TooltipSeverityProps {
  $severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
}

export const TooltipSeverity = styled.span<TooltipSeverityProps>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  text-transform: uppercase;

  ${({ $severity, theme }) =>
    $severity === 'low' &&
    css`
      background: ${theme.colors.white08};
      color: ${theme.colors.white70};
    `}

  ${({ $severity, theme }) =>
    $severity === 'medium' &&
    css`
      background: ${theme.colors.yellowSoft};
      color: ${theme.colors.yellow};
    `}

  ${({ $severity, theme }) =>
    $severity === 'high' &&
    css`
      background: ${theme.colors.orangeSoft};
      color: ${theme.colors.orange};
    `}

  ${({ $severity, theme }) =>
    ($severity === 'critical' || $severity === 'unknown') &&
    css`
      background: ${theme.colors.redSoft};
      color: ${theme.colors.red};
    `}
`;

export const TooltipCause = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.4;
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const TooltipTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const TooltipTag = styled.span`
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.surface4};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const TooltipFooter = styled.div`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.white30};
  margin-top: ${({ theme }) => theme.spacing[2]};
  text-align: center;
`;
