import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { StaticAnalysis } from './StaticAnalysis';

const meta: Meta<typeof StaticAnalysis> = {
  title: 'Pages/StaticAnalysis',
  component: StaticAnalysis,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/static-analysis'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaticAnalysis>;

// Mock sessions and findings data
const mockStaticSession = {
  session_id: 'sess_abc123def456',
  agent_workflow_id: 'test-agent-workflow',
  agent_workflow_name: 'Test Agent Workflow',
  session_type: 'STATIC',
  status: 'COMPLETED',
  created_at: Date.now() / 1000 - 3600, // 1 hour ago
  completed_at: Date.now() / 1000 - 3000, // 50 minutes ago
  findings_count: 5,
  risk_score: 65,
};

const mockAutofixSession = {
  session_id: 'sess_fix789xyz012',
  agent_workflow_id: 'test-agent-workflow',
  agent_workflow_name: 'Test Agent Workflow',
  session_type: 'AUTOFIX',
  status: 'COMPLETED',
  created_at: Date.now() / 1000 - 1800, // 30 minutes ago
  completed_at: Date.now() / 1000 - 1500, // 25 minutes ago
  findings_count: 2,
  risk_score: null,
};

const mockRunningSession = {
  session_id: 'sess_running456',
  agent_workflow_id: 'test-agent-workflow',
  agent_workflow_name: 'Test Agent Workflow',
  session_type: 'STATIC',
  status: 'IN_PROGRESS',
  created_at: Date.now() / 1000 - 300, // 5 minutes ago
  completed_at: null,
  findings_count: 0,
  risk_score: null,
};

const mockFindings = [
  {
    finding_id: 'find_001',
    session_id: 'sess_abc123def456',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/handlers/auth.py',
    line_start: 42,
    line_end: 45,
    finding_type: 'LLM01',
    severity: 'CRITICAL',
    title: 'Potential prompt injection vulnerability',
    description: 'User input is directly concatenated into prompt without sanitization.',
    evidence: {
      code_snippet: 'prompt = f"User says: {user_input}"',
      context: 'The user_input variable comes from request body',
    },
    owasp_mapping: ['LLM01'],
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    finding_id: 'find_002',
    session_id: 'sess_abc123def456',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/utils/logging.py',
    line_start: 15,
    line_end: 18,
    finding_type: 'LLM06',
    severity: 'HIGH',
    title: 'Sensitive data exposure in logs',
    description: 'API keys are being logged in plaintext.',
    evidence: {
      code_snippet: 'logger.info(f"API Key: {api_key}")',
      context: 'Found in logging utility',
    },
    owasp_mapping: ['LLM06'],
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    finding_id: 'find_003',
    session_id: 'sess_abc123def456',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/models/chat.py',
    line_start: 88,
    line_end: 92,
    finding_type: 'LLM02',
    severity: 'MEDIUM',
    title: 'Missing output validation',
    description: 'LLM output is not validated before being used.',
    evidence: {
      code_snippet: 'return llm_response.content',
      context: 'Direct return without sanitization',
    },
    owasp_mapping: ['LLM02'],
    status: 'FIXED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock static summary data (7 security check categories)
const createMockStaticSummary = (sessions: unknown[], findings: unknown[]) => {
  type FindingWithStatus = { status: string; severity: string };
  const typedFindings = findings as FindingWithStatus[];
  const openCount = typedFindings.filter(f => f.status === 'OPEN').length;
  const hasCompletedSession = (sessions as { status: string }[]).some(s => s.status === 'COMPLETED');
  const hasRunningSession = (sessions as { status: string }[]).some(s => s.status === 'IN_PROGRESS');

  return {
    agent_workflow_id: 'test-agent-workflow',
    last_scan: hasCompletedSession ? {
      session_id: 'sess_abc123def456',
      created_at: Date.now() / 1000 - 3600,
      completed_at: Date.now() / 1000 - 3000,
      findings_count: (findings as unknown[]).length,
    } : null,
    running_scan: hasRunningSession ? {
      session_id: 'sess_running456',
      created_at: Date.now() / 1000 - 300,
    } : null,
    summary: {
      total: 7,
      passed: 5,
      warning: 1,
      failed: openCount > 0 ? 1 : 0,
      gate_status: openCount > 0 ? 'BLOCKED' : 'OPEN',
    },
    severity_counts: {
      CRITICAL: typedFindings.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length,
      HIGH: typedFindings.filter(f => f.severity === 'HIGH' && f.status === 'OPEN').length,
      MEDIUM: typedFindings.filter(f => f.severity === 'MEDIUM' && f.status === 'OPEN').length,
      LOW: typedFindings.filter(f => f.severity === 'LOW' && f.status === 'OPEN').length,
    },
    checks: hasCompletedSession ? [
      { category_id: 'PROMPT', name: 'Prompt Security', status: openCount > 0 ? 'FAIL' : 'PASS', findings_count: openCount, open_count: openCount, description: 'Prompt injection checks', findings: [], owasp_llm: ['LLM01'], max_severity: openCount > 0 ? 'CRITICAL' : null },
      { category_id: 'OUTPUT', name: 'Output Handling', status: 'PASS', findings_count: 0, open_count: 0, description: 'Output validation', findings: [], owasp_llm: ['LLM02'], max_severity: null },
      { category_id: 'TOOL', name: 'Tool Usage', status: 'PASS', findings_count: 0, open_count: 0, description: 'Tool security', findings: [], owasp_llm: ['LLM07'], max_severity: null },
      { category_id: 'DATA', name: 'Data Protection', status: 'WARNING', findings_count: 0, open_count: 0, description: 'Data handling', findings: [], owasp_llm: ['LLM06'], max_severity: null },
      { category_id: 'MEMORY', name: 'Memory Security', status: 'PASS', findings_count: 0, open_count: 0, description: 'Context security', findings: [], owasp_llm: ['LLM08'], max_severity: null },
      { category_id: 'SUPPLY', name: 'Supply Chain', status: 'PASS', findings_count: 0, open_count: 0, description: 'Dependencies', findings: [], owasp_llm: ['LLM05'], max_severity: null },
      { category_id: 'BEHAVIOR', name: 'Behavioral Controls', status: 'PASS', findings_count: 0, open_count: 0, description: 'Agent behavior', findings: [], owasp_llm: ['LLM09'], max_severity: null },
    ] : [],
  };
};

// Create mock fetch function
const createMockFetch = (
  sessions: unknown[],
  findings: unknown[],
) => {
  const staticSummary = createMockStaticSummary(sessions, findings);

  return (url: string) => {
    // Handle static-summary endpoint
    if (url.includes('/api/workflow/') && url.includes('/static-summary')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(staticSummary),
      });
    }
    // Handle correlation-summary endpoint (graceful fallback to null)
    if (url.includes('/api/workflow/') && url.includes('/correlation-summary')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          agent_workflow_id: 'test-agent-workflow',
          validated: 0,
          unexercised: 0,
          runtime_only: 0,
          theoretical: 0,
          uncorrelated: 0,
          sessions_count: 0,
          is_correlated: false,
        }),
      });
    }
    // Handle analysis sessions endpoint
    if (url.includes('/api/sessions/analysis')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sessions }),
      });
    }
    // Handle findings endpoint (legacy)
    if (url.includes('/api/agent-workflow/') && url.includes('/findings')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ findings }),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

