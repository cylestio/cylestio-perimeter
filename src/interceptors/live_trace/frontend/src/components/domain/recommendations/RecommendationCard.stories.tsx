import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { RecommendationCard } from './RecommendationCard';
import type { Recommendation } from '@api/types/findings';

const meta: Meta<typeof RecommendationCard> = {
  title: 'Domain/Recommendations/RecommendationCard',
  component: RecommendationCard,
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
    onViewFinding: { action: 'view finding' },
  },
};

export default meta;
type Story = StoryObj<typeof RecommendationCard>;

const baseRecommendation: Recommendation = {
  recommendation_id: 'REC-001',
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

export const Critical: Story = {
  args: {
    recommendation: baseRecommendation,
    showFixAction: true,
    onCopyCommand: fn(),
    onDismiss: fn(),
    onViewFinding: fn(),
  },
  play: async ({ canvas }) => {
    // Verify critical severity is displayed
    await expect(canvas.getByText(/Direct Prompt Injection/i)).toBeInTheDocument();
    await expect(canvas.getByText(/CVSS 9.1/i)).toBeInTheDocument();

    // Test Fix button is present and clickable
    const fixButton = canvas.getByRole('button', { name: /\/fix/i });
    await expect(fixButton).toBeInTheDocument();
    await userEvent.click(fixButton);
    // Note: onCopyCommand may not be called if clipboard API is unavailable in test env
  },
};

export const High: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      recommendation_id: 'REC-002',
      severity: 'HIGH',
      cvss_score: 7.5,
      category: 'TOOL',
      owasp_llm: 'LLM08',
      title: 'Dangerous Tool Without Constraints',
      description: 'Shell execution tool has no input validation or path constraints.',
      file_path: 'src/tools.py',
      line_start: 15,
    },
    showFixAction: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Dangerous Tool/i)).toBeInTheDocument();
    await expect(canvas.getByText(/CVSS 7.5/i)).toBeInTheDocument();
  },
};

export const Medium: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      recommendation_id: 'REC-003',
      severity: 'MEDIUM',
      cvss_score: 5.3,
      category: 'DATA',
      owasp_llm: 'LLM06',
      title: 'PII Logged in Debug Mode',
      description: 'User email and name are logged in debug output.',
      file_path: 'src/logger.py',
      line_start: 78,
    },
    showFixAction: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/PII Logged/i)).toBeInTheDocument();
    await expect(canvas.getByText(/CVSS 5.3/i)).toBeInTheDocument();
  },
};

export const Low: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      recommendation_id: 'REC-004',
      severity: 'LOW',
      cvss_score: 2.0,
      category: 'SUPPLY',
      owasp_llm: 'LLM05',
      title: 'Unpinned Model Version',
      description: 'Model version is not pinned, may get unexpected behavior changes.',
      file_path: 'config.py',
      line_start: 5,
    },
    showFixAction: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Unpinned Model/i)).toBeInTheDocument();
    await expect(canvas.getByText(/CVSS 2/i)).toBeInTheDocument();
  },
};

export const DynamicSource: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      recommendation_id: 'REC-005',
      source_type: 'DYNAMIC',
      category: 'BEHAVIOR',
      severity: 'HIGH',
      title: 'Token Budget Exceeded',
      description: 'Agent consistently exceeds token budget in production sessions.',
      file_path: undefined,
      line_start: undefined,
    },
    showFixAction: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: /Token Budget Exceeded/i })).toBeInTheDocument();
    await expect(canvas.getByText(/Dynamic/i)).toBeInTheDocument();
  },
};

export const FixingStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'FIXING',
      fixed_by: 'claude-opus-4.5',
    },
    showFixAction: true,
    onMarkFixed: fn(),
    onDismiss: fn(),
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText(/Direct Prompt Injection/i)).toBeInTheDocument();

    // Open dropdown menu
    const moreButton = canvas.getByRole('button', { name: '' });
    await userEvent.click(moreButton);

    // Click Mark as Fixed option
    const markFixedOption = canvas.getByText(/Mark as Fixed/i);
    await expect(markFixedOption).toBeInTheDocument();
    await userEvent.click(markFixedOption);
    await expect(args.onMarkFixed).toHaveBeenCalled();
  },
};

export const FixedStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'FIXED',
      fixed_by: 'developer@example.com',
      fixed_at: new Date().toISOString(),
      fix_notes: 'Added input validation using pydantic model',
      files_modified: ['src/agent.py', 'src/models.py'],
    },
    showFixAction: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Direct Prompt Injection/i)).toBeInTheDocument();
    await expect(canvas.getByText(/FIXED/i)).toBeInTheDocument();
  },
};

export const VerifiedStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'VERIFIED',
      fixed_by: 'developer@example.com',
      fixed_at: new Date(Date.now() - 86400000).toISOString(),
      fix_notes: 'Added input validation using pydantic model',
    },
    showFixAction: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Direct Prompt Injection/i)).toBeInTheDocument();
    await expect(canvas.getByText(/VERIFIED/i)).toBeInTheDocument();
  },
};

export const DismissedStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      recommendation_id: 'REC-010',
      status: 'DISMISSED',
      severity: 'MEDIUM',
    },
    showFixAction: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Direct Prompt Injection/i)).toBeInTheDocument();
    await expect(canvas.getByText(/DISMISSED/i)).toBeInTheDocument();
  },
};

export const WithAllFrameworks: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      owasp_llm: 'LLM01',
      cwe: 'CWE-74',
      soc2_controls: ['CC6.6', 'CC6.1'],
      cvss_score: 9.1,
    },
    showFixAction: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Direct Prompt Injection/i)).toBeInTheDocument();
    await expect(canvas.getByText(/LLM01/i)).toBeInTheDocument();
  },
};

export const WithDismissInteraction: Story = {
  args: {
    recommendation: baseRecommendation,
    showFixAction: true,
    onDismiss: fn(),
  },
  play: async ({ canvas, args }) => {
    // Open dropdown menu
    const moreButton = canvas.getByRole('button', { name: '' });
    await userEvent.click(moreButton);

    // Click Dismiss - Risk Accepted option
    const dismissOption = canvas.getByText(/Dismiss - Risk Accepted/i);
    await expect(dismissOption).toBeInTheDocument();
    await userEvent.click(dismissOption);
    await expect(args.onDismiss).toHaveBeenCalledWith('DISMISSED');
  },
};
