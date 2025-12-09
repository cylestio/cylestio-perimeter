import styled, { css, keyframes } from 'styled-components';

import type { AnalysisStatus } from './AnalysisStatusItem';

// Status color mapping
const getStatusColor = (status: AnalysisStatus, isRecommendation?: boolean) => {
  if (isRecommendation) return 'purple';
  switch (status) {
    case 'ok':
      return 'green';
    case 'warning':
      return 'orange';
    case 'critical':
      return 'red';
    case 'running':
      return 'white50'; // Neutral gray for running
    case 'inactive':
    default:
      return 'white30';
  }
};

// Spin animation for running status
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface StyledItemProps {
  $collapsed?: boolean;
  $isRecommendation?: boolean;
  $clickable?: boolean;
  $active?: boolean;
  $disabled?: boolean;
}

export const StyledAnalysisStatusItem = styled.div<StyledItemProps>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  transition: all 150ms ease;
  text-decoration: none;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: 10px;
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.4;
      pointer-events: none;
      cursor: not-allowed;
    `}

  ${({ $active, $isRecommendation, theme }) => {
    if ($active) {
      return css`
        background: ${$isRecommendation ? `${theme.colors.purple}20` : theme.colors.white15};
        color: ${theme.colors.white};
      `;
    }
    if ($isRecommendation) {
      return css`
        background: ${theme.colors.purple}10;
      `;
    }
    return '';
  }}

  ${({ $clickable, $active, $disabled, theme }) =>
    $clickable &&
    !$active &&
    !$disabled &&
    css`
      cursor: pointer;
      &:hover {
        background: ${theme.colors.white08};
      }
    `}

  ${({ $clickable, $active, $disabled }) =>
    $clickable &&
    $active &&
    !$disabled &&
    css`
      cursor: pointer;
    `}
`;

interface StatusRingContainerProps {
  $status: AnalysisStatus;
  $isRecommendation?: boolean;
  $isRunning?: boolean;
}

export const StatusRingContainer = styled.span<StatusRingContainerProps>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;

  color: ${({ $status, $isRecommendation, theme }) =>
    theme.colors[getStatusColor($status, $isRecommendation) as keyof typeof theme.colors]};

  .ring-svg {
    position: absolute;
    top: 0;
    left: 0;

    ${({ $isRunning }) =>
      $isRunning &&
      css`
        animation: ${spin} 1s linear infinite;
      `}
  }

  .progress-circle {
    transition: stroke-dasharray 0.3s ease;
  }

  .ring-icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      display: block;
    }
  }
`;

export const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
`;

export const ItemLabel = styled.span`
  color: ${({ theme }) => theme.colors.white80};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
`;

export const ItemStat = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
`;

interface ItemBadgeProps {
  $status: AnalysisStatus;
  $isRecommendation?: boolean;
}

export const ItemBadge = styled.span<ItemBadgeProps>`
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $status, $isRecommendation, theme }) => {
    const color = getStatusColor($status, $isRecommendation);
    return `${theme.colors[color as keyof typeof theme.colors]}20`;
  }};
  color: ${({ $status, $isRecommendation, theme }) =>
    theme.colors[getStatusColor($status, $isRecommendation) as keyof typeof theme.colors]};
`;
