import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';

import { CursorIcon } from './CursorIcon';

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const meta: Meta<typeof CursorIcon> = {
  title: 'UI/Icons/CursorIcon',
  component: CursorIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CursorIcon>;

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
      <CursorIcon size={16} />
      <CursorIcon size={24} />
      <CursorIcon size={32} />
      <CursorIcon size={48} />
    </Row>
  ),
};

export const WithCustomStyle: Story = {
  args: {
    size: 32,
    style: { opacity: 0.7 },
  },
};
