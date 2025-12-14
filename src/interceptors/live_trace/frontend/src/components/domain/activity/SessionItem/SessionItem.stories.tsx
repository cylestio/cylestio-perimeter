import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';

import { SessionItem } from './SessionItem';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const meta: Meta<typeof SessionItem> = {
  title: 'Domain/Activity/SessionItem',
  component: SessionItem,
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
type Story = StoryObj<typeof SessionItem>;

export const Default: Story = {
  args: {
    agentStepId: 'prompt-a8b9ef35309f',
    agentStepName: 'Prompt A8b9ef35309f',
    sessionId: 'f4f68af8',
    status: 'COMPLETE',
    isActive: false,
    duration: '1h 30m',
    lastActivity: '2d ago',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Prompt A8b9ef35309f')).toBeInTheDocument();
    await expect(canvas.getByText('f4f68af8')).toBeInTheDocument();
    await expect(canvas.getByText('COMPLETE')).toBeInTheDocument();
  },
};

export const Active: Story = {
  args: {
    agentStepId: 'ant-math-agent-v7',
    agentStepName: 'Ant Math',
    sessionId: '09d848b3',
    status: 'ACTIVE',
    isActive: true,
    duration: '<1m',
    lastActivity: 'just now',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Ant Math')).toBeInTheDocument();
    await expect(canvas.getByText('ACTIVE')).toBeInTheDocument();
  },
};

export const WithErrors: Story = {
  args: {
    agentStepId: 'error-prone-agent',
    agentStepName: 'Error Prone',
    sessionId: 'abc12345',
    status: 'ERROR',
    isActive: false,
    duration: '5m',
    lastActivity: '1h ago',
    hasErrors: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ERROR')).toBeInTheDocument();
  },
};

export const Clickable: Story = {
  args: {
    agentStepId: 'clickable-agent',
    agentStepName: 'Clickable Agent',
    sessionId: 'click123',
    status: 'COMPLETE',
    isActive: false,
    duration: '10m',
    lastActivity: '5m ago',
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const item = canvas.getByText('Clickable Agent');
    await userEvent.click(item);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const AllStates: Story = {
  render: () => (
    <>
      <SessionItem
        agentStepId="active-agent"
        agentStepName="Active Session"
        sessionId="active01"
        status="ACTIVE"
        isActive={true}
        duration="<1m"
        lastActivity="just now"
      />
      <SessionItem
        agentStepId="complete-agent"
        agentStepName="Completed Session"
        sessionId="done0123"
        status="COMPLETE"
        isActive={false}
        duration="45m"
        lastActivity="1h ago"
      />
      <SessionItem
        agentStepId="error-agent"
        agentStepName="Error Session"
        sessionId="err12345"
        status="ERROR"
        isActive={false}
        duration="2m"
        lastActivity="30m ago"
        hasErrors={true}
      />
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Active Session')).toBeInTheDocument();
    await expect(canvas.getByText('Completed Session')).toBeInTheDocument();
    await expect(canvas.getByText('Error Session')).toBeInTheDocument();
  },
};
