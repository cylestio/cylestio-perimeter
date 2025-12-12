import type { Meta, StoryObj } from '@storybook/react';

import { FixActionCard } from './FixActionCard';

const meta: Meta<typeof FixActionCard> = {
  title: 'Domain/Security/FixActionCard',
  component: FixActionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FixActionCard>;

export const Default: Story = {
  args: {
    recommendationId: 'REC-001',
  },
};

export const WithCursor: Story = {
  args: {
    recommendationId: 'REC-002',
    connectedIde: 'cursor',
  },
};

export const WithClaudeCode: Story = {
  args: {
    recommendationId: 'REC-003',
    connectedIde: 'claude-code',
  },
};

export const CustomCommand: Story = {
  args: {
    recommendationId: 'REC-004',
    customCommand: 'Audit and fix the prompt injection vulnerability in src/agent.py line 42',
    connectedIde: 'cursor',
  },
};
