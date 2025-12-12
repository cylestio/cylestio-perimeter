import styled from 'styled-components';

export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const MetricCard = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

interface MetricIconProps {
  $color: 'cyan' | 'green' | 'orange' | 'purple' | 'red';
}

export const MetricIcon = styled.div<MetricIconProps>`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color, theme }) => theme.colors[`${$color}Soft` as keyof typeof theme.colors]};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ $color, theme }) => theme.colors[$color]};
  flex-shrink: 0;
`;

export const MetricContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const MetricLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const MetricValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
`;

interface MetricChangeProps {
  $positive?: boolean;
}

export const MetricChange = styled.span<MetricChangeProps>`
  font-size: 11px;
  color: ${({ $positive, theme }) => 
    $positive ? theme.colors.green : theme.colors.white30};
`;

export const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const ChartTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white80};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
`;

export const ChartPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${({ theme }) => theme.colors.white30};
  gap: ${({ theme }) => theme.spacing[3]};

  span {
    font-size: 13px;
  }
`;

export const ToolsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ToolItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const ToolName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white80};
`;

export const ToolCount = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
`;
