import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { AgentStepSelector, type AgentStep } from './AgentStepSelector';

const Container = styled.div`
  width: 260px;
  background: #0a0a0f;
`;

const mockAgentSteps: AgentStep[] = [
  { id: '1', name: 'CustomerAgent', initials: 'CA', status: 'online' },
  { id: '2', name: 'SupportBot', initials: 'SB', status: 'online' },
  { id: '3', name: 'DataAgent', initials: 'DA', status: 'offline' },
  { id: '4', name: 'ErrorAgent', initials: 'EA', status: 'error' },
];

const meta: Meta<typeof AgentStepSelector> = {
  title: 'Domain/AgentSteps/AgentStepSelector',
  component: AgentStepSelector,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentStepSelector>;

export const Default: Story = {
  render: function AgentStepSelectorDefault() {
    const [selected, setSelected] = useState(mockAgentSteps[0]);
    return (
      <AgentStepSelector
        agentSteps={mockAgentSteps}
        selectedAgentStep={selected}
        onSelect={setSelected}
      />
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CustomerAgent')).toBeInTheDocument();
    await expect(canvas.getByText('Active Agent Step')).toBeInTheDocument();
  },
};

export const WithStatuses: Story = {
  render: function AgentStepSelectorWithStatuses() {
    const [selected, setSelected] = useState(mockAgentSteps[0]);
    return (
      <AgentStepSelector
        agentSteps={mockAgentSteps}
        selectedAgentStep={selected}
        onSelect={setSelected}
      />
    );
  },
};

export const Collapsed: Story = {
  args: {
    agentSteps: mockAgentSteps,
    selectedAgentStep: mockAgentSteps[0],
    onSelect: fn(),
    collapsed: true,
  },
};

export const SelectionInteraction: Story = {
  args: {
    agentSteps: mockAgentSteps,
    selectedAgentStep: mockAgentSteps[0],
    onSelect: fn(),
  },
  play: async ({ args, canvas }) => {
    // Open dropdown
    const selectBox = canvas.getByRole('button');
    await userEvent.click(selectBox);

    // Select a different agent step
    const supportBot = canvas.getByText('SupportBot');
    await userEvent.click(supportBot);

    await expect(args.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'SupportBot' })
    );
  },
};

export const KeyboardNavigation: Story = {
  render: function AgentStepSelectorKeyboard() {
    const [selected, setSelected] = useState(mockAgentSteps[0]);
    return (
      <AgentStepSelector
        agentSteps={mockAgentSteps}
        selectedAgentStep={selected}
        onSelect={setSelected}
      />
    );
  },
  play: async ({ canvas }) => {
    const selectBox = canvas.getByRole('button');
    selectBox.focus();

    // Open with Enter
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    // Close with Escape
    await userEvent.keyboard('{Escape}');
  },
};
