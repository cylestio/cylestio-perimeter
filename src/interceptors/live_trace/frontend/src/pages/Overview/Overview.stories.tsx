import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { Overview } from './Overview';

const meta: Meta<typeof Overview> = {
  title: 'Pages/Overview',
  component: Overview,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent-workflow/test-agent-workflow/overview'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Overview>;

// Mock dashboard data
const mockDashboardData = {
  agents: [
    {
      id: 'agent_001',
      id_short: 'agent_001',
      name: 'Customer Support Bot',
      agent_workflow_id: 'test-agent-workflow',
      total_sessions: 150,
      active_sessions: 3,
      total_errors: 5,
      total_tools: 8,
      risk_status: 'evaluating',
      security_score: 85,
      last_active: new Date().toISOString(),
    },
    {
      id: 'agent_002',
      id_short: 'agent_002',
      name: 'Code Assistant',
      agent_workflow_id: 'test-agent-workflow',
      total_sessions: 75,
      active_sessions: 1,
      total_errors: 2,
      total_tools: 12,
      risk_status: 'ok',
      security_score: 92,
      last_active: new Date().toISOString(),
    },
  ],
  sessions_count: 225,
  last_updated: new Date().toISOString(),
};

const mockSessionsData = {
  sessions: [
    {
      session_id: 'sess_001',
      agent_id: 'agent_001',
      agent_name: 'Customer Support Bot',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      duration_minutes: 45,
      errors: 1,
      events_count: 120,
      status: 'completed',
    },
    {
      session_id: 'sess_002',
      agent_id: 'agent_002',
      agent_name: 'Code Assistant',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      duration_minutes: 30,
      errors: 0,
      events_count: 85,
      status: 'completed',
    },
  ],
  total: 225,
};

const mockAgentAnalytics = {
  agent: {
    id: 'agent_001',
    name: 'Customer Support Bot',
    avg_response_time_ms: 1250,
  },
  analytics: {
    token_summary: {
      total_tokens: 150000,
      input_tokens: 100000,
      output_tokens: 50000,
      total_cost: 0.45,
      models_used: 2,
      pricing_last_updated: null,
    },
    tools: [
      { tool: 'web_search', executions: 42, avg_duration_ms: 350 },
      { tool: 'code_editor', executions: 28, avg_duration_ms: 120 },
    ],
    timeline: [
      { date: '2025-12-10', requests: 12, tokens: 5000, input_tokens: 3000, output_tokens: 2000 },
      { date: '2025-12-11', requests: 18, tokens: 7500, input_tokens: 4500, output_tokens: 3000 },
      { date: '2025-12-12', requests: 15, tokens: 6000, input_tokens: 3600, output_tokens: 2400 },
    ],
    tool_timeline: [],
  },
};

// Create mock fetch function
const createMockFetch = (
  dashboardData: unknown,
  sessionsData: unknown,
  agentData: unknown = mockAgentAnalytics
) => {
  return (url: string) => {
    if (url.includes('/api/dashboard')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(dashboardData),
      });
    }
    if (url.includes('/api/sessions/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sessionsData),
      });
    }
    if (url.includes('/api/agent/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(agentData),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent-workflow/:agentWorkflowId/overview" element={children} />
  </Routes>
);

export const Default: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(mockDashboardData, mockSessionsData) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Overview')).toBeInTheDocument();
    await expect(await canvas.findByText('Agents')).toBeInTheDocument();
    await expect(await canvas.findByText('Total Sessions')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      window.fetch = createMockFetch(
        { agents: [], sessions_count: 0, last_updated: new Date().toISOString() },
        { sessions: [], total: 0 }
      ) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Overview')).toBeInTheDocument();
    await expect(await canvas.findByText('No tools discovered yet')).toBeInTheDocument();
  },
};

export const WithErrors: Story = {
  decorators: [
    (Story) => {
      const dataWithErrors = {
        ...mockDashboardData,
        agents: mockDashboardData.agents.map((a, i) => ({
          ...a,
          total_errors: i === 0 ? 15 : 8,
        })),
      };
      window.fetch = createMockFetch(dataWithErrors, mockSessionsData) as typeof fetch;
      return (
        <RouteWrapper>
          <Story />
        </RouteWrapper>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Overview')).toBeInTheDocument();
    await expect(await canvas.findByText('Total Errors')).toBeInTheDocument();
  },
};
