import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';

import { ClaudeCodeIcon } from './ClaudeCodeIcon';

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const meta: Meta<typeof ClaudeCodeIcon> = {
  title: 'UI/Icons/ClaudeCodeIcon',
  component: ClaudeCodeIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ClaudeCodeIcon>;

export const Default: Story = {
  args: {
    size: 24,
  },
};

export const Small: Story = {
  args: {
    size: 16,
  },
};

export const Medium: Story = {
  args: {
    size: 32,
  },
};

export const Large: Story = {
  args: {
    size: 48,
  },
};

export const Sizes: Story = {
  render: () => (
    <Row>
      <ClaudeCodeIcon size={16} />
      <ClaudeCodeIcon size={24} />
      <ClaudeCodeIcon size={32} />
      <ClaudeCodeIcon size={48} />
    </Row>
  ),
};

export const WithCustomStyle: Story = {
  args: {
    size: 32,
    style: { opacity: 0.7 },
  },
};
