import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Content } from './Content';
import { Card } from '../core/Card';

const Container = styled.div`
  height: 400px;
  background: #000;
  display: flex;
`;

const meta: Meta<typeof Content> = {
  title: 'UI/Layout/Content',
  component: Content,
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
type Story = StoryObj<typeof Content>;

export const Default: Story = {
  args: {
    children: (
      <Card>
        <Card.Header title="Content Area" />
        <Card.Content>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            This is the main content area. It can contain cards, tables, and other components.
          </p>
        </Card.Content>
      </Card>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Content Area')).toBeInTheDocument();
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <Card>
        <Card.Content>Small padding content</Card.Content>
      </Card>
    ),
  },
};

export const MediumPadding: Story = {
  args: {
    padding: 'md',
    children: (
      <Card>
        <Card.Content>Medium padding content</Card.Content>
      </Card>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <Card>
        <Card.Content>Large padding content</Card.Content>
      </Card>
    ),
  },
};

export const MaxWidthLg: Story = {
  args: {
    maxWidth: 'lg',
    children: (
      <Card>
        <Card.Content>Content with max-width: lg (1024px)</Card.Content>
      </Card>
    ),
  },
};
