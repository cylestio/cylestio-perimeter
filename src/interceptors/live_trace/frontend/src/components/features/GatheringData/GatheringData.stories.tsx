import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { GatheringData } from './GatheringData';

const meta: Meta<typeof GatheringData> = {
  title: 'Features/GatheringData',
  component: GatheringData,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof GatheringData>;

export const Default: Story = {
  args: {
    currentSessions: 2,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Analyzing Agent Behavior')).toBeInTheDocument();
    await expect(canvas.getByText('2 / 5')).toBeInTheDocument();
    await expect(canvas.getByText('More sessions improve accuracy')).toBeInTheDocument();
  },
};

export const AlmostReady: Story = {
  args: {
    currentSessions: 4,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('4 / 5')).toBeInTheDocument();
  },
};

export const JustStarted: Story = {
  args: {
    currentSessions: 0,
    minSessionsRequired: 5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('0 / 5')).toBeInTheDocument();
  },
};

export const CustomContent: Story = {
  args: {
    currentSessions: 3,
    minSessionsRequired: 5,
    title: 'Building Behavioral Profile',
    description: 'Behavioral analysis requires session data to identify patterns and anomalies.',
    hint: 'Analysis improves with more data',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Building Behavioral Profile')).toBeInTheDocument();
    await expect(canvas.getByText('Analysis improves with more data')).toBeInTheDocument();
    await expect(canvas.getByText('3 / 5')).toBeInTheDocument();
  },
};
