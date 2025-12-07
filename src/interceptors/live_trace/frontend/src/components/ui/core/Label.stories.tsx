import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Label } from './Label';

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const Row = styled.div<{ $gap?: number }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 16 }) => $gap}px;
  flex-wrap: wrap;
`;

const meta: Meta<typeof Label> = {
  title: 'UI/Core/Label',
  component: Label,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm'],
    },
    color: {
      control: 'select',
      options: ['default', 'cyan', 'muted'],
    },
    uppercase: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Default label',
  },
};

export const Colors: Story = {
  render: () => (
    <Stack>
      <Label>Default label</Label>
      <Label color="cyan">Cyan label</Label>
      <Label color="muted">Muted label</Label>
    </Stack>
  ),
};

export const Uppercase: Story = {
  render: () => (
    <Stack>
      <Label uppercase color="cyan">
        Uppercase cyan label
      </Label>
      <Label uppercase>Uppercase default label</Label>
    </Stack>
  ),
};

export const Required: Story = {
  render: () => <Label required>Required field</Label>,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('*')).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: () => (
    <Row>
      <Label size="xs">Extra small label</Label>
      <Label size="sm">Small label</Label>
    </Row>
  ),
};
