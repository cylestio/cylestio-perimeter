import styled, { css } from 'styled-components';

interface AgentSelectorContainerProps {
  $collapsed: boolean;
}

export const AgentSelectorContainer = styled.div<AgentSelectorContainerProps>`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  position: relative;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: flex;
      justify-content: center;
      padding: ${({ theme }) => theme.spacing[3]};
    `}

  /* Label spacing */
  > label {
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }
`;

export const AgentSelectBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    background: ${({ theme }) => theme.colors.surface3};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;

export const AgentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const DropdownIcon = styled.span<{ $open: boolean }>`
  display: flex;
  color: ${({ theme }) => theme.colors.white30};
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
`;

export const AgentDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[1]};
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const AgentOption = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  ${({ $selected, theme }) =>
    $selected &&
    css`
      background: ${theme.colors.white04};
    `}

  &:hover {
    background: ${({ theme }) => theme.colors.white08};
  }

  svg:last-child {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.cyan};
  }
`;
