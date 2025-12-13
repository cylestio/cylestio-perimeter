import styled, { css } from 'styled-components';
import type { StatCardColor, StatCardSize } from './StatCard';
import { BaseCard } from '@ui/core/Card.styles';

// ===========================================
// STAT CARD
// ===========================================

interface StyledStatCardProps {
  $size: StatCardSize;
}

export const StyledStatCard = styled(BaseCard)<StyledStatCardProps>`
  min-width: 180px;

  ${({ $size }) =>
    $size === 'sm'
      ? css`
          padding: 16px;
        `
      : css`
          padding: 20px;
        `}
`;

interface IconContainerProps {
  $color?: StatCardColor;
  $size: StatCardSize;
}

const colorMap: Record<StatCardColor, { bg: string; fg: string }> = {
  orange: { bg: 'orangeSoft', fg: 'orange' },
  red: { bg: 'redSoft', fg: 'red' },
  green: { bg: 'greenSoft', fg: 'green' },
  purple: { bg: 'purpleSoft', fg: 'purple' },
  cyan: { bg: 'cyanSoft', fg: 'cyan' },
};

export const IconContainer = styled.div<IconContainerProps>`
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${({ $size }) =>
    $size === 'sm'
      ? css`
          width: 28px;
          height: 28px;
        `
      : css`
          width: 32px;
          height: 32px;
          margin-bottom: 12px;
        `}

  ${({ $color, theme }) => {
    if (!$color) {
      return `
        background: ${theme.colors.white08};
        color: ${theme.colors.white50};
      `;
    }
    const colors = colorMap[$color];
    return `
      background: ${theme.colors[colors.bg as keyof typeof theme.colors]};
      color: ${theme.colors[colors.fg as keyof typeof theme.colors]};
    `;
  }}

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export const StatLabel = styled.span`
  display: block;
  margin-bottom: 4px;
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
`;

export const StatLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

export const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  cursor: help;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.white50};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

interface StatValueProps {
  $color?: StatCardColor;
  $size: StatCardSize;
}

export const StatValue = styled.div<StatValueProps>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;

  ${({ $size }) =>
    $size === 'sm'
      ? css`
          font-size: 28px;
        `
      : css`
          font-size: 32px;
        `}

  ${({ $color, theme }) => {
    if (!$color) {
      return `color: ${theme.colors.white};`;
    }
    const colors = colorMap[$color];
    return `color: ${theme.colors[colors.fg as keyof typeof theme.colors]};`;
  }}
`;

export const StatDetail = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white30};
`;
