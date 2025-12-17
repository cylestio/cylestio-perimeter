import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { PieChart } from './PieChart';

const meta: Meta<typeof PieChart> = {
  title: 'Domain/Charts/PieChart',
  component: PieChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PieChart>;

// Sample data for stories
const tokenDistributionData = [
  { name: 'Input Tokens', value: 125000, color: 'cyan' as const },
  { name: 'Output Tokens', value: 75000, color: 'purple' as const },
];

const modelUsageData = [
  { name: 'claude-sonnet', value: 156 },
  { name: 'gpt-4o', value: 89 },
  { name: 'claude-opus', value: 45 },
  { name: 'gpt-4-turbo', value: 23 },
];

const severityData = [
  { name: 'Critical', value: 3, color: 'red' as const },
  { name: 'High', value: 8, color: 'orange' as const },
  { name: 'Medium', value: 15, color: 'purple' as const },
  { name: 'Low', value: 25, color: 'cyan' as const },
  { name: 'Pass', value: 150, color: 'green' as const },
];

const singleDataPoint = [{ name: 'Total', value: 100 }];

// Default donut chart
export const Default: Story = {
  args: {
    data: tokenDistributionData,
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Tokens')).toBeInTheDocument();
    await expect(canvas.getByText('Output Tokens')).toBeInTheDocument();
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
    emptyMessage: 'No token usage data yet',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No token usage data yet')).toBeInTheDocument();
  },
};

// Pie chart (no inner radius)
export const PieChartStyle: Story = {
  args: {
    data: tokenDistributionData,
    innerRadius: 0,
    outerRadius: 80,
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Tokens')).toBeInTheDocument();
  },
};

// Large donut
export const LargeDonut: Story = {
  args: {
    data: tokenDistributionData,
    innerRadius: 70,
    outerRadius: 100,
    height: 300,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Tokens')).toBeInTheDocument();
  },
};

// Small donut
export const SmallDonut: Story = {
  args: {
    data: tokenDistributionData,
    innerRadius: 30,
    outerRadius: 50,
    height: 180,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Tokens')).toBeInTheDocument();
  },
};

// Without legend
export const NoLegend: Story = {
  args: {
    data: tokenDistributionData,
    showLegend: false,
    height: 200,
  },
  play: async ({ canvas }) => {
    // Legend items should not be visible
    const legendItems = canvas.queryByText('Input Tokens');
    await expect(legendItems).not.toBeInTheDocument();
  },
};

// Multiple segments (4+ items)
export const MultipleSegments: Story = {
  args: {
    data: modelUsageData,
    height: 280,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('claude-sonnet')).toBeInTheDocument();
    await expect(canvas.getByText('gpt-4o')).toBeInTheDocument();
  },
};

// Many segments with custom colors
export const ManySegmentsWithColors: Story = {
  args: {
    data: severityData,
    height: 300,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
    await expect(canvas.getByText('Pass')).toBeInTheDocument();
  },
};

// Single segment
export const SingleSegment: Story = {
  args: {
    data: singleDataPoint,
    height: 200,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total')).toBeInTheDocument();
  },
};

// Two equal segments
export const EqualSegments: Story = {
  args: {
    data: [
      { name: 'Input', value: 50, color: 'cyan' as const },
      { name: 'Output', value: 50, color: 'purple' as const },
    ],
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input')).toBeInTheDocument();
    await expect(canvas.getByText('Output')).toBeInTheDocument();
  },
};

// With custom value formatter
export const WithFormatter: Story = {
  args: {
    data: tokenDistributionData,
    formatValue: (v: number) => `${(v / 1000).toFixed(1)}K`,
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Tokens')).toBeInTheDocument();
  },
};

// Token distribution (real-world example)
export const TokenDistribution: Story = {
  args: {
    data: [
      { name: 'Input Tokens', value: 1250000, color: 'cyan' as const },
      { name: 'Output Tokens', value: 450000, color: 'purple' as const },
    ],
    formatValue: (v: number) => `${(v / 1000000).toFixed(2)}M`,
    height: 280,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Tokens')).toBeInTheDocument();
    await expect(canvas.getByText('Output Tokens')).toBeInTheDocument();
  },
};

// Model request distribution (real-world example)
export const ModelRequestDistribution: Story = {
  args: {
    data: [
      { name: 'claude-sonnet-4', value: 156 },
      { name: 'gpt-4o', value: 89 },
      { name: 'claude-opus', value: 45 },
      { name: 'gpt-4-turbo', value: 23 },
      { name: 'claude-haiku', value: 12 },
    ],
    formatValue: (v: number) => `${v} req`,
    height: 300,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('claude-sonnet-4')).toBeInTheDocument();
  },
};

// Cost breakdown (real-world example)
export const CostBreakdown: Story = {
  args: {
    data: [
      { name: 'Input Cost', value: 12.50, color: 'cyan' as const },
      { name: 'Output Cost', value: 37.80, color: 'purple' as const },
    ],
    formatValue: (v: number) => `$${v.toFixed(2)}`,
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input Cost')).toBeInTheDocument();
    await expect(canvas.getByText('Output Cost')).toBeInTheDocument();
  },
};

// Very small values
export const SmallValues: Story = {
  args: {
    data: [
      { name: 'Errors', value: 2 },
      { name: 'Warnings', value: 5 },
      { name: 'Success', value: 993 },
    ],
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Success')).toBeInTheDocument();
  },
};

// Large percentage difference
export const LargePercentageDifference: Story = {
  args: {
    data: [
      { name: 'Primary', value: 950, color: 'cyan' as const },
      { name: 'Secondary', value: 50, color: 'purple' as const },
    ],
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Primary')).toBeInTheDocument();
  },
};
