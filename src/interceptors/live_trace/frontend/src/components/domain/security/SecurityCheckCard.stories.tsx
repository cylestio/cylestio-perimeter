import type { Meta, StoryObj } from '@storybook/react';
import { SecurityCheckCard } from './SecurityCheckCard';
import type { SecurityCheck, Finding } from '@api/types/findings';

const meta: Meta<typeof SecurityCheckCard> = {
  title: 'Domain/Security/SecurityCheckCard',
  component: SecurityCheckCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SecurityCheckCard>;

const mockFinding: Finding = {
  finding_id: 'FND-001',
  session_id: 'session-123',
  agent_workflow_id: 'sample-agent',
  file_path: 'agent.py',
  line_start: 42,
  line_end: 45,
  finding_type: 'PROMPT_INJECTION',
  severity: 'CRITICAL',
  title: 'User input concatenated into system prompt',
  description: 'User input is directly concatenated into the system prompt without sanitization, allowing prompt injection attacks.',
  evidence: {
    code_snippet: 'system_prompt = f"You are a helpful assistant. User context: {user_input}"',
    context: 'The user_input variable comes directly from external input without any validation.',
  },
  owasp_mapping: ['LLM01'],
  status: 'OPEN',
  created_at: '2024-12-15T10:30:00Z',
  updated_at: '2024-12-15T10:30:00Z',
};

const passedCheck: SecurityCheck = {
  category_id: 'DATA',
  name: 'Data & Secrets',
  status: 'PASS',
  owasp_llm: ['LLM06'],
  findings_count: 0,
  max_severity: null,
  findings: [],
};

const failedCheck: SecurityCheck = {
  category_id: 'PROMPT',
  name: 'Prompt Security',
  status: 'FAIL',
  owasp_llm: ['LLM01'],
  findings_count: 2,
  max_severity: 'CRITICAL',
  findings: [mockFinding, { ...mockFinding, finding_id: 'FND-002', severity: 'HIGH' }],
};

const infoCheck: SecurityCheck = {
  category_id: 'TOOL',
  name: 'Tool Security',
  status: 'INFO',
  owasp_llm: ['LLM07', 'LLM08'],
  findings_count: 2,
  max_severity: 'MEDIUM',
  findings: [{ ...mockFinding, finding_id: 'FND-003', severity: 'MEDIUM' }],
};

export const Passed: Story = {
  args: {
    check: passedCheck,
  },
};

export const Failed: Story = {
  args: {
    check: failedCheck,
    defaultExpanded: true,
  },
};

export const Info: Story = {
  args: {
    check: infoCheck,
  },
};

export const AllCategories: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <SecurityCheckCard check={failedCheck} />
      <SecurityCheckCard check={infoCheck} />
      <SecurityCheckCard check={passedCheck} />
      <SecurityCheckCard check={{ ...passedCheck, category_id: 'OUTPUT', name: 'Output Security', owasp_llm: ['LLM02'] }} />
      <SecurityCheckCard check={{ ...passedCheck, category_id: 'MEMORY', name: 'Memory & Context', owasp_llm: [] }} />
      <SecurityCheckCard check={{ ...passedCheck, category_id: 'SUPPLY', name: 'Supply Chain', owasp_llm: ['LLM05'] }} />
      <SecurityCheckCard check={{ ...passedCheck, category_id: 'BEHAVIOR', name: 'Behavioral Boundaries', owasp_llm: ['LLM08', 'LLM09'] }} />
    </div>
  ),
};
