import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { Bell, Settings } from 'lucide-react';
import { TopBar, SearchBox } from './TopBar';
import { Button } from '@ui/core/Button';

const Container = styled.div`
  background: #0a0a0f;
`;

const meta: Meta<typeof TopBar> = {
  title: 'Domain/Layout/TopBar',
  component: TopBar,
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
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: {
    breadcrumb: [{ label: 'Dashboard' }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};

export const WithSearch: Story = {
  args: {
    breadcrumb: [{ label: 'Dashboard' }],
    search: {
      placeholder: 'Search sessions...',
      onSearch: fn(),
      shortcut: '⌘K',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('Search sessions...')).toBeInTheDocument();
  },
};

export const WithBreadcrumb: Story = {
  args: {
    breadcrumb: [
      { label: 'Dashboard', href: '/' },
      { label: 'Findings', href: '/findings' },
      { label: 'SQL Injection' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(canvas.getByText('SQL Injection')).toBeInTheDocument();
  },
};

export const WithActions: Story = {
  args: {
    breadcrumb: [{ label: 'Dashboard' }],
    actions: (
      <>
        <Button iconOnly icon={<Bell />} variant="ghost" />
        <Button iconOnly icon={<Settings />} variant="ghost" />
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};

export const SearchInteraction: Story = {
  args: {
    breadcrumb: [{ label: 'Dashboard' }],
    search: {
      placeholder: 'Type and press Enter...',
      onSearch: fn(),
    },
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByPlaceholderText('Type and press Enter...');
    await userEvent.type(input, 'test query');
    await userEvent.keyboard('{Enter}');
    await expect(args.search?.onSearch).toHaveBeenCalledWith('test query');
  },
};

// SearchBox standalone story
export const SearchBoxDefault: Story = {
  render: () => <SearchBox placeholder="Search..." onSearch={fn()} shortcut="⌘K" />,
};
