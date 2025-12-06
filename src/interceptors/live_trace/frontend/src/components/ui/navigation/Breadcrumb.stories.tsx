import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Findings', href: '/findings' },
        { label: 'SQL Injection' },
      ]}
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(canvas.getByText('SQL Injection')).toBeInTheDocument();
  },
};

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Sessions', href: '/sessions' },
        { label: 'Session Details' },
      ]}
      separator={<ChevronRight size={12} />}
    />
  ),
};

export const Long: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'Agent Monitor', href: '/projects/agent-monitor' },
        { label: 'Sessions', href: '/projects/agent-monitor/sessions' },
        { label: 'Session #abc123' },
      ]}
    />
  ),
};
