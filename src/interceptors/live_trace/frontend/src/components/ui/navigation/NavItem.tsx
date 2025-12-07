import type { FC, ReactNode } from 'react';
import {
  StyledNavItem,
  NavItemIcon,
  NavItemBadge,
  StyledNavGroup,
  NavGroupLabel,
} from './NavItem.styles';

// Types
export type NavItemBadgeColor = 'orange' | 'red' | 'cyan';

export interface NavItemProps {
  icon?: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  badge?: string | number;
  badgeColor?: NavItemBadgeColor;
  onClick?: () => void;
  disabled?: boolean;
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
  href,
  active = false,
  badge,
  badgeColor,
  onClick,
  disabled = false,
  className,
}) => {
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

  return (
    <StyledNavItem
      href={href || '#'}
      $active={active}
      $disabled={disabled}
      onClick={handleClick}
      className={className}
    >
      {icon && <NavItemIcon>{icon}</NavItemIcon>}
      {label}
      {badge !== undefined && <NavItemBadge $color={badgeColor}>{badge}</NavItemBadge>}
    </StyledNavItem>
  );
};

export const NavGroup: FC<NavGroupProps> = ({ label, children, className }) => {
  return (
    <StyledNavGroup className={className}>
      {label && <NavGroupLabel>{label}</NavGroupLabel>}
      {children}
    </StyledNavGroup>
  );
};
