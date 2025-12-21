import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';

import type { DynamicSecurityCheck, DynamicCategoryDefinition } from '@api/types/security';

import { Button } from '@ui/core/Button';

import { DynamicCheckDrawer } from './DynamicCheckDrawer';

const meta: Meta<typeof DynamicCheckDrawer> = {
  title: 'Domain/Security/DynamicCheckDrawer',
  component: DynamicCheckDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DynamicCheckDrawer>;

// Mock data
const criticalCheck: DynamicSecurityCheck = {
  check_id: 'PII_001_DETECTION',
  agent_id: 'agent-123',
  agent_workflow_id: 'workflow-456',
  category_id: 'PRIVACY_COMPLIANCE',
  check_type: 'pii_detection',
  status: 'critical',
  title: 'PII Detection',
  value: '3 entities found',
  description:
    'Scans message content for personally identifiable information across entity types including names, emails, phone numbers, and addresses.',
  evidence: {
    total_entities: 3,
    entity_types: ['EMAIL', 'PHONE_NUMBER', 'PERSON'],
    sessions_affected: 2,
    detection_confidence: 0.95,
  },
  recommendations: [
    'Implement PII redaction before sending to LLM',
    'Review data handling policies for sensitive PII',
    'Consider using synthetic data for testing',
    'Set up data loss prevention (DLP) monitoring',
  ],
  framework_mappings: {
    owasp_llm: 'LLM06',
    owasp_llm_name: 'Sensitive Information Disclosure',
    soc2_controls: ['PI1.1', 'CC6.5'],
    cwe: 'CWE-359',
    mitre: 'T1530',
    cvss_score: 8.0,
  },
  affected_sessions: ['session-abc123', 'session-def456'],
};

const warningCheck: DynamicSecurityCheck = {
  check_id: 'BEHAV_002_OUTLIER_RATE',
  agent_id: 'agent-123',
  category_id: 'BEHAVIORAL',
  check_type: 'outlier_rate',
  status: 'warning',
  title: 'Behavioral Outlier Rate',
  value: '15% (threshold: 10%)',
  description:
    'Tracks the share of sessions that diverge from established behavioral patterns. High outlier rates may indicate inconsistent agent behavior.',
  evidence: {
    outlier_count: 3,
    total_sessions: 20,
    outlier_rate: 0.15,
    threshold: 0.10,
  },
  recommendations: [
    'Investigate outlier sessions for root causes',
    'Add validation checks for unusual input patterns',
    'Implement fallback behaviors for edge cases',
  ],
  framework_mappings: {
    owasp_llm: 'LLM08',
    owasp_llm_name: 'Excessive Agency',
    soc2_controls: ['CC7.2'],
  },
};

const passedCheck: DynamicSecurityCheck = {
  check_id: 'RESOURCE_001_TOKEN_BOUNDS',
  agent_id: 'agent-123',
  category_id: 'RESOURCE_MANAGEMENT',
  check_type: 'token_bounds',
  status: 'passed',
  title: 'Token Budget Usage',
  value: '12,500 / 50,000 (25%)',
  description:
    'Validates that per-session token usage stays within the allowed range.',
  evidence: {
    max_tokens_used: 12500,
    token_limit: 50000,
    sessions_checked: 15,
    violations: 0,
  },
  recommendations: [],
  framework_mappings: {
    owasp_llm: 'LLM08',
    owasp_llm_name: 'Excessive Agency',
    soc2_controls: ['CC6.1', 'CC6.8'],
    cwe: 'CWE-770',
    mitre: 'T1499',
  },
};

const categoryDefinition: DynamicCategoryDefinition = {
  name: 'Privacy & PII Compliance',
  description: 'Detects and reports PII exposure in messages and prompts.',
  icon: 'lock',
  order: 4,
};

// Interactive wrapper component
const DrawerWrapper = ({
  check,
  categoryDefinition,
}: {
  check: DynamicSecurityCheck;
  categoryDefinition?: DynamicCategoryDefinition;
}) => {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ padding: 20 }}>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <DynamicCheckDrawer
        check={check}
        categoryDefinition={categoryDefinition}
        open={open}
        onClose={() => setOpen(false)}
        agentWorkflowId="workflow-123"
      />
    </div>
  );
};

// Stories
export const Critical: Story = {
  render: () => <DrawerWrapper check={criticalCheck} categoryDefinition={categoryDefinition} />,
  play: async () => {
    // Wait for drawer animation to complete
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Check that the drawer content is visible (uses portal)
    const drawer = within(document.body);
    const drawerTitle = await drawer.findByTestId('drawer-title');
    await expect(drawerTitle).toHaveTextContent('PII Detection');
    const statusBadge = await drawer.findByTestId('drawer-status-badge');
    await expect(statusBadge).toHaveTextContent(/critical/i);
  },
};

export const Warning: Story = {
  render: () => <DrawerWrapper check={warningCheck} />,
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const drawer = within(document.body);
    const drawerTitle = await drawer.findByTestId('drawer-title');
    await expect(drawerTitle).toHaveTextContent('Behavioral Outlier Rate');
    const statusBadge = await drawer.findByTestId('drawer-status-badge');
    await expect(statusBadge).toHaveTextContent(/warning/i);
  },
};

export const Passed: Story = {
  render: () => <DrawerWrapper check={passedCheck} />,
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const drawer = within(document.body);
    const drawerTitle = await drawer.findByTestId('drawer-title');
    await expect(drawerTitle).toHaveTextContent('Token Budget Usage');
    const statusBadge = await drawer.findByTestId('drawer-status-badge');
    await expect(statusBadge).toHaveTextContent(/passed/i);
  },
};

export const CanClose: Story = {
  render: () => <DrawerWrapper check={criticalCheck} />,
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const drawer = within(document.body);

    // Find and click close button
    const closeButton = drawer.getByTestId('drawer-close-button');
    await userEvent.click(closeButton);

    // Wait for drawer to close
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify drawer is closed (drawer title should not be visible)
    await expect(drawer.queryByText('PII Detection')).not.toBeInTheDocument();
  },
};
