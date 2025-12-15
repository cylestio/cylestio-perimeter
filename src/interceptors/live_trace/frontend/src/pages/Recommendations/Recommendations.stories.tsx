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
    recommendation_id: 'REC-001',
    source_finding_id: 'find_001',
    workflow_id: 'test-agent-workflow',
    category: 'PROMPT',
    severity: 'CRITICAL',
    status: 'PENDING',
    source_type: 'STATIC',
    title: 'Potential prompt injection vulnerability',
    description: 'User input is directly concatenated into prompt.',
    fix_hints: 'Sanitize user input before including in prompts.',
    file_path: 'src/handlers/auth.py',
    line_start: 42,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    recommendation_id: 'REC-002',
    source_finding_id: 'find_002',
    workflow_id: 'test-agent-workflow',
    category: 'DATA',
    severity: 'HIGH',
    status: 'PENDING',
    source_type: 'STATIC',
    title: 'Sensitive data exposure in logs',
    description: 'API keys are being logged in plaintext.',
    fix_hints: 'Remove sensitive data from log statements or use redaction.',
    file_path: 'src/utils/logging.py',
    line_start: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    recommendation_id: 'REC-003',
    source_finding_id: 'find_003',
    workflow_id: 'test-agent-workflow',
    category: 'OUTPUT',
    severity: 'MEDIUM',
    status: 'FIXED',
    source_type: 'STATIC',
    title: 'Missing output validation',
    description: 'LLM output is not validated before being used.',
    fix_hints: 'Add output validation before using LLM responses.',
    file_path: 'src/models/chat.py',
    line_start: 88,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create mock fetch function
const createMockFetch = (recommendations: typeof mockRecommendations) => {
  return (url: string) => {
    // Handle recommendations endpoint
    if (url.includes('/api/workflow/') && url.includes('/recommendations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          recommendations,
          total_count: recommendations.length,
          workflow_id: 'test-agent-workflow',
        }),
      });
    }
    // Handle gate-status endpoint
    if (url.includes('/api/workflow/') && url.includes('/gate-status')) {
      const hasBlocking = recommendations.some(r =>
        (r.severity === 'CRITICAL' || r.severity === 'HIGH') && r.status !== 'FIXED'
      );
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          gate_status: hasBlocking ? 'BLOCKED' : 'OPEN',
          blocking_critical: recommendations.filter(r => r.severity === 'CRITICAL' && r.status !== 'FIXED').length,
          blocking_high: recommendations.filter(r => r.severity === 'HIGH' && r.status !== 'FIXED').length,
        }),
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
    await expect(await canvas.findByTestId('recommendations')).toBeInTheDocument();
    await expect(await canvas.findByText('Recommendations')).toBeInTheDocument();
    // Shows ProgressSummary with gate status (blocked due to critical/high recommendations)
    await expect(await canvas.findByText(/TO UNBLOCK PRODUCTION/)).toBeInTheDocument();
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
    await expect(await canvas.findByText('Recommendations')).toBeInTheDocument();
    // Should show PENDING FIXES section with the pending recommendations
    await expect(await canvas.findByText(/PENDING FIXES/)).toBeInTheDocument();
    // Should show the critical recommendation title
    await expect(await canvas.findByText('Potential prompt injection vulnerability')).toBeInTheDocument();
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
    // Should show empty state message
    await expect(await canvas.findByText('No recommendations yet')).toBeInTheDocument();
    await expect(await canvas.findByText(/Run a security scan/)).toBeInTheDocument();
  },
};

export const AllResolved: Story = {
  decorators: [
    (Story) => {
      const resolvedRecommendations = mockRecommendations.map((r) => ({ ...r, status: 'FIXED' }));
      window.fetch = createMockFetch(resolvedRecommendations) as typeof fetch;
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
    // Should show production ready status
    await expect(await canvas.findByText(/PRODUCTION READY/)).toBeInTheDocument();
    // Should show all resolved message from ProgressSummary
    await expect(await canvas.findByText(/All critical and high severity issues have been addressed/)).toBeInTheDocument();
  },
};
