import styled, { css } from 'styled-components';

export const CheckboxWrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
    color: ${({ theme }) => theme.colors.void};
    opacity: 0;
    transition: opacity 150ms ease;
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
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
`;
