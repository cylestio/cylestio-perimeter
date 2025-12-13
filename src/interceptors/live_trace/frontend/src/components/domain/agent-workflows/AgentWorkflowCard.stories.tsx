import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AgentWorkflowCard } from './AgentWorkflowCard';

const meta: Meta<typeof AgentWorkflowCard> = {
  title: 'Domain/AgentWorkflows/AgentWorkflowCard',
  component: AgentWorkflowCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentWorkflowCard>;

export const Default: Story = {
  args: {
    id: 'ecommerce-platform',
    name: 'E-Commerce Platform',
    agentCount: 5,
    sessionCount: 12,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('E-Commerce Platform')).toBeInTheDocument();
    await expect(canvas.getByText('ecommerce-platform')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument();
    await expect(canvas.getByText('12')).toBeInTheDocument();
  },
};

export const WithClick: Story = {
  args: {
    id: 'analytics-pipeline',
    name: 'Analytics Pipeline',
    agentCount: 3,
    sessionCount: 8,
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByTestId('agent-workflow-card');
    await userEvent.click(card);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const NoSessions: Story = {
  args: {
    id: 'new-agent-workflow',
    name: 'New Agent Workflow',
    agentCount: 2,
    sessionCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('New Agent Workflow')).toBeInTheDocument();
    await expect(canvas.getByText('0')).toBeInTheDocument();
  },
};

export const HighCounts: Story = {
  args: {
    id: 'production-system',
    name: 'Production System',
    agentCount: 42,
    sessionCount: 1284,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('42')).toBeInTheDocument();
    await expect(canvas.getByText('1284')).toBeInTheDocument();
  },
};

export const LongName: Story = {
  args: {
    id: 'very-long-agent-workflow-identifier-name',
    name: 'Very Long Agent Workflow Name That Might Overflow',
    agentCount: 7,
    sessionCount: 23,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Very Long Agent Workflow Name That Might Overflow')).toBeInTheDocument();
  },
};

export const Grid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, width: 620 }}>
      <AgentWorkflowCard
        id="ecommerce"
        name="E-Commerce Platform"
        agentCount={5}
        sessionCount={12}
      />
      <AgentWorkflowCard
        id="support"
        name="Customer Support"
        agentCount={3}
        sessionCount={45}
      />
      <AgentWorkflowCard
        id="analytics"
        name="Analytics Pipeline"
        agentCount={8}
        sessionCount={127}
      />
      <AgentWorkflowCard
        id="payment"
        name="Payment Gateway"
        agentCount={2}
        sessionCount={89}
      />
    </div>
  ),
  decorators: [(Story) => <Story />],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('E-Commerce Platform')).toBeInTheDocument();
    await expect(canvas.getByText('Customer Support')).toBeInTheDocument();
    await expect(canvas.getByText('Analytics Pipeline')).toBeInTheDocument();
    await expect(canvas.getByText('Payment Gateway')).toBeInTheDocument();
  },
};
