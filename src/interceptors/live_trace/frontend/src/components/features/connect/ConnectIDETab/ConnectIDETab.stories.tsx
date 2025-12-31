import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { ConnectIDETab } from './ConnectIDETab';

const meta: Meta<typeof ConnectIDETab> = {
  title: 'Features/Connect/ConnectIDETab',
  component: ConnectIDETab,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectIDETab>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify both IDE sections are rendered
    await expect(canvas.getByText('Cursor')).toBeInTheDocument();
    await expect(canvas.getByText('Claude Code')).toBeInTheDocument();

    // Verify instruction text is present
    await expect(
      canvas.getByText('Run this command in Cursor:')
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Run these commands in Claude Code:')
    ).toBeInTheDocument();

    // Verify numbered steps for Claude Code
    await expect(canvas.getByText('1')).toBeInTheDocument();
    await expect(canvas.getByText('2')).toBeInTheDocument();
  },
};

export const CopyInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get all copy buttons - verify they exist and are interactive
    const copyButtons = canvas.getAllByRole('button');
    await expect(copyButtons.length).toBeGreaterThanOrEqual(3);

    // Verify buttons are present and clickable (don't actually click due to clipboard API restrictions in test env)
    await expect(copyButtons[0]).toBeEnabled();
    await expect(copyButtons[1]).toBeEnabled();
    await expect(copyButtons[2]).toBeEnabled();
  },
};
