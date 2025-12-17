import type { Meta, StoryObj } from '@storybook/react';
import { FrameworkBadges } from './FrameworkBadges';

const meta: Meta<typeof FrameworkBadges> = {
  title: 'Domain/Security/FrameworkBadges',
  component: FrameworkBadges,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FrameworkBadges>;

export const AllBadges: Story = {
  args: {
    owaspLlm: 'LLM01',
    cwe: ['CWE-95', 'CWE-532'],
    soc2Controls: ['CC6.1', 'CC6.2'],
    cvssScore: 9.2,
  },
};

export const OwaspOnly: Story = {
  args: {
    owaspLlm: ['LLM01', 'LLM07'],
  },
};

export const CweOnly: Story = {
  args: {
    cwe: ['CWE-95', 'CWE-532', 'CWE-770'],
  },
};

export const CvssScores: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FrameworkBadges cvssScore={9.8} />
      <FrameworkBadges cvssScore={7.5} />
      <FrameworkBadges cvssScore={5.0} />
      <FrameworkBadges cvssScore={2.5} />
    </div>
  ),
};

export const CriticalSeverity: Story = {
  args: {
    owaspLlm: 'LLM01',
    cwe: 'CWE-94',
    cvssScore: 9.8,
  },
};

export const HighSeverity: Story = {
  args: {
    owaspLlm: 'LLM06',
    cwe: 'CWE-532',
    cvssScore: 7.2,
  },
};

export const MediumSeverity: Story = {
  args: {
    owaspLlm: 'LLM08',
    cvssScore: 5.5,
  },
};

export const LowSeverity: Story = {
  args: {
    cwe: 'CWE-1004',
    cvssScore: 2.0,
  },
};

export const Empty: Story = {
  args: {},
};
