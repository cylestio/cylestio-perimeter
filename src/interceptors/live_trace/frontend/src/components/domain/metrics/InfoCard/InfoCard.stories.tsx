import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Badge } from '@ui/core/Badge';

import { InfoCard } from './InfoCard';

const meta: Meta<typeof InfoCard> = {
  title: 'Domain/Metrics/InfoCard',
  component: InfoCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof InfoCard>;

export const Default: Story = {
  args: {
    title: 'Session Info',
    primaryLabel: 'SESSION ID',
    primaryValue: 'abc123def456-gh78-ij90-klmn-opqr1234567890',
    stats: [
      { label: 'AGENT ID', value: 'agent-123' },
      { label: 'STATUS', badge: <Badge variant="success">ACTIVE</Badge> },
      { label: 'DURATION', value: '5.2 minutes' },
      { label: 'MESSAGES', value: '24' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Session Info')).toBeInTheDocument();
    await expect(canvas.getByText('SESSION ID')).toBeInTheDocument();
    await expect(canvas.getByText(/abc123def456/)).toBeInTheDocument();
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Agent Details',
    primaryLabel: 'AGENT ID',
    primaryValue: 'customer-support-agent-v2',
    stats: [
      { label: 'SESSIONS', value: '156' },
      { label: 'STATUS', badge: <Badge variant="medium">EVALUATING</Badge> },
    ],
    badge: <Badge variant="critical">ATTENTION REQUIRED</Badge>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Agent Details')).toBeInTheDocument();
    await expect(canvas.getByText('ATTENTION REQUIRED')).toBeInTheDocument();
  },
};

export const MinimalStats: Story = {
  args: {
    title: 'Quick Info',
    primaryLabel: 'ID',
    primaryValue: 'event-12345',
    stats: [
      { label: 'TYPE', value: 'llm.call.start' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Quick Info')).toBeInTheDocument();
    await expect(canvas.getByText('llm.call.start')).toBeInTheDocument();
  },
};

export const NoStats: Story = {
  args: {
    title: 'Simple Card',
    primaryLabel: 'VALUE',
    primaryValue: 'This is just a simple value display without stats',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Simple Card')).toBeInTheDocument();
    await expect(canvas.getByText('VALUE')).toBeInTheDocument();
  },
};
