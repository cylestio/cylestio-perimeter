import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { JsonEditor } from './JsonEditor';

const meta: Meta<typeof JsonEditor> = {
  title: 'UI/Form/JsonEditor',
  component: JsonEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof JsonEditor>;

const sampleMessages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello, how are you?' },
];

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState(JSON.stringify(sampleMessages, null, 2));
    return <JsonEditor value={value} onChange={setValue} label="Messages" />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Messages')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  render: function EmptyStory() {
    const [value, setValue] = useState('[]');
    return (
      <JsonEditor
        value={value}
        onChange={setValue}
        label="Messages"
        placeholder="Click + Add Item to add a message"
      />
    );
  },
  play: async ({ canvas }) => {
    const addButton = canvas.getByText('+ Add Item');
    await expect(addButton).toBeInTheDocument();
  },
};

export const WithError: Story = {
  render: function ErrorStory() {
    const [value, setValue] = useState('{ invalid json }');
    return <JsonEditor value={value} onChange={setValue} label="Error Example" />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Error Example')).toBeInTheDocument();
    await expect(canvas.getByText(/Expected property name/)).toBeInTheDocument();
  },
};

export const ToolsArray: Story = {
  render: function ToolsStory() {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
          },
        },
      },
    ];
    const [value, setValue] = useState(JSON.stringify(tools, null, 2));
    return <JsonEditor value={value} onChange={setValue} label="Tools" />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Tools')).toBeInTheDocument();
  },
};

export const NoLabel: Story = {
  render: function NoLabelStory() {
    const [value, setValue] = useState(JSON.stringify(sampleMessages, null, 2));
    return <JsonEditor value={value} onChange={setValue} />;
  },
  play: async ({ canvas }) => {
    // Editor should render without a label
    const messages = canvas.queryByText('Messages');
    await expect(messages).not.toBeInTheDocument();
  },
};
