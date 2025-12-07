import styled, { css } from 'styled-components';

export const RadioWrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.cyan};
    opacity: 0;
    transform: scale(0);
    transition: all 150ms ease;
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
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
`;

// Radio Group
interface RadioGroupWrapperProps {
  $direction: 'horizontal' | 'vertical';
}

export const RadioGroupWrapper = styled.div<RadioGroupWrapperProps>`
  display: flex;
  gap: 16px;

  ${({ $direction }) =>
    $direction === 'vertical' &&
    css`
      flex-direction: column;
      gap: 12px;
    `}
`;
