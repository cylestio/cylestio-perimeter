import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { ComplianceGauge } from './ComplianceGauge';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  max-width: 400px;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const meta: Meta<typeof ComplianceGauge> = {
  title: 'Domain/Metrics/ComplianceGauge',
  component: ComplianceGauge,
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
type Story = StoryObj<typeof ComplianceGauge>;

export const Default: Story = {
  args: {
    label: 'OWASP LLM Top 10',
    value: 82,
    passed: 9,
    total: 11,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('OWASP LLM Top 10')).toBeInTheDocument();
    await expect(canvas.getByText('82%')).toBeInTheDocument();
    await expect(canvas.getByText('9 of 11 controls passed')).toBeInTheDocument();
  },
};

export const AllLevels: Story = {
  render: () => (
    <Stack>
      <ComplianceGauge label="High Compliance" value={92} passed={11} total={12} />
      <ComplianceGauge label="Medium Compliance" value={65} passed={7} total={11} />
      <ComplianceGauge label="Low Compliance" value={33} passed={3} total={9} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('92%')).toBeInTheDocument();
    await expect(canvas.getByText('65%')).toBeInTheDocument();
    await expect(canvas.getByText('33%')).toBeInTheDocument();
  },
};

export const Frameworks: Story = {
  render: () => (
    <Stack>
      <ComplianceGauge label="OWASP LLM Top 10" value={82} passed={9} total={11} />
      <ComplianceGauge label="NIST AI RMF" value={67} passed={8} total={12} />
      <ComplianceGauge label="ISO 27001" value={91} passed={18} total={20} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('OWASP LLM Top 10')).toBeInTheDocument();
    await expect(canvas.getByText('NIST AI RMF')).toBeInTheDocument();
    await expect(canvas.getByText('ISO 27001')).toBeInTheDocument();
  },
};

export const FullCompliance: Story = {
  args: {
    label: 'All Controls',
    value: 100,
    passed: 10,
    total: 10,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('100%')).toBeInTheDocument();
    await expect(canvas.getByText('10 of 10 controls passed')).toBeInTheDocument();
  },
};
