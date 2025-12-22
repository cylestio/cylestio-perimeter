import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { AgentHealthRing } from './AgentHealthRing';

const meta: Meta<typeof AgentHealthRing> = {
  title: 'Domain/Metrics/AgentHealthRing',
  component: AgentHealthRing,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof AgentHealthRing>;

const defaultDimensions = {
  security: 92,
  availability: 50,
  reliability: 75,
  efficiency: 85,
};

const defaultIssueCounts = {
  security: 1,
  availability: 3,
  reliability: 2,
  efficiency: 1,
};

export const Healthy: Story = {
  args: {
    health: 85,
    dimensions: { security: 95, availability: 80, reliability: 85, efficiency: 90 },
    issueCounts: { security: 0, availability: 1, reliability: 1, efficiency: 0 },
    trend: 'improving',
    trendDelta: 5,
    onViewCodeIssues: fn(),
    onViewSecurityIssues: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('agent-health-ring')).toBeInTheDocument();
    await expect(canvas.getByText('Agent Health Score')).toBeInTheDocument();
    await expect(canvas.getByText(/\+5%\s*from last scan/)).toBeInTheDocument();
  },
};

export const NeedsAttention: Story = {
  args: {
    health: 65,
    dimensions: defaultDimensions,
    issueCounts: defaultIssueCounts,
    trend: 'stable',
    trendDelta: 0,
    suggestion: {
      dimension: 'availability',
      potentialGain: 15,
      action: 'Add retry logic to API client',
    },
    onViewCodeIssues: fn(),
    onViewSecurityIssues: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('agent-health-ring')).toBeInTheDocument();
    await expect(canvas.getByText('Add retry logic to API client')).toBeInTheDocument();
    await expect(canvas.getByText(/\+15%\s*health improvement/)).toBeInTheDocument();
  },
};

export const Critical: Story = {
  args: {
    health: 35,
    dimensions: { security: 40, availability: 30, reliability: 35, efficiency: 45 },
    issueCounts: { security: 5, availability: 4, reliability: 3, efficiency: 2 },
    trend: 'declining',
    trendDelta: -10,
    onViewCodeIssues: fn(),
    onViewSecurityIssues: fn(),
  },
  play: async ({ canvas }) => {
    // Main health score in center ring
    await expect(canvas.getByTestId('agent-health-ring')).toBeInTheDocument();
    await expect(canvas.getByText(/-10%\s*from last scan/)).toBeInTheDocument();
  },
};

export const WithDimensionBreakdown: Story = {
  args: {
    health: 72,
    dimensions: defaultDimensions,
    issueCounts: defaultIssueCounts,
    trend: 'improving',
    trendDelta: 3,
    onViewCodeIssues: fn(),
    onViewSecurityIssues: fn(),
  },
  play: async ({ canvas }) => {
    // Check dimension cards render
    await expect(canvas.getByText('Security')).toBeInTheDocument();
    await expect(canvas.getByText('Availability')).toBeInTheDocument();
    await expect(canvas.getByText('Reliability')).toBeInTheDocument();
    await expect(canvas.getByText('Efficiency')).toBeInTheDocument();

    // Check issue counts display (unique values only to avoid getAllByText)
    await expect(canvas.getByText('3 issues')).toBeInTheDocument(); // availability
    await expect(canvas.getByText('2 issues')).toBeInTheDocument(); // reliability
  },
};

export const Interactive: Story = {
  args: {
    health: 72,
    dimensions: defaultDimensions,
    issueCounts: defaultIssueCounts,
    trend: 'stable',
    onViewCodeIssues: fn(),
    onViewSecurityIssues: fn(),
  },
  play: async ({ canvas, args }) => {
    // Click code issues button
    const codeButton = canvas.getByText('View Code Issues');
    await userEvent.click(codeButton);
    await expect(args.onViewCodeIssues).toHaveBeenCalled();

    // Click security issues button
    const securityButton = canvas.getByText('View Security Issues');
    await userEvent.click(securityButton);
    await expect(args.onViewSecurityIssues).toHaveBeenCalled();
  },
};
