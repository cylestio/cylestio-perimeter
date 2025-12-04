import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { Spinner } from './Spinner';

const Row = styled.div<{ $gap?: number }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 16 }) => $gap}px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.white70};
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const meta: Meta<typeof Spinner> = {
  title: 'UI/Feedback/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['cyan', 'white', 'current'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: 'md',
    color: 'cyan',
  },
};

export const Sizes: Story = {
  render: () => (
    <Row $gap={24}>
      <div>
        <SectionTitle>Small</SectionTitle>
        <Spinner size="sm" />
      </div>
      <div>
        <SectionTitle>Medium</SectionTitle>
        <Spinner size="md" />
      </div>
      <div>
        <SectionTitle>Large</SectionTitle>
        <Spinner size="lg" />
      </div>
    </Row>
  ),
};

export const Colors: Story = {
  render: () => (
    <Row $gap={24}>
      <div>
        <SectionTitle>Cyan</SectionTitle>
        <Spinner color="cyan" />
      </div>
      <div>
        <SectionTitle>White</SectionTitle>
        <Spinner color="white" />
      </div>
      <div style={{ color: '#ff9f43' }}>
        <SectionTitle>Current Color</SectionTitle>
        <Spinner color="current" />
      </div>
    </Row>
  ),
};
