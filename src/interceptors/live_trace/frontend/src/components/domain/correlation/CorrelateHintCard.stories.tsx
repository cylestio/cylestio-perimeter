import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { CorrelateHintCard } from './CorrelateHintCard';

const meta: Meta<typeof CorrelateHintCard> = {
  title: 'Domain/Correlation/CorrelateHintCard',
  component: CorrelateHintCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CorrelateHintCard>;

export const Default: Story = {
  args: {
    staticFindingsCount: 5,
    dynamicSessionsCount: 3,
    connectedIde: 'cursor',
  },
  play: async ({ canvas }) => {
    // Verify copy button exists and is clickable
    const copyButton = canvas.getByRole('button', { name: /copy/i });
    await expect(copyButton).toBeInTheDocument();
    await userEvent.click(copyButton);
    // After click, button shows Check icon (state change)
  },
};

export const WithClaudeCode: Story = {
  args: {
    staticFindingsCount: 12,
    dynamicSessionsCount: 8,
    connectedIde: 'claude-code',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Claude Code/i)).toBeInTheDocument();
  },
};

export const SingleFindings: Story = {
  args: {
    staticFindingsCount: 1,
    dynamicSessionsCount: 1,
    connectedIde: 'cursor',
  },
};

export const ManyFindings: Story = {
  args: {
    staticFindingsCount: 42,
    dynamicSessionsCount: 15,
    connectedIde: 'cursor',
  },
};
