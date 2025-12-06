import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { MoreVertical, Edit, Copy, Trash, Settings } from 'lucide-react';
import { Dropdown } from './Dropdown';
import { Button } from '../core/Button';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  min-height: 300px;
`;

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Overlays/Dropdown',
  component: Dropdown,
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
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  args: {
    trigger: <Button variant="secondary" iconOnly icon={<MoreVertical size={16} />} />,
    items: [
      { id: 'edit', label: 'Edit', icon: <Edit size={14} /> },
      { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} /> },
      { id: 'divider', label: '', divider: true },
      { id: 'delete', label: 'Delete', icon: <Trash size={14} />, danger: true },
    ],
  },
  play: async ({ canvasElement }) => {
    // Click on the inner button (Button component inside trigger)
    const innerButton = canvasElement.querySelector('button');
    if (innerButton) {
      await userEvent.click(innerButton);
    }
    // Menu items should be visible after click
    await expect(canvasElement.querySelector('[role="menu"]')).toBeInTheDocument();
  },
};

export const ItemClick: Story = {
  args: {
    trigger: <Button variant="secondary">Options</Button>,
    items: [
      { id: 'edit', label: 'Edit', onClick: fn() },
      { id: 'delete', label: 'Delete', danger: true, onClick: fn() },
    ],
  },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByText('Options');
    await userEvent.click(trigger);
    const editItem = canvas.getByRole('menuitem', { name: 'Edit' });
    await userEvent.click(editItem);
    await expect(args.items[0].onClick).toHaveBeenCalled();
  },
};

export const RightAligned: Story = {
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Dropdown
        trigger={<Button variant="secondary">Right Aligned</Button>}
        items={[
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
          { id: 'option3', label: 'Option 3' },
        ]}
        align="right"
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Right Aligned');
    await userEvent.click(trigger);
    await expect(canvas.getByRole('menu')).toBeInTheDocument();
  },
};

export const WithDisabledItems: Story = {
  args: {
    trigger: <Button variant="secondary">Actions</Button>,
    items: [
      { id: 'edit', label: 'Edit', icon: <Edit size={14} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={14} />, disabled: true },
      { id: 'divider', label: '', divider: true },
      { id: 'delete', label: 'Delete', icon: <Trash size={14} />, danger: true, disabled: true },
    ],
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Actions');
    await userEvent.click(trigger);
    await expect(canvas.getByText('Settings')).toBeInTheDocument();
  },
};

export const KeyboardNavigation: Story = {
  args: {
    trigger: <Button variant="secondary">Navigate with keyboard</Button>,
    items: [
      { id: 'one', label: 'Option One' },
      { id: 'two', label: 'Option Two' },
      { id: 'three', label: 'Option Three' },
    ],
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Navigate with keyboard');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');
  },
};
