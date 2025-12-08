import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { WorkflowSelector, type Workflow } from './WorkflowSelector';

const meta: Meta<typeof WorkflowSelector> = {
  title: 'Domain/Workflows/WorkflowSelector',
  component: WorkflowSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkflowSelector>;

const mockWorkflows: Workflow[] = [
  { id: 'ecommerce-agents', name: 'E-Commerce Agents', agentCount: 5 },
  { id: 'support-bots', name: 'Support Bots', agentCount: 3 },
  { id: 'analytics-pipeline', name: 'Analytics Pipeline', agentCount: 8 },
  { id: null, name: 'Unassigned', agentCount: 2 },
];

const InteractiveWorkflowSelector = () => {
  const [selected, setSelected] = useState<Workflow | null>(null);

  return (
    <WorkflowSelector
      workflows={mockWorkflows}
      selectedWorkflow={selected}
      onSelect={setSelected}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveWorkflowSelector />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Verify "All Workflows" is shown by default
    await expect(canvas.getByText('All Workflows')).toBeInTheDocument();
    // Verify dropdown button exists
    await expect(canvas.getByRole('button')).toBeInTheDocument();
  },
};

export const WithSelection: Story = {
  args: {
    workflows: mockWorkflows,
    selectedWorkflow: mockWorkflows[0],
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Verify selected workflow is displayed
    await expect(canvas.getByText('E-Commerce Agents')).toBeInTheDocument();
  },
};

export const ClickToOpen: Story = {
  args: {
    workflows: mockWorkflows,
    selectedWorkflow: null,
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Click to open dropdown
    await userEvent.click(button);

    // Verify dropdown is open with options
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('E-Commerce Agents')).toBeInTheDocument();
    await expect(canvas.getByText('Support Bots')).toBeInTheDocument();
  },
};

export const SelectWorkflow: Story = {
  args: {
    workflows: mockWorkflows,
    selectedWorkflow: null,
    onSelect: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Open dropdown
    await userEvent.click(canvas.getByRole('button'));

    // Select a workflow
    await userEvent.click(canvas.getByText('Support Bots'));

    // Verify onSelect was called with correct workflow
    await expect(args.onSelect).toHaveBeenCalledWith(mockWorkflows[1]);
  },
};

export const Collapsed: Story = {
  args: {
    workflows: mockWorkflows,
    selectedWorkflow: mockWorkflows[0],
    onSelect: fn(),
    collapsed: true,
  },
  play: async ({ canvasElement }) => {
    // In collapsed mode, should show folder icon
    await expect(canvasElement.querySelector('svg')).toBeInTheDocument();
  },
};

export const SingleWorkflow: Story = {
  args: {
    workflows: [{ id: 'my-project', name: 'My Project', agentCount: 10 }],
    selectedWorkflow: null,
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('All Workflows')).toBeInTheDocument();
  },
};

export const OnlyUnassigned: Story = {
  args: {
    workflows: [{ id: null, name: 'Unassigned', agentCount: 5 }],
    selectedWorkflow: null,
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('All Workflows')).toBeInTheDocument();
  },
};
