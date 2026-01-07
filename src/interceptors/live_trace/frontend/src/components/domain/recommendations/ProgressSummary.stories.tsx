import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSummary } from './ProgressSummary';
import type { Recommendation } from '@api/types/findings';

const meta: Meta<typeof ProgressSummary> = {
  title: 'Domain/Recommendations/ProgressSummary',
  component: ProgressSummary,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProgressSummary>;

const createRecommendation = (
  id: string,
  status: Recommendation['status'],
  severity: Recommendation['severity'],
  sourceType: 'STATIC' | 'DYNAMIC' = 'STATIC'
): Recommendation => ({
  recommendation_id: id,
  workflow_id: 'test-workflow',
  source_type: sourceType,
  source_finding_id: `FND-${id}`,
  category: 'PROMPT',
  severity,
  title: `Test Recommendation ${id}`,
  status,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const Blocked: Story = {
  args: {
    gateStatus: 'BLOCKED',
    recommendations: [
      createRecommendation('REC-001', 'PENDING', 'CRITICAL'),
      createRecommendation('REC-002', 'PENDING', 'HIGH'),
      createRecommendation('REC-003', 'FIXING', 'HIGH'),
      createRecommendation('REC-004', 'FIXED', 'MEDIUM'),
      createRecommendation('REC-005', 'VERIFIED', 'LOW'),
    ],
    blockingCritical: 1,
    blockingHigh: 2,
  },
};

export const Unblocked: Story = {
  args: {
    gateStatus: 'OPEN',
    recommendations: [
      createRecommendation('REC-001', 'FIXED', 'CRITICAL'),
      createRecommendation('REC-002', 'FIXED', 'HIGH'),
      createRecommendation('REC-003', 'VERIFIED', 'HIGH'),
      createRecommendation('REC-004', 'DISMISSED', 'MEDIUM'),
      createRecommendation('REC-005', 'VERIFIED', 'LOW'),
    ],
    blockingCritical: 0,
    blockingHigh: 0,
  },
};

export const InProgress: Story = {
  args: {
    gateStatus: 'BLOCKED',
    recommendations: [
      createRecommendation('REC-001', 'FIXED', 'CRITICAL'),
      createRecommendation('REC-002', 'FIXING', 'HIGH'),
      createRecommendation('REC-003', 'PENDING', 'HIGH'),
      createRecommendation('REC-004', 'PENDING', 'MEDIUM'),
    ],
    blockingCritical: 0,
    blockingHigh: 2,
  },
};

export const AllPending: Story = {
  args: {
    gateStatus: 'BLOCKED',
    recommendations: [
      createRecommendation('REC-001', 'PENDING', 'CRITICAL'),
      createRecommendation('REC-002', 'PENDING', 'CRITICAL'),
      createRecommendation('REC-003', 'PENDING', 'HIGH'),
      createRecommendation('REC-004', 'PENDING', 'HIGH'),
      createRecommendation('REC-005', 'PENDING', 'HIGH'),
    ],
    blockingCritical: 2,
    blockingHigh: 3,
  },
};

export const MixedSources: Story = {
  args: {
    gateStatus: 'BLOCKED',
    recommendations: [
      createRecommendation('REC-001', 'PENDING', 'CRITICAL', 'STATIC'),
      createRecommendation('REC-002', 'PENDING', 'HIGH', 'STATIC'),
      createRecommendation('REC-003', 'FIXING', 'HIGH', 'DYNAMIC'),
      createRecommendation('REC-004', 'FIXED', 'MEDIUM', 'STATIC'),
      createRecommendation('REC-005', 'DISMISSED', 'MEDIUM', 'DYNAMIC'),
    ],
    blockingCritical: 1,
    blockingHigh: 2,
  },
};

export const NearlyComplete: Story = {
  args: {
    gateStatus: 'BLOCKED',
    recommendations: [
      createRecommendation('REC-001', 'VERIFIED', 'CRITICAL'),
      createRecommendation('REC-002', 'FIXED', 'HIGH'),
      createRecommendation('REC-003', 'VERIFIED', 'HIGH'),
      createRecommendation('REC-004', 'VERIFIED', 'MEDIUM'),
      createRecommendation('REC-005', 'FIXING', 'HIGH'),
    ],
    blockingCritical: 0,
    blockingHigh: 1,
  },
};

export const SingleIssue: Story = {
  args: {
    gateStatus: 'BLOCKED',
    recommendations: [
      createRecommendation('REC-001', 'PENDING', 'CRITICAL'),
    ],
    blockingCritical: 1,
    blockingHigh: 0,
  },
};

export const AllDismissed: Story = {
  args: {
    gateStatus: 'OPEN',
    recommendations: [
      createRecommendation('REC-001', 'DISMISSED', 'MEDIUM'),
      createRecommendation('REC-002', 'IGNORED', 'MEDIUM'),
      createRecommendation('REC-003', 'DISMISSED', 'LOW'),
    ],
    blockingCritical: 0,
    blockingHigh: 0,
  },
};

export const Empty: Story = {
  args: {
    gateStatus: 'OPEN',
    recommendations: [],
    blockingCritical: 0,
    blockingHigh: 0,
  },
};
