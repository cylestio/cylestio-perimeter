import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Text } from './Text';

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const meta: Meta<typeof Text> = {
  title: 'UI/Core/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'disabled', 'cyan', 'green', 'orange', 'red', 'purple'],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack>
      <Text size="xs">Extra small text (11px)</Text>
      <Text size="sm">Small text (12px)</Text>
      <Text size="base">Base text (13px)</Text>
      <Text size="md">Medium text (14px)</Text>
      <Text size="lg">Large text (16px)</Text>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Extra small text (11px)')).toBeInTheDocument();
    await expect(canvas.getByText('Large text (16px)')).toBeInTheDocument();
  },
};

export const Colors: Story = {
  render: () => (
    <Stack>
      <Text color="primary">Primary text (white90)</Text>
      <Text color="secondary">Secondary text (white70)</Text>
      <Text color="muted">Muted text (white50)</Text>
      <Text color="disabled">Disabled text (white30)</Text>
      <Text color="cyan">Cyan accent text</Text>
      <Text color="green">Green success text</Text>
      <Text color="orange">Orange warning text</Text>
      <Text color="red">Red error text</Text>
      <Text color="purple">Purple AI text</Text>
    </Stack>
  ),
};

export const Weights: Story = {
  render: () => (
    <Stack>
      <Text weight="normal">Normal weight (400)</Text>
      <Text weight="medium">Medium weight (500)</Text>
      <Text weight="semibold">Semibold weight (600)</Text>
      <Text weight="bold">Bold weight (700)</Text>
    </Stack>
  ),
};

export const Monospace: Story = {
  render: () => (
    <Stack>
      <Text>Regular font: The quick brown fox</Text>
      <Text mono>Monospace font: session_abc123</Text>
    </Stack>
  ),
};

export const Truncated: Story = {
  render: () => (
    <div style={{ width: 200 }}>
      <Text truncate>
        This is a very long text that will be truncated with an ellipsis when it overflows
      </Text>
    </div>
  ),
};
