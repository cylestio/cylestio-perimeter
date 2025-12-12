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

interface WrapperProps {
  $fullWidth?: boolean;
}

export const Wrapper = styled.div<WrapperProps>`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}
`;

interface TriggerProps {
  $hasError?: boolean;
  $disabled?: boolean;
  $isOpen?: boolean;
}

export const Trigger = styled.button<TriggerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface3};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.white30};
  }

  &:focus {
    outline: none;
    background: ${({ theme }) => theme.colors.surface4};
    border-color: ${({ theme }) => theme.colors.cyan};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft};
  }

  ${({ $isOpen, theme }) =>
    $isOpen &&
    css`
      background: ${theme.colors.surface4};
      border-color: ${theme.colors.cyan};
      box-shadow: 0 0 0 2px ${theme.colors.cyanSoft};
    `}

  ${({ $disabled, theme }) =>
    $disabled &&
    css`
      background: ${theme.colors.surface};
      border-color: ${theme.colors.borderSubtle};
      color: ${theme.colors.white30};
      cursor: not-allowed;
    `}

  ${({ $hasError, theme }) =>
    $hasError &&
    css`
      background: ${theme.colors.redSoft};
      border-color: ${theme.colors.red};

      &:focus {
        background: ${theme.colors.redSoft};
        border-color: ${theme.colors.red};
      }
    `}
`;

export const TriggerValue = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Placeholder = styled.span`
  color: ${({ theme }) => theme.colors.white50};
`;

export const ChevronIcon = styled.span<{ $isOpen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  transition: transform ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      transform: rotate(180deg);
    `}

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Menu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: ${({ theme }) => theme.spacing[1]};
  max-height: 300px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 4px;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${fadeIn} 150ms ease-out;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.white15};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.white30};
  }
`;

interface OptionProps {
  $focused?: boolean;
  $selected?: boolean;
  $disabled?: boolean;
}

export const Option = styled.button<OptionProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  color: ${({ theme }) => theme.colors.white70};
  text-align: left;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.white04};
    color: ${({ theme }) => theme.colors.white90};
  }

  ${({ $focused, theme }) =>
    $focused &&
    css`
      background: ${theme.colors.white08};
      color: ${theme.colors.white90};
    `}

  ${({ $selected, theme }) =>
    $selected &&
    css`
      background: ${theme.colors.cyanSoft};
      color: ${theme.colors.cyan};

      &:hover {
        background: ${theme.colors.cyanSoft};
      }
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    `}
`;

export const OptionContent = styled.span`
  flex: 1;
  min-width: 0;
`;

export const NoOptions = styled.div`
  padding: 12px;
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

