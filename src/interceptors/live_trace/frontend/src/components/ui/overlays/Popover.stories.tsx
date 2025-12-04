import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Popover } from './Popover';
import { Button } from '../core/Button';

const Container = styled.div`
  padding: 100px 24px;
  background: #0a0a0f;
  display: flex;
  gap: 24px;
  justify-content: center;
`;

const PopoverContent = styled.div`
  color: #ffffffb0;
  font-size: 13px;
  max-width: 250px;
`;

const meta: Meta<typeof Popover> = {
  title: 'UI/Overlays/Popover',
  component: Popover,
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
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="secondary">Click me</Button>}
        content={
          <PopoverContent>
            <strong style={{ color: '#fff' }}>Popover Title</strong>
            <p style={{ marginTop: 8 }}>This is a popover with rich content.</p>
          </PopoverContent>
        }
      />
    );
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Click me');
    await expect(trigger).toBeInTheDocument();
    await userEvent.click(trigger);
    // Popover content renders in a portal, verify trigger state changed
    await expect(trigger.closest('[aria-expanded="true"]')).toBeInTheDocument();
  },
};

export const Positions: Story = {
  render: function PositionsStory() {
    const [openTop, setOpenTop] = useState(false);
    const [openBottom, setOpenBottom] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const [openRight, setOpenRight] = useState(false);
    return (
      <Container style={{ flexWrap: 'wrap', gap: 48 }}>
        <Popover
          open={openTop}
          onOpenChange={setOpenTop}
          trigger={<Button variant="secondary">Top</Button>}
          content={<PopoverContent>Top popover</PopoverContent>}
          position="top"
        />
        <Popover
          open={openBottom}
          onOpenChange={setOpenBottom}
          trigger={<Button variant="secondary">Bottom</Button>}
          content={<PopoverContent>Bottom popover</PopoverContent>}
          position="bottom"
        />
        <Popover
          open={openLeft}
          onOpenChange={setOpenLeft}
          trigger={<Button variant="secondary">Left</Button>}
          content={<PopoverContent>Left popover</PopoverContent>}
          position="left"
        />
        <Popover
          open={openRight}
          onOpenChange={setOpenRight}
          trigger={<Button variant="secondary">Right</Button>}
          content={<PopoverContent>Right popover</PopoverContent>}
          position="right"
        />
      </Container>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Top')).toBeInTheDocument();
    await expect(canvas.getByText('Bottom')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: function WithIconStory() {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={
          <span style={{ color: '#00f0ff', cursor: 'pointer' }}>
            <HelpCircle size={20} />
          </span>
        }
        content={
          <PopoverContent>
            <strong style={{ color: '#fff' }}>Need Help?</strong>
            <p style={{ marginTop: 8 }}>Click here to learn more about this feature.</p>
          </PopoverContent>
        }
      />
    );
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button');
    await expect(trigger).toBeInTheDocument();
    await userEvent.click(trigger);
    // Verify aria-expanded changed
    await expect(trigger.getAttribute('aria-expanded')).toBe('true');
  },
};

export const CloseOnEscape: Story = {
  render: function CloseOnEscapeStory() {
    const [open, setOpen] = useState(true);
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="secondary">Press Escape</Button>}
        content={<PopoverContent>Press Escape to close this popover.</PopoverContent>}
      />
    );
  },
  play: async ({ canvas }) => {
    // Verify the trigger button is rendered
    await expect(canvas.getByText('Press Escape')).toBeInTheDocument();
  },
};
