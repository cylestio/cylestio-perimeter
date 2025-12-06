import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { LayoutGrid, Flag, Activity, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Logo } from './Logo';
import { NavItem, NavGroup } from '@ui/navigation/NavItem';
import { UserMenu } from './UserMenu';

const Container = styled.div`
  height: 500px;
  display: flex;
  background: #000;
`;

const meta: Meta<typeof Sidebar> = {
  title: 'Domain/Layout/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <Sidebar>
      <Sidebar.Header>
        <Logo />
      </Sidebar.Header>
      <Sidebar.Section>
        <NavGroup label="Analyze">
          <NavItem icon={<LayoutGrid />} label="Dashboard" active />
          <NavItem icon={<Flag />} label="Findings" badge={5} badgeColor="orange" />
          <NavItem icon={<Activity />} label="Sessions" />
        </NavGroup>
        <NavGroup label="Settings">
          <NavItem icon={<Settings />} label="Settings" />
        </NavGroup>
      </Sidebar.Section>
      <Sidebar.Footer>
        <UserMenu user={{ name: 'John Doe', initials: 'JD', role: 'Admin' }} />
      </Sidebar.Footer>
    </Sidebar>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(canvas.getByText('Findings')).toBeInTheDocument();
  },
};

export const Collapsed: Story = {
  render: () => (
    <Sidebar collapsed>
      <Sidebar.Header>
        <Logo collapsed />
      </Sidebar.Header>
      <Sidebar.Section>
        <NavGroup>
          <NavItem icon={<LayoutGrid />} label="Dashboard" active />
          <NavItem icon={<Flag />} label="Findings" badge={5} badgeColor="orange" />
          <NavItem icon={<Activity />} label="Sessions" />
        </NavGroup>
      </Sidebar.Section>
      <Sidebar.Footer>
        <UserMenu user={{ name: 'John Doe', initials: 'JD', role: 'Admin' }} collapsed />
      </Sidebar.Footer>
    </Sidebar>
  ),
};

export const WithToggle: Story = {
  render: function SidebarWithToggle() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
        <Sidebar.Header>
          <Logo collapsed={collapsed} />
        </Sidebar.Header>
        <Sidebar.Section>
          <NavGroup label={collapsed ? undefined : 'Analyze'}>
            <NavItem icon={<LayoutGrid />} label="Dashboard" active />
            <NavItem icon={<Flag />} label="Findings" badge={5} badgeColor="orange" />
          </NavGroup>
        </Sidebar.Section>
        <Sidebar.Footer>
          <UserMenu user={{ name: 'John Doe', initials: 'JD', role: 'Admin' }} collapsed={collapsed} />
        </Sidebar.Footer>
      </Sidebar>
    );
  },
};

export const ToggleInteraction: Story = {
  args: {
    collapsed: false,
    onToggle: fn(),
  },
  render: (args) => (
    <Sidebar {...args}>
      <Sidebar.Header>
        <Logo />
      </Sidebar.Header>
      <Sidebar.Section>
        <div style={{ padding: '16px', color: 'rgba(255,255,255,0.5)' }}>Content</div>
      </Sidebar.Section>
    </Sidebar>
  ),
  play: async ({ args, canvas }) => {
    const toggleButton = canvas.getByRole('button', { name: /collapse/i });
    await userEvent.click(toggleButton);
    await expect(args.onToggle).toHaveBeenCalled();
  },
};
