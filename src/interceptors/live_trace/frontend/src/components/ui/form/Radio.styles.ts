import styled, { css } from 'styled-components';

export const RadioWrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;

  &[data-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const HiddenRadio = styled.input.attrs({ type: 'radio' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

interface StyledRadioProps {
  $checked?: boolean;
  $disabled?: boolean;
}

export const StyledRadio = styled.span<StyledRadioProps>`
  width: 16px;
  height: 16px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface3};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ theme }) => theme.colors.cyan};
    opacity: 0;
    transform: scale(0);
    transition: all ${({ theme }) => theme.transitions.fast};
  }

  ${({ $checked, theme }) =>
    $checked &&
    css`
      border-color: ${theme.colors.cyan};

      &::after {
        opacity: 1;
        transform: scale(1);
      }
    `}

  ${HiddenRadio}:focus + & {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft};
  }

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
    `}
`;

export const RadioLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  color: ${({ theme }) => theme.colors.white};
`;

// Radio Group
interface RadioGroupWrapperProps {
  $direction: 'horizontal' | 'vertical';
}

export const RadioGroupWrapper = styled.div<RadioGroupWrapperProps>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};

  ${({ $direction, theme }) =>
    $direction === 'vertical' &&
    css`
      flex-direction: column;
      gap: ${theme.spacing[3]};
    `}
`;
