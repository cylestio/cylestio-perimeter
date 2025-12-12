import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '@ui/core/Badge';

import { KeyValueList } from './KeyValueList';

const meta: Meta<typeof KeyValueList> = {
  title: 'UI/Data Display/KeyValueList',
  component: KeyValueList,
  parameters: {
    layout: 'padded',
  },
  args: {
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof KeyValueList>;

export const Default: Story = {
  args: {
    items: [
      { key: 'Session ID', value: 'sess_a7f3b291c4e8d5f6', mono: true },
      { key: 'Model', value: 'claude-sonnet-4-20250514', mono: true },
      { key: 'Provider', value: 'Anthropic' },
    ],
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    items: [
      { key: 'Session ID', value: 'sess_a7f3b291c4e8d5f6', mono: true },
      { key: 'Model', value: 'claude-sonnet-4-20250514', mono: true },
      { key: 'Provider', value: 'Anthropic' },
    ],
  },
};

export const WithBadges: Story = {
  args: {
    items: [
      { key: 'Session ID', value: 'sess_a7f3b291c4e8d5f6', mono: true },
      { key: 'Model', value: 'claude-sonnet-4-20250514', mono: true },
      {
        key: 'Status',
        value: (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Badge variant="success">ACTIVE</Badge>
            <Badge variant="info">ANTHROPIC</Badge>
          </div>
        ),
      },
    ],
  },
};

export const Metrics: Story = {
  args: {
    items: [
      { key: 'Total Cost', value: '$0.0847', mono: true },
      { key: 'Tokens', value: '15.7K', mono: true },
      { key: 'Avg Latency', value: '842ms', mono: true },
      { key: 'Duration', value: '4.5 min' },
    ],
  },
};

