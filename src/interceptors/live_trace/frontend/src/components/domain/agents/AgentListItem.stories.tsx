import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import type { APIAgent } from '@api/types/dashboard';

import { AgentListItem } from './AgentListItem';

// Mock agent data
const mockAgentOk: APIAgent = {
  id: 'prompt-a8b9ef35309f',
  id_short: 'a8b9ef35',
  agent_workflow_id: 'test-agent-workflow-123',
  total_sessions: 5,
  active_sessions: 1,
  completed_sessions: 4,
  total_messages: 150,
  total_tokens: 25000,
  total_tools: 12,
  unique_tools: 4,
  total_errors: 2,
  avg_response_time_ms: 450,
  last_seen: '2024-01-15T10:30:00Z',
  last_seen_relative: '2 min ago',
  risk_status: 'ok',
  current_sessions: 5,
  min_sessions_required: 5,
};

const mockAgentEvaluating: APIAgent = {
  ...mockAgentOk,
  id: 'prompt-eval1234abcd',
  risk_status: 'evaluating',
  current_sessions: 2,
};

const mockAgentRequiresAction: APIAgent = {
  ...mockAgentOk,
  id: 'prompt-action5678efgh',
  analysis_summary: {
    action_required: true,
    failed_checks: 2,
    warnings: 1,
    behavioral: {
      stability: 75,
      predictability: 60,
      confidence: 'medium',
    },
    completed_sessions: 4,
    active_sessions: 1,
    total_sessions: 5,
  },
};

const meta: Meta<typeof AgentListItem> = {
  title: 'Domain/Agents/AgentListItem',
  component: AgentListItem,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 240, background: '#0a0a0f', padding: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentListItem>;

export const StatusOk: Story = {
  args: {
    agent: mockAgentOk,
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Prompt A8b9ef35309f')).toBeInTheDocument();
    await expect(canvas.getByText('2 min ago')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument();
  },
};

export const StatusEvaluating: Story = {
  args: {
    agent: mockAgentEvaluating,
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Prompt Eval1234abcd')).toBeInTheDocument();
  },
};

export const StatusRequiresAction: Story = {
  args: {
    agent: mockAgentRequiresAction,
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Prompt Action5678efgh')).toBeInTheDocument();
  },
};

export const Active: Story = {
  args: {
    agent: mockAgentOk,
    active: true,
    onClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Prompt A8b9ef35309f')).toBeInTheDocument();
  },
};

export const Collapsed: Story = {
  args: {
    agent: mockAgentOk,
    collapsed: true,
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 56, background: '#0a0a0f', padding: 8 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    // In collapsed mode, only avatar is visible
    const container = canvas.getByRole('button');
    await expect(container).toBeInTheDocument();
  },
};

export const ClickInteraction: Story = {
  args: {
    agent: mockAgentOk,
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const item = canvas.getByRole('button');
    await userEvent.click(item);
    await expect(args.onClick).toHaveBeenCalled();
  },
};
