import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { AgentCard } from './AgentCard';

const meta: Meta<typeof AgentCard> = {
  title: 'Domain/Agents/AgentCard',
  component: AgentCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '340px' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    totalSessions: {
      control: { type: 'number', min: 0 },
    },
    totalErrors: {
      control: { type: 'number', min: 0 },
    },
    totalTools: {
      control: { type: 'number', min: 0 },
    },
    riskStatus: {
      control: { type: 'select' },
      options: ['ok', 'evaluating'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof AgentCard>;

export const OK: Story = {
  args: {
    id: 'prompt-f54b66477700',
    name: 'PromptAgent',
    initials: 'PA',
    totalSessions: 12,
    totalErrors: 0,
    totalTools: 55,
    lastSeen: '1d ago',
    riskStatus: 'ok',
    onClick: fn(),
  },
  play: async ({ canvas, args }) => {
    // Verify card renders
    const card = canvas.getByTestId('agent-card');
    await expect(card).toBeInTheDocument();

    // Verify agent name
    await expect(canvas.getByText('PromptAgent')).toBeInTheDocument();

    // Verify agent id
    await expect(canvas.getByText('prompt-f54b66477700')).toBeInTheDocument();

    // Verify risk status badge
    await expect(canvas.getByText('OK')).toBeInTheDocument();

    // Verify stats
    await expect(canvas.getByText('12')).toBeInTheDocument();
    await expect(canvas.getByText('0')).toBeInTheDocument();
    await expect(canvas.getByText('55')).toBeInTheDocument();

    // Verify last seen
    await expect(canvas.getByText('Last seen: 1d ago')).toBeInTheDocument();

    // Verify view button
    await expect(canvas.getByText('View →')).toBeInTheDocument();

    // Click the card
    card.click();
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Evaluating: Story = {
  args: {
    id: 'ant-math-agent-v7',
    name: 'MathAgent',
    initials: 'MA',
    totalSessions: 3,
    totalErrors: 0,
    totalTools: 12,
    lastSeen: '1d ago',
    riskStatus: 'evaluating',
    currentSessions: 3,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    // Verify card renders
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();

    // Verify evaluating badge
    await expect(canvas.getByText('Evaluating')).toBeInTheDocument();

    // Verify progress text
    await expect(canvas.getByText('3/5 sessions needed')).toBeInTheDocument();

    // Verify agent name
    await expect(canvas.getByText('MathAgent')).toBeInTheDocument();
  },
};

export const WithErrors: Story = {
  args: {
    id: 'prompt-a8b9ef35309f',
    name: 'CustomerAgent',
    initials: 'CA',
    totalSessions: 4,
    totalErrors: 3,
    totalTools: 26,
    lastSeen: '2h ago',
    riskStatus: 'evaluating',
    currentSessions: 4,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    // Verify card renders
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();

    // Verify error count (should be red)
    await expect(canvas.getByText('3')).toBeInTheDocument();
  },
};

export const ActionRequired: Story = {
  args: {
    id: 'prompt-critical-agent',
    name: 'CriticalAgent',
    initials: 'CR',
    totalSessions: 10,
    totalErrors: 5,
    totalTools: 30,
    lastSeen: '3d ago',
    riskStatus: 'ok',
    hasCriticalFinding: true,
  },
  play: async ({ canvas }) => {
    // Verify card renders
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();

    // Verify action required message
    await expect(canvas.getByText('⚠ Action required')).toBeInTheDocument();
  },
};
