import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { UserMenu } from './UserMenu';

const Container = styled.div`
  width: 260px;
  padding: 12px;
  background: #0a0a0f;
  position: relative;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const CollapsedContainer = styled.div`
  width: 64px;
  padding: 8px;
  background: #0a0a0f;
  position: relative;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
`;

const mockUser = {
  name: 'John Doe',
  initials: 'JD',
  role: 'Admin',
};

const meta: Meta<typeof UserMenu> = {
  title: 'Domain/Layout/UserMenu',
  component: UserMenu,
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
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {
  args: {
    user: mockUser,
    onSettings: fn(),
    onLogout: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('John Doe')).toBeInTheDocument();
    await expect(canvas.getByText('Admin')).toBeInTheDocument();
  },
};

export const Collapsed: Story = {
  args: {
    user: mockUser,
    onSettings: fn(),
    onLogout: fn(),
    collapsed: true,
  },
  decorators: [
    (Story) => (
      <CollapsedContainer>
        <Story />
      </CollapsedContainer>
    ),
  ],
};

export const DropdownInteraction: Story = {
  args: {
    user: mockUser,
    onSettings: fn(),
    onLogout: fn(),
  },
  play: async ({ args, canvas }) => {
    // Open menu
    const menuButton = canvas.getByRole('button');
    await userEvent.click(menuButton);

    // Click settings
    const settingsButton = canvas.getByText('Settings');
    await expect(settingsButton).toBeInTheDocument();
    await userEvent.click(settingsButton);
    await expect(args.onSettings).toHaveBeenCalled();
  },
};

export const LogoutInteraction: Story = {
  args: {
    user: mockUser,
    onSettings: fn(),
    onLogout: fn(),
  },
  play: async ({ args, canvas }) => {
    // Open menu
    const menuButton = canvas.getByRole('button');
    await userEvent.click(menuButton);

    // Click logout
    const logoutButton = canvas.getByText('Log out');
    await userEvent.click(logoutButton);
    await expect(args.onLogout).toHaveBeenCalled();
  },
};

export const KeyboardNavigation: Story = {
  args: {
    user: mockUser,
    onSettings: fn(),
    onLogout: fn(),
  },
  play: async ({ canvas }) => {
    const menuButton = canvas.getByRole('button');
    menuButton.focus();

    // Open with Enter
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('menu')).toBeInTheDocument();

    // Close with Escape
    await userEvent.keyboard('{Escape}');
  },
};
