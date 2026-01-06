import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { SessionOption } from './SessionFilter';
import { SessionFilter } from './SessionFilter';

const mockOptions: SessionOption[] = [
  { value: 'research-v1', count: 23 },
  { value: 'research-v2', count: 15 },
  { value: 'prod-main', count: 8 },
  { value: 'test-session', count: 4 },
];

const meta: Meta<typeof SessionFilter> = {
  title: 'Domain/Sessions/SessionFilter',
  component: SessionFilter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '300px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionFilter>;

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await expect(trigger).toBeInTheDocument();
    await expect(trigger).toHaveTextContent('All sessions');
  },
};

export const WithSelection: Story = {
  render: function WithSelectionStory() {
    const [value, setValue] = useState<string | null>('research-v1');
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await expect(trigger).toHaveTextContent('research-v1');
  },
};

export const OpenDropdown: Story = {
  render: function OpenDropdownStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Click to open dropdown
    await userEvent.click(trigger);
    const listbox = canvas.getByRole('listbox');
    await expect(listbox).toBeInTheDocument();

    // Verify options are shown in dropdown (with counts)
    await expect(canvas.getByText('research-v1')).toBeInTheDocument();
    await expect(canvas.getByText('(23)')).toBeInTheDocument();
    await expect(canvas.getByText('prod-main')).toBeInTheDocument();
    // "All sessions" appears in both trigger and dropdown - verify at least one exists
    const allSessionsTexts = canvas.getAllByText('All sessions');
    await expect(allSessionsTexts.length).toBeGreaterThanOrEqual(1);
    // Verify total count is shown for "All sessions"
    await expect(canvas.getByText('(50)')).toBeInTheDocument();
  },
};

export const SelectOption: Story = {
  render: function SelectOptionStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Open dropdown and select an option
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByText('research-v2'));

    // Dropdown should close and value should be updated
    await expect(trigger).toHaveTextContent('research-v2');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

export const ClearSelection: Story = {
  render: function ClearSelectionStory() {
    const [value, setValue] = useState<string | null>('research-v1');
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Open dropdown and select "All sessions" to clear
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByText('All sessions'));

    // Value should be cleared
    await expect(trigger).toHaveTextContent('All sessions');
  },
};

export const KeyboardNavigation: Story = {
  render: function KeyboardNavigationStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Focus trigger
    trigger.focus();

    // Press ArrowDown to open
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    // Navigate down twice and press Enter
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    // Should select second option (research-v1, index 1)
    await expect(trigger).toHaveTextContent('research-v2');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

export const EscapeCloses: Story = {
  render: function EscapeClosesStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Open dropdown
    await userEvent.click(trigger);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    // Press Escape to close
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();

    // Value should not have changed
    await expect(trigger).toHaveTextContent('All sessions');
  },
};

export const EmptyOptions: Story = {
  render: function EmptyOptionsStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={[]}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Open dropdown
    await userEvent.click(trigger);

    // Should still show "All sessions" option even with empty options
    const listbox = canvas.getByRole('listbox');
    await expect(listbox).toBeInTheDocument();
    // Use getAllByText since "All sessions" appears in both trigger and dropdown
    const allSessionsTexts = canvas.getAllByText('All sessions');
    await expect(allSessionsTexts.length).toBeGreaterThanOrEqual(1);
    // Count should be (0) for empty options
    await expect(canvas.getByText('(0)')).toBeInTheDocument();
  },
};

export const CustomPlaceholder: Story = {
  render: function CustomPlaceholderStory() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <SessionFilter
        value={value}
        onChange={setValue}
        options={mockOptions}
        placeholder="Select a session..."
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await expect(trigger).toHaveTextContent('Select a session...');
  },
};
