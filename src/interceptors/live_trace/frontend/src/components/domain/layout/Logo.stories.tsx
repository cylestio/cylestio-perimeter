import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Logo } from './Logo';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
`;

const meta: Meta<typeof Logo> = {
  title: 'Domain/Layout/Logo',
  component: Logo,
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
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {
    collapsed: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Agent Inspector')).toBeInTheDocument();
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
};

export const CustomText: Story = {
  args: {
    text: 'Agent Inspector',
    collapsed: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Agent Inspector')).toBeInTheDocument();
  },
};
