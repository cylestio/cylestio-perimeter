import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { WorkflowCard } from './WorkflowCard';

const meta: Meta<typeof WorkflowCard> = {
  title: 'Domain/Workflows/WorkflowCard',
  component: WorkflowCard,
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
type Story = StoryObj<typeof WorkflowCard>;

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
    const card = canvas.getByTestId('workflow-card');
    await userEvent.click(card);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const NoSessions: Story = {
  args: {
    id: 'new-workflow',
    name: 'New Workflow',
    agentCount: 2,
    sessionCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('New Workflow')).toBeInTheDocument();
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
    id: 'very-long-workflow-identifier-name',
    name: 'Very Long Workflow Name That Might Overflow',
    agentCount: 7,
    sessionCount: 23,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Very Long Workflow Name That Might Overflow')).toBeInTheDocument();
  },
};

export const Grid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, width: 620 }}>
      <WorkflowCard
        id="ecommerce"
        name="E-Commerce Platform"
        agentCount={5}
        sessionCount={12}
      />
      <WorkflowCard
        id="support"
        name="Customer Support"
        agentCount={3}
        sessionCount={45}
      />
      <WorkflowCard
        id="analytics"
        name="Analytics Pipeline"
        agentCount={8}
        sessionCount={127}
      />
      <WorkflowCard
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
