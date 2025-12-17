import type { Meta, StoryObj } from '@storybook/react-vite';

import { DetectionTimeline } from './DetectionTimeline';
import type { Recommendation } from '@api/types/findings';

const meta: Meta<typeof DetectionTimeline> = {
  title: 'Domain/Recommendations/Dashboard/DetectionTimeline',
  component: DetectionTimeline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DetectionTimeline>;

const createRecommendation = (
  daysAgo: number,
  status: 'PENDING' | 'FIXED' | 'VERIFIED' = 'PENDING',
  fixedDaysAgo?: number
): Recommendation => {
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);

  const fixedAt = fixedDaysAgo !== undefined ? new Date() : undefined;
  if (fixedAt) {
    fixedAt.setDate(fixedAt.getDate() - fixedDaysAgo!);
  }

  return {
    recommendation_id: `REC-${Math.random().toString(36).slice(2, 10)}`,
    workflow_id: 'test-workflow',
    source_type: 'STATIC',
    source_finding_id: 'FND-001',
    category: 'PROMPT',
    severity: 'HIGH',
    cvss_score: 7.5,
    title: 'Test Issue',
    description: 'Test description',
    status,
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
    fixed_at: fixedAt?.toISOString(),
  };
};

export const Default: Story = {
  args: {
    recommendations: [
      // Detected over last 7 days
      createRecommendation(0),
      createRecommendation(0),
      createRecommendation(1),
      createRecommendation(2),
      createRecommendation(2),
      createRecommendation(3),
      createRecommendation(5),
      // Fixed issues
      createRecommendation(5, 'FIXED', 3),
      createRecommendation(4, 'FIXED', 2),
      createRecommendation(3, 'VERIFIED', 1),
    ],
  },
};

export const OnlyDetected: Story = {
  args: {
    recommendations: [
      createRecommendation(0),
      createRecommendation(1),
      createRecommendation(2),
      createRecommendation(3),
      createRecommendation(4),
    ],
  },
};

export const AllResolved: Story = {
  args: {
    recommendations: [
      createRecommendation(5, 'FIXED', 4),
      createRecommendation(4, 'FIXED', 3),
      createRecommendation(3, 'VERIFIED', 2),
      createRecommendation(2, 'FIXED', 1),
      createRecommendation(1, 'VERIFIED', 0),
    ],
  },
};

export const Empty: Story = {
  args: {
    recommendations: [],
  },
};

export const SingleDay: Story = {
  args: {
    recommendations: [
      createRecommendation(0),
      createRecommendation(0),
      createRecommendation(0, 'FIXED', 0),
    ],
  },
};
