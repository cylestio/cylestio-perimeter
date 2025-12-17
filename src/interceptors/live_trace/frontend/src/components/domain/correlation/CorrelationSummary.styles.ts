import styled from 'styled-components';

export const SummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SummaryTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
`;

export const SummarySubtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

export const MetricsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`;

interface MetricBoxProps {
  $color?: 'red' | 'gray' | 'blue' | 'light';
}

export const MetricBox = styled.div<MetricBoxProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme, $color }) => {
    switch ($color) {
      case 'red':
        return 'rgba(255, 71, 87, 0.1)';
      case 'gray':
        return theme.colors.surface3;
      case 'blue':
        return 'rgba(0, 240, 255, 0.1)';
      case 'light':
        return 'rgba(168, 85, 247, 0.08)';
      default:
        return theme.colors.surface3;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme, $color }) => {
    switch ($color) {
      case 'red':
        return 'rgba(255, 71, 87, 0.3)';
      case 'gray':
        return theme.colors.borderSubtle;
      case 'blue':
        return 'rgba(0, 240, 255, 0.3)';
      case 'light':
        return 'rgba(168, 85, 247, 0.2)';
      default:
        return theme.colors.borderSubtle;
    }
  }};
  min-width: 90px;
`;

export const MetricValue = styled.span<MetricBoxProps>`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: 700;
  color: ${({ theme, $color }) => {
    switch ($color) {
      case 'red':
        return theme.colors.severityCritical;
      case 'gray':
        return theme.colors.white70;
      case 'blue':
        return theme.colors.cyan;
      case 'light':
        return theme.colors.white50;
      default:
        return theme.colors.white;
    }
  }};
`;

export const MetricLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const Hint = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.yellow}15;
  border: 1px solid ${({ theme }) => theme.colors.yellow}40;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
`;

export const HintIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.yellow};
  flex-shrink: 0;
`;

export const HintText = styled.span`
  flex: 1;
`;

export const CorrelateCommand = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  background: ${({ theme }) => theme.colors.surface3};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const Insight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white};
`;
