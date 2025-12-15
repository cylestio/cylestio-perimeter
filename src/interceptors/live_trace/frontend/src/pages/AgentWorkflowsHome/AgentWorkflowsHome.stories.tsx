import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { AgentWorkflowsHome } from './AgentWorkflowsHome';

const meta: Meta<typeof AgentWorkflowsHome> = {
  title: 'Pages/AgentWorkflowsHome',
  component: AgentWorkflowsHome,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Mock the API responses
    mockData: [],
  },
};

export default meta;
type Story = StoryObj<typeof AgentWorkflowsHome>;

// Mock fetch for agent workflows and dashboard
const createMockFetch = (agentWorkflows: unknown[], unassignedAgents: unknown[]) => {
  return (url: string) => {
    if (url === '/api/agent-workflows') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ agent_workflows: agentWorkflows }),
      });
    }
    if (url.includes('/api/dashboard')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          agents: unassignedAgents,
          sessions_count: 0,
          latest_session: null,
          last_updated: new Date().toISOString(),
          refresh_interval: 2000,
        }),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  };
};

// Generate mock agent workflows
const generateAgentWorkflows = (count: number) => {
  const names = [
    'E-Commerce Platform',
    'Customer Support',
    'Analytics Pipeline',
    'Payment Gateway',
    'Inventory Management',
    'User Authentication',
    'Notification Service',
    'Search Engine',
    'Recommendation System',
    'Fraud Detection',
    'Content Management',
    'Order Processing',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `agent-workflow-${i + 1}`,
    name: names[i % names.length],
    agent_count: Math.floor(Math.random() * 10) + 1,
    session_count: Math.floor(Math.random() * 50) + 1,
  }));
};

// Generate mock unassigned agents
const generateUnassignedAgents = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `agent-unassigned-${i + 1}`,
    id_short: `una${i + 1}`,
    agent_workflow_id: null,
    total_sessions: Math.floor(Math.random() * 20) + 1,
    active_sessions: Math.random() > 0.7 ? 1 : 0,
    completed_sessions: Math.floor(Math.random() * 15),
    total_messages: Math.floor(Math.random() * 100),
    total_tokens: Math.floor(Math.random() * 10000),
    total_tools: Math.floor(Math.random() * 30),
    unique_tools: Math.floor(Math.random() * 10),
    total_errors: Math.floor(Math.random() * 5),
    avg_response_time_ms: Math.random() * 500,
    last_seen: new Date().toISOString(),
    last_seen_relative: '2 minutes ago',
    risk_status: Math.random() > 0.3 ? 'ok' : 'evaluating',
    current_sessions: Math.floor(Math.random() * 5),
    min_sessions_required: 5,
  }));
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      // Mock fetch with empty data
      window.fetch = createMockFetch([], []) as typeof fetch;
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for loading to finish and verify empty state
    await expect(await canvas.findByText('No agent workflows yet')).toBeInTheDocument();
  },
};

export const WithTwelveAgentWorkflows: Story = {
  decorators: [
    (Story) => {
      // Mock fetch with 12 agent workflows
      window.fetch = createMockFetch(generateAgentWorkflows(12), []) as typeof fetch;
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for loading to finish and verify agent workflow cards appear
    await expect(await canvas.findByText('E-Commerce Platform')).toBeInTheDocument();
    // Should have 12 agent workflow cards
    const cards = canvasElement.querySelectorAll('[data-testid="agent-workflow-card"]');
    await expect(cards.length).toBe(12);
  },
};

export const WithUnassignedAgents: Story = {
  decorators: [
    (Story) => {
      // Mock fetch with some agent workflows and unassigned agents
      window.fetch = createMockFetch(
        generateAgentWorkflows(3),
        generateUnassignedAgents(5)
      ) as typeof fetch;
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for loading and verify both sections appear
    await expect(await canvas.findByText('E-Commerce Platform')).toBeInTheDocument();
    await expect(canvas.getByText('Unassigned Agents')).toBeInTheDocument();
  },
};

export const OnlyUnassignedAgents: Story = {
  decorators: [
    (Story) => {
      // Mock fetch with no agent workflows but some unassigned agents
      window.fetch = createMockFetch([], generateUnassignedAgents(3)) as typeof fetch;
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show empty agent workflows and unassigned section
    await expect(await canvas.findByText('No agent workflows yet')).toBeInTheDocument();
    await expect(canvas.getByText('Unassigned Agents')).toBeInTheDocument();
  },
};
