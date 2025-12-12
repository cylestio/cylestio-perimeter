import styled, { css } from 'styled-components';

export const BadgesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
`;

// Different badge types have different colors
type BadgeType = 'owasp' | 'cwe' | 'soc2' | 'cvss' | 'mitre' | 'nist';

const badgeTypeStyles: Record<BadgeType, ReturnType<typeof css>> = {
  owasp: css`
    background: ${({ theme }) => theme.colors.purpleSoft};
    color: ${({ theme }) => theme.colors.purple};
    border-color: rgba(168, 85, 247, 0.3);
  `,
  cwe: css`
    background: ${({ theme }) => theme.colors.cyanSoft};
    color: ${({ theme }) => theme.colors.cyan};
    border-color: rgba(0, 240, 255, 0.3);
  `,
  soc2: css`
    background: ${({ theme }) => theme.colors.goldSoft};
    color: ${({ theme }) => theme.colors.gold};
    border-color: rgba(251, 191, 36, 0.3);
  `,
  cvss: css`
    // Default, will be overridden by severity
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme }) => theme.colors.white70};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  `,
  mitre: css`
    background: ${({ theme }) => theme.colors.orangeSoft};
    color: ${({ theme }) => theme.colors.orange};
    border-color: rgba(255, 159, 67, 0.3);
  `,
  nist: css`
    background: ${({ theme }) => theme.colors.greenSoft};
    color: ${({ theme }) => theme.colors.green};
    border-color: rgba(0, 255, 136, 0.3);
  `,
};

interface FrameworkBadgeWrapperProps {
  $type: BadgeType;
}

export const FrameworkBadgeWrapper = styled.span<FrameworkBadgeWrapperProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  border: 1px solid;
  white-space: nowrap;

  ${({ $type }) => badgeTypeStyles[$type]}
`;

// CVSS badge with severity-based colors
type CvssSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

const cvssSeverityStyles: Record<CvssSeverity, ReturnType<typeof css>> = {
  critical: css`
    background: ${({ theme }) => theme.colors.redSoft};
    color: ${({ theme }) => theme.colors.red};
    border-color: rgba(255, 71, 87, 0.3);
  `,
  high: css`
    background: ${({ theme }) => theme.colors.orangeSoft};
    color: ${({ theme }) => theme.colors.orange};
    border-color: rgba(255, 159, 67, 0.3);
  `,
  medium: css`
    background: ${({ theme }) => theme.colors.yellowSoft};
    color: ${({ theme }) => theme.colors.yellow};
    border-color: rgba(245, 158, 11, 0.3);
  `,
  low: css`
    background: ${({ theme }) => theme.colors.cyanSoft};
    color: ${({ theme }) => theme.colors.cyan};
    border-color: rgba(0, 240, 255, 0.3);
  `,
  info: css`
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme }) => theme.colors.white50};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  `,
};

interface CvssBadgeWrapperProps {
  $severity: CvssSeverity;
}

export const CvssBadgeWrapper = styled.span<CvssBadgeWrapperProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  border: 1px solid;
  white-space: nowrap;

  ${({ $severity }) => cvssSeverityStyles[$severity]}
`;

export const BadgeLabel = styled.span`
  opacity: 0.7;
  font-weight: 500;
`;

export const BadgeValue = styled.span`
  font-weight: 700;
`;
