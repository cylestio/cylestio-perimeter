import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { Skeleton } from './Skeleton';

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

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.white70};
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const SkeletonCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: 8px;
  padding: 16px;
  width: 300px;
`;

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'title', 'avatar', 'circle', 'rect'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    variant: 'text',
    width: 200,
  },
};

export const Text: Story = {
  render: () => (
    <Stack $gap={24}>
      <Section>
        <SectionTitle>Single Line</SectionTitle>
        <div style={{ width: 300 }}>
          <Skeleton variant="text" />
        </div>
      </Section>
      <Section>
        <SectionTitle>Multiple Lines</SectionTitle>
        <div style={{ width: 300 }}>
          <Skeleton variant="text" lines={3} />
        </div>
      </Section>
      <Section>
        <SectionTitle>Title</SectionTitle>
        <div style={{ width: 300 }}>
          <Skeleton variant="title" />
        </div>
      </Section>
    </Stack>
  ),
};

export const Shapes: Story = {
  render: () => (
    <Row $gap={24}>
      <div>
        <SectionTitle>Avatar</SectionTitle>
        <Skeleton variant="avatar" />
      </div>
      <div>
        <SectionTitle>Circle (64px)</SectionTitle>
        <Skeleton variant="circle" width={64} height={64} />
      </div>
      <div>
        <SectionTitle>Rectangle</SectionTitle>
        <Skeleton variant="rect" width={200} height={100} />
      </div>
    </Row>
  ),
};

export const CardExample: Story = {
  render: () => (
    <SkeletonCard>
      <Row $gap={12}>
        <Skeleton variant="avatar" />
        <Stack $gap={8}>
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={80} />
        </Stack>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Skeleton variant="text" lines={3} />
      </div>
    </SkeletonCard>
  ),
};
