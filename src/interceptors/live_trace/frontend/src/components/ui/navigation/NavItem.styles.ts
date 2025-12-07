import styled, { css } from 'styled-components';
import type { NavItemBadgeColor } from './NavItem';

interface StyledNavItemProps {
  $active?: boolean;
  $disabled?: boolean;
}

export const StyledNavItem = styled.a<StyledNavItemProps>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 150ms ease;

  ${({ $active, $disabled, theme }) => {
    if ($disabled) {
      return css`
        color: ${theme.colors.white30};
        cursor: not-allowed;
        pointer-events: none;
      `;
    }

    if ($active) {
      return css`
        background: ${theme.colors.white15};
        color: ${theme.colors.white};
      `;
    }

    return css`
      color: ${theme.colors.white50};

      &:hover {
        background: ${theme.colors.white08};
        color: ${theme.colors.white};
      }
    `;
  }}
`;

export const NavItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }
`;

interface NavItemBadgeProps {
  $color?: NavItemBadgeColor;
}

const badgeColors: Record<NavItemBadgeColor, { bg: string; fg: string }> = {
  orange: { bg: 'orangeSoft', fg: 'orange' },
  red: { bg: 'redSoft', fg: 'red' },
  cyan: { bg: 'cyanSoft', fg: 'cyan' },
};

export const NavItemBadge = styled.span<NavItemBadgeProps>`
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};

  ${({ $color = 'cyan', theme }) => {
    const colors = badgeColors[$color];
    return css`
      background: ${theme.colors[colors.bg as keyof typeof theme.colors]};
      color: ${theme.colors[colors.fg as keyof typeof theme.colors]};
    `;
  }}
`;

// NavGroup
export const StyledNavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
`;

export const NavGroupLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.white30};
  padding-left: 12px;
  margin-bottom: 8px;
`;
