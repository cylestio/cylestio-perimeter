import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { LineChart } from './LineChart';

const meta: Meta<typeof LineChart> = {
  title: 'Domain/Charts/LineChart',
  component: LineChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof LineChart>;

// Helper to check if chart rendered
const expectChartRendered = async (canvasElement: HTMLElement) => {
  await waitFor(() => {
    const svg = canvasElement.querySelector('.recharts-surface');
    expect(svg).toBeInTheDocument();
  });
};

// Sample data for stories
const sampleData = [
  { date: '2025-12-08', value: 12 },
  { date: '2025-12-09', value: 18 },
  { date: '2025-12-10', value: 15 },
  { date: '2025-12-11', value: 23 },
  { date: '2025-12-12', value: 19 },
];

const singleDataPoint = [{ date: '2025-12-12', value: 42 }];

const manyDataPoints = Array.from({ length: 30 }, (_, i) => ({
  date: `2025-11-${String(i + 1).padStart(2, '0')}`,
  value: Math.floor(Math.random() * 50) + 10,
}));

const trendingUpData = [
  { date: '2025-12-08', value: 5 },
  { date: '2025-12-09', value: 12 },
  { date: '2025-12-10', value: 18 },
  { date: '2025-12-11', value: 28 },
  { date: '2025-12-12', value: 45 },
];

const trendingDownData = [
  { date: '2025-12-08', value: 45 },
  { date: '2025-12-09', value: 38 },
  { date: '2025-12-10', value: 25 },
  { date: '2025-12-11', value: 15 },
  { date: '2025-12-12', value: 8 },
];

// Default story with sample data
export const Default: Story = {
  args: {
    data: sampleData,
    color: 'cyan',
    height: 200,
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Empty state
export const Empty: Story = {
  args: {
    data: [],
    emptyMessage: 'No data available',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No data available')).toBeInTheDocument();
  },
};

// Custom empty message
export const CustomEmptyMessage: Story = {
  args: {
    data: [],
    emptyMessage: 'No session data yet',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No session data yet')).toBeInTheDocument();
  },
};

// Single data point
export const SingleDataPoint: Story = {
  args: {
    data: singleDataPoint,
    color: 'purple',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Many data points (30 days)
export const ManyDataPoints: Story = {
  args: {
    data: manyDataPoints,
    color: 'green',
    height: 250,
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Cyan color (default)
export const ColorCyan: Story = {
  args: {
    data: sampleData,
    color: 'cyan',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Purple color
export const ColorPurple: Story = {
  args: {
    data: sampleData,
    color: 'purple',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Red color (for error rates)
export const ColorRed: Story = {
  args: {
    data: sampleData,
    color: 'red',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Green color (for success metrics)
export const ColorGreen: Story = {
  args: {
    data: sampleData,
    color: 'green',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Orange color (for warnings)
export const ColorOrange: Story = {
  args: {
    data: sampleData,
    color: 'orange',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Custom height (small)
export const SmallHeight: Story = {
  args: {
    data: sampleData,
    height: 120,
    color: 'cyan',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Custom height (large)
export const LargeHeight: Story = {
  args: {
    data: sampleData,
    height: 350,
    color: 'purple',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// With custom value formatter (percentage)
export const WithPercentageFormatter: Story = {
  args: {
    data: trendingDownData.map((d) => ({ ...d, value: d.value })),
    color: 'red',
    formatValue: (v: number) => `${v.toFixed(1)}%`,
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// With custom value formatter (currency)
export const WithCurrencyFormatter: Story = {
  args: {
    data: sampleData.map((d) => ({ ...d, value: d.value * 100 })),
    color: 'green',
    formatValue: (v: number) => `$${v.toLocaleString()}`,
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// With custom value formatter (count)
export const WithCountFormatter: Story = {
  args: {
    data: sampleData,
    color: 'purple',
    formatValue: (v: number) => `${v} sessions`,
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Trending up pattern
export const TrendingUp: Story = {
  args: {
    data: trendingUpData,
    color: 'green',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Trending down pattern
export const TrendingDown: Story = {
  args: {
    data: trendingDownData,
    color: 'red',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Sessions over time (real-world example)
export const SessionsOverTime: Story = {
  args: {
    data: [
      { date: '2025-12-06', value: 8 },
      { date: '2025-12-07', value: 12 },
      { date: '2025-12-08', value: 15 },
      { date: '2025-12-09', value: 22 },
      { date: '2025-12-10', value: 18 },
      { date: '2025-12-11', value: 25 },
      { date: '2025-12-12', value: 20 },
    ],
    color: 'purple',
    height: 200,
    formatValue: (v: number) => v.toString(),
    emptyMessage: 'No session data yet',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};

// Error rate trend (real-world example)
export const ErrorRateTrend: Story = {
  args: {
    data: [
      { date: '2025-12-06', value: 2.5 },
      { date: '2025-12-07', value: 1.8 },
      { date: '2025-12-08', value: 3.2 },
      { date: '2025-12-09', value: 0.5 },
      { date: '2025-12-10', value: 1.2 },
      { date: '2025-12-11', value: 0.8 },
      { date: '2025-12-12', value: 0.3 },
    ],
    color: 'red',
    height: 200,
    formatValue: (v: number) => `${v.toFixed(1)}%`,
    emptyMessage: 'No error data yet',
  },
  play: async ({ canvasElement }) => {
    await expectChartRendered(canvasElement);
  },
};
