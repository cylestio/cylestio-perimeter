import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { RefreshCcw, CheckCircle, Zap } from 'lucide-react';

import type { DeveloperFinding } from '@api/types/code';

import { CodeCheckCard } from './CodeCheckCard';

const meta: Meta<typeof CodeCheckCard> = {
  title: 'Domain/Code/CodeCheckCard',
  component: CodeCheckCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof CodeCheckCard>;

// Sample findings
const sampleOpenFinding: DeveloperFinding = {
  finding_id: 'finding-1',
  session_id: 'session-1',
  agent_workflow_id: 'workflow-1',
  source_type: 'STATIC',
  category: 'TOOL',
  file_path: 'src/tools/api.py',
  line_start: 45,
  finding_type: 'DEV_NO_RETRY',
  severity: 'HIGH',
  title: 'Missing retry logic for API calls',
  description: 'API calls should include retry logic to handle transient failures.',
  evidence: {},
  owasp_mapping: [],
  status: 'OPEN',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  dev_category: 'AVAILABILITY',
  health_impact: 15,
};

const sampleResolvedFinding: DeveloperFinding = {
  ...sampleOpenFinding,
  finding_id: 'finding-2',
  severity: 'MEDIUM',
  title: 'Missing timeout configuration',
  status: 'FIXED',
  health_impact: 5,
};

export const WithOpenFindings: Story = {
  args: {
    category: 'AVAILABILITY',
    name: 'Availability',
    description: 'Network resilience, retry logic, timeout handling',
    icon: <RefreshCcw size={18} />,
    findingsCount: 2,
    openCount: 1,
    findings: [sampleOpenFinding, sampleResolvedFinding],
    healthPenalty: 15,
    defaultExpanded: false,
  },
  play: async ({ canvas }) => {
    // Check that the card renders
    await expect(canvas.getByText('Availability')).toBeInTheDocument();
    await expect(canvas.getByText('1 open')).toBeInTheDocument();
    await expect(canvas.getByText('-15%')).toBeInTheDocument();
    await expect(canvas.getByText('HIGH')).toBeInTheDocument();
  },
};

export const Expanded: Story = {
  args: {
    category: 'AVAILABILITY',
    name: 'Availability',
    description: 'Network resilience, retry logic, timeout handling',
    icon: <RefreshCcw size={18} />,
    findingsCount: 2,
    openCount: 1,
    findings: [sampleOpenFinding, sampleResolvedFinding],
    healthPenalty: 15,
    defaultExpanded: true,
  },
  play: async ({ canvas }) => {
    // Check that findings are visible when expanded
    await expect(canvas.getByText('OPEN (1)')).toBeInTheDocument();
    await expect(canvas.getByText('RESOLVED (1)')).toBeInTheDocument();
    await expect(canvas.getByText('Missing retry logic for API calls')).toBeInTheDocument();
  },
};

export const AllResolved: Story = {
  args: {
    category: 'RELIABILITY',
    name: 'Reliability',
    description: 'Error handling, output validation, tool configuration',
    icon: <CheckCircle size={18} />,
    findingsCount: 1,
    openCount: 0,
    findings: [sampleResolvedFinding],
    healthPenalty: 0,
    defaultExpanded: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Reliability')).toBeInTheDocument();
    await expect(canvas.getByText('1 resolved')).toBeInTheDocument();
  },
};

export const NoFindings: Story = {
  args: {
    category: 'INEFFICIENCY',
    name: 'Efficiency',
    description: 'Resource usage, token optimization, loop bounds',
    icon: <Zap size={18} />,
    findingsCount: 0,
    openCount: 0,
    findings: [],
    healthPenalty: 0,
    defaultExpanded: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Efficiency')).toBeInTheDocument();
    await expect(canvas.getByText('Resource usage, token optimization, loop bounds')).toBeInTheDocument();
  },
};

export const ExpandOnClick: Story = {
  args: {
    category: 'AVAILABILITY',
    name: 'Availability',
    description: 'Network resilience, retry logic, timeout handling',
    icon: <RefreshCcw size={18} />,
    findingsCount: 1,
    openCount: 1,
    findings: [sampleOpenFinding],
    healthPenalty: 15,
    defaultExpanded: false,
  },
  play: async ({ canvas }) => {
    // Initially collapsed
    await expect(canvas.queryByText('OPEN (1)')).not.toBeInTheDocument();

    // Click to expand
    const card = canvas.getByText('Availability').closest('div')?.parentElement?.parentElement;
    if (card) {
      await userEvent.click(card);
      await expect(canvas.getByText('OPEN (1)')).toBeInTheDocument();
    }
  },
};
