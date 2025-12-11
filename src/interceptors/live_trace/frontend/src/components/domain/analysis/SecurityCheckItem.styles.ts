import styled, { css, keyframes } from 'styled-components';

import type { SecurityCheckStatus } from './SecurityCheckItem';

// Status color mapping
const getStatusColor = (status: SecurityCheckStatus, isLocked?: boolean): string => {
  if (isLocked) return 'white30';
  switch (status) {
    case 'ok':
      return 'green';
    case 'warning':
      return 'orange';
    case 'critical':
      return 'red';
    case 'running':
      return 'cyan';
    case 'premium':
      return 'gold';
    case 'locked':
      return 'white30';
    case 'inactive':
    default:
      return 'white30';
  }
};

// Special glow for premium items
const premiumGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 16px rgba(251, 191, 36, 0.5); }
`;

// Spin animation for running status
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Pulse animation for active timeline
const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

interface StyledItemProps {
  $collapsed?: boolean;
  $clickable?: boolean;
  $active?: boolean;
  $disabled?: boolean;
  $isLocked?: boolean;
  $status: SecurityCheckStatus;
}

export const StyledSecurityCheckItem = styled.div<StyledItemProps>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  transition: all 150ms ease;
  text-decoration: none;
  position: relative;

  .status-column {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: 10px;
    `}

  ${({ $disabled, $isLocked }) =>
    ($disabled || $isLocked) &&
    css`
      opacity: ${$isLocked ? 0.6 : 0.4};
      pointer-events: ${$isLocked ? 'auto' : 'none'};
      cursor: ${$isLocked ? 'not-allowed' : 'default'};
    `}

  ${({ $active, $status, theme }) => {
    if ($active) {
      const color = getStatusColor($status);
      return css`
        background: ${theme.colors[color as keyof typeof theme.colors]}15;
        color: ${theme.colors.white};
      `;
    }
    return '';
  }}

  ${({ $clickable, $active, $disabled, $isLocked, theme }) =>
    $clickable &&
    !$active &&
    !$disabled &&
    !$isLocked &&
    css`
      cursor: pointer;
      &:hover {
        background: ${theme.colors.white08};
      }
    `}
`;

interface StatusIndicatorProps {
  $status: SecurityCheckStatus;
  $isLocked?: boolean;
  $isRunning?: boolean;
}

export const StatusIndicatorContainer = styled.span<StatusIndicatorProps>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  z-index: 1;
  border-radius: 50%;

  color: ${({ $status, $isLocked, theme }) => {
    const color = getStatusColor($status, $isLocked);
    return theme.colors[color as keyof typeof theme.colors] || theme.colors.white30;
  }};

  ${({ $status }) =>
    $status === 'premium' &&
    css`
      animation: ${premiumGlow} 2s ease-in-out infinite;
    `}

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

interface TimelineConnectorProps {
  $position: 'top' | 'bottom';
  $status: 'pending' | 'active' | 'complete';
}

export const TimelineConnector = styled.div<TimelineConnectorProps>`
  position: absolute;
  width: 2px;
  height: 20px;
  left: 50%;
  transform: translateX(-50%);

  ${({ $position }) =>
    $position === 'top'
      ? css`
          top: -20px;
        `
      : css`
          bottom: -20px;
        `}

  background: ${({ $status, $position, theme }) => {
    switch ($status) {
      case 'complete':
        return `linear-gradient(
          ${$position === 'top' ? 'to bottom' : 'to top'}, 
          ${theme.colors.green}60, 
          ${theme.colors.green}
        )`;
      case 'active':
        return `linear-gradient(
          ${$position === 'top' ? 'to bottom' : 'to top'},
          ${theme.colors.cyan}40,
          ${theme.colors.cyan}
        )`;
      case 'pending':
      default:
        return `linear-gradient(
          ${$position === 'top' ? 'to bottom' : 'to top'},
          ${theme.colors.white08},
          ${theme.colors.white20}
        )`;
    }
  }};

  ${({ $status }) =>
    $status === 'active' &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
      box-shadow: 0 0 8px ${({ theme }) => theme.colors.cyan}40;
    `}

  ${({ $status }) =>
    $status === 'complete' &&
    css`
      box-shadow: 0 0 6px ${({ theme }) => theme.colors.green}30;
    `}

  border-radius: 1px;
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
  $status: SecurityCheckStatus;
}

export const ItemBadge = styled.span<ItemBadgeProps>`
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $status, theme }) => {
    const color = getStatusColor($status);
    return `${theme.colors[color as keyof typeof theme.colors]}20`;
  }};
  color: ${({ $status, theme }) => {
    const color = getStatusColor($status);
    return theme.colors[color as keyof typeof theme.colors];
  }};
`;

export const LockIcon = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.white30};
  display: flex;
  align-items: center;
`;
