import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { DevConnection } from './DevConnection';

const meta: Meta<typeof DevConnection> = {
  title: 'Pages/DevConnection',
  component: DevConnection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent/test-agent/dev-connection'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DevConnection>;

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent/:agentId/dev-connection" element={children} />
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
    await expect(await canvas.findByText('IDE Connection')).toBeInTheDocument();
    await expect(await canvas.findByRole('heading', { name: 'Not Connected' })).toBeInTheDocument();
    await expect(await canvas.findByText('Supported IDEs')).toBeInTheDocument();
  },
};

export const WithSetupInstructions: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Check Quick Setup section
    await expect(await canvas.findByText('Quick Setup (Recommended)')).toBeInTheDocument();
    await expect(await canvas.findByText('One-Click Setup')).toBeInTheDocument();
    // Check Manual Setup section
    await expect(await canvas.findByText('Manual Setup (Alternative)')).toBeInTheDocument();
    await expect(await canvas.findByText('Start the Agent Inspector server')).toBeInTheDocument();
    await expect(await canvas.findByText('Configure MCP in your IDE')).toBeInTheDocument();
    await expect(await canvas.findByText('Reload your IDE and start scanning')).toBeInTheDocument();
  },
};

export const IDEList: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Only Cursor and Claude Code are supported
    await expect(await canvas.findByText('Cursor')).toBeInTheDocument();
    await expect(await canvas.findByText('Claude Code')).toBeInTheDocument();
  },
};
