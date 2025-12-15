import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { Reports } from './Reports';

// Create mock fetch function for Reports page
const createMockFetch = () => {
  return (url: string) => {
    // Handle report history endpoint
    if (url.includes('/api/workflow/') && url.includes('/reports')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ reports: [] }),
      });
    }
    // Handle compliance report endpoint
    if (url.includes('/api/workflow/') && url.includes('/compliance-report')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          report_type: 'security_assessment',
          workflow_id: 'test-agent-workflow',
          generated_at: new Date().toISOString(),
          executive_summary: {
            gate_status: 'OPEN',
            is_blocked: false,
            risk_score: 25,
            decision: 'GO',
            decision_message: 'Ready for production',
            total_findings: 0,
            open_findings: 0,
            fixed_findings: 0,
            dismissed_findings: 0,
            blocking_count: 0,
            blocking_critical: 0,
            blocking_high: 0,
          },
          owasp_llm_coverage: {},
          soc2_compliance: {},
          security_checks: {},
          static_analysis: { sessions_count: 0, last_scan: null, findings_count: 0 },
          dynamic_analysis: { sessions_count: 0, last_analysis: null },
          remediation_summary: {
            total_recommendations: 0,
            pending: 0,
            fixing: 0,
            fixed: 0,
            verified: 0,
            dismissed: 0,
            resolved: 0,
          },
          audit_trail: [],
          blocking_items: [],
          findings_detail: [],
          recommendations_detail: [],
        }),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

const meta: Meta<typeof Reports> = {
  title: 'Pages/Reports',
  component: Reports,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/reports'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Reports>;

// Wrapper to provide route params - must use agentWorkflowId to match component
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent-workflow/:agentWorkflowId/reports" element={children} />
  </Routes>
);

export const Default: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch() as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Reports')).toBeInTheDocument();
    // Component shows "Generate Report" section
    await expect(await canvas.findByText('Generate Report')).toBeInTheDocument();
  },
};

export const WithTemplates: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch() as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Component shows 3 report templates
    await expect(await canvas.findByText('Security Assessment')).toBeInTheDocument();
    await expect(await canvas.findByText('Executive Summary')).toBeInTheDocument();
    await expect(await canvas.findByText('Customer Due Diligence')).toBeInTheDocument();
  },
};

export const EmptyReports: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch() as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Component shows empty state for report history
    await expect(await canvas.findByText('No previous reports')).toBeInTheDocument();
  },
};
