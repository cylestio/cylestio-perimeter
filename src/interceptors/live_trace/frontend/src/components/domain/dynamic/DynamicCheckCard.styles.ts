import styled, { css } from 'styled-components';

type CheckStatus = 'passed' | 'warning' | 'critical';

interface CheckCardContainerProps {
  $status: CheckStatus;
}

const statusBorderColors: Record<CheckStatus, string> = {
  passed: 'rgba(0, 255, 136, 0.2)',
  warning: 'rgba(255, 159, 67, 0.3)',
  critical: 'rgba(255, 71, 87, 0.3)',
};

export const CheckCardContainer = styled.div<CheckCardContainerProps>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $status }) => statusBorderColors[$status] || theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const CheckHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

interface StatusIconWrapperProps {
  $status: CheckStatus;
}

const statusIconColors: Record<CheckStatus, { bg: string; fg: string }> = {
  passed: { bg: 'greenSoft', fg: 'green' },
  warning: { bg: 'orangeSoft', fg: 'orange' },
  critical: { bg: 'redSoft', fg: 'red' },
};

export const StatusIconWrapper = styled.div<StatusIconWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;

  ${({ theme, $status }) => {
    const colors = statusIconColors[$status];
    return css`
      background: ${theme.colors[colors.bg as keyof typeof theme.colors]};
      color: ${theme.colors[colors.fg as keyof typeof theme.colors]};
    `;
  }}

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const CheckName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  flex: 1;
`;

export const CvssScore = styled.span<{ $severity: 'critical' | 'high' | 'medium' | 'low' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 10px;
  font-weight: 700;

  ${({ theme, $severity }) => {
    switch ($severity) {
      case 'critical':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        `;
      case 'high':
        return css`
          background: ${theme.colors.orangeSoft};
          color: ${theme.colors.orange};
        `;
      case 'medium':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.yellow};
        `;
      default:
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
    }
  }}
`;

export const CheckValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const CheckDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.white30};
  margin: 0 0 ${({ theme }) => theme.spacing[3]};
`;

export const FrameworkBadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const RecommendationsList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const RecommendationItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.white50};

  &::before {
    content: '→';
    color: ${({ theme }) => theme.colors.cyan};
    flex-shrink: 0;
  }
`;
