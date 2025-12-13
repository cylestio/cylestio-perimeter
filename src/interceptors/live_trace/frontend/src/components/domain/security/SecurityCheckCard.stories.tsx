import type { Meta, StoryObj } from '@storybook/react';

import { SecurityCheckCard } from './SecurityCheckCard';

const meta: Meta<typeof SecurityCheckCard> = {
  title: 'Domain/Security/SecurityCheckCard',
  component: SecurityCheckCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SecurityCheckCard>;

const mockFindings = [
  {
    finding_id: 'F-001',
    session_id: 'S-001',
    agent_id: 'W-001',
    file_path: 'src/agent.py',
    line_start: 42,
    finding_type: 'PROMPT_INJECT_DIRECT',
    severity: 'CRITICAL' as const,
    title: 'Direct prompt injection vulnerability',
    description: 'User input directly concatenated to system prompt',
    evidence: { code_snippet: 'prompt = system + user_input' },
    owasp_mapping: ['LLM01'],
    status: 'OPEN' as const,
    created_at: '2024-12-12T10:00:00Z',
    updated_at: '2024-12-12T10:00:00Z',
  },
  {
    finding_id: 'F-002',
    session_id: 'S-001',
    agent_id: 'W-001',
    file_path: 'src/handlers.py',
    line_start: 87,
    finding_type: 'PROMPT_SYSTEM_LEAK',
    severity: 'HIGH' as const,
    title: 'System prompt may be leaked',
    description: 'System prompt exposed in error messages',
    evidence: { code_snippet: 'raise Error(f"Failed: {system_prompt}")' },
    owasp_mapping: ['LLM01'],
    status: 'OPEN' as const,
    created_at: '2024-12-12T10:00:00Z',
    updated_at: '2024-12-12T10:00:00Z',
  },
];

export const Failed: Story = {
  args: {
    categoryId: 'PROMPT_SECURITY',
    name: 'Prompt Security',
    status: 'FAIL',
    owaspLlm: 'LLM01',
    findingsCount: 2,
    maxSeverity: 'CRITICAL',
    findings: mockFindings,
  },
};

export const Passed: Story = {
  args: {
    categoryId: 'SUPPLY_CHAIN',
    name: 'Model & Supply Chain',
    status: 'PASS',
    owaspLlm: 'LLM05',
    findingsCount: 0,
  },
};

export const Info: Story = {
  args: {
    categoryId: 'TOOL_SECURITY',
    name: 'Tool & Function Security',
    status: 'INFO',
    owaspLlm: 'LLM08',
    cwe: ['CWE-20'],
    findingsCount: 3,
    maxSeverity: 'MEDIUM',
  },
};

export const WithSoc2Controls: Story = {
  args: {
    categoryId: 'DATA_SECURITY',
    name: 'Data & Secrets',
    status: 'FAIL',
    owaspLlm: 'LLM06',
    soc2Controls: ['CC6.1', 'CC7.2'],
    findingsCount: 1,
    maxSeverity: 'HIGH',
  },
};

export const Expanded: Story = {
  args: {
    categoryId: 'PROMPT_SECURITY',
    name: 'Prompt Security',
    status: 'FAIL',
    owaspLlm: 'LLM01',
    findingsCount: 2,
    maxSeverity: 'CRITICAL',
    findings: mockFindings,
    defaultExpanded: true,
  },
};
