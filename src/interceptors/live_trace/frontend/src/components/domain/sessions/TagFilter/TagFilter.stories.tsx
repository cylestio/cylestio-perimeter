import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { TagSuggestion } from './TagFilter';
import { TagFilter } from './TagFilter';

const mockSuggestions: TagSuggestion[] = [
  { key: 'user', values: ['alice@example.com', 'bob@example.com', 'charlie@example.com'] },
  { key: 'env', values: ['production', 'staging', 'development'] },
  { key: 'team', values: ['backend', 'frontend', 'infra', 'platform'] },
  { key: 'session' },
];

const meta: Meta<typeof TagFilter> = {
  title: 'Domain/Sessions/TagFilter',
  component: TagFilter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '350px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TagFilter>;

export const Default: Story = {
  render: function DefaultStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await expect(input).toBeInTheDocument();
    await expect(input).toHaveAttribute('placeholder', 'Filter by tag...');
  },
};

export const WithFilters: Story = {
  render: function WithFiltersStory() {
    const [filters, setFilters] = useState<string[]>([
      'user:alice@example.com',
      'env:production',
    ]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('user')).toBeInTheDocument();
    await expect(canvas.getByText('alice@example.com')).toBeInTheDocument();
    await expect(canvas.getByText('env')).toBeInTheDocument();
    await expect(canvas.getByText('production')).toBeInTheDocument();
  },
};

export const WithKeyOnlyFilter: Story = {
  render: function WithKeyOnlyFilterStory() {
    const [filters, setFilters] = useState<string[]>(['session', 'debug']);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('session')).toBeInTheDocument();
    await expect(canvas.getByText('debug')).toBeInTheDocument();
  },
};

export const EmptyWithSuggestions: Story = {
  render: function EmptyWithSuggestionsStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
        placeholder="Add tag filter..."
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await expect(input).toHaveAttribute('placeholder', 'Add tag filter...');
  },
};

export const NoSuggestions: Story = {
  render: function NoSuggestionsStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={[]}
        placeholder="Type key:value..."
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await expect(input).toBeInTheDocument();
  },
};

export const InteractiveDropdown: Story = {
  render: function InteractiveDropdownStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Focus input to open dropdown
    await userEvent.click(input);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('Tag Keys')).toBeInTheDocument();
    await expect(canvas.getByText('user')).toBeInTheDocument();
  },
};

export const TypeAndFilter: Story = {
  render: function TypeAndFilterStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Type to filter suggestions
    await userEvent.type(input, 'env');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('env')).toBeInTheDocument();
  },
};

export const SelectKeyShowsValues: Story = {
  render: function SelectKeyShowsValuesStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Type key with colon to show values
    await userEvent.type(input, 'env:');

    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('Values for env')).toBeInTheDocument();
    await expect(canvas.getByText('production')).toBeInTheDocument();
    await expect(canvas.getByText('staging')).toBeInTheDocument();
  },
};

export const EnterOnlySelectsFromSuggestions: Story = {
  render: function EnterOnlySelectsFromSuggestionsStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Type custom value and press Enter - should NOT add filter
    await userEvent.type(input, 'custom:value{enter}');

    // No filter should be added (custom values not allowed)
    const removeButtons = canvas.queryAllByRole('button', { name: /remove filter/i });
    await expect(removeButtons).toHaveLength(0);

    // Input should still have the value (not cleared)
    await expect(input).toHaveValue('custom:value');
  },
};

export const SelectSuggestionWithEnter: Story = {
  render: function SelectSuggestionWithEnterStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Type to get to values, then select with keyboard
    await userEvent.type(input, 'env:');

    // Dropdown should show values
    await expect(canvas.getByText('Values for env')).toBeInTheDocument();

    // Navigate to first option and press Enter
    await userEvent.keyboard('{ArrowDown}{Enter}');

    // Filter should be added
    await expect(canvas.getByText('env')).toBeInTheDocument();
    await expect(canvas.getByText('production')).toBeInTheDocument();

    // Input should be cleared
    await expect(input).toHaveValue('');
  },
};

export const RemoveFilter: Story = {
  render: function RemoveFilterStory() {
    const [filters, setFilters] = useState<string[]>(['user:alice', 'env:prod']);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click remove button for first filter
    const removeButtons = canvas.getAllByRole('button', { name: /remove filter/i });
    await expect(removeButtons).toHaveLength(2);

    await userEvent.click(removeButtons[0]);

    // First filter should be removed
    const remainingRemoveButtons = canvas.getAllByRole('button', { name: /remove filter/i });
    await expect(remainingRemoveButtons).toHaveLength(1);
  },
};

