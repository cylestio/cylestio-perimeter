import styled, { css } from 'styled-components';
import type { AvatarSize, AvatarVariant, AvatarStatus } from './Avatar';
import { AVATAR_COLORS } from './Avatar';

interface StyledAvatarProps {
  $size: AvatarSize;
  $variant: AvatarVariant;
  $colorIndex: number;
}

interface StatusIndicatorProps {
  $status: AvatarStatus;
  $size: AvatarSize;
}

// Size configurations
const sizeStyles: Record<AvatarSize, ReturnType<typeof css>> = {
  sm: css`
    width: 24px;
    height: 24px;
    font-size: 10px;
  `,
  md: css`
    width: 32px;
    height: 32px;
    font-size: 11px;
  `,
  lg: css`
    width: 40px;
    height: 40px;
    font-size: 13px;
  `,
};

// Base variant styles (without gradient colors - those come from colorIndex)
const getVariantStyles = (variant: AvatarVariant, colorIndex: number) => {
  if (variant === 'user') {
    return css`
      background: ${({ theme }) => theme.colors.surface3};
      border: 1px solid ${({ theme }) => theme.colors.borderMedium};
      border-radius: ${({ theme }) => theme.radii.full};
      color: ${({ theme }) => theme.colors.white70};
      font-weight: ${({ theme }) => theme.typography.weightMedium};
    `;
  }

  // Gradient variant with dynamic colors based on initials hash
  const colors = AVATAR_COLORS[colorIndex];
  return css`
    background: linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%);
    border-radius: ${({ theme }) => theme.radii.md};
    color: ${({ theme }) => theme.colors.void};
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  `;
};

// Status colors
const statusColors: Record<AvatarStatus, string> = {
  online: '#00ff88',
  offline: 'rgba(255, 255, 255, 0.30)',
  error: '#ff4757',
};

// Status dot sizes
const statusSizes: Record<AvatarSize, { size: string; offset: string; border: string }> = {
  sm: { size: '6px', offset: '-2px', border: '1.5px' },
  md: { size: '8px', offset: '-1px', border: '2px' },
  lg: { size: '10px', offset: '0px', border: '2px' },
};

export const StyledAvatar = styled.div<StyledAvatarProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};

  ${({ $size }) => sizeStyles[$size]}
  ${({ $variant, $colorIndex }) => getVariantStyles($variant, $colorIndex)}
`;

export const StatusIndicator = styled.span<StatusIndicatorProps>`
  position: absolute;
  bottom: ${({ $size }) => statusSizes[$size].offset};
  right: ${({ $size }) => statusSizes[$size].offset};
  width: ${({ $size }) => statusSizes[$size].size};
  height: ${({ $size }) => statusSizes[$size].size};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $status }) => statusColors[$status]};
  border: ${({ $size }) => statusSizes[$size].border} solid ${({ theme }) => theme.colors.surface};
`;
