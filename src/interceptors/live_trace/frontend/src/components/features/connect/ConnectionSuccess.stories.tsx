import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ConnectionSuccess } from './ConnectionSuccess';

const meta: Meta<typeof ConnectionSuccess> = {
  title: 'Features/Connect/ConnectionSuccess',
  component: ConnectionSuccess,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectionSuccess>;

export const SingleWorkflow: Story = {
  args: {
    workflowCount: 1,
    agentCount: 1,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection Successful')).toBeInTheDocument();
    await expect(canvas.getByText('Your workflow is now being monitored')).toBeInTheDocument();
    await expect(canvas.getByText('Workflow')).toBeInTheDocument();
    await expect(canvas.getByText('Agent')).toBeInTheDocument();
  },
};

export const MultipleWorkflows: Story = {
  args: {
    workflowCount: 3,
    agentCount: 5,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection Successful')).toBeInTheDocument();
    await expect(canvas.getByText('Your workflows are now being monitored')).toBeInTheDocument();
    await expect(canvas.getByText('3')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument();
    await expect(canvas.getByText('Workflows')).toBeInTheDocument();
    await expect(canvas.getByText('Agents')).toBeInTheDocument();
  },
};

export const ClickViewAgentWorkflows: Story = {
  args: {
    workflowCount: 2,
    agentCount: 3,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /view agent workflows/i });
    await userEvent.click(button);
    await expect(args.onViewAgentWorkflows).toHaveBeenCalled();
  },
};

export const HighCounts: Story = {
  args: {
    workflowCount: 12,
    agentCount: 42,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('12')).toBeInTheDocument();
    await expect(canvas.getByText('42')).toBeInTheDocument();
  },
};
