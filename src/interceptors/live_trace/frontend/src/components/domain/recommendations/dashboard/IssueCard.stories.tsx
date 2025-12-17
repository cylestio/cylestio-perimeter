import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { IssueCard } from './IssueCard';
import type { Recommendation } from '@api/types/findings';

const meta: Meta<typeof IssueCard> = {
  title: 'Domain/Recommendations/Dashboard/IssueCard',
  component: IssueCard,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onCopyCommand: { action: 'copy command' },
    onMarkFixed: { action: 'mark fixed' },
    onDismiss: { action: 'dismiss' },
  },
};

export default meta;
type Story = StoryObj<typeof IssueCard>;

const baseRecommendation: Recommendation = {
  recommendation_id: 'REC-001ABCDE',
  workflow_id: 'test-workflow',
  source_type: 'STATIC',
  source_finding_id: 'FND-abc123',
  category: 'PROMPT',
  severity: 'CRITICAL',
  cvss_score: 9.1,
  owasp_llm: 'LLM01',
  cwe: 'CWE-74',
  soc2_controls: ['CC6.6'],
  title: 'Direct Prompt Injection Vulnerability',
  description: 'User input is directly concatenated into the system prompt without sanitization.',
  impact: 'Attacker can manipulate agent behavior, extract system prompt, or perform unauthorized actions.',
  fix_hints: 'Add input validation and use parameterized prompts',
  fix_complexity: 'Medium',
  file_path: 'src/agent.py',
  line_start: 42,
  line_end: 42,
  code_snippet: 'prompt = f"Help user with: {user_input}"',
  status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const ExpandCollapse: Story = {
  args: {
    recommendation: baseRecommendation,
    defaultExpanded: false,
  },
  play: async ({ canvas }) => {
    // Click to expand
    const expandButton = canvas.getByRole('button', { name: /more/i });
    await userEvent.click(expandButton);

    // Verify expanded content is visible
    await expect(canvas.getByText(/Impact/i)).toBeInTheDocument();

    // Click to collapse
    const collapseButton = canvas.getByRole('button', { name: /less/i });
    await userEvent.click(collapseButton);
  },
};

export const ExpandedWithActions: Story = {
  args: {
    recommendation: baseRecommendation,
    defaultExpanded: true,
    onDismiss: fn(),
  },
  play: async ({ canvas, args }) => {
    // Click Risk Accepted button
    const riskAcceptedButton = canvas.getByRole('button', { name: /Risk Accepted/i });
    await userEvent.click(riskAcceptedButton);
    await expect(args.onDismiss).toHaveBeenCalledWith('DISMISSED');
  },
};

export const FalsePositiveAction: Story = {
  args: {
    recommendation: baseRecommendation,
    defaultExpanded: true,
    onDismiss: fn(),
  },
  play: async ({ canvas, args }) => {
    // Click False Positive button
    const falsePositiveButton = canvas.getByRole('button', { name: /False Positive/i });
    await userEvent.click(falsePositiveButton);
    await expect(args.onDismiss).toHaveBeenCalledWith('IGNORED');
  },
};

export const FixingWithMarkFixed: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'FIXING',
    },
    defaultExpanded: true,
    onMarkFixed: fn(),
  },
  play: async ({ canvas, args }) => {
    // Click Mark Fixed button
    const markFixedButton = canvas.getByRole('button', { name: /Mark Fixed/i });
    await userEvent.click(markFixedButton);
    await expect(args.onMarkFixed).toHaveBeenCalled();
  },
};

export const Critical: Story = {
  args: {
    recommendation: baseRecommendation,
  },
};

export const DynamicSource: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      recommendation_id: 'REC-005DYN',
      source_type: 'DYNAMIC',
      category: 'BEHAVIOR',
      severity: 'HIGH',
      title: 'Token Budget Exceeded',
      file_path: undefined,
      line_start: undefined,
    },
  },
};

export const FixedStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'FIXED',
      fixed_by: 'developer@example.com',
      fixed_at: new Date().toISOString(),
    },
  },
  play: async ({ canvas }) => {
    // Verify resolved state - no action buttons should appear when expanded
    const expandButton = canvas.getByRole('button', { name: /more/i });
    await userEvent.click(expandButton);

    // Actions should not be visible for resolved items
    const actionButtons = canvas.queryByRole('button', { name: /Risk Accepted/i });
    await expect(actionButtons).not.toBeInTheDocument();
  },
};

export const DismissedStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'DISMISSED',
      severity: 'MEDIUM',
    },
  },
};

export const IgnoredStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'IGNORED',
      severity: 'LOW',
    },
  },
};
