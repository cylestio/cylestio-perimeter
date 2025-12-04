import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Heading } from './Heading';

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const meta: Meta<typeof Heading> = {
  title: 'UI/Core/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
    size: {
      control: 'select',
      options: ['sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    gradient: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: {
    level: 1,
    children: 'Heading Example',
  },
};

export const Levels: Story = {
  render: () => (
    <Stack $gap={24}>
      <Heading level={1}>Heading 1 (48px)</Heading>
      <Heading level={2}>Heading 2 (32px)</Heading>
      <Heading level={3}>Heading 3 (24px)</Heading>
      <Heading level={4}>Heading 4 (18px)</Heading>
      <Heading level={5}>Heading 5 (16px)</Heading>
      <Heading level={6}>Heading 6 (14px)</Heading>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 6 })).toBeInTheDocument();
  },
};

export const Gradient: Story = {
  render: () => (
    <Stack $gap={24}>
      <Heading level={1} gradient>
        Agent Inspector
      </Heading>
      <Heading level={2} gradient>
        Gradient Heading
      </Heading>
    </Stack>
  ),
};

export const CustomSize: Story = {
  render: () => (
    <Stack>
      <Heading level={3} size="4xl">
        H3 with 4xl size
      </Heading>
      <Heading level={1} size="lg">
        H1 with lg size
      </Heading>
    </Stack>
  ),
};
