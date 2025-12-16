import { type FC, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import type { Recommendation } from '@api/types/findings';

// Styled Components
const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
`;

const ChartWrapper = styled.div`
  position: relative;
  height: 120px;
  width: 100%;
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
`;

const LegendLine = styled.span<{ $color: string }>`
  width: 16px;
  height: 3px;
  background: ${({ $color }) => $color};
  border-radius: 2px;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

// Types
export interface DetectionTimelineProps {
  recommendations: Recommendation[];
}

interface DayData {
  date: string;
  label: string;
  detected: number;
  resolved: number;
}

// Component
export const DetectionTimeline: FC<DetectionTimelineProps> = ({
  recommendations,
}) => {
  const theme = useTheme();

  // Group by day for the last 7 days
  const days = useMemo<DayData[]>(() => {
    const now = new Date();
    const result: DayData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const detected = recommendations.filter(r => {
        const createdDate = r.created_at?.split('T')[0];
        return createdDate === dateStr;
      }).length;
      
      const resolved = recommendations.filter(r => {
        if (!['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)) return false;
        const updatedDate = r.updated_at?.split('T')[0];
        return updatedDate === dateStr;
      }).length;
      
      result.push({ date: dateStr, label, detected, resolved });
    }
    
    return result;
  }, [recommendations]);

  const maxValue = Math.max(
    ...days.map(d => Math.max(d.detected, d.resolved)),
    1
  );

  const hasData = days.some(d => d.detected > 0 || d.resolved > 0);

  // Chart dimensions (in pixels)
  const width = 600;
  const height = 100;
  const padding = { top: 10, right: 20, bottom: 20, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = chartWidth / (days.length - 1 || 1);
  const yScale = (val: number) => chartHeight - (val / maxValue) * chartHeight;

  // Create line paths
  const createPath = (values: number[]) => {
    return values.map((val, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + yScale(val);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const detectedPath = createPath(days.map(d => d.detected));
  const resolvedPath = createPath(days.map(d => d.resolved));

  if (!hasData) {
    return (
      <Container>
        <Title>Activity Timeline (7 days)</Title>
        <EmptyState>No activity in the last 7 days</EmptyState>
      </Container>
    );
  }

  // Y-axis labels
  const yLabels = [0, Math.ceil(maxValue / 2), maxValue];

  return (
    <Container>
      <Title>Activity Timeline (7 days)</Title>
      <ChartWrapper>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis grid lines and labels */}
          {yLabels.map((val, i) => {
            const y = padding.top + yScale(val);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={theme.colors.borderSubtle}
                  strokeWidth={1}
                  strokeDasharray={val === 0 ? 'none' : '4,4'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily={theme.typography.fontMono}
                  fill={theme.colors.white50}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {days.map((d, i) => {
            const x = padding.left + i * xStep;
            return (
              <text
                key={`x-${d.date}`}
                x={x}
                y={height - 4}
                textAnchor="middle"
                fontSize="9"
                fontFamily={theme.typography.fontMono}
                fill={theme.colors.white50}
              >
                {d.label}
              </text>
            );
          })}

          {/* Detected line */}
          <path
            d={detectedPath}
            fill="none"
            stroke={theme.colors.severityMedium}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Resolved line */}
          <path
            d={resolvedPath}
            fill="none"
            stroke={theme.colors.green}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points - Detected */}
          {days.map((d, i) => (
            <circle
              key={`detected-${d.date}`}
              cx={padding.left + i * xStep}
              cy={padding.top + yScale(d.detected)}
              r={3}
              fill={theme.colors.severityMedium}
            />
          ))}

          {/* Data points - Resolved */}
          {days.map((d, i) => (
            <circle
              key={`resolved-${d.date}`}
              cx={padding.left + i * xStep}
              cy={padding.top + yScale(d.resolved)}
              r={3}
              fill={theme.colors.green}
            />
          ))}
        </svg>
      </ChartWrapper>

      <Legend>
        <LegendItem>
          <LegendLine $color={theme.colors.severityMedium} />
          Detected
        </LegendItem>
        <LegendItem>
          <LegendLine $color={theme.colors.green} />
          Resolved
        </LegendItem>
      </Legend>
    </Container>
  );
};
