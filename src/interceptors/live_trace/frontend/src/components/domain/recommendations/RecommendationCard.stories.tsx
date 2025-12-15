import type { Meta, StoryObj } from '@storybook/react-vite';
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
};

export const FixingStatus: Story = {
  args: {
    recommendation: {
      ...baseRecommendation,
      status: 'FIXING',
      fixed_by: 'claude-opus-4.5',
    },
    showFixAction: true,
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
};
