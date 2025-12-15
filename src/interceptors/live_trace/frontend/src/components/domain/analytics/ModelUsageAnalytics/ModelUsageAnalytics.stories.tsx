import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { AgentAnalytics } from '@api/types/agent';

import { ModelUsageAnalytics } from './ModelUsageAnalytics';

const meta: Meta<typeof ModelUsageAnalytics> = {
  title: 'Domain/Analytics/ModelUsageAnalytics',
  component: ModelUsageAnalytics,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ModelUsageAnalytics>;

// Mock data helper
const createMockAnalytics = (overrides?: Partial<AgentAnalytics>): AgentAnalytics => ({
  token_summary: {
    total_tokens: 2500000,
    input_tokens: 1700000,
    output_tokens: 800000,
    total_cost: 33.05,
    models_used: 4,
    pricing_last_updated: '2025-01-15T10:30:00Z',
  },
  models: [
    {
      model: 'claude-sonnet-4',
      requests: 156,
      input_tokens: 450000,
      output_tokens: 180000,
      total_tokens: 630000,
      avg_response_time_ms: 1250,
      p95_response_time_ms: 2100,
      errors: 2,
      cost: 6.3,
    },
    {
      model: 'gpt-4o',
      requests: 89,
      input_tokens: 280000,
      output_tokens: 140000,
      total_tokens: 420000,
      avg_response_time_ms: 980,
      p95_response_time_ms: 1800,
      errors: 0,
      cost: 8.4,
    },
    {
      model: 'claude-opus',
      requests: 45,
      input_tokens: 200000,
      output_tokens: 100000,
      total_tokens: 300000,
      avg_response_time_ms: 2500,
      p95_response_time_ms: 4000,
      errors: 5,
      cost: 15.0,
    },
    {
      model: 'claude-haiku',
      requests: 120,
      input_tokens: 180000,
      output_tokens: 90000,
      total_tokens: 270000,
      avg_response_time_ms: 350,
      p95_response_time_ms: 650,
      errors: 0,
      cost: 0.35,
    },
  ],
  tools: [],
  timeline: [
    { date: '2025-01-08', requests: 45, tokens: 180000, input_tokens: 120000, output_tokens: 60000 },
    { date: '2025-01-09', requests: 62, tokens: 248000, input_tokens: 165000, output_tokens: 83000 },
    { date: '2025-01-10', requests: 78, tokens: 312000, input_tokens: 208000, output_tokens: 104000 },
    { date: '2025-01-11', requests: 55, tokens: 220000, input_tokens: 147000, output_tokens: 73000 },
    { date: '2025-01-12', requests: 89, tokens: 356000, input_tokens: 237000, output_tokens: 119000 },
    { date: '2025-01-13', requests: 72, tokens: 288000, input_tokens: 192000, output_tokens: 96000 },
    { date: '2025-01-14', requests: 95, tokens: 380000, input_tokens: 253000, output_tokens: 127000 },
    { date: '2025-01-15', requests: 88, tokens: 352000, input_tokens: 235000, output_tokens: 117000 },
  ],
  tool_timeline: [],
  ...overrides,
});

// Default story
export const Default: Story = {
  args: {
    analytics: createMockAnalytics(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Model Usage Analytics')).toBeInTheDocument();
    await expect(canvas.getByText('Overview')).toBeInTheDocument();
    // Model name appears in both DistributionBar and the table
    await expect(canvas.getAllByText('claude-sonnet-4').length).toBeGreaterThan(0);
  },
};

// Navigate tabs
export const PerformanceTab: Story = {
  args: {
    analytics: createMockAnalytics(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const performanceTab = canvas.getByText('Performance');
    await userEvent.click(performanceTab);
    await expect(canvas.getByText('Average Response Time')).toBeInTheDocument();
    await expect(canvas.getByText('95th Percentile Response Time')).toBeInTheDocument();
  },
};

export const CostTab: Story = {
  args: {
    analytics: createMockAnalytics(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const costTab = canvas.getByText('Cost Analysis');
    await userEvent.click(costTab);
    await expect(canvas.getByText('Cost by Model')).toBeInTheDocument();
  },
};

export const TrendsTab: Story = {
  args: {
    analytics: createMockAnalytics(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trendsTab = canvas.getByText('Trends');
    await userEvent.click(trendsTab);
    await expect(canvas.getByText('Requests Over Time')).toBeInTheDocument();
    await expect(canvas.getByText('Token Usage Over Time')).toBeInTheDocument();
  },
};

// Single model
export const SingleModel: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [
        {
          model: 'claude-sonnet-4',
          requests: 100,
          input_tokens: 350000,
          output_tokens: 150000,
          total_tokens: 500000,
          avg_response_time_ms: 1100,
          p95_response_time_ms: 1900,
          errors: 0,
          cost: 5.0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Model name appears in both DistributionBar and the table
    await expect(canvas.getAllByText('claude-sonnet-4').length).toBeGreaterThan(0);
  },
};

// No models
export const NoModels: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No model usage data available')).toBeInTheDocument();
  },
};

// Many models
export const ManyModels: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [
        {
          model: 'claude-sonnet-4',
          requests: 200,
          input_tokens: 500000,
          output_tokens: 200000,
          total_tokens: 700000,
          avg_response_time_ms: 1200,
          p95_response_time_ms: 2000,
          errors: 3,
          cost: 7.0,
        },
        {
          model: 'gpt-4o',
          requests: 150,
          input_tokens: 400000,
          output_tokens: 150000,
          total_tokens: 550000,
          avg_response_time_ms: 900,
          p95_response_time_ms: 1600,
          errors: 1,
          cost: 11.0,
        },
        {
          model: 'claude-opus',
          requests: 50,
          input_tokens: 200000,
          output_tokens: 100000,
          total_tokens: 300000,
          avg_response_time_ms: 2500,
          p95_response_time_ms: 4000,
          errors: 2,
          cost: 15.0,
        },
        {
          model: 'gpt-4-turbo',
          requests: 80,
          input_tokens: 150000,
          output_tokens: 80000,
          total_tokens: 230000,
          avg_response_time_ms: 1100,
          p95_response_time_ms: 1800,
          errors: 0,
          cost: 4.6,
        },
        {
          model: 'claude-haiku',
          requests: 300,
          input_tokens: 180000,
          output_tokens: 90000,
          total_tokens: 270000,
          avg_response_time_ms: 400,
          p95_response_time_ms: 700,
          errors: 0,
          cost: 0.54,
        },
        {
          model: 'gpt-3.5-turbo',
          requests: 100,
          input_tokens: 100000,
          output_tokens: 50000,
          total_tokens: 150000,
          avg_response_time_ms: 350,
          p95_response_time_ms: 600,
          errors: 0,
          cost: 0.3,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Model names appear in both DistributionBar and the table
    await expect(canvas.getAllByText('claude-haiku').length).toBeGreaterThan(0);
  },
};

// With errors
export const WithErrors: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [
        {
          model: 'claude-sonnet-4',
          requests: 100,
          input_tokens: 350000,
          output_tokens: 150000,
          total_tokens: 500000,
          avg_response_time_ms: 1100,
          p95_response_time_ms: 1900,
          errors: 12,
          cost: 5.0,
        },
        {
          model: 'gpt-4o',
          requests: 80,
          input_tokens: 280000,
          output_tokens: 120000,
          total_tokens: 400000,
          avg_response_time_ms: 900,
          p95_response_time_ms: 1500,
          errors: 5,
          cost: 8.0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show error badges
    const errors = canvas.getAllByText('12');
    await expect(errors.length).toBeGreaterThan(0);
  },
};

// No cost data
export const NoCostData: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [
        {
          model: 'custom-model',
          requests: 100,
          input_tokens: 350000,
          output_tokens: 150000,
          total_tokens: 500000,
          avg_response_time_ms: 1100,
          p95_response_time_ms: 1900,
          errors: 0,
          cost: 0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const costTab = canvas.getByText('Cost Analysis');
    await userEvent.click(costTab);
    // There are two "No cost data available" messages (one for each chart column)
    await expect(canvas.getAllByText('No cost data available').length).toBeGreaterThan(0);
  },
};

// No timeline data
export const NoTimelineData: Story = {
  args: {
    analytics: createMockAnalytics({
      timeline: [],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trendsTab = canvas.getByText('Trends');
    await userEvent.click(trendsTab);
    await expect(canvas.getAllByText('No timeline data available').length).toBeGreaterThan(0);
  },
};

// High latency
export const HighLatency: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [
        {
          model: 'slow-model',
          requests: 50,
          input_tokens: 500000,
          output_tokens: 250000,
          total_tokens: 750000,
          avg_response_time_ms: 15000,
          p95_response_time_ms: 45000,
          errors: 0,
          cost: 37.5,
        },
        {
          model: 'fast-model',
          requests: 200,
          input_tokens: 100000,
          output_tokens: 50000,
          total_tokens: 150000,
          avg_response_time_ms: 250,
          p95_response_time_ms: 450,
          errors: 0,
          cost: 0.3,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const performanceTab = canvas.getByText('Performance');
    await userEvent.click(performanceTab);
    await expect(canvas.getByText('Average Response Time')).toBeInTheDocument();
  },
};
