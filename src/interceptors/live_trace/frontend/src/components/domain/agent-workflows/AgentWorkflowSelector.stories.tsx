import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AgentWorkflowSelector, type AgentWorkflow } from './AgentWorkflowSelector';

const meta: Meta<typeof AgentWorkflowSelector> = {
  title: 'Domain/AgentWorkflows/AgentWorkflowSelector',
  component: AgentWorkflowSelector,
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
type Story = StoryObj<typeof AgentWorkflowSelector>;

const mockAgentWorkflows: AgentWorkflow[] = [
  { id: 'ecommerce-agents', name: 'E-Commerce Agents', agentCount: 5 },
  { id: 'support-bots', name: 'Support Bots', agentCount: 3 },
  { id: 'analytics-pipeline', name: 'Analytics Pipeline', agentCount: 8 },
  { id: null, name: 'Unassigned', agentCount: 2 },
];

const InteractiveAgentWorkflowSelector = () => {
  const [selected, setSelected] = useState<AgentWorkflow | null>(null);

  return (
    <AgentWorkflowSelector
      agentWorkflows={mockAgentWorkflows}
      selectedAgentWorkflow={selected}
      onSelect={setSelected}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveAgentWorkflowSelector />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // With no selection, first workflow is displayed
    await expect(canvas.getByText('E-Commerce Agents')).toBeInTheDocument();
    // Verify dropdown button exists
    await expect(canvas.getByRole('button')).toBeInTheDocument();
  },
};

export const WithSelection: Story = {
  args: {
    agentWorkflows: mockAgentWorkflows,
    selectedAgentWorkflow: mockAgentWorkflows[0],
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
    agentWorkflows: mockAgentWorkflows,
    selectedAgentWorkflow: mockAgentWorkflows[0],
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Click to open dropdown
    await userEvent.click(button);

    // Verify dropdown is open with options
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('Support Bots')).toBeInTheDocument();
    await expect(canvas.getByText('Analytics Pipeline')).toBeInTheDocument();
  },
};

export const SelectAgentWorkflow: Story = {
  args: {
    agentWorkflows: mockAgentWorkflows,
    selectedAgentWorkflow: mockAgentWorkflows[0],
    onSelect: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Open dropdown
    await userEvent.click(canvas.getByRole('button'));

    // Select an agent workflow
    await userEvent.click(canvas.getByText('Support Bots'));

    // Verify onSelect was called with correct agent workflow
    await expect(args.onSelect).toHaveBeenCalledWith(mockAgentWorkflows[1]);
  },
};

export const Collapsed: Story = {
  args: {
    agentWorkflows: mockAgentWorkflows,
    selectedAgentWorkflow: mockAgentWorkflows[0],
    onSelect: fn(),
    collapsed: true,
  },
  play: async ({ canvasElement }) => {
    // In collapsed mode, should show folder icon
    await expect(canvasElement.querySelector('svg')).toBeInTheDocument();
  },
};

export const SingleAgentWorkflow: Story = {
  args: {
    agentWorkflows: [{ id: 'my-project', name: 'My Project', agentCount: 10 }],
    selectedAgentWorkflow: null,
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // First workflow is shown as default
    await expect(canvas.getByText('My Project')).toBeInTheDocument();
  },
};

export const WithUnassigned: Story = {
  args: {
    agentWorkflows: [
      { id: 'my-project', name: 'My Project', agentCount: 10 },
      { id: null, name: 'Unassigned', agentCount: 5 },
    ],
    selectedAgentWorkflow: null,
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // First workflow shown by default
    await expect(canvas.getByText('My Project')).toBeInTheDocument();
    // Open to see Unassigned option
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Unassigned')).toBeInTheDocument();
  },
};
