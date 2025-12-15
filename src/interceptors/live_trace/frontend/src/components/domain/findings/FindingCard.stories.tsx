import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { Finding } from '@api/types/findings';

import { FindingCard } from './FindingCard';

const mockFinding: Finding = {
  finding_id: 'find_001',
  session_id: 'sess_001',
  agent_workflow_id: 'my-agent-workflow',
  file_path: 'src/handlers/auth.py',
  line_start: 42,
  line_end: 48,
  finding_type: 'PROMPT_INJECTION',
  severity: 'HIGH',
  title: 'Potential prompt injection vulnerability',
  description: 'User input is passed directly to the LLM without sanitization, allowing potential prompt injection attacks.',
  evidence: {
    code_snippet: 'prompt = f"User says: {user_input}"\\nresponse = llm.complete(prompt)',
    context: 'The user_input variable comes from an HTTP request body without validation.',
  },
  owasp_mapping: ['LLM01', 'LLM02'],
  status: 'OPEN',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const meta: Meta<typeof FindingCard> = {
  title: 'Domain/Findings/FindingCard',
  component: FindingCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FindingCard>;

export const Default: Story = {
  args: {
    finding: mockFinding,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Potential prompt injection vulnerability')).toBeInTheDocument();
    await expect(canvas.getByText('HIGH')).toBeInTheDocument();
    // OPEN status is intentionally not shown as a badge - severity alone indicates open items
    await expect(canvas.queryByText('OPEN')).not.toBeInTheDocument();
  },
};

export const Expanded: Story = {
  args: {
    finding: mockFinding,
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Description')).toBeInTheDocument();
    await expect(canvas.getByText('Code Snippet')).toBeInTheDocument();
    await expect(canvas.getByText('LLM01')).toBeInTheDocument();
  },
};

export const CriticalSeverity: Story = {
  args: {
    finding: {
      ...mockFinding,
      severity: 'CRITICAL',
      title: 'Arbitrary code execution via unsafe eval',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('CRITICAL')).toBeInTheDocument();
  },
};

export const FixedStatus: Story = {
  args: {
    finding: {
      ...mockFinding,
      status: 'FIXED',
      updated_at: '2024-01-16T14:00:00Z',
    },
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('FIXED')).toBeInTheDocument();
  },
};

export const MinimalFinding: Story = {
  args: {
    finding: {
      ...mockFinding,
      description: undefined,
      evidence: {},
      owasp_mapping: [],
      line_start: undefined,
      line_end: undefined,
    },
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Metadata')).toBeInTheDocument();
    // Description section should not be present
    const description = canvas.queryByText('Description');
    await expect(description).not.toBeInTheDocument();
  },
};

export const ExpandCollapse: Story = {
  args: {
    finding: mockFinding,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially collapsed - no description visible
    await expect(canvas.queryByText('Description')).not.toBeInTheDocument();

    // Click to expand
    const header = canvas.getByText('Potential prompt injection vulnerability').closest('div');
    if (header) {
      await userEvent.click(header);
    }

    // Now description should be visible
    await expect(canvas.getByText('Description')).toBeInTheDocument();

    // Click to collapse
    if (header) {
      await userEvent.click(header);
    }

    // Description should be hidden again
    await expect(canvas.queryByText('Description')).not.toBeInTheDocument();
  },
};
