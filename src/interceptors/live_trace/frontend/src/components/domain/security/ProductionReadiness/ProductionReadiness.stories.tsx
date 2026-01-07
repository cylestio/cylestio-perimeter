import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { ProductionReadiness } from './ProductionReadiness';

const meta: Meta<typeof ProductionReadiness> = {
  title: 'Domain/Security/ProductionReadiness',
  component: ProductionReadiness,
  tags: ['autodocs'],
  parameters: {
    router: {
      initialEntries: ['/agent-workflow/test-workflow/overview'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProductionReadiness>;

// All checks passed - production ready
export const Ready: Story = {
  args: {
    staticAnalysis: { status: 'completed', criticalCount: 0 },
    dynamicAnalysis: { status: 'completed', criticalCount: 0 },
    isBlocked: false,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Production Ready')).toBeInTheDocument();
    await expect(canvas.getByText('All checks passed')).toBeInTheDocument();
    await expect(canvas.getByText('Generate Report')).toBeInTheDocument();
  },
};

// Has blocking issues
export const Blocked: Story = {
  args: {
    staticAnalysis: { status: 'completed', criticalCount: 3 },
    dynamicAnalysis: { status: 'completed', criticalCount: 2 },
    isBlocked: true,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Attention Required')).toBeInTheDocument();
    await expect(canvas.getByText('5 blocking issues')).toBeInTheDocument();
    await expect(canvas.getByText('Fix Issues')).toBeInTheDocument();
    await expect(canvas.getByText('3')).toBeInTheDocument();
    await expect(canvas.getByText('2')).toBeInTheDocument();
  },
};

// Static has issues, dynamic clean
export const StaticBlocked: Story = {
  args: {
    staticAnalysis: { status: 'completed', criticalCount: 4 },
    dynamicAnalysis: { status: 'completed', criticalCount: 0 },
    isBlocked: true,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Attention Required')).toBeInTheDocument();
    await expect(canvas.getByText('4')).toBeInTheDocument();
  },
};

// Both analyses running - shows in progress state with gray styling
export const Running: Story = {
  args: {
    staticAnalysis: { status: 'running', criticalCount: 0 },
    dynamicAnalysis: { status: 'running', criticalCount: 0 },
    isBlocked: false,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Analysis In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('Running security scans...')).toBeInTheDocument();
  },
};

// Static complete, dynamic pending - analysis required
export const PartialProgress: Story = {
  args: {
    staticAnalysis: { status: 'completed', criticalCount: 0 },
    dynamicAnalysis: { status: 'pending', criticalCount: 0 },
    isBlocked: false,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Analysis Required')).toBeInTheDocument();
    await expect(canvas.getByText('Complete all scans for production readiness')).toBeInTheDocument();
  },
};

// Static running, dynamic pending
export const StaticRunning: Story = {
  args: {
    staticAnalysis: { status: 'running', criticalCount: 0 },
    dynamicAnalysis: { status: 'pending', criticalCount: 0 },
    isBlocked: false,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Analysis In Progress')).toBeInTheDocument();
  },
};

// Both pending (initial state) - gray styling, no action button
export const Pending: Story = {
  args: {
    staticAnalysis: { status: 'pending', criticalCount: 0 },
    dynamicAnalysis: { status: 'pending', criticalCount: 0 },
    isBlocked: false,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Static Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic Analysis')).toBeInTheDocument();
    await expect(canvas.getByText('Analysis Required')).toBeInTheDocument();
    await expect(canvas.getByText('Complete all scans for production readiness')).toBeInTheDocument();
    // No action button when pending
    await expect(canvas.queryByText('Generate Report')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Fix Issues')).not.toBeInTheDocument();
  },
};

// Static green but dynamic has issues - NOT production ready
export const DynamicBlocked: Story = {
  args: {
    staticAnalysis: { status: 'completed', criticalCount: 0 },
    dynamicAnalysis: { status: 'completed', criticalCount: 2 },
    isBlocked: false, // Backend might say false, but frontend computes correctly
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Attention Required')).toBeInTheDocument();
    await expect(canvas.getByText('2 blocking issues')).toBeInTheDocument();
    await expect(canvas.getByText('Fix Issues')).toBeInTheDocument();
    await expect(canvas.getByText('2')).toBeInTheDocument();
  },
};

// Static incomplete (running) but dynamic complete - still in progress
export const StaticIncomplete: Story = {
  args: {
    staticAnalysis: { status: 'running', criticalCount: 0 },
    dynamicAnalysis: { status: 'completed', criticalCount: 0 },
    isBlocked: false,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Analysis In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('Running security scans...')).toBeInTheDocument();
  },
};

// Interactive - clicking blocked stage
export const ClickableStage: Story = {
  args: {
    staticAnalysis: { status: 'completed', criticalCount: 5 },
    dynamicAnalysis: { status: 'completed', criticalCount: 0 },
    isBlocked: true,
    workflowId: 'test-workflow',
  },
  play: async ({ canvas }) => {
    // The stage with issues should be clickable
    const badge = canvas.getByText('5');
    await expect(badge).toBeInTheDocument();

    // Find the parent Stage element and click it
    const staticStage = badge.closest('[class*="Stage"]');
    if (staticStage) {
      await userEvent.click(staticStage);
    }
  },
};
