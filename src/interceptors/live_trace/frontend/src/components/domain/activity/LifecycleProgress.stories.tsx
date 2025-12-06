import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Wrench, Code, Activity, FileText } from 'lucide-react';
import { LifecycleProgress } from './LifecycleProgress';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
`;

const meta: Meta<typeof LifecycleProgress> = {
  title: 'Domain/Activity/LifecycleProgress',
  component: LifecycleProgress,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LifecycleProgress>;

export const Default: Story = {
  args: {
    stages: [
      { id: 'autofix', label: 'Auto-Fix', icon: <Wrench size={16} />, status: 'completed', stat: '15 fixed' },
      { id: 'static', label: 'Static', icon: <Code size={16} />, status: 'completed', stat: '5 issues' },
      { id: 'dynamic', label: 'Dynamic', icon: <Activity size={16} />, status: 'active', stat: '2 confirmed' },
      { id: 'report', label: 'Report', icon: <FileText size={16} />, status: 'pending', stat: 'Ready' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Auto-Fix')).toBeInTheDocument();
    await expect(canvas.getByText('15 fixed')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic')).toBeInTheDocument();
  },
};

export const AllCompleted: Story = {
  args: {
    stages: [
      { id: 'autofix', label: 'Auto-Fix', icon: <Wrench size={16} />, status: 'completed', stat: '15 fixed' },
      { id: 'static', label: 'Static', icon: <Code size={16} />, status: 'completed', stat: '5 issues' },
      { id: 'dynamic', label: 'Dynamic', icon: <Activity size={16} />, status: 'completed', stat: '2 confirmed' },
      { id: 'report', label: 'Report', icon: <FileText size={16} />, status: 'completed', stat: 'Generated' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Generated')).toBeInTheDocument();
  },
};

export const JustStarted: Story = {
  args: {
    stages: [
      { id: 'autofix', label: 'Auto-Fix', icon: <Wrench size={16} />, status: 'active', stat: 'Running...' },
      { id: 'static', label: 'Static', icon: <Code size={16} />, status: 'pending' },
      { id: 'dynamic', label: 'Dynamic', icon: <Activity size={16} />, status: 'pending' },
      { id: 'report', label: 'Report', icon: <FileText size={16} />, status: 'pending' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Running...')).toBeInTheDocument();
  },
};
