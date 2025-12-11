import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Routes, Route } from 'react-router-dom';

import { Reports } from './Reports';

const meta: Meta<typeof Reports> = {
  title: 'Pages/Reports',
  component: Reports,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/agent/test-agent/reports'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Reports>;

// Wrapper to provide route params
const RouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Routes>
    <Route path="/agent/:agentId/reports" element={children} />
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
    await expect(await canvas.findByText('Reports')).toBeInTheDocument();
    await expect(await canvas.findByText('Generate New Report')).toBeInTheDocument();
    await expect(await canvas.findByText('Generated Reports (0)')).toBeInTheDocument();
  },
};

export const WithTemplates: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Executive Summary')).toBeInTheDocument();
    await expect(await canvas.findByText('Security Assessment')).toBeInTheDocument();
    await expect(await canvas.findByText('Compliance Report')).toBeInTheDocument();
    await expect(await canvas.findByText('Developer Report')).toBeInTheDocument();
  },
};

export const EmptyReports: Story = {
  decorators: [
    (Story) => (
      <RouteWrapper>
        <Story />
      </RouteWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('No reports generated yet')).toBeInTheDocument();
    await expect(
      await canvas.findByText('Select a template above to generate your first report. Reports will be stored here for easy access.')
    ).toBeInTheDocument();
  },
};
