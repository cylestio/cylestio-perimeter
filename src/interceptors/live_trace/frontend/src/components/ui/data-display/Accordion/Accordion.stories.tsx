import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { Bot, Settings, Info } from 'lucide-react';

import { Accordion } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'UI/DataDisplay/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {
    title: 'Accordion Title',
    children: 'This is the accordion content. It can contain any text or components.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Accordion Title')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  args: {
    title: 'System Prompt',
    icon: <Bot size={14} />,
    children: 'You are a helpful assistant that answers questions accurately and concisely.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('System Prompt')).toBeInTheDocument();
  },
};

export const DefaultOpen: Story = {
  args: {
    title: 'Settings',
    icon: <Settings size={14} />,
    defaultOpen: true,
    children: 'This accordion starts in the open state.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Settings')).toBeInTheDocument();
    await expect(canvas.getByText('This accordion starts in the open state.')).toBeVisible();
  },
};

export const Interactive: Story = {
  args: {
    title: 'Click to Toggle',
    icon: <Info size={14} />,
    children: 'Hidden content that appears when expanded.',
  },
  play: async ({ canvas }) => {
    const summary = canvas.getByText('Click to Toggle');

    // Click to open
    await userEvent.click(summary);
    await expect(canvas.getByText('Hidden content that appears when expanded.')).toBeVisible();

    // Click to close
    await userEvent.click(summary);
    // Content visibility after close depends on details element behavior
  },
};

export const LongContent: Story = {
  args: {
    title: 'Long Content Example',
    children: `This is a longer piece of content that demonstrates how the accordion handles larger amounts of text.

The accordion content area has a max-height of 300px and will scroll if the content exceeds that height.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Long Content Example')).toBeInTheDocument();
  },
};
