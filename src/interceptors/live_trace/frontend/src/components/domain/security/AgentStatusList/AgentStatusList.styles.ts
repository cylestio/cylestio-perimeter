import styled, { css, keyframes, type DefaultTheme } from 'styled-components';

import type { DynamicCheckStatus } from '@api/types/security';

// Animation for analyzing state
const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

// Status color mapping
const getStatusColor = (status: DynamicCheckStatus): keyof DefaultTheme['colors'] => {
  switch (status) {
    case 'passed':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'critical':
      return 'red';
    case 'analyzing':
      return 'cyan';
    default:
      return 'white50';
  }
};

const getStatusBgColor = (status: DynamicCheckStatus): keyof DefaultTheme['colors'] => {
  switch (status) {
    case 'passed':
      return 'greenSoft';
    case 'warning':
      return 'yellowSoft';
    case 'critical':
      return 'redSoft';
    case 'analyzing':
      return 'cyanSoft';
    default:
      return 'surface2';
  }
};

interface StatusBadgeProps {
  $status: DynamicCheckStatus;
}

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const AgentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]} ${theme.spacing[2]} ${theme.spacing[8]}`};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const AgentName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white80};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

export const StatusBadge = styled.span<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $status, theme }) => theme.colors[getStatusBgColor($status)]};
  color: ${({ $status, theme }) => theme.colors[getStatusColor($status)]};
  flex-shrink: 0;

  ${({ $status }) =>
    $status === 'analyzing' &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;
