import styled, { css } from 'styled-components';

export const BadgesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
`;

type BadgeVariant = 'owasp' | 'cwe' | 'soc2' | 'cvss-critical' | 'cvss-high' | 'cvss-medium' | 'cvss-low';

interface FrameworkBadgeProps {
  $variant: BadgeVariant;
}

const getBadgeStyles = ($variant: BadgeVariant) => {
  switch ($variant) {
    case 'owasp':
      return css`
        background: rgba(168, 85, 247, 0.15);
        color: ${({ theme }) => theme.colors.purple};
        border-color: ${({ theme }) => theme.colors.purple};
      `;
    case 'cwe':
      return css`
        background: rgba(0, 240, 255, 0.12);
        color: ${({ theme }) => theme.colors.cyan};
        border-color: ${({ theme }) => theme.colors.cyan};
      `;
    case 'soc2':
      return css`
        background: rgba(251, 191, 36, 0.12);
        color: ${({ theme }) => theme.colors.gold};
        border-color: ${({ theme }) => theme.colors.gold};
      `;
    case 'cvss-critical':
      return css`
        background: rgba(255, 71, 87, 0.15);
        color: ${({ theme }) => theme.colors.severityCritical};
        border-color: ${({ theme }) => theme.colors.severityCritical};
        font-weight: 600;
      `;
    case 'cvss-high':
      return css`
        background: rgba(255, 159, 67, 0.15);
        color: ${({ theme }) => theme.colors.severityHigh};
        border-color: ${({ theme }) => theme.colors.severityHigh};
        font-weight: 600;
      `;
    case 'cvss-medium':
      return css`
        background: rgba(245, 158, 11, 0.12);
        color: ${({ theme }) => theme.colors.severityMedium};
        border-color: ${({ theme }) => theme.colors.severityMedium};
        font-weight: 600;
      `;
    case 'cvss-low':
      return css`
        background: rgba(107, 114, 128, 0.12);
        color: ${({ theme }) => theme.colors.severityLow};
        border-color: ${({ theme }) => theme.colors.severityLow};
        font-weight: 600;
      `;
    default:
      return css``;
  }
};

export const FrameworkBadge = styled.span<FrameworkBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 2px 6px;
  font-size: 10px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid;
  white-space: nowrap;
  
  ${({ $variant }) => getBadgeStyles($variant)}
`;

export const CvssScoreValue = styled.span`
  font-weight: 700;
`;

export const CvssLabel = styled.span`
  font-size: 9px;
  opacity: 0.8;
`;
