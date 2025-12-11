import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { SecurityCheckItem } from './SecurityCheckItem';

const meta: Meta<typeof SecurityCheckItem> = {
  title: 'Domain/Analysis/SecurityCheckItem',
  component: SecurityCheckItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 220, background: 'var(--color-surface)', padding: 8, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SecurityCheckItem>;

// ==================== Status States ====================

export const OK: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    stat: 'All checks passed',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('All checks passed')).toBeInTheDocument();
  },
};

export const Warning: Story = {
  args: {
    label: 'Dynamic Analysis',
    status: 'warning',
    count: 3,
    stat: '3 warnings found',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('3')).toBeInTheDocument();
  },
};

export const Critical: Story = {
  args: {
    label: 'Security Check',
    status: 'critical',
    count: 5,
    stat: '5 critical issues',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Security Check')).toBeInTheDocument();
    await expect(canvas.getByText('5')).toBeInTheDocument();
  },
};

export const Running: Story = {
  args: {
    label: 'Analysis Running',
    status: 'running',
    stat: 'In progress...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Analysis Running')).toBeInTheDocument();
    await expect(canvas.getByText('In progress...')).toBeInTheDocument();
  },
};

export const Inactive: Story = {
  args: {
    label: 'Dev Connection',
    status: 'inactive',
    stat: 'Not connected',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dev Connection')).toBeInTheDocument();
  },
};

export const Locked: Story = {
  args: {
    label: 'Production',
    status: 'locked',
    isLocked: true,
    lockedTooltip: 'Complete all security checks to unlock Production deployment.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Production')).toBeInTheDocument();
  },
};

export const Premium: Story = {
  args: {
    label: 'Production',
    status: 'premium',
    stat: 'Ready to deploy',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Production')).toBeInTheDocument();
    await expect(canvas.getByText('Ready to deploy')).toBeInTheDocument();
  },
};

// ==================== Collapsed State ====================

export const Collapsed: Story = {
  args: {
    label: 'Static Analysis',
    status: 'warning',
    count: 3,
    collapsed: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 64, background: 'var(--color-surface)', padding: 8, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Label should not be visible when collapsed
    await expect(canvas.queryByText('Static Analysis')).not.toBeInTheDocument();
  },
};

export const CollapsedRunning: Story = {
  args: {
    label: 'Analysis Running',
    status: 'running',
    collapsed: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 64, background: 'var(--color-surface)', padding: 8, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('Analysis Running')).not.toBeInTheDocument();
  },
};

// ==================== Timeline Connectors ====================

export const WithTimelineConnectors: Story = {
  render: function TimelineStory() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 20, paddingBottom: 20 }}>
        <SecurityCheckItem
          label="Dev Connection"
          status="ok"
          isFirst
          showConnectorBelow
        />
        <SecurityCheckItem
          label="Static Analysis"
          status="ok"
          count={0}
          showConnectorAbove
          showConnectorBelow
        />
        <SecurityCheckItem
          label="Dynamic Analysis"
          status="warning"
          count={3}
          showConnectorAbove
          showConnectorBelow
        />
        <SecurityCheckItem
          label="Production"
          status="locked"
          isLocked
          isLast
          showConnectorAbove
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dev Connection')).toBeInTheDocument();
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Production')).toBeInTheDocument();
  },
};

export const TimelineAllGreen: Story = {
  render: function TimelineAllGreenStory() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 20, paddingBottom: 20 }}>
        <SecurityCheckItem
          label="Dev Connection"
          status="ok"
          isFirst
          showConnectorBelow
        />
        <SecurityCheckItem
          label="Static Analysis"
          status="ok"
          showConnectorAbove
          showConnectorBelow
        />
        <SecurityCheckItem
          label="Dynamic Analysis"
          status="ok"
          showConnectorAbove
          showConnectorBelow
        />
        <SecurityCheckItem
          label="Production"
          status="premium"
          stat="Ready to deploy"
          isLast
          showConnectorAbove
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Production')).toBeInTheDocument();
    await expect(canvas.getByText('Ready to deploy')).toBeInTheDocument();
  },
};

// ==================== All States Comparison ====================

