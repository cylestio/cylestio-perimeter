import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import type { HealthSnapshot } from '@api/types/code';

import { HealthTrendChart } from './HealthTrendChart';

const meta: Meta<typeof HealthTrendChart> = {
  title: 'Domain/Metrics/HealthTrendChart',
  component: HealthTrendChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof HealthTrendChart>;

// Generate sample snapshots
const generateSnapshots = (
  count: number,
  startHealth: number,
  trend: 'up' | 'down' | 'stable'
): HealthSnapshot[] => {
  const snapshots: HealthSnapshot[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    let health: number;

    if (trend === 'up') {
      health = startHealth + progress * 20 + Math.random() * 5;
    } else if (trend === 'down') {
      health = startHealth - progress * 20 + Math.random() * 5;
    } else {
      health = startHealth + (Math.random() - 0.5) * 10;
    }

    health = Math.min(100, Math.max(0, health));

    snapshots.push({
      timestamp: new Date(now - (count - 1 - i) * dayMs).toISOString(),
      overall_health: Math.round(health),
      security_score: Math.round(health + 5),
      availability_score: Math.round(health - 10),
      reliability_score: Math.round(health + 2),
      efficiency_score: Math.round(health - 5),
      source: 'static',
    });
  }

  return snapshots;
};

export const Improving: Story = {
  args: {
    snapshots: generateSnapshots(10, 60, 'up'),
    periodDays: 30,
    trend: 'improving',
    delta: 15,
    showDimensions: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Health Trend')).toBeInTheDocument();
    await expect(canvas.getByText('Last 30 days')).toBeInTheDocument();
    await expect(canvas.getByText('+15%')).toBeInTheDocument();
  },
};

export const Declining: Story = {
  args: {
    snapshots: generateSnapshots(10, 80, 'down'),
    periodDays: 30,
    trend: 'declining',
    delta: -12,
    showDimensions: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Health Trend')).toBeInTheDocument();
    await expect(canvas.getByText('-12%')).toBeInTheDocument();
  },
};

export const Stable: Story = {
  args: {
    snapshots: generateSnapshots(10, 75, 'stable'),
    periodDays: 30,
    trend: 'stable',
    delta: 0,
    showDimensions: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Health Trend')).toBeInTheDocument();
    await expect(canvas.getByText('No change')).toBeInTheDocument();
  },
};

export const WithDimensions: Story = {
  args: {
    snapshots: generateSnapshots(10, 70, 'up'),
    periodDays: 30,
    trend: 'improving',
    delta: 10,
    showDimensions: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Health Trend')).toBeInTheDocument();
    // Legend items should be visible
    await expect(canvas.getByText('Overall')).toBeInTheDocument();
    await expect(canvas.getByText('Security')).toBeInTheDocument();
    await expect(canvas.getByText('Availability')).toBeInTheDocument();
    await expect(canvas.getByText('Reliability')).toBeInTheDocument();
    await expect(canvas.getByText('Efficiency')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    snapshots: [],
    periodDays: 30,
    trend: 'stable',
    delta: 0,
    showDimensions: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Health Trend')).toBeInTheDocument();
    await expect(canvas.getByText('No health history data available yet')).toBeInTheDocument();
  },
};

export const SingleDataPoint: Story = {
  args: {
    snapshots: [
      {
        timestamp: new Date().toISOString(),
        overall_health: 72,
        source: 'static' as const,
      },
    ],
    periodDays: 30,
    trend: 'stable',
    delta: 0,
    showDimensions: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Health Trend')).toBeInTheDocument();
  },
};
