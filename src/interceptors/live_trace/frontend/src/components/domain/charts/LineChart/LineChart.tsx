import type { FC } from 'react';

import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTheme } from 'styled-components';

import {
  ChartContainer,
  TooltipContainer,
  TooltipLabel,
  TooltipValue,
  EmptyState,
} from './LineChart.styles';

export type ChartColor = 'cyan' | 'purple' | 'red' | 'green' | 'orange';

export interface LineChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  color?: ChartColor;
  height?: number;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  emptyMessage?: string;
  className?: string;
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: LineChartDataPoint }>;
  label?: string;
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  color?: string;
}

const CustomTooltip: FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatValue,
  formatDate,
  color,
}) => {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const displayLabel = formatDate ? formatDate(label || '') : label;
  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <TooltipContainer>
      <TooltipLabel>{displayLabel}</TooltipLabel>
      <TooltipValue $color={color}>{displayValue}</TooltipValue>
    </TooltipContainer>
  );
};

// Default date formatter (shows month and day)
const defaultFormatDate = (date: string): string => {
  try {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
};

export const LineChart: FC<LineChartProps> = ({
  data,
  color = 'cyan',
  height = 200,
  formatValue,
  formatDate = defaultFormatDate,
  emptyMessage = 'No data available',
  className,
}) => {
  const theme = useTheme();

  // Use theme colors directly (recharts doesn't resolve CSS variables)
  const colorMap: Record<ChartColor, string> = {
    cyan: theme.colors.cyan,
    purple: theme.colors.purple,
    red: theme.colors.red,
    green: theme.colors.green,
    orange: theme.colors.orange,
  };
  const lineColor = colorMap[color] || colorMap.cyan;

  if (!data || data.length === 0) {
    return (
      <EmptyState className={className}>
        <TrendingUp size={24} />
        <span>{emptyMessage}</span>
      </EmptyState>
    );
  }

  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: theme.colors.white50, fontSize: 11 }}
            axisLine={{ stroke: theme.colors.borderSubtle }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fill: theme.colors.white50, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            content={
              <CustomTooltip
                formatValue={formatValue}
                formatDate={formatDate}
                color={lineColor}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: lineColor,
              stroke: theme.colors.surface3,
              strokeWidth: 2,
            }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
