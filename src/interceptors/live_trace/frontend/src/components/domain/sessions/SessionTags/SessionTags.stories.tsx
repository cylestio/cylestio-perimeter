import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { SessionTags } from './SessionTags';

const meta: Meta<typeof SessionTags> = {
  title: 'Domain/Sessions/SessionTags',
  component: SessionTags,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SessionTags>;

export const Default: Story = {
  args: {
    tags: {
      user: 'john@example.com',
      env: 'production',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('user')).toBeInTheDocument();
    await expect(canvas.getByText('john@example.com')).toBeInTheDocument();
    await expect(canvas.getByText('env')).toBeInTheDocument();
    await expect(canvas.getByText('production')).toBeInTheDocument();
  },
};

export const SingleTag: Story = {
  args: {
    tags: {
      user: 'alice@example.com',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('user')).toBeInTheDocument();
    await expect(canvas.getByText('alice@example.com')).toBeInTheDocument();
  },
};

export const ManyTags: Story = {
  args: {
    tags: {
      user: 'test@example.com',
      env: 'staging',
      team: 'engineering',
      project: 'perimeter',
      version: '1.0.0',
      region: 'us-west-2',
      feature: 'tags',
    },
    maxTags: 5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('user')).toBeInTheDocument();
    await expect(canvas.getByText('env')).toBeInTheDocument();
    await expect(canvas.getByText('+2 more')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    tags: {},
    showEmpty: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No tags')).toBeInTheDocument();
  },
};

export const EmptyHidden: Story = {
  args: {
    tags: {},
    showEmpty: false,
  },
  play: async ({ canvas }) => {
    // Component should render nothing
    const container = canvas.queryByText('No tags');
    await expect(container).not.toBeInTheDocument();
  },
};

export const LongValues: Story = {
  args: {
    tags: {
      email: 'very.long.email.address@subdomain.example.com',
      uuid: '550e8400-e29b-41d4-a716-446655440000',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('email')).toBeInTheDocument();
    // Value is truncated but still in the DOM
    await expect(canvas.getByText('very.long.email.address@subdomain.example.com')).toBeInTheDocument();
  },
};

export const WithBooleanTags: Story = {
  args: {
    tags: {
      research: 'true',
      debug: 'true',
      feature: 'enabled',
    },
  },
  play: async ({ canvas }) => {
    // Boolean tags should show only the key
    await expect(canvas.getByText('research')).toBeInTheDocument();
    await expect(canvas.getByText('debug')).toBeInTheDocument();
    // Non-boolean tag should show both key and value
    await expect(canvas.getByText('feature')).toBeInTheDocument();
    await expect(canvas.getByText('enabled')).toBeInTheDocument();
    // "true" should NOT be visible as text for boolean tags
    const trueElements = canvas.queryAllByText('true');
    await expect(trueElements.length).toBe(0);
  },
};

export const MixedBooleanAndValues: Story = {
  args: {
    tags: {
      active: 'true',
      user: 'alice@example.com',
      session: 'sess_abc123',
      enabled: 'true',
    },
  },
  play: async ({ canvas }) => {
    // Boolean tags show only key
    await expect(canvas.getByText('active')).toBeInTheDocument();
    await expect(canvas.getByText('enabled')).toBeInTheDocument();
    // Regular tags show key and value
    await expect(canvas.getByText('user')).toBeInTheDocument();
    await expect(canvas.getByText('alice@example.com')).toBeInTheDocument();
    await expect(canvas.getByText('session')).toBeInTheDocument();
    await expect(canvas.getByText('sess_abc123')).toBeInTheDocument();
  },
};

export const SpecialCharacters: Story = {
  args: {
    tags: {
      path: '/api/v1/users',
      query: 'name=test&value=123',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('path')).toBeInTheDocument();
    await expect(canvas.getByText('/api/v1/users')).toBeInTheDocument();
    await expect(canvas.getByText('query')).toBeInTheDocument();
    await expect(canvas.getByText('name=test&value=123')).toBeInTheDocument();
  },
};
