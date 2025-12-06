import styled, { css, keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

export const DropdownTrigger = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;

interface DropdownMenuProps {
  $align: 'left' | 'right';
  $width?: number;
}

export const DropdownMenu = styled.div<DropdownMenuProps>`
  position: absolute;
  top: 100%;
  margin-top: ${({ theme }) => theme.spacing[1]};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 4px;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${fadeIn} 150ms ease-out;
  min-width: 160px;

  ${({ $align }) =>
    $align === 'left'
      ? css`
          left: 0;
        `
      : css`
          right: 0;
        `}

  ${({ $width }) =>
    $width &&
    css`
      width: ${$width}px;
    `}
`;

interface DropdownItemProps {
  $danger?: boolean;
  $disabled?: boolean;
  $focused?: boolean;
}

export const DropdownItem = styled.button<DropdownItemProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  color: ${({ theme }) => theme.colors.white70};
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.white04};
    color: ${({ theme }) => theme.colors.white90};
  }

  ${({ $focused, theme }) =>
    $focused &&
    css`
      background: ${theme.colors.white08};
      color: ${theme.colors.white90};
    `}

  ${({ $danger, theme }) =>
    $danger &&
    css`
      &:hover {
        background: ${theme.colors.redSoft};
        color: ${theme.colors.red};
      }

      ${$danger &&
      css`
        &[data-focused='true'] {
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        }
      `}
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    `}

  &:focus-visible {
    outline: none;
    background: ${({ theme }) => theme.colors.white08};
  }
`;

export const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderSubtle};
  margin: 4px 0;
`;

export const ItemIcon = styled.span`
  display: flex;
  color: inherit;
  opacity: 0.7;
`;
