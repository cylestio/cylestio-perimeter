import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { AnalysisStatusItem } from './AnalysisStatusItem';

const meta: Meta<typeof AnalysisStatusItem> = {
  title: 'Domain/Analysis/AnalysisStatusItem',
  component: AnalysisStatusItem,
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
type Story = StoryObj<typeof AnalysisStatusItem>;

// ==================== Status States ====================

export const OK: Story = {
  args: {
    label: 'Static Scan',
    status: 'ok',
    stat: 'All checks passed',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Scan')).toBeInTheDocument();
    await expect(canvas.getByText('All checks passed')).toBeInTheDocument();
  },
};

export const Warning: Story = {
  args: {
    label: 'Dynamic Scan',
    status: 'warning',
    count: 3,
    stat: '3 warnings found',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dynamic Scan')).toBeInTheDocument();
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
    label: 'Disabled Check',
    status: 'inactive',
    stat: 'Not configured',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Disabled Check')).toBeInTheDocument();
  },
};

// ==================== Recommendations (Special Styling) ====================

export const Recommendations: Story = {
  args: {
    label: 'Recommendations',
    status: 'ok',
    count: 7,
    stat: '7 fixes available',
    isRecommendation: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Recommendations')).toBeInTheDocument();
    await expect(canvas.getByText('7')).toBeInTheDocument();
  },
};

export const RecommendationsWarning: Story = {
  args: {
    label: 'Auto-Fix Available',
    status: 'warning',
    count: 3,
    stat: '3 issues can be fixed',
    isRecommendation: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Auto-Fix Available')).toBeInTheDocument();
  },
};

// ==================== Collapsed State ====================

export const Collapsed: Story = {
  args: {
    label: 'Static Scan',
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
    await expect(canvas.queryByText('Static Scan')).not.toBeInTheDocument();
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

// ==================== All States Comparison ====================

export const AllStatesComparison: Story = {
  render: function AllStatesComparisonStory() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AnalysisStatusItem
          label="Static Scan"
          status="ok"
          stat="All passed"
        />
        <AnalysisStatusItem
          label="Dynamic Scan"
          status="warning"
          count={3}
          stat="3 warnings"
        />
        <AnalysisStatusItem
          label="Security"
          status="critical"
          count={5}
          stat="5 critical"
        />
        <AnalysisStatusItem
          label="PII Detection"
          status="running"
          stat="Scanning..."
        />
        <AnalysisStatusItem
          label="Behavioral"
          status="inactive"
          stat="Not enabled"
        />
        <AnalysisStatusItem
          label="Recommendations"
          status="ok"
          count={7}
          isRecommendation
          stat="7 available"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Scan')).toBeInTheDocument();
    await expect(canvas.getByText('Recommendations')).toBeInTheDocument();
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
              Analysis
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnalysisStatusItem
              label="Static Scan"
              status="ok"
              collapsed={collapsed}
            />
            <AnalysisStatusItem
              label="Dynamic Scan"
              status="warning"
              count={3}
              collapsed={collapsed}
            />
            <AnalysisStatusItem
              label="Recommendations"
              status="ok"
              count={7}
              isRecommendation
              collapsed={collapsed}
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

// ==================== Without Badge (No Count) ====================

export const WithoutBadge: Story = {
  args: {
    label: 'Static Scan',
    status: 'ok',
    stat: 'Complete',
    // No count prop - badge won't show
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Scan')).toBeInTheDocument();
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

// ==================== Active State ====================

export const Active: Story = {
  args: {
    label: 'Static Scan',
    status: 'ok',
    active: true,
    stat: 'All passed',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Scan')).toBeInTheDocument();
  },
};

export const ActiveWithWarning: Story = {
  args: {
    label: 'Dynamic Scan',
    status: 'warning',
    count: 3,
    active: true,
    stat: '3 warnings',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Dynamic Scan')).toBeInTheDocument();
  },
};

export const ActiveRecommendation: Story = {
  args: {
    label: 'Recommendations',
    status: 'ok',
    count: 5,
    active: true,
    isRecommendation: true,
    stat: '5 available',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Recommendations')).toBeInTheDocument();
  },
};

// ==================== Disabled State ====================

export const Disabled: Story = {
  args: {
    label: 'Static Scan',
    status: 'inactive',
    disabled: true,
    stat: 'Not available',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Scan')).toBeInTheDocument();
  },
};

export const DisabledComparison: Story = {
  render: function DisabledComparisonStory() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AnalysisStatusItem
          label="Static Analysis"
          status="inactive"
          disabled
        />
        <AnalysisStatusItem
          label="Dynamic Analysis"
          status="inactive"
          disabled
        />
        <AnalysisStatusItem
          label="Recommendations"
          status="inactive"
          isRecommendation
          disabled
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Recommendations')).toBeInTheDocument();
  },
};

// ==================== Navigation (to prop) ====================

export const WithNavigation: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    stat: 'All passed',
    to: '/workflow/test-workflow/static-analysis',
  },
  parameters: {
    router: {
      initialEntries: ['/workflow/test-workflow'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link');
    await expect(link).toBeInTheDocument();
    await expect(link).toHaveAttribute('href', '/workflow/test-workflow/static-analysis');
  },
};

export const WithNavigationActive: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    stat: 'All passed',
    to: '/workflow/test-workflow/static-analysis',
    active: true,
  },
  parameters: {
    router: {
      initialEntries: ['/workflow/test-workflow/static-analysis'],
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
    to: '/workflow/test-workflow/static-analysis',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // When disabled, should not render as a link
    await expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
  },
};

export const NavigationCollapsed: Story = {
  args: {
    label: 'Static Analysis',
    status: 'ok',
    to: '/workflow/test-workflow/static-analysis',
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
    const link = canvas.getByRole('link');
    await expect(link).toBeInTheDocument();
    // Label should not be visible when collapsed
    await expect(canvas.queryByText('Static Analysis')).not.toBeInTheDocument();
  },
};
