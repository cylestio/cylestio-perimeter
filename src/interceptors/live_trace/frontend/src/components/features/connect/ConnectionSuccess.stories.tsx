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
    onViewAgents: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection Successful')).toBeInTheDocument();
    await expect(canvas.getByText('Your system prompt is now being monitored')).toBeInTheDocument();
    await expect(canvas.getByText('1')).toBeInTheDocument();
    await expect(canvas.getByText('System prompt')).toBeInTheDocument();
  },
};

export const MultipleAgents: Story = {
  args: {
    agentCount: 5,
    onViewAgents: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Connection Successful')).toBeInTheDocument();
    await expect(canvas.getByText('Your system prompts are now being monitored')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument();
    await expect(canvas.getByText('System prompts')).toBeInTheDocument();
  },
};

export const ClickViewAgents: Story = {
  args: {
    agentCount: 3,
    onViewAgents: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /view agents/i });
    await userEvent.click(button);
    await expect(args.onViewAgents).toHaveBeenCalled();
  },
};

export const HighAgentCount: Story = {
  args: {
    agentCount: 42,
    onViewAgents: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('42')).toBeInTheDocument();
  },
};
