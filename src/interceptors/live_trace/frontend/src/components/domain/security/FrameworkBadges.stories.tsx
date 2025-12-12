import type { Meta, StoryObj } from '@storybook/react';

import { FrameworkBadges } from './FrameworkBadges';

const meta: Meta<typeof FrameworkBadges> = {
  title: 'Domain/Security/FrameworkBadges',
  component: FrameworkBadges,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FrameworkBadges>;

export const AllBadges: Story = {
  args: {
    cvssScore: 9.8,
    owaspLlm: 'LLM01',
    cwe: ['CWE-74', 'CWE-77'],
    soc2Controls: ['CC6.1', 'CC7.2'],
    mitreAtlas: 'AML.T0051',
    nistCsf: 'PR.DS-5',
  },
};

export const CriticalCvss: Story = {
  args: {
    cvssScore: 9.8,
    owaspLlm: 'LLM01',
  },
};

export const HighCvss: Story = {
  args: {
    cvssScore: 7.5,
    owaspLlm: 'LLM08',
    cwe: ['CWE-20'],
  },
};

export const MediumCvss: Story = {
  args: {
    cvssScore: 5.3,
    cwe: ['CWE-200'],
  },
};

export const LowCvss: Story = {
  args: {
    cvssScore: 2.1,
  },
};

export const OwaspOnly: Story = {
  args: {
    owaspLlm: 'LLM06',
  },
};

export const Soc2Controls: Story = {
  args: {
    soc2Controls: ['CC6.1', 'CC7.1', 'CC7.2'],
  },
};

export const CompactMode: Story = {
  args: {
    cvssScore: 8.1,
    owaspLlm: 'LLM01',
    cwe: ['CWE-74', 'CWE-77', 'CWE-78'],
    soc2Controls: ['CC6.1', 'CC7.2', 'CC8.1'],
    compact: true,
  },
};

export const Empty: Story = {
  args: {},
};
