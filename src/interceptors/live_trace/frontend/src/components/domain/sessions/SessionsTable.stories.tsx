import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import type { SessionListItem } from '@api/types/session';

import { SessionsTable } from './SessionsTable';

// Mock data
const mockSessions: SessionListItem[] = [
  {
    id: 'sess_abc123def456',
    id_short: 'sess_abc123d',
    agent_id: 'agent_xyz789',
    agent_id_short: 'agent_xyz78',
    workflow_id: 'workflow_001',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    last_activity: new Date(Date.now() - 600000).toISOString(),
    last_activity_relative: '10m ago',
    duration_minutes: 45.2,
    is_active: true,
    is_completed: false,
    status: 'ACTIVE',
    message_count: 24,
    tool_uses: 12,
    errors: 0,
    total_tokens: 15420,
    error_rate: 0,
  },
  {
    id: 'sess_def456ghi789',
    id_short: 'sess_def456g',
    agent_id: 'agent_xyz789',
    agent_id_short: 'agent_xyz78',
    workflow_id: 'workflow_001',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    last_activity: new Date(Date.now() - 3600000).toISOString(),
    last_activity_relative: '1h ago',
    duration_minutes: 32.5,
    is_active: false,
    is_completed: true,
    status: 'COMPLETED',
    message_count: 18,
    tool_uses: 8,
    errors: 0,
    total_tokens: 8750,
    error_rate: 0,
  },
  {
    id: 'sess_ghi789jkl012',
    id_short: 'sess_ghi789j',
    agent_id: 'agent_abc123',
    agent_id_short: 'agent_abc12',
    workflow_id: 'workflow_001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    last_activity: new Date(Date.now() - 82800000).toISOString(),
    last_activity_relative: '1d ago',
    duration_minutes: 120.3,
    is_active: false,
    is_completed: true,
    status: 'COMPLETED',
    message_count: 45,
    tool_uses: 22,
    errors: 3,
    total_tokens: 42500,
    error_rate: 6.7,
  },
  {
    id: 'sess_jkl012mno345',
    id_short: 'sess_jkl012m',
    agent_id: 'agent_def456',
    agent_id_short: 'agent_def45',
    workflow_id: 'workflow_001',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    last_activity: new Date(Date.now() - 172000000).toISOString(),
    last_activity_relative: '2d ago',
    duration_minutes: 15.8,
    is_active: false,
    is_completed: true,
    status: 'COMPLETED',
    message_count: 8,
    tool_uses: 3,
    errors: 2,
    total_tokens: 3200,
    error_rate: 25.0,
  },
];

const meta: Meta<typeof SessionsTable> = {
  title: 'Domain/Sessions/SessionsTable',
  component: SessionsTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: 'var(--color-surface)', minWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionsTable>;

export const Default: Story = {
  args: {
    sessions: mockSessions,
    workflowId: 'workflow_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session ID')).toBeInTheDocument();
    await expect(canvas.getByText('sess_abc123d')).toBeInTheDocument();
  },
};

export const WithAgentColumn: Story = {
  args: {
    sessions: mockSessions,
    workflowId: 'workflow_001',
    showAgentColumn: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Agent')).toBeInTheDocument();
    await expect(canvas.getByText('agent_xyz78')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    sessions: [],
    workflowId: 'workflow_001',
    loading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session ID')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    sessions: [],
    workflowId: 'workflow_001',
    emptyMessage: 'No sessions found for this workflow',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No Sessions')).toBeInTheDocument();
    await expect(canvas.getByText('No sessions found for this workflow')).toBeInTheDocument();
  },
};

export const SingleSession: Story = {
  args: {
    sessions: [mockSessions[0]],
    workflowId: 'workflow_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('ACTIVE')).toBeInTheDocument();
  },
};

export const WithErrors: Story = {
  args: {
    sessions: mockSessions.filter(s => s.errors > 0),
    workflowId: 'workflow_001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show error rates
    await expect(canvas.getByText('6.7%')).toBeInTheDocument();
    await expect(canvas.getByText('25.0%')).toBeInTheDocument();
  },
};
