import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import styled from 'styled-components';

import { Button } from '@ui/core/Button';

import { Drawer } from './Drawer';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  min-height: 400px;
`;

const meta: Meta<typeof Drawer> = {
  title: 'UI/Overlays/Drawer',
  component: Drawer,
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
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Drawer Title',
    children: (
      <p style={{ color: '#ffffffb0' }}>
        This is the drawer content. You can put anything here.
      </p>
    ),
    onClose: fn(),
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('Drawer Title')).toBeInTheDocument();
    await expect(body.getByText('This is the drawer content. You can put anything here.')).toBeInTheDocument();
  },
};

export const WithFooter: Story = {
  args: {
    open: true,
    title: 'Edit Settings',
    children: (
      <p style={{ color: '#ffffffb0' }}>
        Make your changes below. Click Save to confirm or Cancel to discard.
      </p>
    ),
    onClose: fn(),
    footer: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Save</Button>
      </>
    ),
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('Edit Settings')).toBeInTheDocument();
    await expect(body.getByText('Cancel')).toBeInTheDocument();
    await expect(body.getByText('Save')).toBeInTheDocument();
  },
};

export const Positions: Story = {
  render: function PositionsStory() {
    const [position, setPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
    const [open, setOpen] = useState(true);
    return (
      <>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => { setPosition('left'); setOpen(true); }}>Left</Button>
          <Button variant="secondary" onClick={() => { setPosition('right'); setOpen(true); }}>Right</Button>
          <Button variant="secondary" onClick={() => { setPosition('top'); setOpen(true); }}>Top</Button>
          <Button variant="secondary" onClick={() => { setPosition('bottom'); setOpen(true); }}>Bottom</Button>
        </div>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title={`${position.charAt(0).toUpperCase() + position.slice(1)} Drawer`}
          position={position}
        >
          <p style={{ color: '#ffffffb0' }}>This drawer slides in from the {position}.</p>
        </Drawer>
      </>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Left')).toBeInTheDocument();
    await expect(canvas.getByText('Right')).toBeInTheDocument();
  },
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
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title={`${size.toUpperCase()} Drawer`}
          size={size}
        >
          <p style={{ color: '#ffffffb0' }}>This is a {size} drawer.</p>
        </Drawer>
      </>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Small')).toBeInTheDocument();
  },
};

export const NoOverlay: Story = {
  args: {
    open: true,
    title: 'No Overlay',
    showOverlay: false,
    children: (
      <p style={{ color: '#ffffffb0' }}>
        This drawer has no overlay behind it. The background content is still visible.
      </p>
    ),
    onClose: fn(),
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('No Overlay')).toBeInTheDocument();
  },
};

export const CloseOnOverlayClick: Story = {
  args: {
    open: true,
    title: 'Click Outside to Close',
    children: (
      <p style={{ color: '#ffffffb0' }}>Click outside this drawer to close it.</p>
    ),
    onClose: fn(),
    closeOnOverlayClick: true,
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('Click Outside to Close')).toBeInTheDocument();
  },
};

export const NoClickOutside: Story = {
  args: {
    open: true,
    title: 'No Click Outside',
    children: (
      <p style={{ color: '#ffffffb0' }}>
        Clicking outside this drawer will not close it. Use the X button instead.
      </p>
    ),
    onClose: fn(),
    closeOnOverlayClick: false,
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('No Click Outside')).toBeInTheDocument();
  },
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="Interactive Drawer"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          <p style={{ color: '#ffffffb0' }}>This drawer opens when you click the button.</p>
        </Drawer>
      </>
    );
  },
  play: async ({ canvas }) => {
    const openButton = canvas.getByText('Open Drawer');
    await expect(openButton).toBeInTheDocument();
    // Drawer renders via portal after click
  },
};

export const WithScrollableContent: Story = {
  args: {
    open: true,
    title: 'Scrollable Content',
    children: (
      <div style={{ color: '#ffffffb0' }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <p key={i}>
            This is paragraph {i + 1}. The content is scrollable when it exceeds the drawer height.
          </p>
        ))}
      </div>
    ),
    onClose: fn(),
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('Scrollable Content')).toBeInTheDocument();
  },
};

export const NoTitle: Story = {
  args: {
    open: true,
    children: (
      <div style={{ color: '#ffffffb0', paddingTop: 40 }}>
        <h3>Custom Header</h3>
        <p>This drawer has no title but still has a close button in the corner.</p>
      </div>
    ),
    onClose: fn(),
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.getByText('Custom Header')).toBeInTheDocument();
    await expect(body.getByLabelText('Close drawer')).toBeInTheDocument();
  },
};

