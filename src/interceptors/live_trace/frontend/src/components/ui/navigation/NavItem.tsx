import type { FC, ReactNode } from 'react';

import { Link } from 'react-router-dom';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  StyledNavItem,
  NavItemIcon,
  NavItemLabel,
  NavItemBadge,
  StyledNavGroup,
  NavGroupLabel,
} from './NavItem.styles';

// Types
export type NavItemBadgeColor = 'orange' | 'red' | 'cyan' | 'green';

export interface NavItemProps {
  icon?: ReactNode;
  label: string;
  /** Use 'to' for React Router navigation (preferred for internal links) */
  to?: string;
  /** Use 'href' for external links only */
  href?: string;
  active?: boolean;
  badge?: string | number;
  badgeColor?: NavItemBadgeColor;
  onClick?: () => void;
  disabled?: boolean;
  /** When true, only shows the icon with a tooltip */
  collapsed?: boolean;
  className?: string;
}

export interface NavGroupProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

// Components
export const NavItem: FC<NavItemProps> = ({
  icon,
  label,
  to,
  href,
  active = false,
  badge,
  badgeColor,
  onClick,
  disabled = false,
  collapsed = false,
  className,
}) => {
  const content = (
    <>
      {icon && <NavItemIcon>{icon}</NavItemIcon>}
      {!collapsed && <NavItemLabel>{label}</NavItemLabel>}
      {!collapsed && badge !== undefined && <NavItemBadge $color={badgeColor}>{badge}</NavItemBadge>}
    </>
  );

  // Use React Router Link for internal navigation
  if (to && !disabled) {
    const navItem = (
      <StyledNavItem
        as={Link}
        to={to}
        $active={active}
        $disabled={disabled}
        $collapsed={collapsed}
        className={className}
      >
        {content}
      </StyledNavItem>
    );

    return collapsed ? (
      <Tooltip content={label} position="right">
        {navItem}
      </Tooltip>
    ) : navItem;
  }

  // Fallback to anchor for external links or onClick handlers
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const navItem = (
    <StyledNavItem
      href={href || '#'}
      $active={active}
      $disabled={disabled}
      $collapsed={collapsed}
      onClick={handleClick}
      className={className}
    >
      {content}
    </StyledNavItem>
  );

  return collapsed ? (
    <Tooltip content={label} position="right">
      {navItem}
    </Tooltip>
  ) : navItem;
};

export const NavGroup: FC<NavGroupProps> = ({ label, children, className }) => {
  return (
    <StyledNavGroup className={className}>
      {label && <NavGroupLabel>{label}</NavGroupLabel>}
      {children}
    </StyledNavGroup>
  );
};
