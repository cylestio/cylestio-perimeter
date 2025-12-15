import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import type { AnalysisSession } from '@api/types/findings';

import { AnalysisSessionsTable } from './AnalysisSessionsTable';

// Mock data with ISO date strings (matching API format)
const mockSessions: AnalysisSession[] = [
  {
    session_id: 'analysis_ant-math-agent-v8_20251211_085832',
    agent_workflow_id: 'agent-workflow-001',
    agent_workflow_name: 'math-agent-workflow',
    session_type: 'DYNAMIC',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    completed_at: new Date(Date.now() - 3540000).toISOString(), // 59 min ago (1min duration)
    findings_count: 13,
  },
  {
    session_id: 'analysis_ant-assistant-v2_20251211_085500',
    agent_workflow_id: 'agent-workflow-001',
    agent_workflow_name: 'math-agent-workflow',
    agent_id: 'agent_xyz789',
    session_type: 'DYNAMIC',
    status: 'IN_PROGRESS',
    created_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    findings_count: 5,
  },
  {
    session_id: 'analysis_ant-code-agent_20251211_080000',
    agent_workflow_id: 'agent-workflow-001',
    agent_workflow_name: 'math-agent-workflow',
    session_type: 'STATIC',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    completed_at: new Date(Date.now() - 7140000).toISOString(), // 1min duration
    findings_count: 8,
  },
  {
    session_id: 'analysis_ant-longname-agent-with-extra-chars_20251210_120000',
    agent_workflow_id: 'agent-workflow-001',
    session_type: 'DYNAMIC',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    completed_at: new Date(Date.now() - 86100000).toISOString(), // 5min duration
    findings_count: 22,
  },
  {
    session_id: 'analysis_no-agent-field_20251209_100000',
    agent_workflow_id: 'agent-workflow-001',
    session_type: 'DYNAMIC',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    completed_at: new Date(Date.now() - 172680000).toISOString(), // 2min duration
    findings_count: 10,
  },
  {
    session_id: 'analysis_ant-fifth-agent_20251208_090000',
    agent_workflow_id: 'agent-workflow-001',
    session_type: 'DYNAMIC',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    completed_at: new Date(Date.now() - 259080000).toISOString(),
    findings_count: 7,
  },
];

const meta: Meta<typeof AnalysisSessionsTable> = {
  title: 'Domain/Analysis/AnalysisSessionsTable',
  component: AnalysisSessionsTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: 'var(--color-surface)', minWidth: 900 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AnalysisSessionsTable>;

export const Default: Story = {
  args: {
    sessions: mockSessions,
    agentWorkflowId: 'agent-workflow-001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session ID')).toBeInTheDocument();
    await expect(canvas.getByText('analysis_ant-math-agent-v8_20251211_085832')).toBeInTheDocument();
    // Multiple sessions have DYNAMIC type
    const dynamicBadges = canvas.getAllByText('DYNAMIC');
    await expect(dynamicBadges.length).toBeGreaterThan(0);
  },
};

export const WithMaxRows: Story = {
  args: {
    sessions: mockSessions,
    agentWorkflowId: 'agent-workflow-001',
    maxRows: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show first 3 sessions
    await expect(canvas.getByText('analysis_ant-math-agent-v8_20251211_085832')).toBeInTheDocument();
    await expect(canvas.getByText('analysis_ant-assistant-v2_20251211_085500')).toBeInTheDocument();
    await expect(canvas.getByText('analysis_ant-code-agent_20251211_080000')).toBeInTheDocument();
    // Should NOT show 4th session
    expect(canvas.queryByText('analysis_ant-longname-agent-with-extra-chars_20251210_120000')).not.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    sessions: [],
    agentWorkflowId: 'agent-workflow-001',
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
    agentWorkflowId: 'agent-workflow-001',
    emptyMessage: 'No analysis sessions yet.',
    emptyDescription: 'Run an analysis to see results here.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No analysis sessions yet.')).toBeInTheDocument();
    await expect(canvas.getByText('Run an analysis to see results here.')).toBeInTheDocument();
  },
};

export const SingleSession: Story = {
  args: {
    sessions: [mockSessions[0]],
    agentWorkflowId: 'agent-workflow-001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Completed')).toBeInTheDocument();
    // Agent extracted from session_id: ant-math-agent-v8
    await expect(canvas.getByText('ant-math-agent-v8')).toBeInTheDocument();
  },
};

export const InProgressSession: Story = {
  args: {
    sessions: [mockSessions[1]],
    agentWorkflowId: 'agent-workflow-001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('In Progress')).toBeInTheDocument();
  },
};

export const AgentExtractedFromSessionId: Story = {
  args: {
    sessions: [mockSessions[0]], // Session without explicit agent_id, but has session_id
    agentWorkflowId: 'agent-workflow-001',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Agent should be extracted from session_id: analysis_ant-math-agent-v8_20251211_085832 -> ant-math-agent-v8
    await expect(canvas.getByText('ant-math-agent-v8')).toBeInTheDocument();
  },
};

export const DynamicAnalysisOnly: Story = {
  args: {
    sessions: mockSessions.filter(s => s.session_type === 'DYNAMIC'),
    agentWorkflowId: 'agent-workflow-001',
    maxRows: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // All shown sessions should be DYNAMIC
    const dynamicBadges = canvas.getAllByText('DYNAMIC');
    await expect(dynamicBadges.length).toBeGreaterThan(0);
    // Should not show STATIC
    expect(canvas.queryByText('STATIC')).not.toBeInTheDocument();
  },
};
