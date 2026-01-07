import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { ReportView } from './ReportView';

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent-workflow/:agentWorkflowId/report/:reportId" element={children} />
  </Routes>
);

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

// Create mock fetch functions - cast at usage site like Reports.stories.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSuccessFetch = (): ((url: string) => Promise<any>) => {
  return (url: string) => {
    if (url.includes('/api/reports/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReportData),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createLoadingFetch = (): (() => Promise<any>) => {
  return () => new Promise(() => {});
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createErrorFetch = (): (() => Promise<any>) => {
  return () =>
    Promise.resolve({
      ok: false,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'Report not found' }),
    });
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
};

export default meta;
type Story = StoryObj<typeof ReportView>;

export const Default: Story = {
  decorators: [
    (Story) => {
      window.fetch = createSuccessFetch() as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the page to render
    await expect(canvas.getByTestId('report-view')).toBeInTheDocument();

    // Verify page header shows after loading
    await expect(await canvas.findByText('Security Assessment Report')).toBeInTheDocument();

    // Verify back button is present
    await expect(await canvas.findByText('Back to Reports')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      window.fetch = createLoadingFetch() as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify loading state
    await expect(canvas.getByTestId('report-view')).toBeInTheDocument();
    await expect(canvas.getByText('Loading report...')).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  decorators: [
    (Story) => {
      window.fetch = createErrorFetch() as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify error state renders
    await expect(canvas.getByTestId('report-view')).toBeInTheDocument();
  },
};
