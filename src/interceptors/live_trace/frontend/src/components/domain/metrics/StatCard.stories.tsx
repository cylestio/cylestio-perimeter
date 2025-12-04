import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AlertTriangle, Shield, Activity, Zap } from 'lucide-react';
import styled from 'styled-components';
import { StatCard } from './StatCard';

const Row = styled.div<{ $gap?: number }>`
  display: flex;
  gap: ${({ $gap = 16 }) => $gap}px;
  flex-wrap: wrap;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

const meta: Meta<typeof StatCard> = {
  title: 'Domain/Metrics/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  argTypes: {
    iconColor: {
      control: 'select',
      options: ['cyan', 'green', 'orange', 'red', 'purple'],
    },
    valueColor: {
      control: 'select',
      options: ['cyan', 'green', 'orange', 'red', 'purple'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    icon: <Activity />,
    label: 'Events',
    value: 1234,
    detail: 'Today',
  },
};

export const ColorVariants: Story = {
  render: () => (
    <Row $gap={16}>
      <StatCard
        icon={<AlertTriangle />}
        iconColor="orange"
        label="Risk Score"
        value={52}
        valueColor="orange"
        detail="Medium · ↑3 this week"
      />
      <StatCard
        icon={<Shield />}
        iconColor="red"
        label="Critical Findings"
        value={8}
        valueColor="red"
        detail="Requires attention"
      />
      <StatCard
        icon={<Activity />}
        iconColor="green"
        label="Healthy Sessions"
        value={42}
        valueColor="green"
        detail="Last 24 hours"
      />
      <StatCard
        icon={<Zap />}
        iconColor="purple"
        label="AI Detections"
        value={156}
        valueColor="purple"
        detail="Automated"
      />
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Risk Score')).toBeInTheDocument();
    await expect(canvas.getByText('52')).toBeInTheDocument();
    await expect(canvas.getByText('Critical Findings')).toBeInTheDocument();
  },
};

export const GridLayout: Story = {
  render: () => (
    <StatGrid>
      <StatCard
        icon={<AlertTriangle />}
        iconColor="orange"
        label="Risk Score"
        value={52}
        valueColor="orange"
        detail="Medium · ↑3 this week"
      />
      <StatCard
        icon={<Shield />}
        iconColor="red"
        label="Critical"
        value={8}
        valueColor="red"
        detail="Requires attention"
      />
      <StatCard
        icon={<Activity />}
        iconColor="green"
        label="Sessions"
        value={42}
        valueColor="green"
        detail="Active"
      />
      <StatCard
        icon={<Zap />}
        iconColor="cyan"
        label="Events"
        value="1.2K"
        valueColor="cyan"
        detail="Today"
      />
    </StatGrid>
  ),
};

export const WithoutColor: Story = {
  render: () => (
    <Row>
      <StatCard icon={<Activity />} label="Events" value={1234} detail="No color specified" />
    </Row>
  ),
};

export const Compact: Story = {
  args: {
    icon: <Activity />,
    iconColor: 'cyan',
    label: 'Total Agents',
    value: 24,
    detail: '5 active sessions',
    size: 'sm',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total Agents')).toBeInTheDocument();
    await expect(canvas.getByText('24')).toBeInTheDocument();
  },
};

export const CompactGrid: Story = {
  render: () => (
    <StatGrid>
      <StatCard
        icon={<AlertTriangle />}
        iconColor="cyan"
        label="Total Agents"
        value={24}
        detail="5 active sessions"
        size="sm"
      />
      <StatCard
        icon={<Shield />}
        iconColor="red"
        label="Total Errors"
        value={8}
        valueColor="red"
        detail="Across all agents"
        size="sm"
      />
      <StatCard
        icon={<Activity />}
        iconColor="green"
        label="OK Status"
        value={18}
        valueColor="green"
        detail="Evaluated agents"
        size="sm"
      />
      <StatCard
        icon={<Zap />}
        iconColor="purple"
        label="Total Sessions"
        value="1.2K"
        valueColor="purple"
        detail="All time"
        size="sm"
      />
    </StatGrid>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total Agents')).toBeInTheDocument();
    await expect(canvas.getByText('Total Errors')).toBeInTheDocument();
    await expect(canvas.getByText('OK Status')).toBeInTheDocument();
    await expect(canvas.getByText('Total Sessions')).toBeInTheDocument();
  },
};

export const SizeComparison: Story = {
  render: () => (
    <Row $gap={24}>
      <div>
        <h4 style={{ color: 'white', marginBottom: 12 }}>Default (md)</h4>
        <StatCard
          icon={<Activity />}
          iconColor="cyan"
          label="Total Agents"
          value={24}
          detail="5 active sessions"
        />
      </div>
      <div>
        <h4 style={{ color: 'white', marginBottom: 12 }}>Compact (sm)</h4>
        <StatCard
          icon={<Activity />}
          iconColor="cyan"
          label="Total Agents"
          value={24}
          detail="5 active sessions"
          size="sm"
        />
      </div>
    </Row>
  ),
  play: async ({ canvas }) => {
    const labels = canvas.getAllByText('Total Agents');
    await expect(labels).toHaveLength(2);
  },
};
