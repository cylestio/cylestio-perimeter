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
      agent_step_id: 'agent_001',
      agent_step_name: 'Customer Support Bot',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      duration_minutes: 45,
      errors: 1,
      events_count: 120,
      status: 'completed',
    },
    {
      session_id: 'sess_002',
      agent_step_id: 'agent_002',
      agent_step_name: 'Code Assistant',
      start_time: new Date(Date.now() - 1800000).toISOString(),
      duration_minutes: 30,
      errors: 0,
      events_count: 85,
      status: 'completed',
    },
  ],
  total: 225,
};

// Create mock fetch function
const createMockFetch = (dashboardData: unknown, sessionsData: unknown) => {
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
