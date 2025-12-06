import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { SurfaceNode } from './SurfaceNode';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const meta: Meta<typeof SurfaceNode> = {
  title: 'Domain/Visualization/SurfaceNode',
  component: SurfaceNode,
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
type Story = StoryObj<typeof SurfaceNode>;

export const Default: Story = {
  args: {
    label: 'HTTP API',
    type: 'entry',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('HTTP API')).toBeInTheDocument();
  },
};

export const AllTypes: Story = {
  render: () => (
    <Container>
      <SurfaceNode label="HTTP API" type="entry" />
      <SurfaceNode label="search_db" type="tool" />
      <SurfaceNode label="Response" type="exit" />
    </Container>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('HTTP API')).toBeInTheDocument();
    await expect(canvas.getByText('search_db')).toBeInTheDocument();
    await expect(canvas.getByText('Response')).toBeInTheDocument();
  },
};

export const RiskyNodes: Story = {
  render: () => (
    <Container>
      <SurfaceNode label="Public Endpoint" type="entry" risky />
      <SurfaceNode label="delete_all" type="tool" risky />
      <SurfaceNode label="Unencrypted" type="exit" risky />
    </Container>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Public Endpoint')).toBeInTheDocument();
    await expect(canvas.getByText('delete_all')).toBeInTheDocument();
  },
};

export const AttackSurface: Story = {
  render: () => (
    <div style={{ padding: 24, background: '#0a0a0f' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ color: '#ffffff50', fontSize: 12 }}>Entry Points:</span>
        <SurfaceNode label="REST API" type="entry" />
        <SurfaceNode label="WebSocket" type="entry" />
        <SurfaceNode label="CLI" type="entry" risky />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ color: '#ffffff50', fontSize: 12 }}>Tools:</span>
        <SurfaceNode label="query_db" type="tool" />
        <SurfaceNode label="send_email" type="tool" />
        <SurfaceNode label="execute_cmd" type="tool" risky />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#ffffff50', fontSize: 12 }}>Exit Points:</span>
        <SurfaceNode label="JSON Response" type="exit" />
        <SurfaceNode label="File Download" type="exit" risky />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('REST API')).toBeInTheDocument();
    await expect(canvas.getByText('execute_cmd')).toBeInTheDocument();
  },
};
