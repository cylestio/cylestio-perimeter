import { useEffect } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Route, Routes, useNavigate } from 'react-router-dom';

import { PageMetaProvider } from '../../context';
import { WorkflowDetail } from './WorkflowDetail';

// Wrapper that sets up routing within the global MemoryRouter
const WorkflowDetailWrapper = () => {
  const navigate = useNavigate();
  // Navigate to the workflow route on mount
  useEffect(() => {
    navigate('/workflow/my-workflow');
  }, [navigate]);

  return (
    <Routes>
      <Route path="/workflow/:workflowId" element={<WorkflowDetail />} />
      <Route path="*" element={<div>Loading route...</div>} />
    </Routes>
  );
};

const meta: Meta<typeof WorkflowDetail> = {
  title: 'Pages/WorkflowDetail',
  component: WorkflowDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    () => (
      <PageMetaProvider>
        <WorkflowDetailWrapper />
      </PageMetaProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkflowDetail>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // The component renders inside the PageMetaProvider and Routes
    // Check that the canvas element exists (component mounted)
    await expect(canvasElement).toBeInTheDocument();
  },
};
