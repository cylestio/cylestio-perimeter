import type { Meta, StoryObj } from '@storybook/react';
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
      gate_status: 'UNBLOCKED',
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
      gate_status: 'UNBLOCKED',
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
};
