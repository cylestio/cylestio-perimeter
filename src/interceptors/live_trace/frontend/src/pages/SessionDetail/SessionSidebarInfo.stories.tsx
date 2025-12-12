import type { Meta, StoryObj } from '@storybook/react-vite';

import { SessionSidebarInfo } from './SessionSidebarInfo';

const meta: Meta<typeof SessionSidebarInfo> = {
  title: 'Pages/SessionDetail/SessionSidebarInfo',
  component: SessionSidebarInfo,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px', minHeight: '800px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionSidebarInfo>;

/**
 * Default state showing all sidebar sections with real + mock data.
 * The sidebar includes:
 * - Session Info (metadata)
 * - Metrics (cost, tokens, latency, duration)
 * - Behavioral Insights (cluster membership)
 * - Security Checks (passed/warnings)
 * - Tool Utilization (usage stats)
 */
export const Default: Story = {
  args: {
    sessionId: 'sess_a7f3b291c4e8d5f6',
    agentId: 'agent_8c2e1f4a9b3d7e6c',
    isActive: true,
    totalTokens: 15730,
    messageCount: 24,
    durationMinutes: 4.5,
    toolUses: 30,
    errors: 0,
    errorRate: 0,
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  },
};

/**
 * Completed session (inactive) with some errors.
 */
export const CompletedWithErrors: Story = {
  args: {
    sessionId: 'sess_b8f4c392d5e9a6g7',
    agentId: 'agent_9d3f2g5b0c4e8h7i',
    isActive: false,
    totalTokens: 28450,
    messageCount: 42,
    durationMinutes: 12.3,
    toolUses: 56,
    errors: 3,
    errorRate: 7.14,
    model: 'gpt-4o',
    provider: 'openai',
  },
};

/**
 * Long-running active session.
 */
export const LongRunningSession: Story = {
  args: {
    sessionId: 'sess_c9g5d4e3f6h7i8j9',
    agentId: 'agent_0e4g3h6c1d5f9i8j',
    isActive: true,
    totalTokens: 156000,
    messageCount: 180,
    durationMinutes: 125.5,
    toolUses: 245,
    errors: 0,
    errorRate: 0,
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  },
};

/**
 * Minimal data (only required fields).
 */
export const MinimalData: Story = {
  args: {
    sessionId: 'sess_minimal_123',
    isActive: false,
  },
};

/**
 * Wider layout to test responsive behavior.
 */
export const WideLayout: Story = {
  args: {
    sessionId: 'sess_a7f3b291c4e8d5f6',
    agentId: 'agent_8c2e1f4a9b3d7e6c',
    isActive: true,
    totalTokens: 15730,
    messageCount: 24,
    durationMinutes: 4.5,
    toolUses: 30,
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', minHeight: '800px' }}>
        <Story />
      </div>
    ),
  ],
};
