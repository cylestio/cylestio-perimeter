import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';

import { CorrelationBadge } from './CorrelationBadge';

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const meta: Meta<typeof CorrelationBadge> = {
  title: 'Domain/Correlation/CorrelationBadge',
  component: CorrelationBadge,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CorrelationBadge>;

export const Validated: Story = {
  args: {
    state: 'VALIDATED',
  },
};

export const Unexercised: Story = {
  args: {
    state: 'UNEXERCISED',
  },
};

export const RuntimeOnly: Story = {
  args: {
    state: 'RUNTIME_ONLY',
  },
};

export const Theoretical: Story = {
  args: {
    state: 'THEORETICAL',
  },
};

export const WithEvidence: Story = {
  args: {
    state: 'VALIDATED',
    evidence: 'Triggered 12 times in session abc-123 during tool execution',
  },
};

export const AllStates: Story = {
  render: () => (
    <Stack>
      <Row>
        <CorrelationBadge state="VALIDATED" />
        <CorrelationBadge state="UNEXERCISED" />
        <CorrelationBadge state="RUNTIME_ONLY" />
        <CorrelationBadge state="THEORETICAL" />
      </Row>
    </Stack>
  ),
};
