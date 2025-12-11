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
    await expect(await canvas.findByText('Setup Instructions')).toBeInTheDocument();
    await expect(await canvas.findByText('Start the Agent Inspector server')).toBeInTheDocument();
    await expect(await canvas.findByText('Configure your IDE')).toBeInTheDocument();
    await expect(await canvas.findByText('Start analyzing')).toBeInTheDocument();
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
    await expect(await canvas.findByText('Cursor')).toBeInTheDocument();
    await expect(await canvas.findByText('VS Code')).toBeInTheDocument();
    await expect(await canvas.findByText('Claude Desktop')).toBeInTheDocument();
  },
};
