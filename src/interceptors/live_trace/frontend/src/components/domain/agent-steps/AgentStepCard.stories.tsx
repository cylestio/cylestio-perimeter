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
    stability: {
      control: { type: 'number', min: 0, max: 100 },
    },
    predictability: {
      control: { type: 'number', min: 0, max: 100 },
    },
    confidence: {
      control: { type: 'select' },
      options: ['high', 'medium', 'low'],
    },
    failedChecks: {
      control: { type: 'number', min: 0 },
    },
    warnings: {
      control: { type: 'number', min: 0 },
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
    stability: 85,
    predictability: 92,
    confidence: 'high',
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

    // Verify behavioral metrics
    await expect(canvas.getByText('Stability')).toBeInTheDocument();
    await expect(canvas.getByText('85%')).toBeInTheDocument();
    await expect(canvas.getByText('Predictability')).toBeInTheDocument();
    await expect(canvas.getByText('92%')).toBeInTheDocument();
    await expect(canvas.getByText('Confidence')).toBeInTheDocument();
    await expect(canvas.getByText('high')).toBeInTheDocument();

    // Verify stats
    await expect(canvas.getByText('12')).toBeInTheDocument();
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
    stability: 45,
    predictability: 38,
    confidence: 'low',
    failedChecks: 3,
    warnings: 5,
  },
  play: async ({ canvas }) => {
    // Verify card renders
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();

    // Verify action required message (no emoji prefix in component)
    await expect(canvas.getByText('Action required')).toBeInTheDocument();

    // Verify low confidence badge
    await expect(canvas.getByText('low')).toBeInTheDocument();

    // Verify warnings display (no emoji prefix in component)
    await expect(canvas.getByText('3 failed checks')).toBeInTheDocument();
    await expect(canvas.getByText('5 warnings')).toBeInTheDocument();
  },
};

export const MediumConfidence: Story = {
  args: {
    id: 'analysis-agent-v2',
    name: 'AnalysisAgent',
    initials: 'AA',
    totalSessions: 8,
    totalErrors: 1,
    totalTools: 22,
    lastSeen: '5h ago',
    riskStatus: 'ok',
    stability: 72,
    predictability: 68,
    confidence: 'medium',
    warnings: 2,
  },
  play: async ({ canvas }) => {
    // Verify card renders
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();

    // Verify medium confidence badge
    await expect(canvas.getByText('medium')).toBeInTheDocument();

    // Verify behavioral metrics
    await expect(canvas.getByText('72%')).toBeInTheDocument();
    await expect(canvas.getByText('68%')).toBeInTheDocument();

    // Verify warnings (no emoji prefix in component)
    await expect(canvas.getByText('2 warnings')).toBeInTheDocument();
  },
};

export const OKWithoutBehavioral: Story = {
  args: {
    id: 'new-agent-001',
    name: 'NewAgent',
    initials: 'NA',
    totalSessions: 6,
    totalErrors: 0,
    totalTools: 15,
    lastSeen: '30m ago',
    riskStatus: 'ok',
    // No behavioral metrics - section should not render
  },
  play: async ({ canvas }) => {
    // Verify card renders
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();

    // Verify OK badge
    await expect(canvas.getByText('OK')).toBeInTheDocument();

    // Verify behavioral section is NOT present
    const stabilityLabel = canvas.queryByText('Stability');
    await expect(stabilityLabel).not.toBeInTheDocument();
  },
};

// Lifecycle Stage Stories - demonstrate different agent states
export const LifecycleDev: Story = {
  args: {
    id: 'dev-agent-001',
    name: 'DevAgent',
    totalSessions: 0,
    totalErrors: 0,
    totalTools: 5,
    lastSeen: '1h ago',
    riskStatus: 'evaluating',
    currentSessions: 0,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();
    // Verify evaluating state with 0 sessions
    await expect(canvas.getByText('Evaluating')).toBeInTheDocument();
    await expect(canvas.getByText('0/5 sessions needed')).toBeInTheDocument();
  },
};

export const LifecycleStatic: Story = {
  args: {
    id: 'static-agent-001',
    name: 'StaticAgent',
    totalSessions: 5,
    totalErrors: 0,
    totalTools: 20,
    lastSeen: '30m ago',
    riskStatus: 'evaluating',
    currentSessions: 5,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();
    // Verify evaluating state at threshold
    await expect(canvas.getByText('Evaluating')).toBeInTheDocument();
    await expect(canvas.getByText('5/5 sessions needed')).toBeInTheDocument();
  },
};

export const LifecycleDynamic: Story = {
  args: {
    id: 'dynamic-agent-001',
    name: 'DynamicAgent',
    totalSessions: 15,
    totalErrors: 0,
    totalTools: 45,
    lastSeen: '2h ago',
    riskStatus: 'ok',
    stability: 88,
    predictability: 90,
    confidence: 'high',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('agent-card')).toBeInTheDocument();
    // Verify OK state with behavioral metrics
    await expect(canvas.getByText('OK')).toBeInTheDocument();
    await expect(canvas.getByText('88%')).toBeInTheDocument();
    await expect(canvas.getByText('90%')).toBeInTheDocument();
    await expect(canvas.getByText('high')).toBeInTheDocument();
  },
};
