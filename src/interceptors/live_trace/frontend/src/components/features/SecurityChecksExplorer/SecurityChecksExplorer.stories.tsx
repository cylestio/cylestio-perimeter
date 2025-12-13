import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { AgentSecurityCheck, SystemPromptSecurityData as AgentSecurityData } from '@api/endpoints/agent';

import { SecurityChecksExplorer } from './SecurityChecksExplorer';

// Mock data
const mockChecks: AgentSecurityCheck[] = [
  {
    check_id: 'check_001',
    system_prompt_id: 'agent_abc123',
    agent_id: 'agent_001',
    analysis_session_id: 'session_001',
    category_id: 'RESOURCE_MANAGEMENT',
    check_type: 'session_duration',
    status: 'passed',
    title: 'Session Duration Consistency',
    value: '45 min avg',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    check_id: 'check_002',
    system_prompt_id: 'agent_abc123',
    agent_id: 'agent_001',
    analysis_session_id: 'session_001',
    category_id: 'RESOURCE_MANAGEMENT',
    check_type: 'token_usage',
    status: 'warning',
    title: 'Token Consistency Across Sessions',
    value: '15% variance',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    check_id: 'check_003',
    system_prompt_id: 'agent_abc123',
    agent_id: 'agent_001',
    analysis_session_id: 'session_001',
    category_id: 'ENVIRONMENT',
    check_type: 'model_pinning',
    status: 'passed',
    title: 'Pinned Model Usage',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    check_id: 'check_004',
    system_prompt_id: 'agent_abc123',
    agent_id: 'agent_001',
    analysis_session_id: 'session_001',
    category_id: 'BEHAVIORAL',
    check_type: 'stability_score',
    status: 'passed',
    title: 'Stability Score',
    value: '0.92',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    check_id: 'check_005',
    system_prompt_id: 'agent_abc123',
    agent_id: 'agent_001',
    analysis_session_id: 'session_001',
    category_id: 'BEHAVIORAL',
    check_type: 'anomaly_detection',
    status: 'critical',
    title: 'Anomaly Detection',
    description: 'Unusual pattern detected in tool usage',
    created_at: '2024-01-15T10:30:00Z',
  },
];

const mockAgent: AgentSecurityData = {
  system_prompt_id: 'agent_abc123def456',
  system_prompt_name: 'math-agent',
  checks: mockChecks,
  latest_check_at: new Date(Date.now() - 300 * 1000).toISOString(), // 5 minutes ago
  summary: {
    total: 5,
    passed: 3,
    warnings: 1,
    critical: 1,
  },
};

const mockAgentWithManyChecks: AgentSecurityData = {
  system_prompt_id: 'agent_xyz789',
  system_prompt_name: 'assistant-v2',
  checks: [
    ...mockChecks.map((c, i) => ({ ...c, check_id: `check_1${i}`, system_prompt_id: 'agent_xyz789' })),
    {
      check_id: 'check_106',
      system_prompt_id: 'agent_xyz789',
      agent_id: 'agent_001',
      analysis_session_id: 'session_002',
      category_id: 'ENVIRONMENT',
      check_type: 'tool_authorization',
      status: 'passed',
      title: 'Tool Authorization',
      created_at: '2024-01-15T11:00:00Z',
    },
  ],
  latest_check_at: new Date(Date.now() - 60 * 1000).toISOString(), // 1 minute ago
  summary: {
    total: 6,
    passed: 4,
    warnings: 1,
    critical: 1,
  },
};

const meta: Meta<typeof SecurityChecksExplorer> = {
  title: 'Features/SecurityChecksExplorer',
  component: SecurityChecksExplorer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: 'var(--color-surface)', minWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SecurityChecksExplorer>;

export const SingleAgent: Story = {
  args: {
    agents: [mockAgent],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('security-checks-explorer')).toBeInTheDocument();
    // Shows system_prompt_id not agent_name
    await expect(canvas.getByText('agent_abc123def456')).toBeInTheDocument();
    await expect(canvas.getByText('3 passed')).toBeInTheDocument();
    await expect(canvas.getByText('1 warnings')).toBeInTheDocument();
    await expect(canvas.getByText('1 critical')).toBeInTheDocument();
  },
};

export const MultipleAgents: Story = {
  args: {
    agents: [mockAgent, mockAgentWithManyChecks],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Component now shows "System prompt X of Y"
    await expect(canvas.getByText('System prompt 1 of 2')).toBeInTheDocument();
    await expect(canvas.getByText('agent_abc123def456')).toBeInTheDocument();

    // Navigate to next system prompt
    const nextButton = canvas.getByLabelText('Next system prompt');
    await userEvent.click(nextButton);

    await expect(canvas.getByText('System prompt 2 of 2')).toBeInTheDocument();
    await expect(canvas.getByText('agent_xyz789')).toBeInTheDocument();
  },
};

export const WithCategories: Story = {
  args: {
    agents: [mockAgent],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Resource Management')).toBeInTheDocument();
    await expect(canvas.getByText('Environment')).toBeInTheDocument();
    await expect(canvas.getByText('Behavioral')).toBeInTheDocument();
  },
};

export const WithTimestamp: Story = {
  args: {
    agents: [mockAgent],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show relative timestamp (5m ago from mock data)
    await expect(canvas.getByText('5m ago')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    agents: [],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No security checks available.')).toBeInTheDocument();
  },
};

export const AgentWithNoChecks: Story = {
  args: {
    agents: [{
      system_prompt_id: 'agent_empty',
      system_prompt_name: 'empty-agent',
      checks: [],
      summary: { total: 0, passed: 0, warnings: 0, critical: 0 },
    }],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Component now says "system prompt" instead of "agent"
    await expect(canvas.getByText('No checks for this system prompt yet.')).toBeInTheDocument();
  },
};

export const AllPassedChecks: Story = {
  args: {
    agents: [{
      system_prompt_id: 'agent_perfect',
      system_prompt_name: 'perfect-agent',
      checks: mockChecks.filter(c => c.status === 'passed').map((c, i) => ({
        ...c,
        check_id: `perfect_${i}`,
      })),
      latest_check_at: new Date(Date.now() - 120 * 1000).toISOString(),
      summary: { total: 3, passed: 3, warnings: 0, critical: 0 },
    }],
    agentId: 'agent_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3 passed')).toBeInTheDocument();
    // Should not show warnings or critical badges
    expect(canvas.queryByText(/warnings/)).not.toBeInTheDocument();
    expect(canvas.queryByText(/critical/)).not.toBeInTheDocument();
  },
};
