import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AlertTriangle, Shield, Activity, Zap, RefreshCw } from 'lucide-react';
import styled from 'styled-components';
import { Card, CardHeader, CardContent } from './Card';
import { StatCard } from '@domain/metrics/StatCard';
import { Button } from './Button';
import { Badge } from './Badge';

const Row = styled.div<{ $gap?: number }>`
  display: flex;
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

const CardContainer = styled.div`
  width: 350px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

// ===========================================
// CARD STORIES
// ===========================================

const meta: Meta<typeof Card> = {
  title: 'UI/Core/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'status'],
    },
    status: {
      control: 'select',
      options: ['critical', 'high', 'success'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <CardContainer>
      <Card>
        <Card.Header title="Sessions Overview" />
        <Card.Content>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            47 sessions analyzed in the last 24 hours
          </p>
        </Card.Content>
      </Card>
    </CardContainer>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Sessions Overview')).toBeInTheDocument();
  },
};

export const Elevated: Story = {
  render: () => (
    <CardContainer>
      <Card variant="elevated">
        <Card.Header title="Risk Score" actions={<Badge variant="high">Medium</Badge>} />
        <Card.Content>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#ff9f43',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            52
          </div>
        </Card.Content>
      </Card>
    </CardContainer>
  ),
};

export const StatusCards: Story = {
  render: () => (
    <Stack>
      <Section>
        <SectionTitle>Status Card Variants</SectionTitle>
        <Stack $gap={16}>
          <CardContainer>
            <Card variant="status" status="critical">
              <Card.Header title="SQL Injection Found" />
              <Card.Content>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  Critical vulnerability detected in login form
                </p>
              </Card.Content>
            </Card>
          </CardContainer>

          <CardContainer>
            <Card variant="status" status="high">
              <Card.Header title="Suspicious Activity" />
              <Card.Content>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  Unusual API call patterns detected
                </p>
              </Card.Content>
            </Card>
          </CardContainer>

          <CardContainer>
            <Card variant="status" status="success">
              <Card.Header title="Scan Complete" />
              <Card.Content>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  All security checks passed successfully
                </p>
              </Card.Content>
            </Card>
          </CardContainer>
        </Stack>
      </Section>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('SQL Injection Found')).toBeInTheDocument();
    await expect(canvas.getByText('Scan Complete')).toBeInTheDocument();
  },
};

export const CardWithActions: Story = {
  render: () => (
    <CardContainer>
      <Card>
        <Card.Header
          title="Recent Activity"
          actions={
            <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />}>
              Refresh
            </Button>
          }
        />
        <Card.Content>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Activity feed content here...</p>
        </Card.Content>
      </Card>
    </CardContainer>
  ),
};

export const CardNoPadding: Story = {
  render: () => (
    <CardContainer>
      <Card>
        <Card.Header title="Data Table" />
        <Card.Content noPadding>
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Row 1
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Row 2
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 20px' }}>Row 3</div>
        </Card.Content>
      </Card>
    </CardContainer>
  ),
};

export const FlatAPI: Story = {
  name: 'Flat API (Alternative)',
  render: () => (
    <CardContainer>
      <Card variant="default">
        <CardHeader title="Using Flat API" />
        <CardContent>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            You can also use CardHeader and CardContent as separate imports
          </p>
        </CardContent>
      </Card>
    </CardContainer>
  ),
};

export const CenteredHeader: Story = {
  render: () => (
    <CardContainer>
      <Card>
        <Card.Header
          title="Connect Your Agent"
          subtitle="Point your client to this proxy URL to start capturing requests"
          centered
        />
        <Card.Content>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Content goes here...</p>
        </Card.Content>
      </Card>
    </CardContainer>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Connect Your Agent')).toBeInTheDocument();
    await expect(
      canvas.getByText('Point your client to this proxy URL to start capturing requests')
    ).toBeInTheDocument();
  },
};

export const WithSubtitle: Story = {
  render: () => (
    <CardContainer>
      <Card>
        <Card.Header title="Card Title" subtitle="A subtitle that provides additional context" />
        <Card.Content>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            This card has a subtitle but is left-aligned (default)
          </p>
        </Card.Content>
      </Card>
    </CardContainer>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Card Title')).toBeInTheDocument();
    await expect(
      canvas.getByText('A subtitle that provides additional context')
    ).toBeInTheDocument();
  },
};

// ===========================================
// STAT CARD STORIES
// ===========================================

export const StatCards: Story = {
  render: () => (
    <Section>
      <SectionTitle>Stat Card Color Variants</SectionTitle>
      <Row $gap={16}>
        <StatCard
          icon={<AlertTriangle />}
          iconColor="orange"
          label="Risk Score"
          value={52}
          valueColor="orange"
          detail="Medium · ↑3 this week"
        />
        <StatCard
          icon={<Shield />}
          iconColor="red"
          label="Critical Findings"
          value={8}
          valueColor="red"
          detail="Requires attention"
        />
        <StatCard
          icon={<Activity />}
          iconColor="green"
          label="Healthy Sessions"
          value={42}
          valueColor="green"
          detail="Last 24 hours"
        />
        <StatCard
          icon={<Zap />}
          iconColor="purple"
          label="AI Detections"
          value={156}
          valueColor="purple"
          detail="Automated"
        />
      </Row>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Risk Score')).toBeInTheDocument();
    await expect(canvas.getByText('52')).toBeInTheDocument();
    await expect(canvas.getByText('Critical Findings')).toBeInTheDocument();
  },
};

export const StatCardGrid: Story = {
  render: () => (
    <StatGrid>
      <StatCard
        icon={<AlertTriangle />}
        iconColor="orange"
        label="Risk Score"
        value={52}
        valueColor="orange"
        detail="Medium · ↑3 this week"
      />
      <StatCard
        icon={<Shield />}
        iconColor="red"
        label="Critical"
        value={8}
        valueColor="red"
        detail="Requires attention"
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
    </StatGrid>
  ),
};

export const StatCardDefault: Story = {
  render: () => (
    <Row>
      <StatCard icon={<Activity />} label="Events" value={1234} detail="No color specified" />
    </Row>
  ),
};

// ===========================================
// COMBINED SHOWCASE
// ===========================================

export const Showcase: Story = {
  render: () => (
    <Stack $gap={32}>
      <Section>
        <SectionTitle>Card Variants</SectionTitle>
        <Row $gap={16}>
          <CardContainer>
            <Card>
              <Card.Header title="Default Card" />
              <Card.Content>Standard card with border</Card.Content>
            </Card>
          </CardContainer>
          <CardContainer>
            <Card variant="elevated">
              <Card.Header title="Elevated Card" />
              <Card.Content>Cyan border with glow</Card.Content>
            </Card>
          </CardContainer>
          <CardContainer>
            <Card variant="status" status="critical">
              <Card.Header title="Status Card" />
              <Card.Content>Left border by severity</Card.Content>
            </Card>
          </CardContainer>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Stat Cards</SectionTitle>
        <StatGrid>
          <StatCard
            icon={<AlertTriangle />}
            iconColor="orange"
            label="Risk Score"
            value={52}
            valueColor="orange"
          />
          <StatCard
            icon={<Shield />}
            iconColor="red"
            label="Critical"
            value={8}
            valueColor="red"
          />
          <StatCard
            icon={<Activity />}
            iconColor="green"
            label="Healthy"
            value={42}
            valueColor="green"
          />
          <StatCard
            icon={<Zap />}
            iconColor="purple"
            label="AI Hits"
            value={156}
            valueColor="purple"
          />
        </StatGrid>
      </Section>
    </Stack>
  ),
};
