import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { ScanStatusCard } from './ScanStatusCard';

const meta: Meta<typeof ScanStatusCard> = {
  title: 'Domain/Security/ScanStatusCard',
  component: ScanStatusCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScanStatusCard>;

export const NoScansYet: Story = {
  args: {
    lastScan: null,
    summary: null,
    onRunScan: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No scans yet')).toBeInTheDocument();
    await expect(canvas.getByText('Run Security Scan')).toBeInTheDocument();
  },
};

export const GateBlocked: Story = {
  args: {
    lastScan: {
      timestamp: '2024-12-15T10:30:00Z',
      scanned_by: 'claude-opus-4.5',
      files_analyzed: 15,
      duration_ms: 2300,
      session_id: 'session-123',
    },
    summary: {
      total_checks: 7,
      passed: 4,
      failed: 2,
      info: 1,
      gate_status: 'BLOCKED',
    },
    severityCounts: {
      critical: 2,
      high: 3,
      medium: 5,
      low: 1,
    },
    checkStatuses: [
      { status: 'FAIL' },
      { status: 'FAIL' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Scan Status')).toBeInTheDocument();
    await expect(canvas.getByText('15 files analyzed')).toBeInTheDocument();
    await expect(canvas.getByText(/by claude-opus-4\.5/)).toBeInTheDocument();
    await expect(canvas.getByText('Critical')).toBeInTheDocument();
  },
};

export const GateOpen: Story = {
  args: {
    lastScan: {
      timestamp: '2024-12-15T10:30:00Z',
      scanned_by: 'claude-opus-4.5',
      files_analyzed: 12,
      duration_ms: 1800,
      session_id: 'session-456',
    },
    summary: {
      total_checks: 7,
      passed: 7,
      failed: 0,
      info: 0,
      gate_status: 'OPEN',
    },
    severityCounts: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 2,
    },
    checkStatuses: [
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Scan Status')).toBeInTheDocument();
    await expect(canvas.getByText('12 files analyzed')).toBeInTheDocument();
    await expect(canvas.getByText('Low')).toBeInTheDocument();
  },
};

export const WithInfoOnly: Story = {
  args: {
    lastScan: {
      timestamp: '2024-12-15T10:30:00Z',
      scanned_by: 'gpt-4-turbo',
      files_analyzed: 8,
      duration_ms: 1200,
      session_id: 'session-789',
    },
    summary: {
      total_checks: 7,
      passed: 5,
      failed: 0,
      info: 2,
      gate_status: 'OPEN',
    },
    severityCounts: {
      critical: 0,
      high: 0,
      medium: 4,
      low: 1,
    },
    checkStatuses: [
      { status: 'PASS' },
      { status: 'INFO' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Scan Status')).toBeInTheDocument();
    await expect(canvas.getByText('8 files analyzed')).toBeInTheDocument();
    await expect(canvas.getByText(/by gpt-4-turbo/)).toBeInTheDocument();
  },
};

/** Shows scan with minimal data - only scanned_by, no files_analyzed or duration_ms */
export const MinimalScanData: Story = {
  args: {
    lastScan: {
      timestamp: '2025-12-21T13:54:02.905483+00:00',
      scanned_by: 'AI Assistant',
      files_analyzed: null,
      duration_ms: null,
      session_id: 'sess_cddf0aa67831',
    },
    summary: {
      total_checks: 5,
      passed: 5,
      failed: 0,
      info: 0,
      gate_status: 'OPEN',
    },
    checkStatuses: [
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Scan Status')).toBeInTheDocument();
    // Should show scanned_by without the separator since files_analyzed is null
    await expect(canvas.getByText(/by AI Assistant/)).toBeInTheDocument();
    // Should NOT show "files analyzed" text since it's null
    const filesText = canvas.queryByText(/files analyzed/);
    await expect(filesText).not.toBeInTheDocument();
  },
};
