import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { Finding, FindingsSummary } from '@api/types/findings';

import { FindingsTab } from './FindingsTab';

const mockFindings: Finding[] = [
  {
    finding_id: 'find_001',
    session_id: 'sess_001',
    agent_workflow_id: 'my-agent-workflow',
    file_path: 'src/handlers/auth.py',
    line_start: 42,
    finding_type: 'PROMPT_INJECTION',
    severity: 'CRITICAL',
    title: 'Critical: Unsanitized user input to LLM',
    description: 'User input passed directly to LLM without validation.',
    evidence: { code_snippet: 'llm.complete(user_input)' },
    owasp_mapping: ['LLM01'],
    status: 'OPEN',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    finding_id: 'find_002',
    session_id: 'sess_001',
    agent_workflow_id: 'my-agent-workflow',
    file_path: 'src/api/endpoints.py',
    line_start: 88,
    finding_type: 'EXCESSIVE_AGENCY',
    severity: 'HIGH',
    title: 'Agent has unrestricted tool access',
    description: 'No permission boundaries on tool invocations.',
    evidence: {},
    owasp_mapping: ['LLM08'],
    status: 'OPEN',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    finding_id: 'find_003',
    session_id: 'sess_001',
    agent_workflow_id: 'my-agent-workflow',
    file_path: 'src/utils/logging.py',
    line_start: 15,
    finding_type: 'DATA_EXPOSURE',
    severity: 'MEDIUM',
    title: 'Sensitive data logged without redaction',
    evidence: {},
    owasp_mapping: ['LLM06'],
    status: 'FIXED',
    created_at: '2024-01-14T09:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
  },
  {
    finding_id: 'find_004',
    session_id: 'sess_001',
    agent_workflow_id: 'my-agent-workflow',
    file_path: 'src/config.py',
    line_start: 5,
    finding_type: 'MISCONFIGURATION',
    severity: 'LOW',
    title: 'Debug mode enabled in production config',
    evidence: {},
    owasp_mapping: [],
    status: 'IGNORED',
    created_at: '2024-01-13T08:00:00Z',
    updated_at: '2024-01-13T08:00:00Z',
  },
];

const mockSummary: FindingsSummary = {
  agent_workflow_id: 'my-agent-workflow',
  total_findings: 4,
  by_severity: {
    CRITICAL: 1,
    HIGH: 1,
    MEDIUM: 1,
    LOW: 1,
  },
  by_status: {
    OPEN: 2,
    FIXED: 1,
    IGNORED: 1,
  },
  open_count: 2,
  fixed_count: 1,
  ignored_count: 1,
};

const meta: Meta<typeof FindingsTab> = {
  title: 'Domain/Findings/FindingsTab',
  component: FindingsTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FindingsTab>;

export const Default: Story = {
  args: {
    findings: mockFindings,
    summary: mockSummary,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Total Findings')).toBeInTheDocument();
    await expect(canvas.getByText('4')).toBeInTheDocument();
    await expect(canvas.getByText('Critical: Unsanitized user input to LLM')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    findings: [],
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // When loading, no findings or empty state should be shown
    await expect(canvas.queryByText('No findings')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Total Findings')).not.toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    findings: [],
    error: 'Failed to load findings. Please try again.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Failed to load findings. Please try again.')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    findings: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No findings')).toBeInTheDocument();
    await expect(canvas.getByText('No security findings detected for this agent')).toBeInTheDocument();
  },
};

export const WithFilters: Story = {
  args: {
    findings: mockFindings,
    summary: mockSummary,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click on CRITICAL filter
    const criticalFilter = canvas.getByText('CRITICAL (1)');
    await userEvent.click(criticalFilter);

    // Only critical finding should be visible
    await expect(canvas.getByText('Critical: Unsanitized user input to LLM')).toBeInTheDocument();
    await expect(canvas.queryByText('Agent has unrestricted tool access')).not.toBeInTheDocument();

    // Click All Severities to reset
    const allSeverities = canvas.getByText('All Severities');
    await userEvent.click(allSeverities);

    // All findings visible again
    await expect(canvas.getByText('Agent has unrestricted tool access')).toBeInTheDocument();
  },
};

export const FilterByStatus: Story = {
  args: {
    findings: mockFindings,
    summary: mockSummary,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click on Fixed status filter
    const fixedFilter = canvas.getByText('Fixed (1)');
    await userEvent.click(fixedFilter);

    // Only fixed finding should be visible
    await expect(canvas.getByText('Sensitive data logged without redaction')).toBeInTheDocument();
    await expect(canvas.queryByText('Critical: Unsanitized user input to LLM')).not.toBeInTheDocument();
  },
};

export const NoMatchingFilters: Story = {
  args: {
    findings: mockFindings.filter((f) => f.severity !== 'LOW'),
    summary: {
      ...mockSummary,
      by_severity: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 0 },
      total_findings: 3,
    },
  },
  play: async ({ canvasElement }) => {
    // LOW filter should not be present since count is 0
    await expect(within(canvasElement).queryByText(/LOW \(\d+\)/)).not.toBeInTheDocument();
  },
};
