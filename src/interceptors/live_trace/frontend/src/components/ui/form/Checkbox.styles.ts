import styled, { css } from 'styled-components';

export const CheckboxWrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;

  &[data-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

interface StyledCheckboxProps {
  $checked?: boolean;
  $indeterminate?: boolean;
  $disabled?: boolean;
}

export const StyledCheckbox = styled.span<StyledCheckboxProps>`
  width: 16px;
  height: 16px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface3};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
    color: ${({ theme }) => theme.colors.void};
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transitions.fast};
  }

  ${({ $checked, $indeterminate, theme }) =>
    ($checked || $indeterminate) &&
    css`
      background: ${theme.colors.cyan};
      border-color: ${theme.colors.cyan};

      svg {
        opacity: 1;
      }
    `}

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft};
  }

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
    `}
`;

export const CheckboxLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.white};
`;
