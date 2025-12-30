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
      // Clusters in radial layout (center + ring)
      {
        id: 'cluster_1',
        x: 50,
        y: 50,
        size: 'lg',
        type: 'cluster',
        clusterId: 'cluster_1',
        metadata: { size: 15, percentage: 45, commonTools: ['search', 'read_file'] },
      },
      {
        id: 'cluster_2',
        x: 50,
        y: 25,
        size: 'md',
        type: 'cluster',
        clusterId: 'cluster_2',
        metadata: { size: 8, percentage: 25, commonTools: ['write_file'] },
      },
      {
        id: 'cluster_3',
        x: 25,
        y: 50,
        size: 'sm',
        type: 'cluster',
        clusterId: 'cluster_3',
        metadata: { size: 3, percentage: 10 },
      },
      // Outliers positioned around clusters
      {
        id: 'outlier_1',
        x: 75,
        y: 60,
        size: 'sm',
        type: 'outlier',
        sessionId: 'sess-abc123',
        metadata: { severity: 'medium', primaryCauses: ['Unusual tool sequence detected'] },
      },
      {
        id: 'outlier_2',
        x: 85,
        y: 30,
        size: 'md',
        type: 'dangerous',
        sessionId: 'sess-xyz789',
        metadata: { severity: 'high', primaryCauses: ['Excessive token usage', 'Unique tools not seen in normal sessions'] },
      },
    ],
    links: [
      // Outlier to cluster links
      { source: 'outlier_1', target: 'cluster_1', type: 'outlier-to-cluster', strength: 0.5 },
      { source: 'outlier_2', target: 'cluster_2', type: 'outlier-to-cluster', strength: 0.3 },
      // Cluster to cluster links
      { source: 'cluster_1', target: 'cluster_2', type: 'cluster-to-cluster', strength: 0.8 },
      { source: 'cluster_1', target: 'cluster_3', type: 'cluster-to-cluster', strength: 0.6 },
    ],
    height: 250,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Normal Cluster')).toBeInTheDocument();
    await expect(canvas.getByText('Outlier')).toBeInTheDocument();
    await expect(canvas.getByText('Dangerous')).toBeInTheDocument();
  },
};

export const WithLinks: Story = {
  args: {
    nodes: [
      // Main cluster at center
      {
        id: 'main',
        x: 50,
        y: 50,
        size: 'lg',
        type: 'cluster',
        clusterId: 'main',
        metadata: { size: 25, percentage: 60, commonTools: ['search', 'read_file', 'write_file'] },
      },
      // Secondary clusters in ring
      {
        id: 'secondary_1',
        x: 50,
        y: 20,
        size: 'md',
        type: 'cluster',
        clusterId: 'secondary_1',
        metadata: { size: 8, percentage: 20 },
      },
      {
        id: 'secondary_2',
        x: 25,
        y: 65,
        size: 'sm',
        type: 'cluster',
        clusterId: 'secondary_2',
        metadata: { size: 5, percentage: 12 },
      },
      // Outliers linked to clusters
      {
        id: 'out_1',
        x: 75,
        y: 35,
        size: 'sm',
        type: 'outlier',
        sessionId: 'sess-out1',
        metadata: { severity: 'low', primaryCauses: ['Minor deviation'] },
      },
      {
        id: 'out_2',
        x: 80,
        y: 60,
        size: 'sm',
        type: 'outlier',
        sessionId: 'sess-out2',
        metadata: { severity: 'medium', primaryCauses: ['Unusual pattern'] },
      },
      {
        id: 'out_3',
        x: 15,
        y: 35,
        size: 'md',
        type: 'dangerous',
        sessionId: 'sess-out3',
        metadata: { severity: 'high', primaryCauses: ['Critical anomaly detected'] },
      },
    ],
    links: [
      // Cluster-to-cluster links (solid lines)
      { source: 'main', target: 'secondary_1', type: 'cluster-to-cluster', strength: 0.9 },
      { source: 'main', target: 'secondary_2', type: 'cluster-to-cluster', strength: 0.7 },
      { source: 'secondary_1', target: 'secondary_2', type: 'cluster-to-cluster', strength: 0.4 },
      // Outlier-to-cluster links (dashed lines)
      { source: 'out_1', target: 'main', type: 'outlier-to-cluster', strength: 0.6 },
      { source: 'out_2', target: 'main', type: 'outlier-to-cluster', strength: 0.4 },
      { source: 'out_3', target: 'secondary_2', type: 'outlier-to-cluster', strength: 0.2 },
    ],
    height: 280,
  },
  play: async ({ canvas }) => {
    // Verify nodes are rendered
    await expect(canvas.getByTestId('cluster-node-main')).toBeInTheDocument();
    await expect(canvas.getByTestId('cluster-node-out_1')).toBeInTheDocument();
    await expect(canvas.getByTestId('cluster-node-out_3')).toBeInTheDocument();
    // Verify legend
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
    links: [
      { source: '2', target: '1', type: 'outlier-to-cluster', strength: 0.5 },
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

export const NoLinks: Story = {
  args: {
    nodes: [
      { id: '1', x: 30, y: 30, size: 'lg', type: 'cluster', clusterId: 'cluster_1' },
      { id: '2', x: 50, y: 50, size: 'md', type: 'cluster', clusterId: 'cluster_2' },
      { id: '3', x: 70, y: 40, size: 'sm', type: 'outlier', sessionId: 'sess-1' },
    ],
    // No links prop - should render without links
    height: 200,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('cluster-node-1')).toBeInTheDocument();
    await expect(canvas.getByTestId('cluster-node-2')).toBeInTheDocument();
    await expect(canvas.getByTestId('cluster-node-3')).toBeInTheDocument();
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
        x: 50,
        y: 50,
        size: 'lg',
        type: 'cluster',
        clusterId: 'cluster_main',
        metadata: {
          size: 42,
          percentage: 68,
          commonTools: ['read_file', 'write_file', 'search', 'bash', 'list_dir'],
        },
      },
      // Medium cluster
      {
        id: 'cluster-secondary',
        x: 50,
        y: 20,
        size: 'md',
        type: 'cluster',
        clusterId: 'cluster_secondary',
        metadata: {
          size: 12,
          percentage: 19,
          commonTools: ['read_file', 'write_file'],
        },
      },
      // Small cluster
      {
        id: 'cluster-small',
        x: 25,
        y: 50,
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
        x: 70,
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
        x: 75,
        y: 55,
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
    links: [
      // Cluster connections
      { source: 'cluster-main', target: 'cluster-secondary', type: 'cluster-to-cluster', strength: 0.85 },
      { source: 'cluster-main', target: 'cluster-small', type: 'cluster-to-cluster', strength: 0.5 },
      // Outlier connections
      { source: 'outlier-low', target: 'cluster-main', type: 'outlier-to-cluster', strength: 0.7 },
      { source: 'outlier-med', target: 'cluster-main', type: 'outlier-to-cluster', strength: 0.4 },
      { source: 'dangerous-high', target: 'cluster-secondary', type: 'outlier-to-cluster', strength: 0.2 },
      { source: 'dangerous-critical', target: 'cluster-main', type: 'outlier-to-cluster', strength: 0.1 },
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
