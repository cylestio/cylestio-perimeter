import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { Plus, Download, Settings } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Button } from '@ui/core/Button';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
    description: 'Overview of agent security monitoring and findings',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(
      canvas.getByText('Overview of agent security monitoring and findings')
    ).toBeInTheDocument();
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Settings',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Settings')).toBeInTheDocument();
  },
};

export const WithSingleAction: Story = {
  args: {
    title: 'Findings',
    description: 'Security vulnerabilities and issues detected by agents',
    actions: (
      <Button icon={<Plus size={16} />}>New Scan</Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Findings')).toBeInTheDocument();
    await expect(canvas.getByText('New Scan')).toBeInTheDocument();
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: 'Reports',
    description: 'Generate and download compliance reports',
    actions: (
      <>
        <Button variant="secondary" icon={<Settings size={16} />}>
          Configure
        </Button>
        <Button icon={<Download size={16} />}>Export</Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Reports')).toBeInTheDocument();
    await expect(canvas.getByText('Configure')).toBeInTheDocument();
    await expect(canvas.getByText('Export')).toBeInTheDocument();
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Security Vulnerability Assessment Dashboard',
    description:
      'Comprehensive overview of all security vulnerabilities, compliance status, and remediation progress across your infrastructure',
    actions: <Button>Action</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Security Vulnerability Assessment Dashboard')
    ).toBeInTheDocument();
  },
};
