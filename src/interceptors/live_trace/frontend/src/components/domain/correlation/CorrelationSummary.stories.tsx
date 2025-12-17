import type { Meta, StoryObj } from '@storybook/react-vite';

import { CorrelationSummary } from './CorrelationSummary';

const meta: Meta<typeof CorrelationSummary> = {
  title: 'Domain/Correlation/CorrelationSummary',
  component: CorrelationSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CorrelationSummary>;

export const NoCorrelation: Story = {
  args: {
    validated: 0,
    unexercised: 0,
    theoretical: 0,
    uncorrelated: 0,
    sessionsCount: 0,
  },
};

export const AllValidated: Story = {
  args: {
    validated: 5,
    unexercised: 0,
    theoretical: 0,
    uncorrelated: 0,
    sessionsCount: 12,
  },
};

export const MixedStates: Story = {
  args: {
    validated: 3,
    unexercised: 2,
    theoretical: 4,
    uncorrelated: 5,
    sessionsCount: 8,
  },
};

export const WithUncorrelated: Story = {
  args: {
    validated: 2,
    unexercised: 1,
    theoretical: 3,
    uncorrelated: 10,
    sessionsCount: 5,
  },
};

export const SingleSession: Story = {
  args: {
    validated: 1,
    unexercised: 0,
    theoretical: 2,
    uncorrelated: 3,
    sessionsCount: 1,
  },
};
