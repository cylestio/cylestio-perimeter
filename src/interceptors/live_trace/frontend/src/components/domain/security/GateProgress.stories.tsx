import type { Meta, StoryObj } from '@storybook/react';

import { GateProgress } from './GateProgress';

const meta: Meta<typeof GateProgress> = {
  title: 'Domain/Security/GateProgress',
  component: GateProgress,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof GateProgress>;

export const AllPassed: Story = {
  args: {
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

export const Blocked: Story = {
  args: {
    checks: [
      { status: 'FAIL' },
      { status: 'FAIL' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
  },
};

export const MixedStatus: Story = {
  args: {
    checks: [
      { status: 'PASS' },
      { status: 'INFO' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'UNBLOCKED',
  },
};

export const NoStats: Story = {
  args: {
    checks: [
      { status: 'PASS' },
      { status: 'FAIL' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
    showStats: false,
  },
};

export const SingleCheck: Story = {
  args: {
    checks: [{ status: 'PASS' }],
    gateStatus: 'UNBLOCKED',
  },
};
