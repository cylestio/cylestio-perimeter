import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const Subtitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const TrendBadge = styled.span<{ $trend: 'improving' | 'declining' | 'stable' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 11px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $trend }) =>
    $trend === 'improving' ? theme.colors.greenSoft :
    $trend === 'declining' ? theme.colors.redSoft :
    theme.colors.surface};
  color: ${({ theme, $trend }) =>
    $trend === 'improving' ? theme.colors.green :
    $trend === 'declining' ? theme.colors.red :
    theme.colors.white50};
`;

export const ChartContainer = styled.div`
  position: relative;
  height: 200px;
  width: 100%;
`;

export const ChartSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

export const GridLine = styled.line`
  stroke: ${({ theme }) => theme.colors.borderSubtle};
  stroke-dasharray: 4 4;
`;

export const AxisLabel = styled.text`
  font-size: 10px;
  fill: ${({ theme }) => theme.colors.white30};
`;

export const TrendLine = styled.path<{ $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export const TrendArea = styled.path<{ $color: string }>`
  fill: url(#gradient-${({ $color }) => $color});
  opacity: 0.3;
`;

export const DataPoint = styled.circle<{ $color: string }>`
  fill: ${({ $color }) => $color};
  stroke: ${({ theme }) => theme.colors.void};
  stroke-width: 2;
  cursor: pointer;
  transition: r 0.15s ease;

  &:hover {
    r: 6;
  }
`;

export const Legend = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[2]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const LegendDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};

  svg {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
`;

export const Tooltip = styled.div`
  position: absolute;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white90};
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;
