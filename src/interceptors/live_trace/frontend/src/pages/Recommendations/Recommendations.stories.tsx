import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { Recommendations } from './Recommendations';

const meta: Meta<typeof Recommendations> = {
  title: 'Pages/Recommendations',
  component: Recommendations,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/recommendations'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Recommendations>;

// Mock findings data
const mockFindings = [
  {
    finding_id: 'find_001',
    session_id: 'sess_001',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/handlers/auth.py',
    line_start: 42,
    finding_type: 'LLM01',
    severity: 'CRITICAL',
    title: 'Potential prompt injection vulnerability',
    description: 'User input is directly concatenated into prompt.',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    finding_id: 'find_002',
    session_id: 'sess_001',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/utils/logging.py',
    line_start: 15,
    finding_type: 'LLM06',
    severity: 'HIGH',
    title: 'Sensitive data exposure in logs',
    description: 'API keys are being logged in plaintext.',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    finding_id: 'find_003',
    session_id: 'sess_001',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/models/chat.py',
    line_start: 88,
    finding_type: 'LLM02',
    severity: 'MEDIUM',
    title: 'Missing output validation',
    description: 'LLM output is not validated before being used.',
    status: 'FIXED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create mock fetch function
const createMockFetch = (findings: unknown[]) => {
  return (url: string) => {
    if (url.includes('/api/agent-workflow/') && url.includes('/findings')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ findings }),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent-workflow/:agentWorkflowId/recommendations" element={children} />
  </Routes>
);

export const Default: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(mockFindings) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('recommendations')).toBeInTheDocument();
    await expect(await canvas.findByText('Security Score')).toBeInTheDocument();
    await expect(await canvas.findByText(/Actionable Recommendations/)).toBeInTheDocument();
  },
};

export const WithCriticalFindings: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(mockFindings) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Recommendations')).toBeInTheDocument();
    // Should show critical findings recommendation
    await expect(await canvas.findByText(/Address.*critical security finding/)).toBeInTheDocument();
  },
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch([]) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Recommendations')).toBeInTheDocument();
    await expect(await canvas.findByText('Security Score')).toBeInTheDocument();
    // Should show recommendation to run first analysis
    await expect(await canvas.findByText('Run your first security analysis')).toBeInTheDocument();
  },
};

export const AllResolved: Story = {
  decorators: [
    (Story) => {
      const resolvedFindings = mockFindings.map((f) => ({ ...f, status: 'FIXED' }));
      window.fetch = createMockFetch(resolvedFindings) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Recommendations')).toBeInTheDocument();
    // Should show all resolved message
    await expect(await canvas.findByText('All findings have been addressed')).toBeInTheDocument();
  },
};
