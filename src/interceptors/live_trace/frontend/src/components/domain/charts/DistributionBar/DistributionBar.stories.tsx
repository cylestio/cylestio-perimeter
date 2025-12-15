import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { DistributionBar } from './DistributionBar';

const meta: Meta<typeof DistributionBar> = {
  title: 'Domain/Charts/DistributionBar',
  component: DistributionBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DistributionBar>;

export const TwoSegments: Story = {
  args: {
    segments: [
      { name: 'Input', value: 45000, color: 'cyan' },
      { name: 'Output', value: 15000, color: 'purple' },
    ],
    formatValue: (v) => `${(v / 1000).toFixed(1)}K`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Input')).toBeInTheDocument();
    await expect(canvas.getByText('Output')).toBeInTheDocument();
    await expect(canvas.getByText('45.0K')).toBeInTheDocument();
    await expect(canvas.getByText('15.0K')).toBeInTheDocument();
  },
};

export const MultipleSegments: Story = {
  args: {
    segments: [
      { name: 'claude-sonnet-4', value: 150, color: 'cyan' },
      { name: 'gpt-4o', value: 80, color: 'purple' },
      { name: 'claude-haiku', value: 45, color: 'green' },
      { name: 'gpt-4o-mini', value: 25, color: 'orange' },
    ],
    formatValue: (v) => `${v} requests`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('claude-sonnet-4')).toBeInTheDocument();
    await expect(canvas.getByText('gpt-4o')).toBeInTheDocument();
    await expect(canvas.getByText('claude-haiku')).toBeInTheDocument();
    await expect(canvas.getByText('gpt-4o-mini')).toBeInTheDocument();
  },
};

export const WithoutPercent: Story = {
  args: {
    segments: [
      { name: 'Success', value: 950, color: 'green' },
      { name: 'Failure', value: 50, color: 'red' },
    ],
    showPercent: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Success')).toBeInTheDocument();
    await expect(canvas.getByText('Failure')).toBeInTheDocument();
    await expect(canvas.getByText('950')).toBeInTheDocument();
    await expect(canvas.getByText('50')).toBeInTheDocument();
  },
};

export const SingleSegment: Story = {
  args: {
    segments: [{ name: 'Total', value: 1000, color: 'cyan' }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total')).toBeInTheDocument();
    await expect(canvas.getByText('(100.0%)')).toBeInTheDocument();
  },
};

export const CostDistribution: Story = {
  args: {
    segments: [
      { name: 'claude-sonnet-4', value: 12.5, color: 'orange' },
      { name: 'gpt-4o', value: 8.3, color: 'purple' },
      { name: 'claude-haiku', value: 2.1, color: 'cyan' },
    ],
    formatValue: (v) => `$${v.toFixed(2)}`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('$12.50')).toBeInTheDocument();
    await expect(canvas.getByText('$8.30')).toBeInTheDocument();
    await expect(canvas.getByText('$2.10')).toBeInTheDocument();
  },
};
