import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { AgentAnalytics } from '@api/types/agent';

import { ToolUsageAnalytics } from './ToolUsageAnalytics';

const meta: Meta<typeof ToolUsageAnalytics> = {
  title: 'Domain/Analytics/ToolUsageAnalytics',
  component: ToolUsageAnalytics,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ToolUsageAnalytics>;

// Mock data helper
const createMockAnalytics = (overrides?: Partial<AgentAnalytics>): AgentAnalytics => ({
  token_summary: {
    total_tokens: 1000000,
    input_tokens: 700000,
    output_tokens: 300000,
    total_cost: 10.0,
    models_used: 2,
    pricing_last_updated: '2025-01-15T10:30:00Z',
  },
  models: [],
  tools: [
    {
      tool: 'web_search',
      executions: 156,
      avg_duration_ms: 850,
      max_duration_ms: 2500,
      failures: 3,
      successes: 153,
      failure_rate: 0.019,
    },
    {
      tool: 'code_editor',
      executions: 89,
      avg_duration_ms: 120,
      max_duration_ms: 450,
      failures: 0,
      successes: 89,
      failure_rate: 0,
    },
    {
      tool: 'file_reader',
      executions: 67,
      avg_duration_ms: 45,
      max_duration_ms: 180,
      failures: 1,
      successes: 66,
      failure_rate: 0.015,
    },
    {
      tool: 'database_query',
      executions: 45,
      avg_duration_ms: 1250,
      max_duration_ms: 5000,
      failures: 5,
      successes: 40,
      failure_rate: 0.111,
    },
    {
      tool: 'image_generator',
      executions: 23,
      avg_duration_ms: 3500,
      max_duration_ms: 8000,
      failures: 2,
      successes: 21,
      failure_rate: 0.087,
    },
  ],
  timeline: [],
  tool_timeline: [],
  ...overrides,
});

// Default story
export const Default: Story = {
  args: {
    analytics: createMockAnalytics(),
    availableTools: [
      'web_search',
      'code_editor',
      'file_reader',
      'database_query',
      'image_generator',
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Tool Usage Analytics')).toBeInTheDocument();
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
    await expect(canvas.getByText('Tool Utilization')).toBeInTheDocument();
    // Check table headers exist
    const table = canvas.getByRole('table');
    const tableCanvas = within(table);
    await expect(tableCanvas.getByText('Max Duration')).toBeInTheDocument();
    await expect(tableCanvas.getByText('Avg Duration')).toBeInTheDocument();
  },
};

// Test sortable columns
export const SortableColumns: Story = {
  args: {
    analytics: createMockAnalytics(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Find the table headers specifically using role
    const table = canvas.getByRole('table');
    const tableCanvas = within(table);
    // Click on Tool header to sort alphabetically
    const toolHeader = tableCanvas.getByText('Tool');
    await userEvent.click(toolHeader);
    // Should show sort indicator
    await expect(toolHeader.textContent).toContain('▼');
    // Click again to reverse
    await userEvent.click(toolHeader);
    await expect(toolHeader.textContent).toContain('▲');
    // Click on Executions header (within table)
    const execHeader = tableCanvas.getByText('Executions');
    await userEvent.click(execHeader);
    await expect(execHeader.textContent).toContain('▼');
  },
};

// No tools
export const NoTools: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [],
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No tool usage data available')).toBeInTheDocument();
  },
};

// Single tool
export const SingleTool: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'web_search',
          executions: 100,
          avg_duration_ms: 500,
          max_duration_ms: 1500,
          failures: 2,
          successes: 98,
          failure_rate: 0.02,
        },
      ],
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

// Many tools (with show more toggle)
export const ManyTools: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'web_search',
          executions: 200,
          avg_duration_ms: 850,
          max_duration_ms: 2500,
          failures: 5,
          successes: 195,
          failure_rate: 0.025,
        },
        {
          tool: 'code_editor',
          executions: 180,
          avg_duration_ms: 120,
          max_duration_ms: 450,
          failures: 0,
          successes: 180,
          failure_rate: 0,
        },
        {
          tool: 'file_reader',
          executions: 150,
          avg_duration_ms: 45,
          max_duration_ms: 180,
          failures: 1,
          successes: 149,
          failure_rate: 0.007,
        },
        {
          tool: 'database_query',
          executions: 120,
          avg_duration_ms: 1250,
          max_duration_ms: 5000,
          failures: 10,
          successes: 110,
          failure_rate: 0.083,
        },
        {
          tool: 'image_generator',
          executions: 80,
          avg_duration_ms: 3500,
          max_duration_ms: 8000,
          failures: 4,
          successes: 76,
          failure_rate: 0.05,
        },
        {
          tool: 'text_analyzer',
          executions: 60,
          avg_duration_ms: 200,
          max_duration_ms: 600,
          failures: 0,
          successes: 60,
          failure_rate: 0,
        },
        {
          tool: 'calculator',
          executions: 45,
          avg_duration_ms: 10,
          max_duration_ms: 50,
          failures: 0,
          successes: 45,
          failure_rate: 0,
        },
        {
          tool: 'email_sender',
          executions: 30,
          avg_duration_ms: 500,
          max_duration_ms: 1500,
          failures: 2,
          successes: 28,
          failure_rate: 0.067,
        },
        {
          tool: 'calendar_api',
          executions: 25,
          avg_duration_ms: 300,
          max_duration_ms: 900,
          failures: 1,
          successes: 24,
          failure_rate: 0.04,
        },
        {
          tool: 'translation',
          executions: 20,
          avg_duration_ms: 600,
          max_duration_ms: 1800,
          failures: 0,
          successes: 20,
          failure_rate: 0,
        },
        {
          tool: 'voice_recognition',
          executions: 15,
          avg_duration_ms: 800,
          max_duration_ms: 2000,
          failures: 1,
          successes: 14,
          failure_rate: 0.067,
        },
        {
          tool: 'pdf_parser',
          executions: 10,
          avg_duration_ms: 400,
          max_duration_ms: 1200,
          failures: 0,
          successes: 10,
          failure_rate: 0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
    // Show more toggle should be visible with 2 hidden tools
    const showMoreButton = canvas.getByText(/Show 2 more tools/);
    await expect(showMoreButton).toBeInTheDocument();
    // Click to show all
    await userEvent.click(showMoreButton);
    // Now should show "Hide" button
    await expect(canvas.getByText(/Hide 2 tools/)).toBeInTheDocument();
    // Should now show the hidden tools
    await expect(canvas.getByText('voice_recognition')).toBeInTheDocument();
    await expect(canvas.getByText('pdf_parser')).toBeInTheDocument();
    // Click to hide again
    await userEvent.click(canvas.getByText(/Hide 2 tools/));
    await expect(canvas.getByText(/Show 2 more tools/)).toBeInTheDocument();
  },
};

