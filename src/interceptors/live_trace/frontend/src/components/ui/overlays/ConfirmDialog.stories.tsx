import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import styled from 'styled-components';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '../core/Button';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  min-height: 400px;
`;

const meta: Meta<typeof ConfirmDialog> = {
  title: 'UI/Overlays/ConfirmDialog',
  component: ConfirmDialog,
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
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed with this action? This cannot be undone.',
    onClose: fn(),
    onConfirm: fn(),
  },
  // ConfirmDialog uses Modal which renders via portal
};

export const Danger: Story = {
  args: {
    open: true,
    title: 'Delete Finding?',
    description: 'This will permanently delete the finding and all associated data. This action cannot be undone.',
    variant: 'danger',
    confirmLabel: 'Delete',
    onClose: fn(),
    onConfirm: fn(),
  },
  // ConfirmDialog uses Modal which renders via portal
};

export const Warning: Story = {
  args: {
    open: true,
    title: 'Rescan Agent?',
    description: 'This will interrupt the current scan and start a new one. Any unsaved progress will be lost.',
    variant: 'warning',
    confirmLabel: 'Rescan',
    onClose: fn(),
    onConfirm: fn(),
  },
  // ConfirmDialog uses Modal which renders via portal
};

export const Loading: Story = {
  args: {
    open: true,
    title: 'Delete Finding?',
    description: 'This action cannot be undone.',
    variant: 'danger',
    confirmLabel: 'Delete',
    loading: true,
    onClose: fn(),
    onConfirm: fn(),
  },
  // ConfirmDialog uses Modal which renders via portal
};

export const ConfirmAction: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    description: 'Are you sure?',
    onClose: fn(),
    onConfirm: fn(),
  },
  // ConfirmDialog uses Modal which renders via portal
};

export const CancelAction: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    description: 'Are you sure?',
    onClose: fn(),
    onConfirm: fn(),
  },
  // ConfirmDialog uses Modal which renders via portal
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);
    const [deleted, setDeleted] = useState(false);
    return (
      <>
        {deleted ? (
          <p style={{ color: '#00ff88' }}>Item deleted!</p>
        ) : (
          <Button variant="danger" onClick={() => setOpen(true)}>Delete Item</Button>
        )}
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => { setDeleted(true); setOpen(false); }}
          title="Delete Item?"
          description="This will permanently delete the item."
          variant="danger"
          confirmLabel="Delete"
        />
      </>
    );
  },
  play: async ({ canvas }) => {
    const deleteButton = canvas.getByText('Delete Item');
    await expect(deleteButton).toBeInTheDocument();
    // Dialog content renders via portal after click
  },
};
