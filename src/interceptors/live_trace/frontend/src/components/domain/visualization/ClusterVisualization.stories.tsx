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
      {
        id: '1',
        x: 25,
        y: 35,
        size: 'lg',
        type: 'cluster',
        clusterId: 'cluster_1',
        metadata: { size: 15, percentage: 45, commonTools: ['search', 'read_file'] },
      },
      {
        id: '2',
        x: 30,
        y: 45,
        size: 'md',
        type: 'cluster',
        clusterId: 'cluster_2',
        metadata: { size: 8, percentage: 25, commonTools: ['write_file'] },
      },
      { id: '3', x: 22, y: 40, size: 'sm', type: 'cluster', clusterId: 'cluster_3', metadata: { size: 3, percentage: 10 } },
      { id: '4', x: 70, y: 30, size: 'md', type: 'cluster', clusterId: 'cluster_4', metadata: { size: 5, percentage: 15 } },
      {
        id: '5',
        x: 75,
        y: 60,
        size: 'sm',
        type: 'outlier',
        sessionId: 'sess-abc123',
        metadata: { severity: 'medium', primaryCauses: ['Unusual tool sequence detected'] },
      },
      {
        id: '6',
        x: 85,
        y: 20,
        size: 'md',
        type: 'dangerous',
        sessionId: 'sess-xyz789',
        metadata: { severity: 'high', primaryCauses: ['Excessive token usage', 'Unique tools not seen in normal sessions'] },
      },
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
      {
        id: '1',
        x: 30,
        y: 40,
        size: 'lg',
        type: 'cluster',
        clusterId: 'cluster_1',
        metadata: { size: 10, percentage: 50 },
      },
      {
        id: '2',
        x: 70,
        y: 60,
        size: 'md',
        type: 'outlier',
        sessionId: 'sess-test123',
        metadata: { severity: 'low', primaryCauses: ['Minor deviation'] },
      },
    ],
    height: 200,
    onNodeClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const node = canvas.getByTestId('cluster-node-1');
    await userEvent.click(node);
    await expect(args.onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', type: 'cluster', clusterId: 'cluster_1' })
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

export const DetailedTooltips: Story = {
  args: {
    nodes: [
      // Large cluster with common tools
      {
        id: 'cluster-main',
        x: 25,
        y: 40,
        size: 'lg',
        type: 'cluster',
        clusterId: 'cluster_main',
        metadata: {
          size: 42,
          percentage: 68,
          commonTools: ['read_file', 'write_file', 'search', 'bash', 'list_dir'],
        },
      },
      // Medium cluster with fewer tools
      {
        id: 'cluster-secondary',
        x: 35,
        y: 55,
        size: 'md',
        type: 'cluster',
        clusterId: 'cluster_secondary',
        metadata: {
          size: 12,
          percentage: 19,
          commonTools: ['read_file', 'write_file'],
        },
      },
      // Small cluster with no tools data
      {
        id: 'cluster-small',
        x: 20,
        y: 30,
        size: 'sm',
        type: 'cluster',
        clusterId: 'cluster_small',
        metadata: {
          size: 3,
          percentage: 5,
        },
      },
      // Low severity outlier
      {
        id: 'outlier-low',
        x: 60,
        y: 35,
        size: 'sm',
        type: 'outlier',
        sessionId: 'sess-abc123def456',
        metadata: {
          severity: 'low',
          primaryCauses: ['Slightly elevated response time'],
        },
      },
      // Medium severity outlier with multiple causes
      {
        id: 'outlier-med',
        x: 72,
        y: 50,
        size: 'md',
        type: 'outlier',
        sessionId: 'sess-xyz789uvw012',
        metadata: {
          severity: 'medium',
          primaryCauses: [
            'Unusual tool combination detected',
            'Token usage 2x above baseline',
            'Extended session duration',
          ],
        },
      },
      // High severity dangerous session
      {
        id: 'dangerous-high',
        x: 85,
        y: 25,
        size: 'md',
        type: 'dangerous',
        sessionId: 'sess-danger-001',
        metadata: {
          severity: 'high',
          primaryCauses: [
            'Attempted access to restricted resources',
            'Multiple failed authentication attempts',
          ],
        },
      },
      // Critical dangerous session
      {
        id: 'dangerous-critical',
        x: 78,
        y: 70,
        size: 'lg',
        type: 'dangerous',
        sessionId: 'sess-critical-999',
        metadata: {
          severity: 'critical',
          primaryCauses: [
            'Potential data exfiltration pattern detected',
            'Anomalous network requests',
            'Bypassing security controls',
            'Elevated privilege usage',
          ],
        },
      },
    ],
    height: 300,
    onNodeClick: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Normal Cluster')).toBeInTheDocument();
    await expect(canvas.getByText('Outlier')).toBeInTheDocument();
    await expect(canvas.getByText('Dangerous')).toBeInTheDocument();

    // Verify all nodes are rendered
    await expect(canvas.getByTestId('cluster-node-cluster-main')).toBeInTheDocument();
    await expect(canvas.getByTestId('cluster-node-outlier-low')).toBeInTheDocument();
    await expect(canvas.getByTestId('cluster-node-dangerous-critical')).toBeInTheDocument();
  },
};
