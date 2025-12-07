import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { ClusterVisualization } from './ClusterVisualization';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  max-width: 600px;
`;

const meta: Meta<typeof ClusterVisualization> = {
  title: 'Domain/Visualization/ClusterVisualization',
  component: ClusterVisualization,
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
type Story = StoryObj<typeof ClusterVisualization>;

export const Default: Story = {
  args: {
    nodes: [
      { id: '1', x: 25, y: 35, size: 'lg', type: 'cluster', label: 'Main cluster' },
      { id: '2', x: 30, y: 45, size: 'md', type: 'cluster' },
      { id: '3', x: 22, y: 40, size: 'sm', type: 'cluster' },
      { id: '4', x: 70, y: 30, size: 'md', type: 'cluster' },
      { id: '5', x: 75, y: 60, size: 'sm', type: 'outlier', label: 'Outlier session' },
      { id: '6', x: 85, y: 20, size: 'md', type: 'dangerous', label: 'Dangerous pattern' },
    ],
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Normal Cluster')).toBeInTheDocument();
    await expect(canvas.getByText('Outlier')).toBeInTheDocument();
    await expect(canvas.getByText('Dangerous')).toBeInTheDocument();
  },
};

export const NodeClick: Story = {
  args: {
    nodes: [
      { id: '1', x: 30, y: 40, size: 'lg', type: 'cluster', label: 'Click me' },
      { id: '2', x: 70, y: 60, size: 'md', type: 'outlier' },
    ],
    height: 200,
    onNodeClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const node = canvas.getByTestId('cluster-node-1');
    await userEvent.click(node);
    await expect(args.onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', type: 'cluster' })
    );
  },
};

export const NoLegend: Story = {
  args: {
    nodes: [
      { id: '1', x: 50, y: 50, size: 'lg', type: 'cluster' },
    ],
    height: 150,
    showLegend: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('Normal Cluster')).not.toBeInTheDocument();
  },
};

export const DangerousOnly: Story = {
  args: {
    nodes: [
      { id: '1', x: 30, y: 30, size: 'lg', type: 'dangerous' },
      { id: '2', x: 50, y: 50, size: 'md', type: 'dangerous' },
      { id: '3', x: 70, y: 40, size: 'sm', type: 'dangerous' },
    ],
    height: 200,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dangerous')).toBeInTheDocument();
  },
};
