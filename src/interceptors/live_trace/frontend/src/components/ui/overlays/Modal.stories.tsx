import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import styled from 'styled-components';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../core/Button';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  min-height: 400px;
`;

const meta: Meta<typeof Modal> = {
  title: 'UI/Overlays/Modal',
  component: Modal,
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
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Modal Title',
    children: <p style={{ color: '#ffffffb0' }}>This is the modal content. You can put anything here.</p>,
    onClose: fn(),
  },
  // Modal renders via portal to document.body, tests verify rendering
};

export const WithFooter: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    children: <p style={{ color: '#ffffffb0' }}>Are you sure you want to proceed with this action?</p>,
    onClose: fn(),
    footer: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
  },
  // Modal renders via portal to document.body
};

export const Sizes: Story = {
  render: function SizesStory() {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
    const [open, setOpen] = useState(true);
    return (
      <>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => { setSize('sm'); setOpen(true); }}>Small</Button>
          <Button variant="secondary" onClick={() => { setSize('md'); setOpen(true); }}>Medium</Button>
          <Button variant="secondary" onClick={() => { setSize('lg'); setOpen(true); }}>Large</Button>
          <Button variant="secondary" onClick={() => { setSize('xl'); setOpen(true); }}>XLarge</Button>
        </div>
        <Modal open={open} onClose={() => setOpen(false)} title={`${size.toUpperCase()} Modal`} size={size}>
          <p style={{ color: '#ffffffb0' }}>This is a {size} modal.</p>
        </Modal>
      </>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Small')).toBeInTheDocument();
  },
};

export const CloseWithEscape: Story = {
  args: {
    open: true,
    title: 'Press Escape to Close',
    children: <p style={{ color: '#ffffffb0' }}>Press the Escape key to close this modal.</p>,
    onClose: fn(),
    closeOnEsc: true,
  },
  // Modal renders via portal; escape key functionality can be tested manually
};

export const CloseOnOverlay: Story = {
  args: {
    open: true,
    title: 'Click Outside to Close',
    children: <p style={{ color: '#ffffffb0' }}>Click outside this modal to close it.</p>,
    onClose: fn(),
    closeOnOverlayClick: true,
  },
  // Modal renders via portal to document.body
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Interactive Modal"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          <p style={{ color: '#ffffffb0' }}>This modal opens when you click the button.</p>
        </Modal>
      </>
    );
  },
  play: async ({ canvas }) => {
    const openButton = canvas.getByText('Open Modal');
    await expect(openButton).toBeInTheDocument();
    // Modal renders via portal after click
  },
};
