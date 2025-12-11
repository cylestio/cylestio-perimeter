import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { AttackSurface } from './AttackSurface';

const meta: Meta<typeof AttackSurface> = {
  title: 'Pages/AttackSurface',
  component: AttackSurface,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent/test-agent/attack-surface'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof AttackSurface>;

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent/:agentId/attack-surface" element={children} />
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
    await expect(await canvas.findByText('Attack Surface')).toBeInTheDocument();
    await expect(await canvas.findByText('Critical Vectors')).toBeInTheDocument();
    await expect(await canvas.findByText('High Risk Vectors')).toBeInTheDocument();
  },
};

export const WithVectors: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Identified Attack Vectors (4)')).toBeInTheDocument();
    await expect(await canvas.findByText('Prompt Injection via User Input')).toBeInTheDocument();
    await expect(await canvas.findByText('Tool Misuse Potential')).toBeInTheDocument();
    await expect(await canvas.findByText('Sensitive Data Exposure')).toBeInTheDocument();
    await expect(await canvas.findByText('Rate Limiting Gaps')).toBeInTheDocument();
  },
};

export const VisualizationPlaceholder: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Attack Surface Visualization')).toBeInTheDocument();
    await expect(await canvas.findByText('Interactive Attack Surface Map')).toBeInTheDocument();
    await expect(await canvas.findByText('Coming Soon')).toBeInTheDocument();
  },
};

export const SurfaceOverview: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Total Exposure')).toBeInTheDocument();
    await expect(await canvas.findByText('Coverage')).toBeInTheDocument();
    await expect(await canvas.findByText('85%')).toBeInTheDocument();
  },
};
