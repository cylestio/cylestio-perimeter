import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import type { AgentAnalytics } from '@api/types/agent';

import { TokenUsageInsights } from './TokenUsageInsights';

const meta: Meta<typeof TokenUsageInsights> = {
  title: 'Domain/Analytics/TokenUsageInsights',
  component: TokenUsageInsights,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TokenUsageInsights>;

// Mock data
const createMockAnalytics = (overrides?: Partial<AgentAnalytics>): AgentAnalytics => ({
  token_summary: {
    total_tokens: 1250000,
    input_tokens: 850000,
    output_tokens: 400000,
    total_cost: 12.75,
    models_used: 3,
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
      cost: 6.30,
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
      cost: 4.20,
    },
    {
      model: 'claude-haiku',
      requests: 45,
      input_tokens: 120000,
      output_tokens: 80000,
      total_tokens: 200000,
      avg_response_time_ms: 450,
      p95_response_time_ms: 750,
      errors: 1,
      cost: 2.25,
    },
  ],
  tools: [],
  timeline: [],
  tool_timeline: [],
  ...overrides,
});

// Default story
export const Default: Story = {
  args: {
    analytics: createMockAnalytics(),
    totalSessions: 45,
    avgDurationMinutes: 8.5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
    await expect(canvas.getByText('Total Tokens')).toBeInTheDocument();
    await expect(canvas.getByText('Avg Cost/Session')).toBeInTheDocument();
    await expect(canvas.getByText('Avg Session Time')).toBeInTheDocument();
    await expect(canvas.getByText('Avg Tokens/Session')).toBeInTheDocument();
  },
};

// Single model
export const SingleModel: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 500000,
        input_tokens: 350000,
        output_tokens: 150000,
        total_cost: 5.0,
        models_used: 1,
        pricing_last_updated: '2025-01-10T10:30:00Z',
      },
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
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
    await expect(canvas.getByText('claude-sonnet-4')).toBeInTheDocument();
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
          errors: 0,
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
          errors: 0,
          cost: 5.5,
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
          requests: 120,
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
          requests: 60,
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
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
  },
};

// High cost
export const HighCost: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 50000000,
        input_tokens: 35000000,
        output_tokens: 15000000,
        total_cost: 1250.5,
        models_used: 2,
        pricing_last_updated: '2025-01-15T10:30:00Z',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('$1250.50')).toBeInTheDocument();
  },
};

// Low usage
export const LowUsage: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 500,
        input_tokens: 350,
        output_tokens: 150,
        total_cost: 0.0001,
        models_used: 1,
        pricing_last_updated: '2025-01-15T10:30:00Z',
      },
      models: [
        {
          model: 'claude-haiku',
          requests: 2,
          input_tokens: 350,
          output_tokens: 150,
          total_tokens: 500,
          avg_response_time_ms: 300,
          p95_response_time_ms: 400,
          errors: 0,
          cost: 0.0001,
        },
      ],
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
  },
};

// No pricing
export const NoPricing: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 1000000,
        input_tokens: 700000,
        output_tokens: 300000,
        total_cost: 0,
        models_used: 2,
        pricing_last_updated: null,
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Pricing unavailable')).toBeInTheDocument();
  },
};

// Mostly input tokens
export const MostlyInputTokens: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 1000000,
        input_tokens: 950000,
        output_tokens: 50000,
        total_cost: 9.5,
        models_used: 1,
        pricing_last_updated: '2025-01-15T10:30:00Z',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
  },
};

// Mostly output tokens
export const MostlyOutputTokens: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 1000000,
        input_tokens: 100000,
        output_tokens: 900000,
        total_cost: 27.0,
        models_used: 1,
        pricing_last_updated: '2025-01-15T10:30:00Z',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
  },
};

// Equal distribution
export const EqualDistribution: Story = {
  args: {
    analytics: createMockAnalytics({
      token_summary: {
        total_tokens: 1000000,
        input_tokens: 500000,
        output_tokens: 500000,
        total_cost: 10.0,
        models_used: 1,
        pricing_last_updated: '2025-01-15T10:30:00Z',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Token Usage Insights')).toBeInTheDocument();
  },
};

// No models data
export const NoModelsData: Story = {
  args: {
    analytics: createMockAnalytics({
      models: [],
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No model data available')).toBeInTheDocument();
  },
};
