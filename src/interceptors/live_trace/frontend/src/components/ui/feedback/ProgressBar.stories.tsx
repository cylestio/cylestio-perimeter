import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { ProgressBar } from './ProgressBar';

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

const ProgressContainer = styled.div`
  width: 300px;
`;

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/Feedback/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    value: {
      control: { type: 'range', min: 0, max: 100 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const Variants: Story = {
  render: () => (
    <Stack $gap={24}>
      <Section>
        <SectionTitle>Progress Bar Variants</SectionTitle>
        <Stack $gap={16}>
          <ProgressContainer>
            <ProgressBar value={75} variant="default" />
          </ProgressContainer>
          <ProgressContainer>
            <ProgressBar value={100} variant="success" />
          </ProgressContainer>
          <ProgressContainer>
            <ProgressBar value={45} variant="warning" />
          </ProgressContainer>
          <ProgressContainer>
            <ProgressBar value={25} variant="danger" />
          </ProgressContainer>
        </Stack>
      </Section>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack $gap={24}>
      <Section>
        <SectionTitle>Small</SectionTitle>
        <ProgressContainer>
          <ProgressBar value={60} size="sm" />
        </ProgressContainer>
      </Section>
      <Section>
        <SectionTitle>Medium (Default)</SectionTitle>
        <ProgressContainer>
          <ProgressBar value={60} size="md" />
        </ProgressContainer>
      </Section>
    </Stack>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Stack $gap={16}>
      <ProgressContainer>
        <ProgressBar value={72} variant="success" showLabel />
      </ProgressContainer>
      <ProgressContainer>
        <ProgressBar value={25} variant="danger" showLabel />
      </ProgressContainer>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('72%')).toBeInTheDocument();
    await expect(canvas.getByText('25%')).toBeInTheDocument();
  },
};

export const Animated: Story = {
  render: () => (
    <ProgressContainer>
      <ProgressBar value={65} variant="default" animated showLabel />
    </ProgressContainer>
  ),
};
