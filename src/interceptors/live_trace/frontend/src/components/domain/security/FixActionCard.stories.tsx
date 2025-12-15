import type { Meta, StoryObj } from '@storybook/react';
import { FixActionCard, FixActionInline } from './FixActionCard';

const meta: Meta<typeof FixActionCard> = {
  title: 'Domain/Security/FixActionCard',
  component: FixActionCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FixActionCard>;

export const Default: Story = {
  args: {
    recommendationId: 'REC-001',
    description: 'Sanitize user input before including in system prompt',
    connectedIde: 'cursor',
  },
};

export const WithCursorConnected: Story = {
  args: {
    recommendationId: 'REC-002',
    findingId: 'FND-002',
    connectedIde: 'cursor',
    description: 'Add input validation before shell command execution',
    recommendationUrl: '/recommendations/REC-002',
  },
};

export const WithClaudeCodeConnected: Story = {
  args: {
    recommendationId: 'REC-003',
    connectedIde: 'claude-code',
    description: 'Remove hardcoded API key and use environment variable',
  },
};

export const NoIdeConnected: Story = {
  args: {
    recommendationId: 'REC-004',
    connectedIde: null,
    description: 'Add path validation to prevent directory traversal',
  },
};

export const InlineVersion: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FixActionInline recommendationId="REC-001" />
      <FixActionInline recommendationId="REC-002" />
      <FixActionInline recommendationId="REC-003" />
    </div>
  ),
};

export const MultipleCards: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
      <FixActionCard
        recommendationId="REC-001"
        connectedIde="cursor"
        description="Critical: Fix prompt injection vulnerability"
      />
      <FixActionCard
        recommendationId="REC-002"
        connectedIde="cursor"
        description="High: Remove hardcoded credentials"
      />
      <FixActionCard
        recommendationId="REC-003"
        connectedIde="cursor"
        description="Medium: Add rate limiting to tool calls"
      />
    </div>
  ),
};
