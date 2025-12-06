import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { RiskScore } from './RiskScore';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  display: flex;
  gap: 32px;
  align-items: center;
`;

const meta: Meta<typeof RiskScore> = {
  title: 'Domain/Metrics/RiskScore',
  component: RiskScore,
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
type Story = StoryObj<typeof RiskScore>;

export const Default: Story = {
  args: {
    value: 52,
    variant: 'hero',
    size: 'lg',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('52')).toBeInTheDocument();
    await expect(canvas.getByText('Medium Risk')).toBeInTheDocument();
  },
};

export const AllRiskLevels: Story = {
  render: () => (
    <Container>
      <RiskScore value={20} variant="hero" size="md" />
      <RiskScore value={45} variant="hero" size="md" />
      <RiskScore value={75} variant="hero" size="md" />
      <RiskScore value={90} variant="hero" size="md" />
    </Container>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Low Risk')).toBeInTheDocument();
    await expect(canvas.getByText('Critical Risk')).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: () => (
    <Container>
      <RiskScore value={52} variant="hero" size="sm" />
      <RiskScore value={52} variant="hero" size="md" />
      <RiskScore value={52} variant="hero" size="lg" />
    </Container>
  ),
  play: async ({ canvas }) => {
    const scores = canvas.getAllByText('52');
    await expect(scores).toHaveLength(3);
  },
};

export const Compact: Story = {
  args: {
    value: 52,
    variant: 'compact',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('52')).toBeInTheDocument();
    await expect(canvas.getByText('Medium Risk')).toBeInTheDocument();
  },
};

export const WithChange: Story = {
  args: {
    value: 52,
    variant: 'hero',
    size: 'lg',
    showChange: true,
    change: 3,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('52')).toBeInTheDocument();
    await expect(canvas.getByText('3')).toBeInTheDocument();
  },
};

export const CompactWithChange: Story = {
  args: {
    value: 28,
    variant: 'compact',
    showChange: true,
    change: -5,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('28')).toBeInTheDocument();
    await expect(canvas.getByText('Low Risk')).toBeInTheDocument();
  },
};
