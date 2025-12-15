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

// Premium gold-purple gradient glow animation
const premiumGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 8px rgba(251, 191, 36, 0.4), 0 0 16px rgba(168, 85, 247, 0.2);
  }
  50% { 
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.6), 0 0 24px rgba(168, 85, 247, 0.4);
  }
`;

// Shimmer animation for enterprise badge
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
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
    if ($status === 'premium') {
      return theme.colors.gold;
    }
    const color = getStatusColor($status, $isLocked);
    return theme.colors[color as keyof typeof theme.colors] || theme.colors.white30;
  }};

  ${({ $status }) =>
    $status === 'premium' &&
    css`
      animation: ${premiumGlow} 2s ease-in-out infinite;
      
      /* Gold-purple gradient effect on the SVG ring */
      .ring-svg circle {
        stroke: url(#premiumGradient);
      }
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
  $status: 'pending' | 'active' | 'complete' | 'critical' | 'warning';
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
      case 'critical':
        return `linear-gradient(
          ${$position === 'top' ? 'to bottom' : 'to top'},
          ${theme.colors.red}60,
          ${theme.colors.red}
        )`;
      case 'warning':
        return `linear-gradient(
          ${$position === 'top' ? 'to bottom' : 'to top'},
          ${theme.colors.orange}60,
          ${theme.colors.orange}
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

  ${({ $status }) =>
    $status === 'critical' &&
    css`
      box-shadow: 0 0 6px ${({ theme }) => theme.colors.red}30;
    `}

  ${({ $status }) =>
    $status === 'warning' &&
    css`
      box-shadow: 0 0 6px ${({ theme }) => theme.colors.orange}30;
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
  $badgeColor?: 'red' | 'orange' | 'yellow' | 'green' | 'cyan';
}

export const ItemBadge = styled.span<ItemBadgeProps>`
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $status, $badgeColor, theme }) => {
    // Use badgeColor if provided, otherwise fall back to status color
    const color = $badgeColor || getStatusColor($status);
    return `${theme.colors[color as keyof typeof theme.colors]}20`;
  }};
  color: ${({ $status, $badgeColor, theme }) => {
    // Use badgeColor if provided, otherwise fall back to status color
    const color = $badgeColor || getStatusColor($status);
    return theme.colors[color as keyof typeof theme.colors];
  }};
`;

export const LockIcon = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.white30};
  display: flex;
  align-items: center;
`;

// Enterprise badge with gold-purple gradient
export const EnterpriseBadge = styled.span`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 3px;
  position: relative;
  
  /* Gradient text effect */
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.gold} 0%,
    ${({ theme }) => theme.colors.purple} 50%,
    ${({ theme }) => theme.colors.gold} 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 3s linear infinite;
  
  /* Badge border with gradient */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 3px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.gold}80,
      ${({ theme }) => theme.colors.purple}80
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  
  /* Badge background fill */
  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 2px;
    background: linear-gradient(
      135deg,
      rgba(251, 191, 36, 0.12) 0%,
      rgba(168, 85, 247, 0.12) 100%
    );
    z-index: -1;
    pointer-events: none;
  }

  svg {
    color: ${({ theme }) => theme.colors.gold};
    -webkit-text-fill-color: initial;
    flex-shrink: 0;
  }
`;
