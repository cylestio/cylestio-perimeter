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
    // Handle production readiness endpoint
    if (url.includes('/api/dashboard/production-readiness')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          static_analysis: { status: 'completed' },
          dynamic_analysis: { status: 'completed' },
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

export const WithReportHistory: Story = {
  decorators: [
    (Story) => {
      window.fetch = ((url: string) => {
        // Handle report history endpoint with data
        if (url.includes('/api/workflow/') && url.includes('/reports')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              reports: [
                {
                  report_id: 'report-1',
                  agent_workflow_id: 'test-agent-workflow',
                  report_type: 'security_assessment',
                  report_name: 'Security Assessment Report',
                  generated_at: new Date(Date.now() - 3600000).toISOString(),
                  risk_score: 35,
                  gate_status: 'OPEN',
                  findings_count: 5,
                  recommendations_count: 3,
                  critical_count: 0,
                  high_count: 1,
                  medium_count: 2,
                },
                {
                  report_id: 'report-2',
                  agent_workflow_id: 'test-agent-workflow',
                  report_type: 'security_assessment',
                  report_name: 'Security Assessment Report',
                  generated_at: new Date(Date.now() - 86400000).toISOString(),
                  risk_score: 72,
                  gate_status: 'BLOCKED',
                  findings_count: 12,
                  recommendations_count: 8,
                  critical_count: 2,
                  high_count: 3,
                  medium_count: 4,
                },
              ],
            }),
          });
        }
        // Handle production readiness endpoint
        if (url.includes('/api/dashboard/production-readiness')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              static_analysis: { status: 'completed' },
              dynamic_analysis: { status: 'completed' },
            }),
          });
        }
        return Promise.reject(new Error(`Unknown URL: ${url}`));
      }) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Component shows report history section
    await expect(await canvas.findByText('Report History')).toBeInTheDocument();
    // The page should show the reports section with generate button
    await expect(await canvas.findByText('Generate Report')).toBeInTheDocument();
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
