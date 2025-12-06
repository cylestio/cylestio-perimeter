import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { ActivityFeed } from './ActivityFeed';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  max-width: 400px;
`;

const mockItems = [
  { id: '1', type: 'fixed' as const, title: 'Error handling added', detail: 'agent.py:156', timestamp: '2m ago' },
  { id: '2', type: 'found' as const, title: 'PII exposure detected', detail: 'Static scan', timestamp: '8m ago' },
  { id: '3', type: 'session' as const, title: 'Session completed', detail: '47 requests', timestamp: '15m ago' },
  { id: '4', type: 'scan' as const, title: 'Scan initiated', detail: 'Full analysis', timestamp: '1h ago' },
];

const meta: Meta<typeof ActivityFeed> = {
  title: 'Domain/Activity/ActivityFeed',
  component: ActivityFeed,
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
type Story = StoryObj<typeof ActivityFeed>;

export const Default: Story = {
  args: {
    items: mockItems,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Error handling added')).toBeInTheDocument();
    await expect(canvas.getByText('PII exposure detected')).toBeInTheDocument();
  },
};

export const MaxItems: Story = {
  args: {
    items: mockItems,
    maxItems: 2,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Error handling added')).toBeInTheDocument();
    await expect(canvas.queryByText('Session completed')).not.toBeInTheDocument();
  },
};

export const Clickable: Story = {
  args: {
    items: mockItems,
    onItemClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const item = canvas.getByText('Error handling added');
    await userEvent.click(item);
    await expect(args.onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', type: 'fixed' })
    );
  },
};

export const AllTypes: Story = {
  args: {
    items: [
      { id: '1', type: 'fixed' as const, title: 'Fixed: Error handling', detail: 'Auto-fixed by AI', timestamp: 'Just now' },
      { id: '2', type: 'found' as const, title: 'Found: Security issue', detail: 'OWASP LLM04', timestamp: '5m ago' },
      { id: '3', type: 'session' as const, title: 'Session: Live monitoring', detail: '12 requests', timestamp: '10m ago' },
      { id: '4', type: 'scan' as const, title: 'Scan: Analysis complete', detail: '3 findings', timestamp: '1h ago' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Fixed: Error handling')).toBeInTheDocument();
    await expect(canvas.getByText('Found: Security issue')).toBeInTheDocument();
    await expect(canvas.getByText('Session: Live monitoring')).toBeInTheDocument();
    await expect(canvas.getByText('Scan: Analysis complete')).toBeInTheDocument();
  },
};
