import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Zap, Clock, CheckCircle, AlertTriangle, Coins, TrendingUp, Layers, XCircle } from 'lucide-react';

import { StatsBar } from './StatsBar';

const meta: Meta<typeof StatsBar> = {
  title: 'UI/DataDisplay/StatsBar',
  component: StatsBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatsBar>;

export const Default: Story = {
  args: {
    stats: [
      { icon: <Zap size={18} />, value: '1,234', label: 'Total Executions', iconColor: 'cyan' },
      { icon: <Clock size={18} />, value: '150ms', label: 'Avg Duration', iconColor: 'orange' },
      { icon: <CheckCircle size={18} />, value: '98.5%', label: 'Success Rate', iconColor: 'green' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total Executions')).toBeInTheDocument();
    await expect(canvas.getByText('1,234')).toBeInTheDocument();
    await expect(canvas.getByText('Avg Duration')).toBeInTheDocument();
    await expect(canvas.getByText('Success Rate')).toBeInTheDocument();
  },
};

export const WithDividers: Story = {
  args: {
    stats: [
      { icon: <Coins size={18} />, value: '45.2K', label: 'Total Tokens', iconColor: 'cyan' },
      { icon: <TrendingUp size={18} />, value: '$12.50', label: 'Total Cost', iconColor: 'orange', valueColor: 'orange' },
      'divider',
      { icon: <Layers size={18} />, value: '3', label: 'Models Used', iconColor: 'purple', valueColor: 'purple' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total Tokens')).toBeInTheDocument();
    await expect(canvas.getByText('Total Cost')).toBeInTheDocument();
    await expect(canvas.getByText('Models Used')).toBeInTheDocument();
  },
};

export const AllColors: Story = {
  args: {
    stats: [
      { icon: <Zap size={18} />, value: 'Cyan', label: 'Default Color', iconColor: 'cyan', valueColor: 'cyan' },
      { icon: <CheckCircle size={18} />, value: 'Green', label: 'Success Color', iconColor: 'green', valueColor: 'green' },
      { icon: <Clock size={18} />, value: 'Orange', label: 'Warning Color', iconColor: 'orange', valueColor: 'orange' },
      { icon: <XCircle size={18} />, value: 'Red', label: 'Error Color', iconColor: 'red', valueColor: 'red' },
      { icon: <Layers size={18} />, value: 'Purple', label: 'Info Color', iconColor: 'purple', valueColor: 'purple' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Cyan')).toBeInTheDocument();
    await expect(canvas.getByText('Green')).toBeInTheDocument();
    await expect(canvas.getByText('Orange')).toBeInTheDocument();
    await expect(canvas.getByText('Red')).toBeInTheDocument();
    await expect(canvas.getByText('Purple')).toBeInTheDocument();
  },
};

export const WithMultipleGroups: Story = {
  args: {
    stats: [
      { icon: <Zap size={18} />, value: '500', label: 'Tool Utilization', iconColor: 'green', valueColor: 'green' },
      { icon: <XCircle size={18} />, value: '3', label: 'Unused Tools', iconColor: 'red', valueColor: 'red' },
      'divider',
      { icon: <Clock size={18} />, value: '1,234', label: 'Total Executions', iconColor: 'cyan' },
      { icon: <AlertTriangle size={18} />, value: '250ms', label: 'Avg Duration', iconColor: 'orange', valueColor: 'orange' },
      'divider',
      { icon: <CheckCircle size={18} />, value: '95.2%', label: 'Avg Success Rate', iconColor: 'green', valueColor: 'green' },
      { icon: <AlertTriangle size={18} />, value: '12', label: 'Total Failures', iconColor: 'red', valueColor: 'red' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tool Utilization')).toBeInTheDocument();
    await expect(canvas.getByText('Unused Tools')).toBeInTheDocument();
    await expect(canvas.getByText('Total Executions')).toBeInTheDocument();
    await expect(canvas.getByText('Avg Success Rate')).toBeInTheDocument();
  },
};

export const SingleStat: Story = {
  args: {
    stats: [
      { icon: <Coins size={18} />, value: '1.2M', label: 'Total Tokens', iconColor: 'cyan' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Total Tokens')).toBeInTheDocument();
    await expect(canvas.getByText('1.2M')).toBeInTheDocument();
  },
};
