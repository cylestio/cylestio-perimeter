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

export const SingleAgent: Story = {
  args: {
    agentCount: 1,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection Successful')).toBeInTheDocument();
    await expect(canvas.getByText('Your agent is now being monitored')).toBeInTheDocument();
    await expect(canvas.getByText('1')).toBeInTheDocument();
    await expect(canvas.getByText('Agent')).toBeInTheDocument();
  },
};

export const MultipleAgents: Story = {
  args: {
    agentCount: 5,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection Successful')).toBeInTheDocument();
    await expect(canvas.getByText('Your agents are now being monitored')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument();
    await expect(canvas.getByText('Agents')).toBeInTheDocument();
  },
};

export const ClickViewAgentWorkflows: Story = {
  args: {
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

export const HighAgentCount: Story = {
  args: {
    agentCount: 42,
    onViewAgentWorkflows: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('42')).toBeInTheDocument();
  },
};
