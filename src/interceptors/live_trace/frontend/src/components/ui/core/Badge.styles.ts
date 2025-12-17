import styled, { css } from 'styled-components';
import type { BadgeVariant, BadgeSize, Severity, CorrelationStatus } from './Badge';
import { pulse, glowPulse } from '@theme/animations';

// ===========================================
// BADGE
// ===========================================

const badgeVariantStyles: Record<BadgeVariant, ReturnType<typeof css>> = {
  critical: css`
    background: ${({ theme }) => theme.colors.redSoft};
    color: ${({ theme }) => theme.colors.severityCritical};
  `,
  high: css`
    background: ${({ theme }) => theme.colors.redSoft};
    color: ${({ theme }) => theme.colors.severityHigh};
  `,
  medium: css`
    background: ${({ theme }) => theme.colors.yellowSoft};
    color: ${({ theme }) => theme.colors.severityMedium};
  `,
  low: css`
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme }) => theme.colors.severityLow};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.greenSoft};
    color: ${({ theme }) => theme.colors.green};
  `,
  info: css`
    background: ${({ theme }) => theme.colors.cyanSoft};
    color: ${({ theme }) => theme.colors.cyan};
  `,
  ai: css`
    background: ${({ theme }) => theme.colors.purpleSoft};
    color: ${({ theme }) => theme.colors.purple};
  `,
};

const badgeSizeStyles: Record<BadgeSize, ReturnType<typeof css>> = {
  sm: css`
    padding: 2px 6px;
    font-size: 9px;
  `,
  md: css`
    padding: 4px 10px;
    font-size: 10px;
  `,
};

interface StyledBadgeProps {
  $variant: BadgeVariant;
  $size: BadgeSize;
}

export const StyledBadge = styled.span<StyledBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};

  ${({ $variant }) => badgeVariantStyles[$variant]}
  ${({ $size }) => badgeSizeStyles[$size]}
`;

// ===========================================
// SEVERITY DOT
// ===========================================

const severityColors: Record<Severity, { bg: string; glow?: string }> = {
  critical: { bg: 'severityCritical', glow: 'glowRed' },
  high: { bg: 'severityHigh', glow: 'glowRed' },
  medium: { bg: 'severityMedium' },
  low: { bg: 'severityLow' },
};

interface StyledSeverityDotProps {
  $severity: Severity;
  $glow: boolean;
  $size: 'sm' | 'md';
}

export const StyledSeverityDot = styled.span<StyledSeverityDotProps>`
  display: inline-block;
  border-radius: 50%;

  ${({ $size }) =>
    $size === 'sm'
      ? css`
          width: 6px;
          height: 6px;
        `
      : css`
          width: 8px;
          height: 8px;
        `}

  ${({ $severity, theme }) => {
    const color = severityColors[$severity];
    return css`
      background: ${theme.colors[color.bg as keyof typeof theme.colors]};
    `;
  }}

  ${({ $severity, $glow, theme }) => {
    if (!$glow) return '';
    const color = severityColors[$severity];
    if (!color.glow) return '';
    return css`
      box-shadow: 0 0 8px ${theme.colors[$severity as keyof typeof theme.colors]};
    `;
  }}
`;

// ===========================================
// MODE PILL
// ===========================================

interface StyledModePillProps {
  $active: boolean;
}

export const StyledModePill = styled.span<StyledModePillProps>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;

  ${({ $active, theme }) =>
    $active
      ? css`
          border-color: ${theme.colors.green};
          color: ${theme.colors.green};
        `
      : css`
          border-color: ${theme.colors.white15};
          color: ${theme.colors.white30};
        `}
`;

export const PulseDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: ${pulse} 2s infinite;
`;

// ===========================================
// CORRELATION BADGE
// ===========================================

const correlationStyles: Record<CorrelationStatus, ReturnType<typeof css>> = {
  confirmed: css`
    background: ${({ theme }) => theme.colors.greenSoft};
    border-color: rgba(0, 255, 136, 0.3);
    color: ${({ theme }) => theme.colors.green};
  `,
  controlled: css`
    background: ${({ theme }) => theme.colors.greenSoft};
    border-color: rgba(0, 255, 136, 0.3);
    color: ${({ theme }) => theme.colors.green};
  `,
  discovered: css`
    background: ${({ theme }) => theme.colors.purpleSoft};
    border-color: rgba(168, 85, 247, 0.3);
    color: ${({ theme }) => theme.colors.purple};
  `,
  pending: css`
    background: ${({ theme }) => theme.colors.white04};
    border-color: ${({ theme }) => theme.colors.white30};
    border-style: dashed;
    color: ${({ theme }) => theme.colors.white50};
  `,
  triggered: css`
    background: ${({ theme }) => theme.colors.redSoft};
    border-color: rgba(255, 71, 87, 0.3);
    color: ${({ theme }) => theme.colors.red};
    animation: ${glowPulse} 2s infinite;
  `,
};

interface StyledCorrelationBadgeProps {
  $status: CorrelationStatus;
}

export const StyledCorrelationBadge = styled.span<StyledCorrelationBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 11px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  border: 1px solid;

  ${({ $status }) => correlationStyles[$status]}
`;
