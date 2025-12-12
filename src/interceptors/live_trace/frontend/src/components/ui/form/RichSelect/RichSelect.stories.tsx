import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';

import { RichSelect, type RichSelectOption } from './RichSelect';

const meta: Meta<typeof RichSelect> = {
  title: 'UI/Form/RichSelect',
  component: RichSelect,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RichSelect>;

// Basic options
const basicOptions: RichSelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

// Model options with pricing data
interface ModelData {
  input: number;
  output: number;
}

const modelOptions: RichSelectOption<ModelData>[] = [
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', data: { input: 3, output: 15 } },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', data: { input: 1, output: 5 } },
  { value: 'claude-opus-4-1', label: 'Claude Opus 4.1', data: { input: 15, output: 75 } },
  { value: 'gpt-4o', label: 'GPT-4o', data: { input: 2.5, output: 10 } },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', data: { input: 0.15, output: 0.6 } },
  { value: 'o1', label: 'o1', data: { input: 15, output: 60 } },
];

// Interactive wrapper for controlled state
const RichSelectWithState = <T,>(props: Parameters<typeof RichSelect<T>>[0]) => {
  const [value, setValue] = useState(props.value);
  return (
    <RichSelect<T>
      {...props}
      value={value}
      onChange={(val, opt) => {
        setValue(val);
        props.onChange?.(val, opt);
      }}
    />
  );
};

export const Default: Story = {
  render: () => <RichSelectWithState options={basicOptions} placeholder="Select an option" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await expect(trigger).toBeInTheDocument();
    await expect(trigger).toHaveTextContent('Select an option');
  },
};

export const WithLabel: Story = {
  render: () => (
    <RichSelectWithState options={basicOptions} label="Choose Option" placeholder="Select..." />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Choose Option')).toBeInTheDocument();
  },
};

export const WithValue: Story = {
  render: () => (
    <RichSelectWithState options={basicOptions} value="option2" label="Selected Option" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await expect(trigger).toHaveTextContent('Option 2');
  },
};

export const WithError: Story = {
  render: () => (
    <RichSelectWithState
      options={basicOptions}
      label="Required Field"
      error="Please select an option"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Please select an option')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: () => (
    <RichSelectWithState
      options={basicOptions}
      value="option1"
      label="Disabled Select"
      disabled
    />
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <RichSelectWithState
      options={[
        { value: 'opt1', label: 'Available Option' },
        { value: 'opt2', label: 'Disabled Option', disabled: true },
        { value: 'opt3', label: 'Another Available' },
      ]}
      label="Some Disabled"
      placeholder="Select..."
    />
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: '100%' }}>
      <RichSelectWithState
        options={basicOptions}
        label="Full Width"
        fullWidth
        placeholder="Spans full width"
      />
    </div>
  ),
};

export const CustomRenderOption: Story = {
  render: () => (
    <RichSelectWithState
      options={modelOptions}
      label="Model"
      placeholder="Select a model"
      renderOption={(option) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 16 }}>
          <span>{option.label}</span>
          {option.data && (
            <span style={{ opacity: 0.6, fontSize: 12 }}>
              ${option.data.input} / ${option.data.output}
            </span>
          )}
        </div>
      )}
      renderValue={(option) => (
        <span>
          {option.label}
          {option.data && (
            <span style={{ opacity: 0.6, marginLeft: 8, fontSize: 12 }}>
              ${option.data.input} / ${option.data.output}
            </span>
          )}
        </span>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);

    // Verify options are rendered with pricing
    const menu = canvas.getByRole('listbox');
    await expect(menu).toBeInTheDocument();
    await expect(canvas.getByText('Claude Sonnet 4.5')).toBeInTheDocument();
  },
};

export const ManyOptions: Story = {
  render: () => (
    <RichSelectWithState
      options={Array.from({ length: 20 }, (_, i) => ({
        value: `option${i + 1}`,
        label: `Option ${i + 1}`,
      }))}
      label="Scrollable List"
      placeholder="Select from many options"
    />
  ),
};

export const KeyboardNavigation: Story = {
  render: () => (
    <RichSelectWithState
      options={basicOptions}
      label="Use Arrow Keys"
      placeholder="Focus and use arrows"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Focus and open with arrow down
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');

    // Menu should be open
    const menu = canvas.getByRole('listbox');
    await expect(menu).toBeInTheDocument();

    // Navigate down
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');

    // Select with Enter
    await userEvent.keyboard('{Enter}');

    // Menu should close and value should be set
    await expect(trigger).toHaveTextContent('Option 3');
  },
};

export const NoOptions: Story = {
  render: () => (
    <RichSelectWithState options={[]} label="Empty" placeholder="Select..." />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);

    // When dropdown opens with no options, it shows the NoOptions message inside the menu
    const menu = canvas.getByRole('listbox');
    await expect(within(menu).getByText('No options available')).toBeInTheDocument();
  },
};

