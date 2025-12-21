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

// Props interfaces
interface ItemWrapperProps {
  $status: DynamicCheckStatus;
  $clickable: boolean;
  $variant: 'compact' | 'detailed';
}

interface StatusIconProps {
  $status: DynamicCheckStatus;
  $isAnalyzing: boolean;
}

interface StatusBadgeProps {
  $status: DynamicCheckStatus;
}

interface CategoryBadgeProps {
  $categoryId: string;
}

// Component styles
export const ItemWrapper = styled.div<ItemWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme, $variant }) =>
    $variant === 'compact'
      ? `${theme.spacing[2]} ${theme.spacing[4]}`
      : `${theme.spacing[3]} ${theme.spacing[4]}`};
  background: transparent;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  ${({ $clickable, theme }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        background: ${theme.colors.surface3};
      }

      &:active {
        background: ${theme.colors.surface4};
      }
    `}
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
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
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

export const ValueText = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  white-space: nowrap;
`;

export const DescriptionText = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

  ${({ $status }) =>
    $status === 'analyzing' &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;

export const CategoryBadge = styled.span<CategoryBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  background: ${({ theme }) => theme.colors.white08};
  color: ${({ theme }) => theme.colors.white50};

  svg {
    width: 10px;
    height: 10px;
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`;

export const ChevronIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  transition: color ${({ theme }) => theme.transitions.fast};

  ${ItemWrapper}:hover & {
    color: ${({ theme }) => theme.colors.white50};
  }
`;
