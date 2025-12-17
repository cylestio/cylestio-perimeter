import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { BarChart } from './BarChart';

const meta: Meta<typeof BarChart> = {
  title: 'Domain/Charts/BarChart',
  component: BarChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof BarChart>;

// Sample data for stories
const toolUsageData = [
  { name: 'web_search', value: 42 },
  { name: 'code_editor', value: 28 },
  { name: 'file_reader', value: 15 },
  { name: 'calculator', value: 8 },
  { name: 'image_gen', value: 5 },
];

const singleDataPoint = [{ name: 'web_search', value: 42 }];

const manyDataPoints = [
  { name: 'tool_1', value: 100 },
  { name: 'tool_2', value: 95 },
  { name: 'tool_3', value: 88 },
  { name: 'tool_4', value: 75 },
  { name: 'tool_5', value: 68 },
  { name: 'tool_6', value: 55 },
  { name: 'tool_7', value: 42 },
  { name: 'tool_8', value: 35 },
  { name: 'tool_9', value: 28 },
  { name: 'tool_10', value: 22 },
  { name: 'tool_11', value: 18 },
  { name: 'tool_12', value: 15 },
  { name: 'tool_13', value: 12 },
  { name: 'tool_14', value: 8 },
  { name: 'tool_15', value: 5 },
];

const severityData = [
  { name: 'Critical', value: 3, color: 'red' as const },
  { name: 'High', value: 8, color: 'orange' as const },
  { name: 'Medium', value: 15, color: 'purple' as const },
  { name: 'Low', value: 25, color: 'cyan' as const },
];

const modelUsageData = [
  { name: 'claude-sonnet-4', value: 156 },
  { name: 'gpt-4o', value: 89 },
  { name: 'claude-opus', value: 45 },
  { name: 'gpt-4-turbo', value: 23 },
];

// Default story with sample data (vertical)
export const Default: Story = {
  args: {
    data: toolUsageData,
    color: 'cyan',
    height: 200,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
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
    emptyMessage: 'No tool usage data yet',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No tool usage data yet')).toBeInTheDocument();
  },
};

// Single data point
export const SingleDataPoint: Story = {
  args: {
    data: singleDataPoint,
    color: 'green',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Horizontal bars (default for tool usage)
export const Horizontal: Story = {
  args: {
    data: toolUsageData,
    color: 'green',
    horizontal: true,
    height: 200,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Vertical bars
export const Vertical: Story = {
  args: {
    data: toolUsageData,
    color: 'purple',
    horizontal: false,
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Many data points (limited by maxBars)
export const ManyDataPointsLimited: Story = {
  args: {
    data: manyDataPoints,
    color: 'cyan',
    horizontal: true,
    maxBars: 10,
    height: 300,
  },
  play: async ({ canvas }) => {
    // Should show top 10 only (tool_1 through tool_10)
    await expect(canvas.getByText('tool_1')).toBeInTheDocument();
    await expect(canvas.getByText('tool_10')).toBeInTheDocument();
  },
};

// All data points (high maxBars limit)
export const AllDataPoints: Story = {
  args: {
    data: manyDataPoints,
    color: 'purple',
    horizontal: true,
    maxBars: 20,
    height: 450,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('tool_1')).toBeInTheDocument();
  },
};

// Cyan color (default)
export const ColorCyan: Story = {
  args: {
    data: toolUsageData,
    color: 'cyan',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Purple color
export const ColorPurple: Story = {
  args: {
    data: toolUsageData,
    color: 'purple',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Red color
export const ColorRed: Story = {
  args: {
    data: toolUsageData,
    color: 'red',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Green color
export const ColorGreen: Story = {
  args: {
    data: toolUsageData,
    color: 'green',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Orange color
export const ColorOrange: Story = {
  args: {
    data: toolUsageData,
    color: 'orange',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Per-bar custom colors (severity breakdown)
export const CustomColorsPerBar: Story = {
  args: {
    data: severityData,
    horizontal: true,
    height: 180,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
    await expect(canvas.getByText('High')).toBeInTheDocument();
    await expect(canvas.getByText('Medium')).toBeInTheDocument();
    await expect(canvas.getByText('Low')).toBeInTheDocument();
  },
};

// Small height
export const SmallHeight: Story = {
  args: {
    data: toolUsageData.slice(0, 3),
    color: 'cyan',
    horizontal: true,
    height: 120,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Large height
export const LargeHeight: Story = {
  args: {
    data: toolUsageData,
    color: 'purple',
    horizontal: true,
    height: 350,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// With count formatter
export const WithCountFormatter: Story = {
  args: {
    data: toolUsageData,
    color: 'green',
    horizontal: true,
    formatValue: (v: number) => `${v} calls`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// With percentage formatter
export const WithPercentageFormatter: Story = {
  args: {
    data: [
      { name: 'Success', value: 95.5 },
      { name: 'Warning', value: 3.2 },
      { name: 'Error', value: 1.3 },
    ],
    color: 'green',
    horizontal: true,
    formatValue: (v: number) => `${v.toFixed(1)}%`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Success')).toBeInTheDocument();
  },
};

// Tool usage breakdown (real-world example)
export const ToolUsageBreakdown: Story = {
  args: {
    data: [
      { name: 'web_search', value: 156 },
      { name: 'code_editor', value: 89 },
      { name: 'file_reader', value: 67 },
      { name: 'calculator', value: 34 },
      { name: 'image_generator', value: 23 },
      { name: 'database_query', value: 18 },
    ],
    color: 'green',
    horizontal: true,
    height: 220,
    maxBars: 10,
    formatValue: (v: number) => `${v} calls`,
    emptyMessage: 'No tool usage data',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Model usage breakdown (real-world example)
export const ModelUsageBreakdown: Story = {
  args: {
    data: modelUsageData,
    color: 'purple',
    horizontal: true,
    height: 180,
    formatValue: (v: number) => `${v} requests`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('claude-sonnet-4')).toBeInTheDocument();
  },
};

// Severity distribution (real-world example)
export const SeverityDistribution: Story = {
  args: {
    data: severityData,
    horizontal: false,
    height: 250,
    formatValue: (v: number) => v.toString(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
  },
};

// Two data points
export const TwoDataPoints: Story = {
  args: {
    data: [
      { name: 'Active', value: 42 },
      { name: 'Inactive', value: 18 },
    ],
    color: 'cyan',
    horizontal: true,
    height: 120,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Active')).toBeInTheDocument();
    await expect(canvas.getByText('Inactive')).toBeInTheDocument();
  },
};

// Equal values
export const EqualValues: Story = {
  args: {
    data: [
      { name: 'A', value: 50 },
      { name: 'B', value: 50 },
      { name: 'C', value: 50 },
    ],
    color: 'purple',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('A')).toBeInTheDocument();
    await expect(canvas.getByText('B')).toBeInTheDocument();
    await expect(canvas.getByText('C')).toBeInTheDocument();
  },
};

// Very long names
export const LongNames: Story = {
  args: {
    data: [
      { name: 'very_long_tool_name_that_might_overflow', value: 42 },
      { name: 'another_extremely_long_name', value: 28 },
      { name: 'short', value: 15 },
    ],
    color: 'green',
    horizontal: true,
    height: 150,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('short')).toBeInTheDocument();
  },
};

// Zero values
export const WithZeroValues: Story = {
  args: {
    data: [
      { name: 'Active', value: 42 },
      { name: 'Pending', value: 0 },
      { name: 'Failed', value: 5 },
    ],
    color: 'cyan',
    horizontal: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Active')).toBeInTheDocument();
  },
};

// Large values
export const LargeValues: Story = {
  args: {
    data: [
      { name: 'Requests', value: 1250000 },
      { name: 'Tokens', value: 850000 },
      { name: 'Errors', value: 12500 },
    ],
    color: 'purple',
    horizontal: true,
    formatValue: (v: number) => v.toLocaleString(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Requests')).toBeInTheDocument();
  },
};
