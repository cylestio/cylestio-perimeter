import styled, { css } from 'styled-components';

interface AgentWorkflowSelectorContainerProps {
  $collapsed: boolean;
}

export const AgentWorkflowSelectorContainer = styled.div<AgentWorkflowSelectorContainerProps>`
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

export const AgentWorkflowSelectBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  min-width: 0; /* Allow content to shrink */

  /* Prevent badge and chevron from shrinking */
  > span:last-of-type,
  > div:last-child {
    flex-shrink: 0;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    background: ${({ theme }) => theme.colors.surface3};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;

export const AgentWorkflowInfo = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;

  /* Ensure text truncates */
  > span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const AgentWorkflowIcon = styled.span<{ $small?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.cyan};

  ${({ $small }) =>
    $small &&
    css`
      color: ${({ theme }) => theme.colors.white30};
    `}
`;

export const DropdownIcon = styled.span<{ $open: boolean }>`
  display: flex;
  color: ${({ theme }) => theme.colors.white30};
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
`;

export const AgentWorkflowDropdown = styled.div`
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
  max-height: 300px;
  overflow-y: auto;
`;

export const AgentWorkflowOption = styled.div<{ $selected: boolean; $isAll?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  min-width: 0; /* Allow flex items to shrink */

  /* Text truncation */
  > span:nth-child(2) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${({ $selected, theme }) =>
    $selected &&
    css`
      background: ${theme.colors.white04};
    `}

  ${({ $isAll, theme }) =>
    $isAll &&
    css`
      border-bottom: 1px solid ${theme.colors.borderSubtle};
      margin-bottom: ${theme.spacing[1]};
      padding-bottom: ${theme.spacing[3]};
    `}

  &:hover {
    background: ${({ theme }) => theme.colors.white08};
  }

  svg:last-child {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.cyan};
    flex-shrink: 0;
  }
`;
