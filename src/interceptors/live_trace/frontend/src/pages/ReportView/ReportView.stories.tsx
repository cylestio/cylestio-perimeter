import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { ReportView } from './ReportView';

// Mock the fetch function for stories
const mockReportData = {
  report_id: 'test-report-id',
  agent_workflow_id: 'test-workflow',
  report_type: 'security_assessment' as const,
  report_name: 'Security Assessment - 2024-01-15',
  generated_at: new Date().toISOString(),
  generated_by: 'test-user',
  risk_score: 25,
  gate_status: 'OPEN' as const,
  findings_count: 5,
  recommendations_count: 3,
  report_data: {
    report_type: 'security_assessment' as const,
    workflow_id: 'test-workflow',
    generated_at: new Date().toISOString(),
    executive_summary: {
      gate_status: 'OPEN' as const,
      is_blocked: false,
      risk_score: 25,
      decision: 'GO' as const,
      decision_label: 'Production Ready',
      decision_message: 'System has passed security assessment.',
      total_findings: 5,
      open_findings: 2,
      fixed_findings: 3,
      dismissed_findings: 0,
      blocking_count: 0,
      blocking_critical: 0,
      blocking_high: 0,
    },
    owasp_llm_coverage: {
      'LLM01': { status: 'PASS' as const, name: 'Prompt Injection', message: 'Protected.', findings_count: 0 },
    },
    soc2_compliance: {
      'CC6.1': { status: 'COMPLIANT' as const, name: 'Access Controls', message: 'Implemented.', findings_count: 0 },
    },
    security_checks: {},
    static_analysis: { sessions_count: 3, last_scan: null, findings_count: 2 },
    dynamic_analysis: { sessions_count: 10, last_analysis: null },
    remediation_summary: {
      total_recommendations: 3,
      pending: 1,
      fixing: 1,
      fixed: 1,
      verified: 0,
      dismissed: 0,
      resolved: 1,
    },
    audit_trail: [],
    blocking_items: [],
    findings_detail: [],
    recommendations_detail: [],
  },
};

const meta: Meta<typeof ReportView> = {
  title: 'Pages/ReportView',
  component: ReportView,
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent-workflow/test-workflow/report/test-report-id'],
      route: '/agent-workflow/:agentWorkflowId/report/:reportId',
    },
  },
  decorators: [
    (Story) => {
      // Mock fetch for the story
      const originalFetch = window.fetch;
      window.fetch = async (url: RequestInfo | URL) => {
        const urlString = url.toString();
        if (urlString.includes('/api/reports/')) {
          return new Response(JSON.stringify(mockReportData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return originalFetch(url);
      };

      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ReportView>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the page to render
    await expect(canvas.getByTestId('report-view')).toBeInTheDocument();

    // Verify page header
    await expect(canvas.getByText('Security Assessment Report')).toBeInTheDocument();

    // Verify back button is present
    await expect(canvas.getByText('Back to Reports')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to never resolve (simulates loading)
      window.fetch = () => new Promise(() => {});
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify loading state
    await expect(canvas.getByTestId('report-view')).toBeInTheDocument();
    await expect(canvas.getByText('Loading report...')).toBeInTheDocument();
  },
};

export const Error: Story = {
  decorators: [
    (Story) => {
      // Mock fetch to return error
      window.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Report not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      };
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify error state renders
    await expect(canvas.getByTestId('report-view')).toBeInTheDocument();
  },
};
