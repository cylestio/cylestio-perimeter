import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Tabs } from './Tabs';

const tabsList = [
  { id: 'all', label: 'All Findings' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
];

const tabsWithCounts = [
  { id: 'all', label: 'All Findings', count: 12 },
  { id: 'critical', label: 'Critical', count: 1 },
  { id: 'high', label: 'High', count: 3 },
  { id: 'medium', label: 'Medium', count: 8 },
];

const meta: Meta<typeof Tabs> = {
  title: 'UI/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: function TabsDefaultStory() {
    const [active, setActive] = useState('all');
    return <Tabs tabs={tabsList} activeTab={active} onChange={setActive} />;
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('All Findings')).toBeInTheDocument();
  },
};

export const Pills: Story = {
  render: function TabsPillsStory() {
    const [active, setActive] = useState('all');
    return <Tabs tabs={tabsList} activeTab={active} onChange={setActive} variant="pills" />;
  },
};

export const WithCounts: Story = {
  render: function TabsWithCountsStory() {
    const [active, setActive] = useState('all');
    return <Tabs tabs={tabsWithCounts} activeTab={active} onChange={setActive} />;
  },
};

export const Disabled: Story = {
  render: function TabsDisabledStory() {
    const [active, setActive] = useState('all');
    const tabs = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'archived', label: 'Archived', disabled: true },
    ];
    return <Tabs tabs={tabs} activeTab={active} onChange={setActive} />;
  },
};
