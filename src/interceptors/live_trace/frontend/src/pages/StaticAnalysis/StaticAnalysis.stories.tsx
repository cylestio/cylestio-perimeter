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
      initialEntries: ['/workflow/test-workflow/static-analysis'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaticAnalysis>;

// Mock sessions and findings data
const mockStaticSession = {
  session_id: 'sess_abc123def456',
  workflow_id: 'test-workflow',
  workflow_name: 'Test Workflow',
  session_type: 'STATIC',
  status: 'COMPLETED',
  created_at: Date.now() / 1000 - 3600, // 1 hour ago
  completed_at: Date.now() / 1000 - 3000, // 50 minutes ago
  findings_count: 5,
  risk_score: 65,
};

const mockAutofixSession = {
  session_id: 'sess_fix789xyz012',
  workflow_id: 'test-workflow',
  workflow_name: 'Test Workflow',
  session_type: 'AUTOFIX',
  status: 'COMPLETED',
  created_at: Date.now() / 1000 - 1800, // 30 minutes ago
  completed_at: Date.now() / 1000 - 1500, // 25 minutes ago
  findings_count: 2,
  risk_score: null,
};

const mockRunningSession = {
  session_id: 'sess_running456',
  workflow_id: 'test-workflow',
  workflow_name: 'Test Workflow',
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
    workflow_id: 'test-workflow',
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
    workflow_id: 'test-workflow',
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
    workflow_id: 'test-workflow',
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

const mockSummary = {
  workflow_id: 'test-workflow',
  total_findings: 3,
  by_severity: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 0 },
  by_status: { OPEN: 2, FIXED: 1, IGNORED: 0 },
  open_count: 2,
  fixed_count: 1,
  ignored_count: 0,
};

// Create mock fetch function
const createMockFetch = (
  sessions: unknown[],
  findings: unknown[],
  summary: unknown
) => {
  return (url: string) => {
    if (url.includes('/api/sessions/analysis')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sessions }),
      });
    }
    if (url.includes('/api/workflow/') && url.includes('/findings')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ findings, summary }),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

// Wrapper to provide route params via Routes
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/workflow/:workflowId/static-analysis" element={children} />
  </Routes>
);

export const Empty: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch([], [], {
        workflow_id: 'test-workflow',
        total_findings: 0,
        by_severity: {},
        by_status: {},
        open_count: 0,
        fixed_count: 0,
        ignored_count: 0,
      }) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  parameters: {
    router: {
      initialEntries: ['/workflow/test-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    await expect(await canvas.findByText('No static analysis sessions yet.')).toBeInTheDocument();
  },
};

export const WithSessions: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(
        [mockStaticSession, mockAutofixSession],
        mockFindings,
        mockSummary
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
      initialEntries: ['/workflow/test-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Should show session badges
    await expect(await canvas.findByText('STATIC')).toBeInTheDocument();
    await expect(await canvas.findByText('AUTOFIX')).toBeInTheDocument();
    // Should show findings section
    await expect(canvas.getByText('Security Findings')).toBeInTheDocument();
  },
};

export const WithRunningSession: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(
        [mockRunningSession, mockStaticSession],
        mockFindings,
        mockSummary
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
      initialEntries: ['/workflow/test-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Should show in progress badge
    await expect(await canvas.findByText('1 in progress')).toBeInTheDocument();
    await expect(await canvas.findByText('In Progress')).toBeInTheDocument();
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
      const manySummary = {
        ...mockSummary,
        total_findings: 5,
        by_severity: { CRITICAL: 2, HIGH: 1, MEDIUM: 1, LOW: 1 },
        open_count: 3,
      };
      window.fetch = createMockFetch(
        [mockStaticSession],
        manyFindings,
        manySummary
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
      initialEntries: ['/workflow/test-workflow/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Static Analysis')).toBeInTheDocument();
    // Should show open findings badge
    await expect(await canvas.findByText('3 open')).toBeInTheDocument();
  },
};
