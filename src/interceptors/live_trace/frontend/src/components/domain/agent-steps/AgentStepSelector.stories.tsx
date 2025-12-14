import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { AgentSelector, type Agent } from './AgentSelector';

const Container = styled.div`
  width: 260px;
  background: #0a0a0f;
`;

const mockAgents: Agent[] = [
  { id: '1', name: 'CustomerAgent', initials: 'CA', status: 'online' },
  { id: '2', name: 'SupportBot', initials: 'SB', status: 'online' },
  { id: '3', name: 'DataAgent', initials: 'DA', status: 'offline' },
  { id: '4', name: 'ErrorAgent', initials: 'EA', status: 'error' },
];

const meta: Meta<typeof AgentSelector> = {
  title: 'Domain/Agents/AgentSelector',
  component: AgentSelector,
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
type Story = StoryObj<typeof AgentSelector>;

export const Default: Story = {
  render: function AgentSelectorDefault() {
    const [selected, setSelected] = useState(mockAgents[0]);
    return (
      <AgentSelector
        agents={mockAgents}
        selectedAgent={selected}
        onSelect={setSelected}
      />
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CustomerAgent')).toBeInTheDocument();
    await expect(canvas.getByText('Active Agent')).toBeInTheDocument();
  },
};

export const WithStatuses: Story = {
  render: function AgentSelectorWithStatuses() {
    const [selected, setSelected] = useState(mockAgents[0]);
    return (
      <AgentSelector
        agents={mockAgents}
        selectedAgent={selected}
        onSelect={setSelected}
      />
    );
  },
};

export const Collapsed: Story = {
  args: {
    agents: mockAgents,
    selectedAgent: mockAgents[0],
    onSelect: fn(),
    collapsed: true,
  },
};

export const SelectionInteraction: Story = {
  args: {
    agents: mockAgents,
    selectedAgent: mockAgents[0],
    onSelect: fn(),
  },
  play: async ({ args, canvas }) => {
    // Open dropdown
    const selectBox = canvas.getByRole('button');
    await userEvent.click(selectBox);

    // Select a different agent
    const supportBot = canvas.getByText('SupportBot');
    await userEvent.click(supportBot);

    await expect(args.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'SupportBot' })
    );
  },
};

export const KeyboardNavigation: Story = {
  render: function AgentSelectorKeyboard() {
    const [selected, setSelected] = useState(mockAgents[0]);
    return (
      <AgentSelector
        agents={mockAgents}
        selectedAgent={selected}
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
