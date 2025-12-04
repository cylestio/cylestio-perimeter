import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AlertTriangle, Zap, Shield, Check } from 'lucide-react';
import styled from 'styled-components';
import { Badge, SeverityDot, ModePill, CorrelationBadge } from './Badge';

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

// ===========================================
// BADGE STORIES
// ===========================================

const badgeMeta: Meta<typeof Badge> = {
  title: 'UI/Core/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['critical', 'high', 'medium', 'low', 'success', 'info', 'ai'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
};

export default badgeMeta;
type BadgeStory = StoryObj<typeof Badge>;

export const Default: BadgeStory = {
  args: {
    children: 'Badge',
    variant: 'info',
  },
};

export const Variants: BadgeStory = {
  render: () => (
    <Row>
      <Badge variant="critical">Critical</Badge>
      <Badge variant="high">High</Badge>
      <Badge variant="medium">Medium</Badge>
      <Badge variant="low">Low</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="ai">AI</Badge>
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
    await expect(canvas.getByText('AI')).toBeInTheDocument();
  },
};

export const Sizes: BadgeStory = {
  render: () => (
    <Stack>
      <Row>
        <Badge size="sm" variant="info">
          Small
        </Badge>
        <Badge size="md" variant="info">
          Medium
        </Badge>
      </Row>
      <Row>
        <Badge size="sm" variant="critical">
          CVE-2024
        </Badge>
        <Badge size="md" variant="critical">
          CVE-2024-1234
        </Badge>
      </Row>
    </Stack>
  ),
};

export const WithIcon: BadgeStory = {
  render: () => (
    <Row>
      <Badge variant="critical" icon={<AlertTriangle size={12} />}>
        Alert
      </Badge>
      <Badge variant="ai" icon={<Zap size={12} />}>
        AI Generated
      </Badge>
      <Badge variant="success" icon={<Check size={12} />}>
        Verified
      </Badge>
      <Badge variant="info" icon={<Shield size={12} />}>
        Protected
      </Badge>
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Alert')).toBeInTheDocument();
    await expect(canvas.getByText('AI Generated')).toBeInTheDocument();
  },
};

// ===========================================
// SEVERITY DOT STORIES
// ===========================================

export const SeverityDots: BadgeStory = {
  render: () => (
    <Stack>
      <Section>
        <SectionTitle>Severity Dots - Medium Size</SectionTitle>
        <Row $gap={24}>
          <Row $gap={8}>
            <SeverityDot severity="critical" />
            <span>Critical</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="high" />
            <span>High</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="medium" />
            <span>Medium</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="low" />
            <span>Low</span>
          </Row>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Severity Dots - Small Size</SectionTitle>
        <Row $gap={24}>
          <Row $gap={8}>
            <SeverityDot severity="critical" size="sm" />
            <span>Critical</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="high" size="sm" />
            <span>High</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="medium" size="sm" />
            <span>Medium</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="low" size="sm" />
            <span>Low</span>
          </Row>
        </Row>
      </Section>

      <Section>
        <SectionTitle>With Glow Effect</SectionTitle>
        <Row $gap={24}>
          <Row $gap={8}>
            <SeverityDot severity="critical" glow />
            <span>Critical (glow)</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="high" glow />
            <span>High (glow)</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="medium" glow />
            <span>Medium (no glow defined)</span>
          </Row>
        </Row>
      </Section>
    </Stack>
  ),
};

// ===========================================
// MODE PILL STORIES
// ===========================================

export const ModePills: BadgeStory = {
  render: () => (
    <Stack>
      <Section>
        <SectionTitle>Active States</SectionTitle>
        <Row>
          <ModePill active pulsing>
            Monitoring Active
          </ModePill>
          <ModePill active pulsing={false}>
            Active (no pulse)
          </ModePill>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Inactive State</SectionTitle>
        <Row>
          <ModePill active={false}>Monitoring Paused</ModePill>
        </Row>
      </Section>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Monitoring Active')).toBeInTheDocument();
    await expect(canvas.getByText('Monitoring Paused')).toBeInTheDocument();
  },
};

// ===========================================
// CORRELATION BADGE STORIES
// ===========================================

export const CorrelationBadges: BadgeStory = {
  render: () => (
    <Stack>
      <Section>
        <SectionTitle>All Correlation Statuses</SectionTitle>
        <Row>
          <CorrelationBadge status="confirmed" />
          <CorrelationBadge status="controlled" />
          <CorrelationBadge status="discovered" />
          <CorrelationBadge status="pending" />
          <CorrelationBadge status="triggered" />
        </Row>
      </Section>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CONFIRMED')).toBeInTheDocument();
    await expect(canvas.getByText('CONTROLLED')).toBeInTheDocument();
    await expect(canvas.getByText('DISCOVERED')).toBeInTheDocument();
    await expect(canvas.getByText('PENDING')).toBeInTheDocument();
    await expect(canvas.getByText('TRIGGERED')).toBeInTheDocument();
  },
};

// ===========================================
// COMBINED SHOWCASE
// ===========================================

export const Showcase: BadgeStory = {
  render: () => (
    <Stack $gap={32}>
      <Section>
        <SectionTitle>Badge Variants</SectionTitle>
        <Row>
          <Badge variant="critical">Critical</Badge>
          <Badge variant="high">High</Badge>
          <Badge variant="medium">Medium</Badge>
          <Badge variant="low">Low</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="ai">AI</Badge>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Severity Indicators</SectionTitle>
        <Row $gap={24}>
          <Row $gap={8}>
            <SeverityDot severity="critical" />
            <span>Critical</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="high" />
            <span>High</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="medium" />
            <span>Medium</span>
          </Row>
          <Row $gap={8}>
            <SeverityDot severity="low" />
            <span>Low</span>
          </Row>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Mode Pills</SectionTitle>
        <Row>
          <ModePill active>Active Mode</ModePill>
          <ModePill active={false}>Inactive Mode</ModePill>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Correlation Status</SectionTitle>
        <Row>
          <CorrelationBadge status="confirmed" />
          <CorrelationBadge status="controlled" />
          <CorrelationBadge status="discovered" />
          <CorrelationBadge status="pending" />
          <CorrelationBadge status="triggered" />
        </Row>
      </Section>
    </Stack>
  ),
};
