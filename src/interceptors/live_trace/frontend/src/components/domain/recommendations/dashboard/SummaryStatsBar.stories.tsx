import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryStatsBar } from './SummaryStatsBar';
import type { Recommendation, RecommendationStatus } from '@api/types/findings';

const meta: Meta<typeof SummaryStatsBar> = {
  title: 'Domain/Recommendations/Dashboard/SummaryStatsBar',
  component: SummaryStatsBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SummaryStatsBar>;

const createRecommendation = (
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  status: RecommendationStatus = 'PENDING'
): Recommendation => ({
  recommendation_id: `REC-${Math.random().toString(36).slice(2, 10)}`,
  workflow_id: 'test-workflow',
  source_type: 'STATIC',
  source_finding_id: 'FND-001',
  category: 'PROMPT',
  severity,
  cvss_score: severity === 'CRITICAL' ? 9.5 : severity === 'HIGH' ? 7.5 : severity === 'MEDIUM' ? 5.0 : 2.0,
  title: `${severity} Issue`,
  description: 'Test description',
  status,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const mockRecommendations: Recommendation[] = [
  createRecommendation('CRITICAL'),
  createRecommendation('CRITICAL'),
  createRecommendation('HIGH'),
  createRecommendation('HIGH'),
  createRecommendation('HIGH'),
  createRecommendation('MEDIUM'),
  createRecommendation('MEDIUM'),
  createRecommendation('LOW'),
];

export const Default: Story = {
  args: {
    recommendations: mockRecommendations,
    gateStatus: 'BLOCKED',
    blockingCritical: 2,
    blockingHigh: 3,
  },
};

export const AllGatesPassed: Story = {
  args: {
    recommendations: [
      createRecommendation('LOW'),
      createRecommendation('LOW'),
    ],
    gateStatus: 'OPEN',
    blockingCritical: 0,
    blockingHigh: 0,
  },
};

export const BothGatesBlocked: Story = {
  args: {
    recommendations: mockRecommendations,
    gateStatus: 'BLOCKED',
    blockingCritical: 2,
    blockingHigh: 3,
  },
};

export const NoIssues: Story = {
  args: {
    recommendations: [],
    gateStatus: 'OPEN',
    blockingCritical: 0,
    blockingHigh: 0,
  },
};
