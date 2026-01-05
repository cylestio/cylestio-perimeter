import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { DevConnection } from './DevConnection';

const meta: Meta<typeof DevConnection> = {
  title: 'Pages/DevConnection',
  component: DevConnection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent-workflow/test-workflow/dev-connection'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DevConnection>;

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent-workflow/:agentWorkflowId/dev-connection" element={children} />
  </Routes>
);

export const Default: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Check page header
    await expect(await canvas.findByText('IDE Connection')).toBeInTheDocument();
    // Check status banner is present (waiting for connection)
    await expect(await canvas.findByText('Waiting for connection...')).toBeInTheDocument();
    // Check integration cards are present (use getAllByText since names appear in cards + table)
    await expect(await canvas.findByText('Choose Integration')).toBeInTheDocument();
    const cursorElements = await canvas.findAllByText('Cursor');
    await expect(cursorElements.length).toBeGreaterThanOrEqual(1);
    const claudeCodeElements = await canvas.findAllByText('Claude Code');
    await expect(claudeCodeElements.length).toBeGreaterThanOrEqual(1);
    const mcpOnlyElements = await canvas.findAllByText('MCP Only');
    await expect(mcpOnlyElements.length).toBeGreaterThanOrEqual(1);
    // Check feature comparison table
    await expect(await canvas.findByText('Feature Comparison')).toBeInTheDocument();
  },
};

export const CursorTab: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Default tab is Cursor
    await expect(await canvas.findByText('Connect Cursor')).toBeInTheDocument();
    await expect(
      await canvas.findByText(/AI-powered code editor with full Agent Inspector integration/)
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText('Run this command in Cursor:')
    ).toBeInTheDocument();
    // Check feature checkmarks on card (should show Full badge)
    const fullBadges = await canvas.findAllByText('Full');
    await expect(fullBadges.length).toBeGreaterThanOrEqual(1);
  },
};

export const ClaudeCodeTab: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for page to load
    await canvas.findByText('IDE Connection');

    // Click Claude Code card
    const claudeCodeCard = await canvas.findByRole('button', { name: /Claude Code/i });
    await user.click(claudeCodeCard);

    // Check Claude Code instructions
    await expect(await canvas.findByText('Connect Claude Code')).toBeInTheDocument();
    await expect(
      await canvas.findByText(/These are the instructions for Claude Code only/i)
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText('Run these commands in Claude Code:')
    ).toBeInTheDocument();
    // Check the command steps
    await expect(
      await canvas.findByText('/plugin marketplace add cylestio/agent-inspector')
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText('/agent-inspector:setup')
    ).toBeInTheDocument();
  },
};

export const MCPOnlyTab: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for page to load
    await canvas.findByText('IDE Connection');

    // Click MCP Only card
    const mcpCard = await canvas.findByRole('button', { name: /MCP Only/i });
    await user.click(mcpCard);

    // Check MCP Only instructions
    await expect(await canvas.findByText('MCP Configuration Only')).toBeInTheDocument();
    await expect(
      await canvas.findByText(/Manual MCP server configuration/)
    ).toBeInTheDocument();
    // Check warning note
    await expect(
      await canvas.findByText(/MCP-only configuration provides live tracing and MCP tools access/)
    ).toBeInTheDocument();
    // Check Basic badge on MCP Only card
    await expect(await canvas.findByText('Basic')).toBeInTheDocument();
  },
};

export const TabNavigation: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for page to load
    await canvas.findByText('IDE Connection');

    // Initially on Cursor (default)
    await expect(await canvas.findByText('Connect Cursor')).toBeInTheDocument();

    // Click Claude Code card
    const claudeCodeCard = await canvas.findByRole('button', { name: /Claude Code/i });
    await user.click(claudeCodeCard);
    await expect(await canvas.findByText('Connect Claude Code')).toBeInTheDocument();

    // Click MCP Only card
    const mcpCard = await canvas.findByRole('button', { name: /MCP Only/i });
    await user.click(mcpCard);
    await expect(await canvas.findByText('MCP Configuration Only')).toBeInTheDocument();

    // Click back to Cursor
    const cursorCard = await canvas.findByRole('button', { name: /Cursor/i });
    await user.click(cursorCard);
    await expect(await canvas.findByText('Connect Cursor')).toBeInTheDocument();
  },
};

export const FeatureComparisonTable: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for page to load
    await canvas.findByText('IDE Connection');

    // Check feature comparison table header
    await expect(await canvas.findByText('Feature Comparison')).toBeInTheDocument();

    // Check table headers
    await expect(await canvas.findByText('Feature')).toBeInTheDocument();

    // Check feature rows - descriptions are unique to the table
    await expect(await canvas.findByText(/Examines agent code without execution/)).toBeInTheDocument();
    await expect(await canvas.findByText(/Connects static code findings with runtime evidence/)).toBeInTheDocument();
    await expect(await canvas.findByText(/Provides actionable fix recommendations/)).toBeInTheDocument();
    await expect(await canvas.findByText(/Query the Agent Inspector database directly/)).toBeInTheDocument();
    await expect(await canvas.findByText(/Debug running sessions in your IDE/)).toBeInTheDocument();
  },
};
