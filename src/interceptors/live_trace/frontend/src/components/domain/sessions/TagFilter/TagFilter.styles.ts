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

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  position: relative;
`;

export const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 10px;
  background: ${({ theme }) => theme.colors.cyanSoft};
  border: 1px solid ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.cyan};
  transition: all ${({ theme }) => theme.transitions.base};
`;

export const ChipKey = styled.span`
  color: ${({ theme }) => theme.colors.cyan};

  &::after {
    content: ':';
    color: ${({ theme }) => theme.colors.white50};
    margin-right: 2px;
  }
`;

export const ChipValue = styled.span`
  color: ${({ theme }) => theme.colors.white90};
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChipKeyOnly = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
`;

export const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-left: 2px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.colors.white08};
  }

  &:focus {
    outline: none;
    color: ${({ theme }) => theme.colors.white};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const InputWrapper = styled.div`
  position: relative;
  display: inline-flex;
  min-width: 200px;
`;

interface InputProps {
  $isOpen?: boolean;
}

export const Input = styled.input<InputProps>`
  width: 100%;
  min-height: 36px;
  padding: 8px 32px 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface3};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  transition: all ${({ theme }) => theme.transitions.base};

  &::placeholder {
    color: ${({ theme }) => theme.colors.white50};
  }

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
`;

export const ChevronIcon = styled.span<{ $isOpen?: boolean }>`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  pointer-events: none;
  transition: transform ${({ theme }) => theme.transitions.fast};

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      transform: translateY(-50%) rotate(180deg);
    `}

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: ${({ theme }) => theme.spacing[1]};
  max-height: 240px;
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

export const DropdownSection = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
    margin-top: 4px;
    padding-top: 4px;
  }
`;

export const SectionLabel = styled.div`
  padding: 6px 12px 4px;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white30};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

interface OptionProps {
  $focused?: boolean;
}

export const Option = styled.button<OptionProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
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
`;

export const OptionKey = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const OptionValue = styled.span`
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
`;

export const NoOptions = styled.div`
  padding: 12px;
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const HintText = styled.div`
  padding: 8px 12px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  margin-top: 4px;
`;
