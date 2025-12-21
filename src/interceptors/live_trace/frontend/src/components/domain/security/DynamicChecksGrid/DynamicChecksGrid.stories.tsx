import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';

import type { DynamicSecurityCheck, DynamicCategoryDefinition, DynamicCategoryId } from '@api/types/security';

import { DynamicChecksGrid } from './DynamicChecksGrid';

const meta: Meta<typeof DynamicChecksGrid> = {
  title: 'Domain/Security/DynamicChecksGrid',
  component: DynamicChecksGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DynamicChecksGrid>;

// Mock data
const mockChecks: DynamicSecurityCheck[] = [
  // Resource Management
  {
    check_id: 'RESOURCE_001_TOKEN_BOUNDS',
    agent_id: 'agent-123',
    category_id: 'RESOURCE_MANAGEMENT',
    check_type: 'token_bounds',
    status: 'passed',
    title: 'Token Budget Usage',
    value: '12,500 / 50,000',
    description: 'Validates that per-session token usage stays within the allowed range.',
  },
  {
    check_id: 'RESOURCE_002_TOOL_CALL_BOUNDS',
    agent_id: 'agent-123',
    category_id: 'RESOURCE_MANAGEMENT',
    check_type: 'tool_call_bounds',
    status: 'passed',
    title: 'Tool Call Volume',
    value: '25 / 50',
    description: 'Validates that tool invocations remain within expected limits.',
  },
  // Environment
  {
    check_id: 'ENV_001_CONSISTENT_MODEL',
    agent_id: 'agent-123',
    category_id: 'ENVIRONMENT',
    check_type: 'consistent_model',
    status: 'warning',
    title: 'Pinned Model Usage',
    value: 'gpt-4 (not versioned)',
    description: 'Ensures every LLM call pins a specific, versioned model.',
  },
  {
    check_id: 'ENV_003_UNUSED_TOOLS',
    agent_id: 'agent-123',
    category_id: 'ENVIRONMENT',
    check_type: 'unused_tools',
    status: 'warning',
    title: 'Unused Tools Inventory',
    value: '3 unused',
    description: 'Flags provisioned tools that are never exercised.',
  },
  // Behavioral
  {
    check_id: 'BEHAV_001_STABILITY_SCORE',
    agent_id: 'agent-123',
    category_id: 'BEHAVIORAL',
    check_type: 'stability_score',
    status: 'passed',
    title: 'Behavioral Stability Score',
    value: '87%',
    description: 'Largest-cluster share × purity.',
  },
  {
    check_id: 'BEHAV_002_OUTLIER_RATE',
    agent_id: 'agent-123',
    category_id: 'BEHAVIORAL',
    check_type: 'outlier_rate',
    status: 'warning',
    title: 'Behavioral Outlier Rate',
    value: '15%',
    description: 'Tracks the share of sessions that diverge from patterns.',
  },
  // Privacy
  {
    check_id: 'PII_001_DETECTION',
    agent_id: 'agent-123',
    category_id: 'PRIVACY_COMPLIANCE',
    check_type: 'pii_detection',
    status: 'critical',
    title: 'PII Detection',
    value: '3 entities found',
    description: 'Scans message content for PII.',
    recommendations: [
      'Implement PII redaction',
      'Review data handling policies',
    ],
    framework_mappings: {
      owasp_llm: 'LLM06',
      owasp_llm_name: 'Sensitive Information Disclosure',
      soc2_controls: ['PI1.1'],
      cwe: 'CWE-359',
    },
  },
  {
    check_id: 'PII_003_EXPOSURE_RATE',
    agent_id: 'agent-123',
    category_id: 'PRIVACY_COMPLIANCE',
    check_type: 'pii_exposure',
    status: 'analyzing',
    title: 'PII Exposure Rate',
    description: 'Measures the proportion of sessions containing PII.',
  },
];

const categoryDefinitions: Record<DynamicCategoryId, DynamicCategoryDefinition> = {
  RESOURCE_MANAGEMENT: {
    name: 'Resource Management',
    description: 'Token and tool usage boundaries',
    icon: 'bar-chart',
    order: 1,
  },
  ENVIRONMENT: {
    name: 'Environment & Supply Chain',
    description: 'Model version pinning and tool adoption',
    icon: 'settings',
    order: 2,
  },
  BEHAVIORAL: {
    name: 'Behavioral Stability',
    description: 'Behavioral consistency and predictability',
    icon: 'brain',
    order: 3,
  },
  PRIVACY_COMPLIANCE: {
    name: 'Privacy & PII Compliance',
    description: 'PII exposure detection and reporting',
    icon: 'lock',
    order: 4,
  },
};

// Stories
export const Default: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'category',
    variant: 'list',
    clickable: true,
    showSummary: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('8')).toBeInTheDocument(); // Total count
    await expect(canvas.getByText('Token Budget Usage')).toBeInTheDocument();
    await expect(canvas.getByText('PII Detection')).toBeInTheDocument();
  },
};

export const GroupedByStatus: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'status',
    variant: 'list',
    clickable: true,
    showSummary: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
    await expect(canvas.getByText('Warning')).toBeInTheDocument();
    await expect(canvas.getByText('Passed')).toBeInTheDocument();
  },
};

export const FlatList: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'none',
    variant: 'list',
    clickable: true,
    showSummary: true,
  },
};

export const GridLayout: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'category',
    variant: 'grid',
    clickable: true,
    showSummary: true,
  },
};

export const OnlyCriticalAndWarning: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'none',
    variant: 'list',
    clickable: true,
    showSummary: true,
    statusFilter: ['critical', 'warning'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should not show passed checks
    await expect(canvas.queryByText('Token Budget Usage')).not.toBeInTheDocument();
    // Should show warning and critical checks
    await expect(canvas.getByText('PII Detection')).toBeInTheDocument();
    await expect(canvas.getByText('Pinned Model Usage')).toBeInTheDocument();
  },
};

export const WithoutSummary: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'category',
    variant: 'list',
    clickable: true,
    showSummary: false,
  },
};

export const NonClickable: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'category',
    variant: 'list',
    clickable: false,
    showSummary: true,
  },
};

export const Empty: Story = {
  args: {
    checks: [],
    categoryDefinitions,
    groupBy: 'category',
    variant: 'list',
    clickable: true,
    showSummary: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No Security Checks')).toBeInTheDocument();
  },
};

export const ClickOpensDrawer: Story = {
  args: {
    checks: mockChecks,
    categoryDefinitions,
    groupBy: 'category',
    variant: 'list',
    clickable: true,
    showSummary: true,
    agentWorkflowId: 'workflow-123',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the PII Detection check
    const piiCheck = canvas.getByText('PII Detection');
    const checkItem = piiCheck.closest('[role="button"]');
    if (checkItem) {
      await userEvent.click(checkItem);
    }

    // Wait for drawer to open
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify drawer content in document body (portal)
    const body = document.body;
    const drawer = within(body);
    const statusBadge = drawer.getByTestId('drawer-status-badge');
    await expect(statusBadge).toHaveTextContent(/critical/i);
  },
};
