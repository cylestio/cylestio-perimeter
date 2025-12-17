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

// Mock recommendations data
const mockRecommendations = [
  {
    recommendation_id: 'rec_001',
    source_finding_id: 'find_001',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/handlers/auth.py',
    line_start: 42,
    source_type: 'STATIC',
    category: 'PROMPT',
    severity: 'CRITICAL',
    status: 'PENDING',
    title: 'Potential prompt injection vulnerability',
    description: 'User input is directly concatenated into prompt.',
    owasp_llm: 'LLM01',
    cvss_score: 9.1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    recommendation_id: 'rec_002',
    source_finding_id: 'find_002',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/utils/logging.py',
    line_start: 15,
    source_type: 'STATIC',
    category: 'DATA',
    severity: 'HIGH',
    status: 'PENDING',
    title: 'Sensitive data exposure in logs',
    description: 'API keys are being logged in plaintext.',
    owasp_llm: 'LLM06',
    cvss_score: 7.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    recommendation_id: 'rec_003',
    source_finding_id: 'find_003',
    agent_workflow_id: 'test-agent-workflow',
    file_path: 'src/models/chat.py',
    line_start: 88,
    source_type: 'DYNAMIC',
    category: 'OUTPUT',
    severity: 'MEDIUM',
    status: 'FIXED',
    title: 'Missing output validation',
    description: 'LLM output is not validated before being used.',
    owasp_llm: 'LLM02',
    cvss_score: 5.0,
    fixed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create mock fetch function
const createMockFetch = (recommendations: unknown[], gateStatus = 'BLOCKED') => {
  return (url: string) => {
    if (url.includes('/recommendations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ recommendations }),
      });
    }
    if (url.includes('/gate-status')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ gate_status: gateStatus }),
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
      window.fetch = createMockFetch(mockRecommendations) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('security-dashboard')).toBeInTheDocument();
    await expect(await canvas.findByText('Security Dashboard')).toBeInTheDocument();
    await expect(await canvas.findByText('Overview')).toBeInTheDocument();
  },
};

export const WithCriticalRecommendations: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(mockRecommendations) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Security Dashboard')).toBeInTheDocument();
    // Should show the static analysis gate as blocked
    await expect(await canvas.findByText('Static Analysis Gate')).toBeInTheDocument();
    await expect(await canvas.findByText('BLOCKED')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch([], 'OPEN') as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Security Dashboard')).toBeInTheDocument();
    // Should show both gates as passed (2 PASSED texts)
    const passedElements = await canvas.findAllByText('PASSED');
    await expect(passedElements.length).toBe(2);
  },
};

export const AllResolved: Story = {
  decorators: [
    (Story) => {
      const resolvedRecommendations = mockRecommendations.map((r) => ({ 
        ...r, 
        status: 'FIXED',
        fixed_at: new Date().toISOString(),
      }));
      window.fetch = createMockFetch(resolvedRecommendations, 'OPEN') as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Security Dashboard')).toBeInTheDocument();
    // Should show both gates as passed when all resolved
    const passedElements = await canvas.findAllByText('PASSED');
    await expect(passedElements.length).toBe(2);
    // Check that the page loaded with tabs
    await expect(await canvas.findByText('Overview')).toBeInTheDocument();
    await expect(await canvas.findByText('By Severity')).toBeInTheDocument();
  },
};
