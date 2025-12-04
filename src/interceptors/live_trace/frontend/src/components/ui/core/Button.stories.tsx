import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Settings, Trash2, Plus, ArrowRight, X } from 'lucide-react';
import styled from 'styled-components';
import { Button } from './Button';

const Row = styled.div<{ $gap?: number }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 16 }) => $gap}px;
  flex-wrap: wrap;
`;

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const meta: Meta<typeof Button> = {
  title: 'UI/Core/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const Variants: Story = {
  render: () => (
    <Row>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Danger' })).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: () => (
    <Row>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Row>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Stack>
      <Row>
        <Button icon={<Settings />}>Settings</Button>
        <Button icon={<Plus />} variant="success">
          Add Item
        </Button>
        <Button icon={<Trash2 />} variant="danger">
          Delete
        </Button>
      </Row>
      <Row>
        <Button icon={<ArrowRight />} iconPosition="right">
          Continue
        </Button>
      </Row>
    </Stack>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <Row>
      <Button iconOnly icon={<Settings />} variant="secondary" aria-label="Settings" />
      <Button iconOnly icon={<Plus />} variant="primary" aria-label="Add" />
      <Button iconOnly icon={<X />} variant="ghost" aria-label="Close" />
      <Button iconOnly icon={<Trash2 />} variant="danger" aria-label="Delete" />
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  render: () => (
    <Row>
      <Button loading>Loading...</Button>
      <Button loading variant="secondary">
        Processing
      </Button>
      <Button loading variant="danger">
        Deleting
      </Button>
    </Row>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Row>
      <Button disabled>Disabled</Button>
      <Button disabled variant="secondary">
        Disabled
      </Button>
      <Button disabled variant="ghost">
        Disabled
      </Button>
    </Row>
  ),
  play: async ({ canvas }) => {
    const buttons = canvas.getAllByRole('button', { name: 'Disabled' });
    for (const button of buttons) {
      await expect(button).toBeDisabled();
    }
  },
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <Button fullWidth>Full Width Button</Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Row>
      <Button as="a" href="https://example.com" target="_blank">
        Visit Website
      </Button>
      <Button as="a" href="#" variant="secondary" icon={<ArrowRight />} iconPosition="right">
        Learn More
      </Button>
    </Row>
  ),
};

export const ClickInteraction: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Click me' });

    // Click the button
    await userEvent.click(button);

    // Verify onClick was called
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    // Verify button has focus after click
    await expect(button).toHaveFocus();
  },
};

export const KeyboardNavigation: Story = {
  args: {
    children: 'Press Enter',
    variant: 'primary',
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Press Enter' });

    // Tab to focus
    await userEvent.tab();
    await expect(button).toHaveFocus();

    // Press Enter
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalled();
  },
};
