import type { FC } from 'react';

import { PieChart as PieChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from 'styled-components';

import {
  ChartContainer,
  TooltipContainer,
  TooltipLabel,
  TooltipValue,
  LegendContainer,
  LegendItem,
  LegendDot,
  LegendLabel,
  LegendValue,
  EmptyState,
} from './PieChart.styles';

export type PieChartColor = 'cyan' | 'purple' | 'red' | 'green' | 'orange';

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: PieChartColor;
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  emptyMessage?: string;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: PieChartDataPoint & { percent: number } }>;
  formatValue?: (value: number) => string;
}

const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, formatValue }) => {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const displayValue = formatValue ? formatValue(item.value) : item.value.toLocaleString();
  const percent = ((item.percent || 0) * 100).toFixed(1);

  return (
    <TooltipContainer>
      <TooltipLabel>{item.name}</TooltipLabel>
      <TooltipValue>{displayValue} ({percent}%)</TooltipValue>
    </TooltipContainer>
  );
};

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: PieChartDataPoint & { percent: number };
  }>;
  formatValue?: (value: number) => string;
}

const CustomLegend: FC<CustomLegendProps> = ({ payload, formatValue }) => {
  if (!payload?.length) return null;

  return (
    <LegendContainer>
      {payload.map((entry, index) => {
        const percent = ((entry.payload.percent || 0) * 100).toFixed(1);
        const displayValue = formatValue
          ? formatValue(entry.payload.value)
          : entry.payload.value.toLocaleString();

        return (
          <LegendItem key={`legend-${index}`}>
            <LegendDot $color={entry.color} />
            <LegendLabel>{entry.value}</LegendLabel>
            <LegendValue>{displayValue} ({percent}%)</LegendValue>
          </LegendItem>
        );
      })}
    </LegendContainer>
  );
};

export const PieChart: FC<PieChartProps> = ({
  data,
  height = 200,
  innerRadius = 50,
  outerRadius = 80,
  formatValue,
  showLegend = true,
  emptyMessage = 'No data available',
  className,
}) => {
  const theme = useTheme();

  const colorMap: Record<PieChartColor, string> = {
    cyan: theme.colors.cyan,
    purple: theme.colors.purple,
    red: theme.colors.red,
    green: theme.colors.green,
    orange: theme.colors.orange,
  };

  const defaultColors: PieChartColor[] = ['cyan', 'purple', 'green', 'orange', 'red'];

  if (!data || data.length === 0) {
    return (
      <EmptyState className={className}>
        <PieChartIcon size={24} />
        <span>{emptyMessage}</span>
      </EmptyState>
    );
  }

  // Calculate total for percentage
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Add percent to data
  const chartData = data.map((d) => ({
    ...d,
    percent: total > 0 ? d.value / total : 0,
  }));

  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            nameKey="name"
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ? colorMap[entry.color] : colorMap[defaultColors[index % defaultColors.length]]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          {showLegend && (
            <Legend
              content={<CustomLegend formatValue={formatValue} />}
              verticalAlign="bottom"
              align="center"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