export const KeyboardNavigation: Story = {
  render: function KeyboardNavigationStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Focus input
    await userEvent.click(input);

    // Press arrow down to open and navigate
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    // Navigate down
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');

    // Press Escape to close
    await userEvent.keyboard('{Escape}');

    // Dropdown should be closed
    const listbox = canvas.queryByRole('listbox');
    await expect(listbox).not.toBeInTheDocument();
  },
};

export const ManyFilters: Story = {
  render: function ManyFiltersStory() {
    const [filters, setFilters] = useState<string[]>([
      'user:alice@example.com',
      'env:production',
      'team:backend',
      'session:run-12345',
      'feature:enabled',
    ]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const removeButtons = canvas.getAllByRole('button', { name: /remove filter/i });
    await expect(removeButtons).toHaveLength(5);
  },
};

const longSuggestions: TagSuggestion[] = [
  { key: 'user', values: [
    'alice@example.com', 'bob@example.com', 'charlie@example.com',
    'david@example.com', 'eve@example.com', 'frank@example.com',
    'grace@example.com', 'henry@example.com', 'ivy@example.com',
    'jack@example.com', 'kate@example.com', 'leo@example.com',
  ]},
  { key: 'env', values: ['production', 'staging', 'development', 'testing', 'qa', 'uat'] },
  { key: 'team', values: ['backend', 'frontend', 'infra', 'platform', 'mobile', 'data', 'ml', 'devops'] },
  { key: 'region', values: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-northeast-1'] },
  { key: 'service', values: ['api', 'web', 'worker', 'scheduler', 'gateway', 'auth', 'billing', 'notifications'] },
  { key: 'version' },
  { key: 'session' },
  { key: 'request_id' },
  { key: 'trace_id' },
  { key: 'span_id' },
  { key: 'customer_id' },
  { key: 'feature_flag' },
];

export const LongKeysList: Story = {
  render: function LongKeysListStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={longSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Focus input to open dropdown
    await userEvent.click(input);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    // Verify multiple keys are shown
    await expect(canvas.getByText('user')).toBeInTheDocument();
    await expect(canvas.getByText('region')).toBeInTheDocument();
    await expect(canvas.getByText('feature_flag')).toBeInTheDocument();
  },
};

export const LongValuesList: Story = {
  render: function LongValuesListStory() {
    const [filters, setFilters] = useState<string[]>([]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={longSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');

    // Type to show values for user key
    await userEvent.type(input, 'user:');

    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('Values for user')).toBeInTheDocument();
    await expect(canvas.getByText('alice@example.com')).toBeInTheDocument();
    await expect(canvas.getByText('leo@example.com')).toBeInTheDocument();
  },
};

export const WithBooleanFilters: Story = {
  render: function WithBooleanFiltersStory() {
    const [filters, setFilters] = useState<string[]>([
      'research',
      'debug:true',
      'env:production',
    ]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Boolean filters (no value or value="true") should show only the key
    await expect(canvas.getByText('research')).toBeInTheDocument();
    await expect(canvas.getByText('debug')).toBeInTheDocument();
    // Non-boolean filter should show key and value
    await expect(canvas.getByText('env')).toBeInTheDocument();
    await expect(canvas.getByText('production')).toBeInTheDocument();
  },
};

export const WithLongValueChips: Story = {
  render: function WithLongValueChipsStory() {
    const [filters, setFilters] = useState<string[]>([
      'email:very.long.email.address@subdomain.example.com',
      'uuid:550e8400-e29b-41d4-a716-446655440000',
      'session:abc123',
    ]);
    return (
      <TagFilter
        value={filters}
        onChange={setFilters}
        suggestions={mockSuggestions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Keys should be visible
    await expect(canvas.getByText('email')).toBeInTheDocument();
    await expect(canvas.getByText('uuid')).toBeInTheDocument();
    await expect(canvas.getByText('session')).toBeInTheDocument();
    // Values are truncated but still in the DOM
    await expect(canvas.getByText('very.long.email.address@subdomain.example.com')).toBeInTheDocument();
    await expect(canvas.getByText('abc123')).toBeInTheDocument();
  },
};
