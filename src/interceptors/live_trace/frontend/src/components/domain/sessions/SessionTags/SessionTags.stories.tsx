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
    await expect(canvas.getByText('very.long.email.address@subdomain.example.com')).toBeInTheDocument();
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
