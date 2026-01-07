import type { Meta, StoryObj } from '@storybook/react';
import { GateProgress } from './GateProgress';

const meta: Meta<typeof GateProgress> = {
  title: 'Domain/Security/GateProgress',
  component: GateProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'OPEN',
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
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
  },
};

export const MixedWithInfo: Story = {
  args: {
    checks: [
      { status: 'PASS' },
      { status: 'INFO' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'OPEN',
  },
};

export const OneFailing: Story = {
  args: {
    checks: [
      { status: 'FAIL' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
  },
};

export const WithoutStats: Story = {
  args: {
    checks: [
      { status: 'FAIL' },
      { status: 'INFO' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'PASS' },
    ],
    gateStatus: 'BLOCKED',
    showStats: false,
  },
};
