import styled, { css } from 'styled-components';

interface UserMenuContainerProps {
  $collapsed: boolean;
}

interface UserMenuButtonProps {
  $collapsed: boolean;
}

interface UserDropdownProps {
  $collapsed: boolean;
}

export const UserMenuContainer = styled.div<UserMenuContainerProps>`
  position: relative;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: flex;
      justify-content: center;
    `}
`;

export const UserMenuButton = styled.div<UserMenuButtonProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.white04};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      padding: ${({ theme }) => theme.spacing[2]};
    `}
`;

export const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  /* Text truncation for child Text components */
  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const ExpandIcon = styled.span<{ $open: boolean }>`
  display: flex;
  color: ${({ theme }) => theme.colors.white30};
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
`;

export const UserDropdown = styled.div<UserDropdownProps>`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      min-width: 140px;
    `}
`;

export const UserDropdownItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme, $danger }) => ($danger ? theme.colors.red : theme.colors.white90)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: -2px;
  }

  ${({ $danger, theme }) =>
    $danger &&
    css`
      color: ${theme.colors.white50};

      &:hover {
        color: ${theme.colors.red};
        background: ${theme.colors.redSoft};
      }
    `}
`;
