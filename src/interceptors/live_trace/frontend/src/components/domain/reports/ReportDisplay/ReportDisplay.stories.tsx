import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';

import type { ComplianceReportResponse } from '@api/endpoints/agentWorkflow';

import { ReportDisplay } from './ReportDisplay';

// Mock report data for stories
const mockReport: ComplianceReportResponse = {
  report_type: 'security_assessment',
  workflow_id: 'test-workflow',
  generated_at: new Date().toISOString(),
  executive_summary: {
    gate_status: 'OPEN',
    is_blocked: false,
    risk_score: 25,
    decision: 'GO',
    decision_label: 'Production Ready',
    is_advisory: true,
    advisory_notice: 'Advisory only - does not block deployments.',
    decision_message: 'System has passed security assessment with minor recommendations.',
    total_findings: 5,
    open_findings: 2,
    fixed_findings: 3,
    dismissed_findings: 0,
    blocking_count: 0,
    blocking_critical: 0,
    blocking_high: 0,
  },
  business_impact: {
    overall_risk: 'LOW',
    overall_description: 'Low risk to business operations.',
    impacts: {
      remote_code_execution: { risk_level: 'NONE', description: 'No RCE vulnerabilities detected.' },
      data_exfiltration: { risk_level: 'LOW', description: 'Minor data handling concerns.' },
      privilege_escalation: { risk_level: 'NONE', description: 'No privilege escalation risks.' },
      supply_chain: { risk_level: 'NONE', description: 'Dependencies are secure.' },
      compliance_violation: { risk_level: 'NONE', description: 'Compliant with standards.' },
    },
    executive_bullets: [
      'No critical security vulnerabilities detected',
      'Minor improvements recommended for logging',
    ],
  },
  owasp_llm_coverage: {
    'LLM01': { status: 'PASS', name: 'Prompt Injection', message: 'Protected against prompt injection.', findings_count: 0 },
    'LLM02': { status: 'PASS', name: 'Insecure Output Handling', message: 'Output properly sanitized.', findings_count: 0 },
    'LLM03': { status: 'WARNING', name: 'Training Data Poisoning', message: 'Review training data sources.', findings_count: 1 },
  },
  soc2_compliance: {
    'CC6.1': { status: 'COMPLIANT', name: 'Logical Access Controls', message: 'Access controls implemented.', findings_count: 0 },
    'CC6.7': { status: 'COMPLIANT', name: 'Encryption', message: 'Data encrypted in transit.', findings_count: 0 },
  },
  security_checks: {},
  static_analysis: {
    sessions_count: 3,
    last_scan: null,
    findings_count: 2,
  },
  dynamic_analysis: {
    sessions_count: 10,
    last_analysis: null,
    sessions_analyzed: 10,
    checks_total: 6,
    checks_passed: 5,
    behavioral_stability: 0.85,
  },
  remediation_summary: {
    total_recommendations: 5,
    pending: 2,
    fixing: 1,
    fixed: 2,
    verified: 0,
    dismissed: 0,
    resolved: 2,
  },
  audit_trail: [],
  blocking_items: [],
  findings_detail: [],
  recommendations_detail: [
    {
      recommendation_id: 'REC-001',
      title: 'Add input validation',
      description: 'Implement input validation for user-provided prompts.',
      severity: 'MEDIUM',
      category: 'INPUT_VALIDATION',
      status: 'PENDING',
      fix_complexity: 'LOW',
      fix_hints: 'Use a validation library to sanitize inputs.',
    },
    {
      recommendation_id: 'REC-002',
      title: 'Enable audit logging',
      description: 'Enable comprehensive audit logging for all API calls.',
      severity: 'LOW',
      category: 'LOGGING',
      status: 'FIXED',
      fix_complexity: 'LOW',
    },
  ],
};

