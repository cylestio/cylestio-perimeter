import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { LayoutGrid, Flag, Activity, Settings, Users, Shield } from 'lucide-react';
import styled from 'styled-components';
import { NavItem, NavGroup } from './NavItem';

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const SidebarContainer = styled.div`
  width: 240px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: 8px;
`;

const CollapsedSidebarContainer = styled.div`
  width: 64px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: 8px;
`;

const meta: Meta<typeof NavItem> = {
  title: 'UI/Navigation/NavItem',
  component: NavItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = {
  render: () => (
    <SidebarContainer>
      <Stack $gap={4}>
        <NavItem label="Dashboard" />
        <NavItem label="Findings" />
        <NavItem label="Sessions" />
      </Stack>
    </SidebarContainer>
  ),
};

export const Active: Story = {
  render: () => (
    <SidebarContainer>
      <Stack $gap={4}>
        <NavItem label="Dashboard" active />
        <NavItem label="Findings" />
        <NavItem label="Sessions" />
      </Stack>
    </SidebarContainer>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <SidebarContainer>
      <Stack $gap={4}>
        <NavItem icon={<LayoutGrid />} label="Dashboard" active />
        <NavItem icon={<Flag />} label="Findings" />
        <NavItem icon={<Activity />} label="Sessions" />
        <NavItem icon={<Settings />} label="Settings" />
      </Stack>
    </SidebarContainer>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <SidebarContainer>
      <Stack $gap={4}>
        <NavItem icon={<LayoutGrid />} label="Dashboard" />
        <NavItem icon={<Flag />} label="Findings" badge={5} badgeColor="orange" />
        <NavItem icon={<Shield />} label="Alerts" badge={12} badgeColor="red" />
        <NavItem icon={<Activity />} label="Sessions" badge="New" badgeColor="cyan" />
      </Stack>
    </SidebarContainer>
  ),
};

export const Disabled: Story = {
  render: () => (
    <SidebarContainer>
      <Stack $gap={4}>
        <NavItem icon={<LayoutGrid />} label="Dashboard" />
        <NavItem icon={<Settings />} label="Settings" disabled />
      </Stack>
    </SidebarContainer>
  ),
};

export const GroupWithLabel: Story = {
  render: () => (
    <SidebarContainer>
      <NavGroup label="Analyze">
        <NavItem icon={<LayoutGrid />} label="Dashboard" active />
        <NavItem icon={<Flag />} label="Findings" badge={5} badgeColor="orange" />
        <NavItem icon={<Activity />} label="Sessions" />
      </NavGroup>
      <NavGroup label="Settings">
        <NavItem icon={<Users />} label="Team" />
        <NavItem icon={<Settings />} label="Settings" />
      </NavGroup>
    </SidebarContainer>
  ),
};

export const InteractiveSidebar: Story = {
  render: function SidebarNavigationStory() {
    const [active, setActive] = useState('dashboard');

    return (
      <SidebarContainer>
        <NavGroup label="Analyze">
          <NavItem
            icon={<LayoutGrid />}
            label="Dashboard"
            active={active === 'dashboard'}
            onClick={() => setActive('dashboard')}
          />
          <NavItem
            icon={<Flag />}
            label="Findings"
            badge={5}
            badgeColor="orange"
            active={active === 'findings'}
            onClick={() => setActive('findings')}
          />
          <NavItem
            icon={<Activity />}
            label="Sessions"
            active={active === 'sessions'}
            onClick={() => setActive('sessions')}
          />
        </NavGroup>
        <NavGroup label="Settings">
          <NavItem
            icon={<Users />}
            label="Team"
            active={active === 'team'}
            onClick={() => setActive('team')}
          />
          <NavItem
            icon={<Settings />}
            label="Settings"
            active={active === 'settings'}
            onClick={() => setActive('settings')}
          />
        </NavGroup>
      </SidebarContainer>
    );
  },
};

export const Collapsed: Story = {
  render: () => (
    <CollapsedSidebarContainer>
      <Stack $gap={4}>
        <NavItem icon={<LayoutGrid />} label="Dashboard" active collapsed />
        <NavItem icon={<Flag />} label="Findings" badge={5} badgeColor="orange" collapsed />
        <NavItem icon={<Activity />} label="Sessions" collapsed />
        <NavItem icon={<Settings />} label="Settings" collapsed />
      </Stack>
    </CollapsedSidebarContainer>
  ),
  play: async ({ canvas }) => {
    // In collapsed mode, labels should not be visible
    expect(canvas.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(canvas.queryByText('Findings')).not.toBeInTheDocument();
  },
};
