import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { SystemPromptFilter } from './SystemPromptFilter';

const meta: Meta<typeof SystemPromptFilter> = {
  title: 'Domain/Sessions/SystemPromptFilter',
  component: SystemPromptFilter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SystemPromptFilter>;

const mockSystemPrompts = [
  { id: 'math-agent-v1', id_short: 'math-agent-v', sessionCount: 42 },
  { id: 'math-agent-v2', id_short: 'math-agent-v', sessionCount: 18 },
  { id: 'chat-assistant', id_short: 'chat-assista', sessionCount: 7 },
];

export const Default: Story = {
  render: function SystemPromptFilterDefaultStory() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    return (
      <SystemPromptFilter
        systemPrompts={mockSystemPrompts}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify filter label is present
    await expect(canvas.getByText('System Prompt')).toBeVisible();

    // Verify "All" is initially active
    const allButton = canvas.getByRole('button', { name: /All \(67\)/ });
    await expect(allButton).toBeVisible();

    // Click on a specific system prompt
    const firstPrompt = canvas.getByRole('button', { name: /math-agent-v1 \(42\)/ });
    await userEvent.click(firstPrompt);

    // Verify it can be clicked
    await expect(firstPrompt).toBeVisible();
  },
};

export const WithSelection: Story = {
  render: function SystemPromptFilterSelectedStory() {
    const [selectedId, setSelectedId] = useState<string | null>('math-agent-v1');
    return (
      <SystemPromptFilter
        systemPrompts={mockSystemPrompts}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify filter label is visible
    await expect(canvas.getByText('System Prompt')).toBeVisible();

    // Verify the selected prompt button is visible
    const selectedButton = canvas.getByRole('button', { name: /math-agent-v1 \(42\)/ });
    await expect(selectedButton).toBeVisible();

    // Click "All" to reset
    const allButton = canvas.getByRole('button', { name: /All \(67\)/ });
    await userEvent.click(allButton);
    await expect(allButton).toBeVisible();
  },
};

export const SinglePrompt: Story = {
  args: {
    systemPrompts: [{ id: 'sp-single', id_short: 'single12345', sessionCount: 10 }],
    selectedId: null,
    onSelect: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should not render anything when there's only one system prompt
    const buttons = canvas.queryAllByRole('button');
    await expect(buttons.length).toBe(0);
  },
};

export const ManyPrompts: Story = {
  render: function SystemPromptFilterManyStory() {
    const manyPrompts = [
      { id: 'sp-1', id_short: 'prompt_1_abc', sessionCount: 15 },
      { id: 'sp-2', id_short: 'prompt_2_def', sessionCount: 23 },
      { id: 'sp-3', id_short: 'prompt_3_ghi', sessionCount: 8 },
      { id: 'sp-4', id_short: 'prompt_4_jkl', sessionCount: 31 },
      { id: 'sp-5', id_short: 'prompt_5_mno', sessionCount: 12 },
    ];
    const [selectedId, setSelectedId] = useState<string | null>(null);
    return (
      <SystemPromptFilter
        systemPrompts={manyPrompts}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify filter label
    await expect(canvas.getByText('System Prompt')).toBeVisible();

    // Verify total count is correct (15+23+8+31+12 = 89)
    const allButton = canvas.getByRole('button', { name: /All \(89\)/ });
    await expect(allButton).toBeVisible();
  },
};
