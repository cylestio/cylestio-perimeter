import styled, { css, keyframes, type DefaultTheme } from 'styled-components';

import type { DynamicCheckStatus } from '@api/types/security';

// Animation for analyzing state
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

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

// Props interfaces
interface ItemWrapperProps {
  $status: DynamicCheckStatus;
  $expanded: boolean;
}

interface StatusIconProps {
  $status: DynamicCheckStatus;
  $isAnalyzing: boolean;
}

interface ChevronIconProps {
  $expanded: boolean;
}

// Component styles
export const ItemContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
  }
`;

export const ItemWrapper = styled.div<ItemWrapperProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
  }

  &:active {
    background: ${({ theme }) => theme.colors.surface4};
  }
`;

export const StatusIconContainer = styled.div<StatusIconProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ $status, theme }) => theme.colors[getStatusColor($status)]};

  svg {
    width: 16px;
    height: 16px;
  }

  ${({ $isAnalyzing }) =>
    $isAnalyzing &&
    css`
      svg {
        animation: ${spin} 1s linear infinite;
      }
    `}
`;

export const ContentContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

export const TitleWithInfo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  cursor: help;
`;

export const CheckTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  flex-shrink: 0;

  ${TitleWithInfo}:hover & {
    color: ${({ theme }) => theme.colors.white50};
  }
`;

export const SummaryText = styled.span<{ $hasIssues: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ $hasIssues, theme }) =>
    $hasIssues ? theme.colors.yellow : theme.colors.white50};
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`;

export const ChevronIcon = styled.div<ChevronIconProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  transition:
    color ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  ${({ $expanded }) =>
    $expanded &&
    css`
      transform: rotate(90deg);
    `}

  ${ItemWrapper}:hover & {
    color: ${({ theme }) => theme.colors.white50};
  }
`;

export const ExpandedContent = styled.div<{ $expanded: boolean }>`
  overflow: hidden;
  max-height: ${({ $expanded }) => ($expanded ? '500px' : '0')};
  transition: max-height ${({ theme }) => theme.transitions.slow};
  background: ${({ theme }) => theme.colors.surface};
  border-top: ${({ $expanded, theme }) =>
    $expanded ? `1px solid ${theme.colors.borderSubtle}` : 'none'};
`;

export const AnalyzingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ theme }) => theme.colors.cyanSoft};
  color: ${({ theme }) => theme.colors.cyan};
  animation: ${pulse} 2s ease-in-out infinite;
`;
