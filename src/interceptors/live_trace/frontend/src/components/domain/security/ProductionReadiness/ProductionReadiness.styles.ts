import styled, { css, keyframes } from 'styled-components';

import type { ProductionReadinessStatus } from '@api/types/dashboard';

// Status variant type for consistent styling
type StatusVariant = 'pending' | 'ready' | 'blocked';

// Pulse animation for running state
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Spin animation for loader
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const Container = styled.div<{ $variant: StatusVariant }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'ready':
        return `linear-gradient(135deg, ${theme.colors.greenSoft}, ${theme.colors.surface})`;
      case 'blocked':
        return `linear-gradient(135deg, ${theme.colors.redSoft}, ${theme.colors.surface})`;
      case 'pending':
      default:
        return theme.colors.surface;
    }
  }};
  border: 1px solid ${({ $variant, theme }) => {
    switch ($variant) {
      case 'ready':
        return `${theme.colors.green}40`;
      case 'blocked':
        return `${theme.colors.red}40`;
      case 'pending':
      default:
        return theme.colors.borderMedium;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-right: ${({ theme }) => theme.spacing[4]};
  border-right: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const TitleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white70};
`;

export const Title = styled.span`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
  white-space: nowrap;
`;

export const StagesSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex: 1;
`;

export const Stage = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $clickable, theme }) =>
    $clickable &&
    css`
      cursor: pointer;
      &:hover {
        border-color: ${theme.colors.borderMedium};
        background: ${theme.colors.white08};
      }
    `}
`;

export const StageIcon = styled.div<{ $status: ProductionReadinessStatus; $hasCritical: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;

  ${({ $status, $hasCritical, theme }) => {
    if ($status === 'pending') {
      return css`
        background: ${theme.colors.white08};
        border: 1px solid ${theme.colors.borderMedium};
        color: ${theme.colors.white30};
      `;
    }
    if ($status === 'running') {
      return css`
        background: ${theme.colors.cyanSoft};
        border: 1px solid ${theme.colors.cyan};
        color: ${theme.colors.cyan};
        animation: ${pulse} 1.5s ease-in-out infinite;
      `;
    }
    // completed
    if ($hasCritical) {
      return css`
        background: ${theme.colors.redSoft};
        border: 1px solid ${theme.colors.red};
        color: ${theme.colors.red};
      `;
    }
    return css`
      background: ${theme.colors.greenSoft};
      border: 1px solid ${theme.colors.green};
      color: ${theme.colors.green};
    `;
  }}
`;

export const StageLabel = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white};
`;

export const StageBadge = styled.span<{ $color: 'red' | 'green' }>`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color, theme }) =>
    $color === 'red' ? theme.colors.red : theme.colors.green};
  color: ${({ theme }) => theme.colors.void};
`;

export const Connector = styled.div<{ $active: boolean }>`
  width: 32px;
  height: 2px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.green : theme.colors.borderMedium};
  flex-shrink: 0;
`;

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding-left: ${({ theme }) => theme.spacing[4]};
  border-left: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const StatusIndicator = styled.div<{ $variant: StatusVariant }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const StatusIcon = styled.div<{ $variant: StatusVariant; $spinning?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'ready':
        return theme.colors.green;
      case 'blocked':
        return theme.colors.red;
      case 'pending':
      default:
        return theme.colors.white08;
    }
  }};
  color: ${({ $variant, theme }) =>
    $variant === 'pending' ? theme.colors.white50 : theme.colors.void};
  border: ${({ $variant, theme }) =>
    $variant === 'pending' ? `1px solid ${theme.colors.borderMedium}` : 'none'};

  svg {
    ${({ $spinning }) =>
      $spinning &&
      css`
        animation: ${spin} 1.5s linear infinite;
      `}
  }
`;

export const StatusText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatusTitle = styled.span<{ $variant: StatusVariant }>`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'ready':
        return theme.colors.green;
      case 'blocked':
        return theme.colors.red;
      case 'pending':
      default:
        return theme.colors.white70;
    }
  }};
`;

export const StatusSubtitle = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const ActionButton = styled.button<{ $variant: 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  ${({ $variant, theme }) =>
    $variant === 'success'
      ? css`
          background: ${theme.colors.green};
          border: 1px solid ${theme.colors.green};
          color: ${theme.colors.void};

          &:hover {
            filter: brightness(1.15);
          }
        `
      : css`
          background: ${theme.colors.surface2};
          border: 1px solid ${theme.colors.red};
          color: ${theme.colors.red};

          &:hover {
            background: ${theme.colors.redSoft};
          }
        `}
`;
