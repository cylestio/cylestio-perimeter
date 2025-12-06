import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Search, Shield, Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No results found')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <EmptyState
      icon={<Search />}
      title="No sessions yet"
      description="Run your agent through the proxy to see behavioral analysis."
    />
  ),
};

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={<Inbox />}
      title="No findings"
      description="Great news! No security issues were detected in your last scan."
      action={{
        label: 'Run New Scan',
        onClick: fn(),
        variant: 'primary',
      }}
    />
  ),
};

export const NoSessions: Story = {
  render: () => (
    <EmptyState
      icon={<Shield />}
      title="No active sessions"
      description="Start monitoring your AI agents by connecting them through the Cylestio proxy."
      action={{
        label: 'View Setup Guide',
        onClick: fn(),
        variant: 'secondary',
      }}
    />
  ),
};