export const AllStatesComparison: Story = {
  render: function AllStatesComparisonStory() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SecurityCheckItem
          label="OK Status"
          status="ok"
          stat="All passed"
        />
        <SecurityCheckItem
          label="Warning Status"
          status="warning"
          count={3}
          stat="3 warnings"
        />
        <SecurityCheckItem
          label="Critical Status"
          status="critical"
          count={5}
          stat="5 critical"
        />
        <SecurityCheckItem
          label="Running Status"
          status="running"
          stat="Scanning..."
        />
        <SecurityCheckItem
          label="Inactive Status"
          status="inactive"
          stat="Not enabled"
        />
        <SecurityCheckItem
          label="Locked Status"
          status="locked"
          isLocked
        />
        <SecurityCheckItem
          label="Premium Status"
          status="premium"
          stat="Unlocked"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('OK Status')).toBeInTheDocument();
    await expect(canvas.getByText('Premium Status')).toBeInTheDocument();
  },
};

// ==================== Sidebar Context ====================

export const InSidebarContext: Story = {
  render: function InSidebarContextStory() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '8px 16px',
            background: 'var(--color-cyan)',
            color: 'var(--color-void)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>

        <div
          style={{
            width: collapsed ? 64 : 220,
            background: 'var(--color-surface)',
            padding: 8,
            borderRadius: 8,
            transition: 'width 150ms',
          }}
        >
          {!collapsed && (
            <div style={{
              fontSize: 10,
              color: 'var(--color-white-30)',
              padding: '8px 12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Security Checks
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: collapsed ? 0 : 20 }}>
            <SecurityCheckItem
              label="Dev"
              status="ok"
              collapsed={collapsed}
              isFirst
              showConnectorBelow
            />
            <SecurityCheckItem
              label="Static Analysis"
              status="ok"
              collapsed={collapsed}
              showConnectorAbove
              showConnectorBelow
            />
            <SecurityCheckItem
              label="Dynamic Analysis"
              status="warning"
              count={3}
              collapsed={collapsed}
              showConnectorAbove
              showConnectorBelow
            />
            <SecurityCheckItem
              label="Production"
              status="locked"
              isLocked
              collapsed={collapsed}
              isLast
              showConnectorAbove
            />
          </div>
        </div>
      </div>
    );
  },
  decorators: [(Story) => <Story />],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button')).toBeInTheDocument();
  },
};

// ==================== Active State ====================

export const Active: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    active: true,
    stat: 'All passed',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
  },
};

export const ActiveWithWarning: Story = {
  args: {
    label: 'Dynamic Analysis',
    status: 'warning',
    count: 3,
    active: true,
    stat: '3 warnings',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
  },
};

// ==================== Disabled State ====================

export const Disabled: Story = {
  args: {
    label: 'Static Analysis',
    status: 'inactive',
    disabled: true,
    stat: 'Not available',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
  },
};

// ==================== Navigation (to prop) ====================

export const WithNavigation: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    stat: 'All passed',
    to: '/agent/test-agent/static-analysis',
  },
  parameters: {
    router: {
      initialEntries: ['/agent/test-agent'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link');
    await expect(link).toBeInTheDocument();
    await expect(link).toHaveAttribute('href', '/agent/test-agent/static-analysis');
  },
};

export const WithNavigationActive: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    stat: 'All passed',
    to: '/agent/test-agent/static-analysis',
    active: true,
  },
  parameters: {
    router: {
      initialEntries: ['/agent/test-agent/static-analysis'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link');
    await expect(link).toBeInTheDocument();
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
  },
};

export const NavigationDisabled: Story = {
  args: {
    label: 'Static Analysis',
    status: 'inactive',
    to: '/agent/test-agent/static-analysis',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // When disabled, should not render as a link
    await expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
  },
};

export const NavigationLocked: Story = {
  args: {
    label: 'Production',
    status: 'locked',
    isLocked: true,
    lockedTooltip: 'Complete all checks to unlock',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Locked items should not be clickable links
    await expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    await expect(canvas.getByText('Production')).toBeInTheDocument();
  },
};

// ==================== Without Badge (No Count) ====================

export const WithoutBadge: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    stat: 'Complete',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    // Badge should not be present
    await expect(canvas.queryByText(/^\d+$/)).not.toBeInTheDocument();
  },
};

// ==================== Zero Count (Badge Hidden) ====================

export const ZeroCount: Story = {
  args: {
    label: 'Security Check',
    status: 'ok',
    count: 0,
    stat: 'No issues',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Security Check')).toBeInTheDocument();
    // Badge should not show for count=0
    await expect(canvas.queryByText('0')).not.toBeInTheDocument();
  },
};