// High failure rate
export const HighFailureRate: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'unreliable_api',
          executions: 100,
          avg_duration_ms: 2000,
          max_duration_ms: 10000,
          failures: 35,
          successes: 65,
          failure_rate: 0.35,
        },
        {
          tool: 'flaky_service',
          executions: 80,
          avg_duration_ms: 1500,
          max_duration_ms: 8000,
          failures: 20,
          successes: 60,
          failure_rate: 0.25,
        },
        {
          tool: 'stable_tool',
          executions: 150,
          avg_duration_ms: 100,
          max_duration_ms: 300,
          failures: 0,
          successes: 150,
          failure_rate: 0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show failure badges
    await expect(canvas.getByText('Total Failures')).toBeInTheDocument();
  },
};

// Very slow tools
export const VerySlowTools: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'ml_inference',
          executions: 50,
          avg_duration_ms: 15000,
          max_duration_ms: 60000,
          failures: 2,
          successes: 48,
          failure_rate: 0.04,
        },
        {
          tool: 'video_processor',
          executions: 20,
          avg_duration_ms: 30000,
          max_duration_ms: 120000,
          failures: 1,
          successes: 19,
          failure_rate: 0.05,
        },
        {
          tool: 'quick_lookup',
          executions: 200,
          avg_duration_ms: 25,
          max_duration_ms: 100,
          failures: 0,
          successes: 200,
          failure_rate: 0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show slow tools with orange duration highlighting
    await expect(canvas.getByText('ml_inference')).toBeInTheDocument();
    await expect(canvas.getByText('15.00s')).toBeInTheDocument();
  },
};

// Perfect success rate
export const PerfectSuccessRate: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'reliable_tool_1',
          executions: 100,
          avg_duration_ms: 200,
          max_duration_ms: 500,
          failures: 0,
          successes: 100,
          failure_rate: 0,
        },
        {
          tool: 'reliable_tool_2',
          executions: 80,
          avg_duration_ms: 150,
          max_duration_ms: 400,
          failures: 0,
          successes: 80,
          failure_rate: 0,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = canvas.getAllByText('100%');
    await expect(badges.length).toBeGreaterThan(0);
  },
};

// With unused tools
export const WithUnusedTools: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'web_search',
          executions: 100,
          avg_duration_ms: 500,
          max_duration_ms: 1500,
          failures: 2,
          successes: 98,
          failure_rate: 0.02,
        },
        {
          tool: 'code_editor',
          executions: 50,
          avg_duration_ms: 100,
          max_duration_ms: 300,
          failures: 0,
          successes: 50,
          failure_rate: 0,
        },
      ],
    }),
    availableTools: [
      'web_search',
      'code_editor',
      'file_reader',
      'database_query',
      'image_generator',
      'calculator',
      'email_sender',
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show 5 unused tools and utilization badge
    await expect(canvas.getByText('Unused Tools')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument(); // 5 unused tools
    await expect(canvas.getByText('29%')).toBeInTheDocument(); // 2/7 = 28.5% rounded to 29%
    // Unused tools should appear in the table
    await expect(canvas.getByText('file_reader')).toBeInTheDocument();
  },
};

// Low tool utilization
export const LowToolUtilization: Story = {
  args: {
    analytics: createMockAnalytics({
      tools: [
        {
          tool: 'web_search',
          executions: 50,
          avg_duration_ms: 500,
          max_duration_ms: 1500,
          failures: 1,
          successes: 49,
          failure_rate: 0.02,
        },
      ],
    }),
    availableTools: [
      'web_search',
      'code_editor',
      'file_reader',
      'database_query',
      'image_generator',
      'calculator',
      'email_sender',
      'calendar_api',
      'translation',
      'text_analyzer',
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show low utilization (1/10 = 10%)
    await expect(canvas.getByText('10%')).toBeInTheDocument();
    await expect(canvas.getByText('9')).toBeInTheDocument(); // 9 unused tools
  },
};
