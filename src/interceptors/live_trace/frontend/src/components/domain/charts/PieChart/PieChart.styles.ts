import styled from 'styled-components';

export const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 150px;

  .recharts-tooltip-wrapper {
    outline: none;
  }

  .recharts-pie-sector {
    transition: opacity 150ms ease;
  }

  .recharts-pie-sector:hover {
    opacity: 0.8;
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

export const TooltipValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const LegendDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const LegendLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
`;

export const LegendValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
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
