import type { FC } from 'react';

import { BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useTheme } from 'styled-components';

import {
  ChartContainer,
  TooltipContainer,
  TooltipLabel,
  TooltipValue,
  EmptyState,
} from './BarChart.styles';

export type BarChartColor = 'cyan' | 'purple' | 'red' | 'green' | 'orange';

export interface BarChartDataPoint {
  name: string;
  value: number;
  color?: BarChartColor;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  color?: BarChartColor;
  height?: number;
  horizontal?: boolean;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  maxBars?: number;
  className?: string;
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: BarChartDataPoint }>;
  formatValue?: (value: number) => string;
  color?: string;
}

const CustomTooltip: FC<CustomTooltipProps> = ({
  active,
  payload,
  formatValue,
  color,
}) => {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const displayValue = formatValue ? formatValue(item.value) : item.value.toString();

  return (
    <TooltipContainer>
      <TooltipLabel>{item.name}</TooltipLabel>
      <TooltipValue $color={color}>{displayValue}</TooltipValue>
    </TooltipContainer>
  );
};

export const BarChart: FC<BarChartProps> = ({
  data,
  color = 'cyan',
  height = 200,
  horizontal = false,
  formatValue,
  emptyMessage = 'No data available',
  maxBars = 10,
  className,
}) => {
  const theme = useTheme();

  // Use theme colors directly (recharts doesn't resolve CSS variables)
  const colorMap: Record<BarChartColor, string> = {
    cyan: theme.colors.cyan,
    purple: theme.colors.purple,
    red: theme.colors.red,
    green: theme.colors.green,
    orange: theme.colors.orange,
  };
  const barColor = colorMap[color] || colorMap.cyan;

  if (!data || data.length === 0) {
    return (
      <EmptyState className={className}>
        <BarChart2 size={24} />
        <span>{emptyMessage}</span>
      </EmptyState>
    );
  }

  // Limit the number of bars and sort by value
  const chartData = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxBars);

  if (horizontal) {
    return (
      <ChartContainer className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: theme.colors.white50, fontSize: 11 }}
              axisLine={{ stroke: theme.colors.borderSubtle }}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: theme.colors.white50, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={75}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} color={barColor} />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color ? colorMap[entry.color] : barColor}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: theme.colors.white50, fontSize: 11 }}
            axisLine={{ stroke: theme.colors.borderSubtle }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: theme.colors.white50, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={formatValue}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} color={barColor} />}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ? colorMap[entry.color] : barColor}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
