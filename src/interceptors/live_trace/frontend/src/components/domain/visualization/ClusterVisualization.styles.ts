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

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px currentColor;
  }
  50% {
    box-shadow: 0 0 16px currentColor;
  }
`;

interface ClusterNodeProps {
  $x: number;
  $y: number;
  $size: number;
  $type: ClusterNodeType;
  $clickable?: boolean;
}

export const ClusterNode = styled.div<ClusterNodeProps>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
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
        transform: translate(-50%, -50%) scale(1.2);
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
