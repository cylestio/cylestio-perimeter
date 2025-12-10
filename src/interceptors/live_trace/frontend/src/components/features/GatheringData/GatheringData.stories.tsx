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
