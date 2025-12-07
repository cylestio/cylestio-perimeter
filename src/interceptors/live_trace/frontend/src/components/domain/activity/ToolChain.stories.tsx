import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { ToolChain } from './ToolChain';
import { Badge } from '@ui/core/Badge';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  max-width: 600px;
`;

const meta: Meta<typeof ToolChain> = {
  title: 'Domain/Activity/ToolChain',
  component: ToolChain,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToolChain>;

export const Default: Story = {
  args: {
    steps: [
      { name: 'search_customer' },
      { name: 'get_permissions' },
      { name: 'update_record' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('search_customer')).toBeInTheDocument();
    await expect(canvas.getByText('get_permissions')).toBeInTheDocument();
    await expect(canvas.getByText('update_record')).toBeInTheDocument();
  },
};

export const DangerousChain: Story = {
  args: {
    steps: [
      { name: 'search_customer' },
      { name: 'get_permissions' },
      { name: 'delete_record', risky: true },
    ],
    dangerous: true,
    badge: <Badge variant="critical">No Confirmation</Badge>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('delete_record')).toBeInTheDocument();
    await expect(canvas.getByText('No Confirmation')).toBeInTheDocument();
  },
};

export const SingleStep: Story = {
  args: {
    steps: [
      { name: 'read_file' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('read_file')).toBeInTheDocument();
  },
};

export const LongChain: Story = {
  args: {
    steps: [
      { name: 'authenticate' },
      { name: 'fetch_user' },
      { name: 'validate' },
      { name: 'process', risky: true },
      { name: 'store' },
      { name: 'notify' },
    ],
    dangerous: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('authenticate')).toBeInTheDocument();
    await expect(canvas.getByText('notify')).toBeInTheDocument();
  },
};
