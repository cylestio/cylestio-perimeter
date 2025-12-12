import styled, { css } from 'styled-components';

export const InsightsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const InsightsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const InsightsTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const SuperpowerBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.purpleSoft};
  color: ${({ theme }) => theme.colors.purple};
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
`;

export const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

interface MetricCardProps {
  $status: 'good' | 'warning' | 'critical';
}

const metricStatusStyles = {
  good: css`
    border-color: ${({ theme }) => theme.colors.green}30;
    background: ${({ theme }) => theme.colors.greenSoft};
  `,
  warning: css`
    border-color: ${({ theme }) => theme.colors.orange}30;
    background: ${({ theme }) => theme.colors.orangeSoft};
  `,
  critical: css`
    border-color: ${({ theme }) => theme.colors.red}30;
    background: ${({ theme }) => theme.colors.redSoft};
  `,
};

export const MetricCard = styled.div<MetricCardProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  ${({ $status }) => metricStatusStyles[$status]}
`;

export const MetricValue = styled.span<{ $status: 'good' | 'warning' | 'critical' }>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme, $status }) =>
    $status === 'good' ? theme.colors.green :
    $status === 'warning' ? theme.colors.orange :
    theme.colors.red};
`;

export const MetricLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
`;

export const MetricIcon = styled.span<{ $status: 'good' | 'warning' | 'critical' }>`
  margin-left: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme, $status }) =>
    $status === 'good' ? theme.colors.green :
    $status === 'warning' ? theme.colors.orange :
    theme.colors.red};
`;

export const Interpretation = styled.p`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.white08};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const OutlierActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.cyan};
  }
`;
