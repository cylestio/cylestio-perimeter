import styled from 'styled-components';

export const ChartContainer = styled.div`
  width: 100%;
  height: 100%;

  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line {
    stroke: ${({ theme }) => theme.colors.borderSubtle};
    stroke-opacity: 0.5;
  }

  .recharts-xAxis .recharts-cartesian-axis-tick-value,
  .recharts-yAxis .recharts-cartesian-axis-tick-value {
    fill: ${({ theme }) => theme.colors.white50};
    font-size: 11px;
    font-family: ${({ theme }) => theme.typography.fontMono};
  }

  .recharts-tooltip-wrapper {
    outline: none;
  }
`;

export const TooltipContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ theme }) => theme.spacing[2]};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

export const TooltipLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: 4px;
`;

export const TooltipValue = styled.div<{ $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color, theme }) => $color || theme.colors.cyan};
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: ${({ theme }) => theme.colors.white50};
  gap: ${({ theme }) => theme.spacing[2]};

  svg {
    opacity: 0.5;
  }

  span {
    font-size: 13px;
  }
`;