const blockedReport: ComplianceReportResponse = {
  ...mockReport,
  executive_summary: {
    ...mockReport.executive_summary,
    gate_status: 'BLOCKED',
    is_blocked: true,
    risk_score: 75,
    decision: 'NO-GO',
    decision_label: 'Attention Required',
    decision_message: 'Critical security issues must be addressed before production.',
    blocking_count: 2,
    blocking_critical: 1,
    blocking_high: 1,
  },
  blocking_items: [
    {
      recommendation_id: 'REC-CRIT-001',
      title: 'Prompt injection vulnerability detected',
      description: 'User input is passed directly to LLM without sanitization.',
      severity: 'CRITICAL',
      category: 'INJECTION',
      file_path: 'src/handlers/chat.py',
      line_start: 45,
      line_end: 52,
      code_snippet: 'prompt = f"User said: {user_input}"',
      fix_hints: 'Use template-based prompts with proper escaping.',
      impact: 'Attackers could manipulate the LLM to bypass security controls.',
      owasp_mapping: 'LLM01',
      cvss_score: 9.1,
    },
    {
      recommendation_id: 'REC-HIGH-001',
      title: 'Sensitive data in logs',
      description: 'API keys are being logged in debug output.',
      severity: 'HIGH',
      category: 'DATA_EXPOSURE',
      file_path: 'src/utils/logger.py',
      line_start: 23,
      fix_hints: 'Mask sensitive data before logging.',
      impact: 'API keys could be exposed in log aggregation systems.',
      owasp_mapping: 'LLM06',
    },
  ],
};

const meta: Meta<typeof ReportDisplay> = {
  title: 'Domain/Reports/ReportDisplay',
  component: ReportDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    reportType: {
      control: 'select',
      options: ['security_assessment', 'executive_summary', 'customer_dd'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReportDisplay>;

export const Default: Story = {
  args: {
    report: mockReport,
    workflowId: 'my-agent-workflow',
    reportType: 'security_assessment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify component renders
    await expect(canvas.getByTestId('report-display')).toBeInTheDocument();

    // Verify header content
    await expect(canvas.getByText('my-agent-workflow')).toBeInTheDocument();
    await expect(canvas.getByText('Production Ready (Advisory)')).toBeInTheDocument();

    // Verify tabs are present
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Compliance')).toBeInTheDocument();

    // Verify stats are displayed
    await expect(canvas.getByText('Risk Score')).toBeInTheDocument();
    await expect(canvas.getByText('25')).toBeInTheDocument();
  },
};

export const Blocked: Story = {
  args: {
    report: blockedReport,
    workflowId: 'blocked-workflow',
    reportType: 'security_assessment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify component renders
    await expect(canvas.getByTestId('report-display')).toBeInTheDocument();

    // Verify blocked status
    await expect(canvas.getByText('Attention Required (Advisory)')).toBeInTheDocument();
    await expect(canvas.getByText('75')).toBeInTheDocument();

    // Verify blocking items badge on Evidences tab
    const evidencesTab = canvas.getByText('Evidences');
    await expect(evidencesTab).toBeInTheDocument();
  },
};

export const TabNavigation: Story = {
  args: {
    report: blockedReport,
    workflowId: 'tab-test-workflow',
    reportType: 'security_assessment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click on Dynamic Analysis tab
    const dynamicTab = canvas.getByText('Dynamic Analysis');
    await userEvent.click(dynamicTab);
    await expect(canvas.getByText('Dynamic Analysis Results')).toBeInTheDocument();

    // Click on Compliance tab
    const complianceTab = canvas.getByText('Compliance');
    await userEvent.click(complianceTab);
    await expect(canvas.getByText('Compliance Posture')).toBeInTheDocument();

    // Click on Evidences tab
    const evidencesTab = canvas.getByText('Evidences');
    await userEvent.click(evidencesTab);
    await expect(canvas.getByText(/Security Evidences/)).toBeInTheDocument();

    // Click on Remediation tab
    const remediationTab = canvas.getByText('Remediation Plan');
    await userEvent.click(remediationTab);
    await expect(canvas.getByText('Pending')).toBeInTheDocument();
  },
};

export const WithRefreshCallback: Story = {
  args: {
    report: mockReport,
    workflowId: 'refresh-test',
    reportType: 'security_assessment',
    onRefresh: () => console.log('Refresh clicked'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify refresh button is present when callback provided
    await expect(canvas.getByText('Refresh')).toBeInTheDocument();

    // Verify export buttons are present
    await expect(canvas.getByText('Export Markdown')).toBeInTheDocument();
    await expect(canvas.getByText('Export HTML')).toBeInTheDocument();
  },
};
