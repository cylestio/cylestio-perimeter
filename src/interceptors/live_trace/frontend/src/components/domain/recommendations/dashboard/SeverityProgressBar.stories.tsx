import type { Meta, StoryObj } from '@storybook/react-vite';

import { SeverityProgressBar } from './SeverityProgressBar';
import type { Recommendation, RecommendationStatus } from '@api/types/findings';

const meta: Meta<typeof SeverityProgressBar> = {
  title: 'Domain/Recommendations/Dashboard/SeverityProgressBar',
  component: SeverityProgressBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SeverityProgressBar>;

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

export const NoProgress: Story = {
  args: {
    recommendations: [
      createRecommendation('CRITICAL'),
      createRecommendation('HIGH'),
      createRecommendation('MEDIUM'),
      createRecommendation('LOW'),
    ],
  },
};

export const PartialProgress: Story = {
  args: {
    recommendations: [
      createRecommendation('CRITICAL'),
      createRecommendation('CRITICAL', 'FIXED'),
      createRecommendation('HIGH'),
      createRecommendation('HIGH', 'VERIFIED'),
      createRecommendation('MEDIUM'),
      createRecommendation('MEDIUM', 'FIXED'),
      createRecommendation('LOW', 'FIXED'),
    ],
  },
};

export const AllFixed: Story = {
  args: {
    recommendations: [
      createRecommendation('CRITICAL', 'FIXED'),
      createRecommendation('HIGH', 'VERIFIED'),
      createRecommendation('MEDIUM', 'FIXED'),
      createRecommendation('LOW', 'FIXED'),
    ],
  },
};

export const EmptyState: Story = {
  args: {
    recommendations: [],
  },
};

export const OnlyCritical: Story = {
  args: {
    recommendations: [
      createRecommendation('CRITICAL'),
      createRecommendation('CRITICAL'),
      createRecommendation('CRITICAL', 'FIXED'),
    ],
  },
};
