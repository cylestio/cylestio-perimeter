import type { Meta, StoryObj } from '@storybook/react';

import { ScanStatusCard } from './ScanStatusCard';

const meta: Meta<typeof ScanStatusCard> = {
  title: 'Domain/Security/ScanStatusCard',
  component: ScanStatusCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ScanStatusCard>;

export const WithFindings: Story = {
  args: {
    lastScan: {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      scannedBy: 'AI Assistant',
      filesAnalyzed: 15,
      durationMs: 2300,
    },
    checks: [
      { status: 'FAIL' },
      { status: 'FAIL' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
    severityCounts: {
      CRITICAL: 2,
      HIGH: 3,
      MEDIUM: 5,
      LOW: 1,
    },
  },
};

export const AllPassed: Story = {
  args: {
    lastScan: {
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      scannedBy: 'AI Assistant',
      filesAnalyzed: 8,
      durationMs: 1500,
    },
    checks: [
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'UNBLOCKED',
  },
};

export const OnlyLowSeverity: Story = {
  args: {
    lastScan: {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      scannedBy: 'Claude',
      filesAnalyzed: 12,
      durationMs: 1800,
    },
    checks: [
      { status: 'PASS' },
      { status: 'INFO' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'UNBLOCKED',
    severityCounts: {
      MEDIUM: 2,
      LOW: 4,
    },
  },
};

export const NoScanYet: Story = {
  args: {
    lastScan: null,
    checks: [],
    gateStatus: 'BLOCKED',
  },
};

export const MinimalInfo: Story = {
  args: {
    lastScan: {
      timestamp: new Date().toISOString(),
    },
    checks: [
      { status: 'FAIL' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
    severityCounts: {
      HIGH: 1,
    },
  },
};
