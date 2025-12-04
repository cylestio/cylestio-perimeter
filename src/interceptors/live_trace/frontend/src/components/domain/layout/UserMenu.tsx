import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronUp } from 'lucide-react';
import { Avatar } from '@ui/core/Avatar';
import { Text } from '@ui/core/Text';
import {
  UserMenuContainer,
  UserMenuButton,
  UserInfo,
  ExpandIcon,
  UserDropdown,
  UserDropdownItem,
} from './UserMenu.styles';

// Types
export interface User {
  name: string;
  initials: string;
  role: string;
}

export interface UserMenuProps {
  user: User;
  onLogout?: () => void;
  onSettings?: () => void;
  collapsed?: boolean;
}

// Component
export const UserMenu: FC<UserMenuProps> = ({
  user,
  onLogout,
  onSettings,
  collapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSettings = () => {
    onSettings?.();
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout?.();
    setIsOpen(false);
  };

  return (
    <UserMenuContainer ref={containerRef} $collapsed={collapsed}>
      <UserMenuButton
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        $collapsed={collapsed}
      >
        <Avatar initials={user.initials} variant="user" />
        {!collapsed && (
          <>
            <UserInfo>
              <Text size="sm" weight="medium">
                {user.name}
              </Text>
              <Text size="xs" color="muted">
                {user.role}
              </Text>
            </UserInfo>
            <ExpandIcon $open={isOpen}>
              <ChevronUp size={16} />
            </ExpandIcon>
          </>
        )}
      </UserMenuButton>

      {isOpen && (
        <UserDropdown role="menu" $collapsed={collapsed}>
          {onSettings && (
            <UserDropdownItem onClick={handleSettings} role="menuitem">
              <Settings size={14} />
              Settings
            </UserDropdownItem>
          )}
          {onLogout && (
            <UserDropdownItem onClick={handleLogout} role="menuitem" $danger>
              <LogOut size={14} />
              Log out
            </UserDropdownItem>
          )}
        </UserDropdown>
      )}
    </UserMenuContainer>
  );
};
