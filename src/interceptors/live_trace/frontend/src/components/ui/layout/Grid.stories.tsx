import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Activity, AlertTriangle, Shield, Zap } from 'lucide-react';
import { StatsRow, TwoColumn, ThreeColumn, Stack } from './Grid';
import { Card } from '../core/Card';
import { StatCard } from '@domain/metrics/StatCard';

const Container = styled.div`
  padding: 24px;
  background: #000;
`;

const meta: Meta<typeof StatsRow> = {
  title: 'UI/Layout/Grid',
  component: StatsRow,
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
type Story = StoryObj<typeof StatsRow>;

export const StatsRowDefault: Story = {
  render: () => (
    <StatsRow>
      <StatCard
        icon={<AlertTriangle />}
        iconColor="orange"
        label="Risk Score"
        value={52}
        valueColor="orange"
        detail="Medium"
      />
      <StatCard
        icon={<Shield />}
        iconColor="red"
        label="Critical"
        value={8}
        valueColor="red"
        detail="Findings"
      />
      <StatCard
        icon={<Activity />}
        iconColor="green"
        label="Sessions"
        value={42}
        valueColor="green"
        detail="Active"
      />
      <StatCard
        icon={<Zap />}
        iconColor="cyan"
        label="Events"
        value="1.2K"
        valueColor="cyan"
        detail="Today"
      />
    </StatsRow>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Risk Score')).toBeInTheDocument();
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
    await expect(canvas.getByText('Sessions')).toBeInTheDocument();
    await expect(canvas.getByText('Events')).toBeInTheDocument();
  },
};

export const StatsRowThreeColumns: Story = {
  render: () => (
    <StatsRow columns={3}>
      <StatCard icon={<Activity />} label="Sessions" value={42} detail="Active" />
      <StatCard icon={<Shield />} label="Findings" value={8} detail="Open" />
      <StatCard icon={<Zap />} label="Events" value="1.2K" detail="Today" />
    </StatsRow>
  ),
};

export const TwoColumnDefault: Story = {
  render: () => (
    <TwoColumn
      main={
        <Card>
          <Card.Header title="Main Content" />
          <Card.Content>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              This is the main content area taking up 2/3 of the width.
            </p>
          </Card.Content>
        </Card>
      }
      sidebar={
        <Card>
          <Card.Header title="Sidebar" />
          <Card.Content>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Sidebar content (1/3 width)</p>
          </Card.Content>
        </Card>
      }
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Main Content')).toBeInTheDocument();
    await expect(canvas.getByText('Sidebar')).toBeInTheDocument();
  },
};

export const ThreeColumnDefault: Story = {
  render: () => (
    <ThreeColumn>
      <Card>
        <Card.Header title="Column 1" />
        <Card.Content>First column</Card.Content>
      </Card>
      <Card>
        <Card.Header title="Column 2" />
        <Card.Content>Second column</Card.Content>
      </Card>
      <Card>
        <Card.Header title="Column 3" />
        <Card.Content>Third column</Card.Content>
      </Card>
    </ThreeColumn>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Column 1')).toBeInTheDocument();
    await expect(canvas.getByText('Column 2')).toBeInTheDocument();
    await expect(canvas.getByText('Column 3')).toBeInTheDocument();
  },
};

export const StackDefault: Story = {
  render: () => (
    <Stack gap="lg">
      <Card>
        <Card.Content>First item in stack</Card.Content>
      </Card>
      <Card>
        <Card.Content>Second item in stack</Card.Content>
      </Card>
      <Card>
        <Card.Content>Third item in stack</Card.Content>
      </Card>
    </Stack>
  ),
};
