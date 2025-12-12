import type { Meta, StoryObj } from '@storybook/react';

import { StaticAnalysis } from './StaticAnalysis';

const meta: Meta<typeof StaticAnalysis> = {
  title: 'Pages/StaticAnalysis',
  component: StaticAnalysis,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent/test-agent/static-analysis'],
      routePath: '/agent/:agentId/static-analysis',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaticAnalysis>;

// Default story - will show loading then empty state if no mock
export const Default: Story = {};