// Wrapper to provide route params via Routes
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent-workflow/:agentWorkflowId/static-analysis" element={children} />
  </Routes>
);

export const Empty: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch([], []) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  parameters: {
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Component shows empty state when no scans (multiple elements show this text)
    const elements = await canvas.findAllByText('No scans yet');
    await expect(elements.length).toBeGreaterThan(0);
  },
};

export const WithSessions: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(
        [mockStaticSession, mockAutofixSession],
        mockFindings
      ) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  parameters: {
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Should show the 7 security checks section
    await expect(await canvas.findByText('Security Checks')).toBeInTheDocument();
    // Should show at least one check category
    await expect(await canvas.findByText('Prompt Security')).toBeInTheDocument();
  },
};

export const WithRunningSession: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(
        [mockRunningSession, mockStaticSession],
        mockFindings
      ) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  parameters: {
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Should show the security checks
    await expect(await canvas.findByText('Security Checks')).toBeInTheDocument();
    // Should show scan status
    await expect(await canvas.findByText(/scans/)).toBeInTheDocument();
  },
};

export const WithManyFindings: Story = {
  decorators: [
    (Story) => {
      const manyFindings = [
        ...mockFindings,
        {
          ...mockFindings[0],
          finding_id: 'find_004',
          severity: 'LOW',
          title: 'Minor code style issue',
        },
        {
          ...mockFindings[1],
          finding_id: 'find_005',
          severity: 'CRITICAL',
          title: 'Another critical vulnerability',
          status: 'OPEN',
        },
      ];
      window.fetch = createMockFetch(
        [mockStaticSession],
        manyFindings
      ) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  parameters: {
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Should show findings count in header
    await expect(await canvas.findByText(/findings/)).toBeInTheDocument();
    // Should show security checks section
    await expect(await canvas.findByText('Security Checks')).toBeInTheDocument();
  },
};
