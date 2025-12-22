import { useMemo, type FC } from 'react';

import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';

import type { HealthSnapshot, HealthTrend } from '@api/types/code';

import {
  Container,
  Header,
  HeaderLeft,
  Title,
  Subtitle,
  TrendBadge,
  ChartContainer,
  ChartSvg,
  GridLine,
  AxisLabel,
  TrendLine,
  TrendArea,
  DataPoint,
  Legend,
  LegendItem,
  LegendDot,
  EmptyState,
} from './HealthTrendChart.styles';

export interface HealthTrendChartProps {
  /** Health snapshots over time */
  snapshots: HealthSnapshot[];
  /** Number of days in the period */
  periodDays?: number;
  /** Overall trend direction */
  trend?: HealthTrend;
  /** Health delta over period */
  delta?: number;
  /** Show dimension lines */
  showDimensions?: boolean;
  className?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

const COLORS = {
  overall: '#00f0ff', // cyan
  security: '#00d4aa', // green-cyan
  availability: '#22c55e', // green
  reliability: '#f97316', // orange
  efficiency: '#a855f7', // purple
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTrendIcon = (trend: HealthTrend) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp size={12} />;
    case 'declining':
      return <TrendingDown size={12} />;
    default:
      return <Minus size={12} />;
  }
};

const getTrendText = (trend: HealthTrend, delta: number): string => {
  if (trend === 'improving') return `+${Math.abs(delta).toFixed(0)}%`;
  if (trend === 'declining') return `-${Math.abs(delta).toFixed(0)}%`;
  return 'No change';
};

/**
 * HealthTrendChart displays health score history as a line chart.
 */
export const HealthTrendChart: FC<HealthTrendChartProps> = ({
  snapshots,
  periodDays = 30,
  trend = 'stable',
  delta = 0,
  showDimensions = false,
  className,
}) => {
  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const height = 200;
  const chartWidth = 600; // internal coordinate system
  const chartHeight = height - margin.top - margin.bottom;

  // Process data into chart points
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return { overall: [], dimensions: {} };

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const minTime = new Date(sortedSnapshots[0].timestamp).getTime();
    const maxTime = new Date(sortedSnapshots[sortedSnapshots.length - 1].timestamp).getTime();
    const timeRange = maxTime - minTime || 1;

    const toPoint = (snapshot: HealthSnapshot, value: number): ChartPoint => ({
      x: margin.left + ((new Date(snapshot.timestamp).getTime() - minTime) / timeRange) * (chartWidth - margin.left - margin.right),
      y: margin.top + (1 - value / 100) * chartHeight,
      value,
      date: formatDate(snapshot.timestamp),
    });

    const overall: ChartPoint[] = sortedSnapshots.map((s) =>
      toPoint(s, s.overall_health)
    );

    const dimensions: Record<string, ChartPoint[]> = {};
    if (showDimensions) {
      dimensions.security = sortedSnapshots
        .filter((s) => s.security_score !== undefined)
        .map((s) => toPoint(s, s.security_score!));
      dimensions.availability = sortedSnapshots
        .filter((s) => s.availability_score !== undefined)
        .map((s) => toPoint(s, s.availability_score!));
      dimensions.reliability = sortedSnapshots
        .filter((s) => s.reliability_score !== undefined)
        .map((s) => toPoint(s, s.reliability_score!));
      dimensions.efficiency = sortedSnapshots
        .filter((s) => s.efficiency_score !== undefined)
        .map((s) => toPoint(s, s.efficiency_score!));
    }

    return { overall, dimensions };
  }, [snapshots, showDimensions, chartWidth, chartHeight, margin]);

  // Generate path from points
  const pointsToPath = (points: ChartPoint[]): string => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  };

  // Generate area path (closed at bottom)
  const pointsToAreaPath = (points: ChartPoint[]): string => {
    if (points.length === 0) return '';
    const linePath = pointsToPath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${linePath} L ${lastPoint.x} ${margin.top + chartHeight} L ${firstPoint.x} ${margin.top + chartHeight} Z`;
  };

  // Empty state
  if (snapshots.length === 0) {
    return (
      <Container className={className}>
        <Header>
          <HeaderLeft>
            <Title>
              <BarChart2 size={16} />
              Health Trend
            </Title>
            <Subtitle>Last {periodDays} days</Subtitle>
          </HeaderLeft>
        </Header>
        <EmptyState>
          <BarChart2 size={32} />
          <p>No health history data available yet</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container className={className} data-testid="health-trend-chart">
      <Header>
        <HeaderLeft>
          <Title>
            <BarChart2 size={16} />
            Health Trend
          </Title>
          <Subtitle>Last {periodDays} days</Subtitle>
        </HeaderLeft>
        <TrendBadge $trend={trend}>
          {getTrendIcon(trend)}
          {getTrendText(trend, delta)}
        </TrendBadge>
      </Header>

      <ChartContainer>
        <ChartSvg viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient-overall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.overall} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.overall} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = margin.top + (1 - value / 100) * chartHeight;
            return (
              <g key={value}>
                <GridLine
                  x1={margin.left}
                  y1={y}
                  x2={chartWidth - margin.right}
                  y2={y}
                />
                <AxisLabel x={margin.left - 5} y={y + 4} textAnchor="end">
                  {value}%
                </AxisLabel>
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.overall.length > 1 && (
            <>
              <AxisLabel
                x={chartData.overall[0].x}
                y={height - 5}
                textAnchor="start"
              >
                {chartData.overall[0].date}
              </AxisLabel>
              <AxisLabel
                x={chartData.overall[chartData.overall.length - 1].x}
                y={height - 5}
                textAnchor="end"
              >
                {chartData.overall[chartData.overall.length - 1].date}
              </AxisLabel>
            </>
          )}

          {/* Area under overall line */}
          <TrendArea
            d={pointsToAreaPath(chartData.overall)}
            $color="overall"
          />

          {/* Dimension lines (if enabled) */}
          {showDimensions && Object.entries(chartData.dimensions).map(([key, points]) => (
            points.length > 1 && (
              <TrendLine
                key={key}
                d={pointsToPath(points)}
                $color={COLORS[key as keyof typeof COLORS]}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            )
          ))}

          {/* Overall trend line */}
          <TrendLine
            d={pointsToPath(chartData.overall)}
            $color={COLORS.overall}
          />

          {/* Data points */}
          {chartData.overall.map((point, i) => (
            <DataPoint
              key={i}
              cx={point.x}
              cy={point.y}
              r={4}
              $color={COLORS.overall}
            />
          ))}
        </ChartSvg>
      </ChartContainer>

      {showDimensions && (
        <Legend>
          <LegendItem>
            <LegendDot $color={COLORS.overall} />
            Overall
          </LegendItem>
          <LegendItem>
            <LegendDot $color={COLORS.security} />
            Security
          </LegendItem>
          <LegendItem>
            <LegendDot $color={COLORS.availability} />
            Availability
          </LegendItem>
          <LegendItem>
            <LegendDot $color={COLORS.reliability} />
            Reliability
          </LegendItem>
          <LegendItem>
            <LegendDot $color={COLORS.efficiency} />
            Efficiency
          </LegendItem>
        </Legend>
      )}
    </Container>
  );
};
