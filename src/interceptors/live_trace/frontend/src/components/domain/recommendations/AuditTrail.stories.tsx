import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuditTrail, type AuditLogEntry } from './AuditTrail';

const meta: Meta<typeof AuditTrail> = {
  title: 'Domain/Recommendations/AuditTrail',
  component: AuditTrail,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuditTrail>;

const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const sampleEntries: AuditLogEntry[] = [
  {
    id: 'audit-001',
    entity_type: 'recommendation',
    entity_id: 'REC-001',
    action: 'RECOMMENDATION_CREATED',
    performed_by: 'AI Security Scanner',
    performed_at: daysAgo(3),
    details: {},
  },
  {
    id: 'audit-002',
    entity_type: 'recommendation',
    entity_id: 'REC-001',
    action: 'FIX_STARTED',
    performed_by: 'claude-opus-4.5',
    performed_at: daysAgo(2),
    details: {},
  },
  {
    id: 'audit-003',
    entity_type: 'recommendation',
    entity_id: 'REC-001',
    action: 'FIX_COMPLETED',
    performed_by: 'claude-opus-4.5',
    performed_at: hoursAgo(48),
    details: {
      notes: 'Added input validation using pydantic model with length limits and sanitization.',
      files_modified: ['src/agent.py', 'src/models.py'],
      fix_method: 'AI_ASSISTED',
    },
  },
  {
    id: 'audit-004',
    entity_type: 'recommendation',
    entity_id: 'REC-001',
    action: 'FIX_VERIFIED',
    performed_by: 'Security Team',
    performed_at: hoursAgo(24),
    details: {
      verification_result: 'Re-scan confirmed vulnerability is resolved. No prompt injection vectors detected.',
    },
  },
];

export const Default: Story = {
  args: {
    entries: sampleEntries,
  },
};

export const WithDismissal: Story = {
  args: {
    entries: [
      {
        id: 'audit-001',
        entity_type: 'recommendation',
        entity_id: 'REC-002',
        action: 'RECOMMENDATION_CREATED',
        performed_by: 'AI Security Scanner',
        performed_at: daysAgo(5),
        details: {},
      },
      {
        id: 'audit-002',
        entity_type: 'recommendation',
        entity_id: 'REC-002',
        action: 'RECOMMENDATION_DISMISSED',
        performed_by: 'developer@example.com',
        performed_at: daysAgo(2),
        details: {
          reason: 'This is test code only, never runs in production. Risk accepted for MVP deadline.',
        },
      },
    ],
  },
};

export const WithFalsePositive: Story = {
  args: {
    entries: [
      {
        id: 'audit-001',
        entity_type: 'recommendation',
        entity_id: 'REC-003',
        action: 'RECOMMENDATION_CREATED',
        performed_by: 'AI Security Scanner',
        performed_at: daysAgo(1),
        details: {},
      },
      {
        id: 'audit-002',
        entity_type: 'recommendation',
        entity_id: 'REC-003',
        action: 'RECOMMENDATION_IGNORED',
        performed_by: 'security-lead@example.com',
        performed_at: hoursAgo(12),
        details: {
          reason: 'The variable is not actually user-controlled - it comes from an internal service with validated input.',
        },
      },
    ],
  },
};

export const RecentActivity: Story = {
  args: {
    entries: [
      {
        id: 'audit-001',
        entity_type: 'recommendation',
        entity_id: 'REC-004',
        action: 'RECOMMENDATION_CREATED',
        performed_by: 'AI Security Scanner',
        performed_at: hoursAgo(2),
        details: {},
      },
      {
        id: 'audit-002',
        entity_type: 'recommendation',
        entity_id: 'REC-004',
        action: 'FIX_STARTED',
        performed_by: 'gpt-4o',
        performed_at: hoursAgo(1),
        details: {},
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};

export const SingleEntry: Story = {
  args: {
    entries: [
      {
        id: 'audit-001',
        entity_type: 'recommendation',
        entity_id: 'REC-005',
        action: 'RECOMMENDATION_CREATED',
        performed_by: 'AI Security Scanner',
        performed_at: hoursAgo(5),
        details: {},
      },
    ],
  },
};

export const LongHistory: Story = {
  args: {
    entries: [
      {
        id: 'audit-001',
        entity_type: 'recommendation',
        entity_id: 'REC-006',
        action: 'RECOMMENDATION_CREATED',
        performed_by: 'AI Security Scanner',
        performed_at: daysAgo(14),
        details: {},
      },
      {
        id: 'audit-002',
        entity_type: 'recommendation',
        entity_id: 'REC-006',
        action: 'FIX_STARTED',
        performed_by: 'junior-dev@example.com',
        performed_at: daysAgo(10),
        details: {},
      },
      {
        id: 'audit-003',
        entity_type: 'recommendation',
        entity_id: 'REC-006',
        action: 'REOPENED',
        performed_by: 'security-review@example.com',
        performed_at: daysAgo(7),
        details: {
          reason: 'Fix was incomplete - still possible to bypass validation with unicode characters.',
        },
      },
      {
        id: 'audit-004',
        entity_type: 'recommendation',
        entity_id: 'REC-006',
        action: 'FIX_STARTED',
        performed_by: 'claude-sonnet-4',
        performed_at: daysAgo(5),
        details: {},
      },
      {
        id: 'audit-005',
        entity_type: 'recommendation',
        entity_id: 'REC-006',
        action: 'FIX_COMPLETED',
        performed_by: 'claude-sonnet-4',
        performed_at: daysAgo(5),
        details: {
          notes: 'Added unicode normalization and comprehensive character filtering.',
          files_modified: ['src/validation.py'],
          fix_method: 'AI_ASSISTED',
        },
      },
      {
        id: 'audit-006',
        entity_type: 'recommendation',
        entity_id: 'REC-006',
        action: 'FIX_VERIFIED',
        performed_by: 'Security Team',
        performed_at: daysAgo(3),
        details: {
          verification_result: 'Verified with fuzzing tests - no bypass vectors found.',
        },
      },
    ],
  },
};
