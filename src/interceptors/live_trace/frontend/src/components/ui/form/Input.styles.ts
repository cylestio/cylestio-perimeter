import styled, { css } from 'styled-components';

interface InputWrapperProps {
  $fullWidth?: boolean;
}

export const InputWrapper = styled.div<InputWrapperProps>`
  display: inline-flex;
  flex-direction: column;
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}
`;

interface InputContainerProps {
  $hasError?: boolean;
  $disabled?: boolean;
  $hasLeftIcon?: boolean;
  $hasRightIcon?: boolean;
}

export const InputContainer = styled.div<InputContainerProps>`
  position: relative;
  display: flex;
  align-items: center;

  ${({ $hasLeftIcon }) =>
    $hasLeftIcon &&
    css`
      input {
        padding-left: 38px;
      }
    `}

  ${({ $hasRightIcon }) =>
    $hasRightIcon &&
    css`
      input {
        padding-right: 38px;
      }
    `}
`;

interface StyledInputProps {
  $hasError?: boolean;
  $mono?: boolean;
}

export const StyledInput = styled.input<StyledInputProps>`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface3};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-family: ${({ theme, $mono }) =>
    $mono ? theme.typography.fontMono : theme.typography.fontDisplay};
  transition: all ${({ theme }) => theme.transitions.base};
  outline: none;

  ${({ $mono, theme }) =>
    $mono &&
    css`
      font-size: ${theme.typography.textSm};
    `}

  &::placeholder {
    color: ${({ theme }) => theme.colors.white30};
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: ${({ theme }) => theme.colors.white30};
  }

  &:focus {
    background: ${({ theme }) => theme.colors.surface4};
    border-color: ${({ theme }) => theme.colors.cyan};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.borderSubtle};
    color: ${({ theme }) => theme.colors.white30};
    cursor: not-allowed;
  }

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

interface IconWrapperProps {
  $position: 'left' | 'right';
}

export const IconWrapper = styled.span<IconWrapperProps>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  pointer-events: none;

  ${({ $position }) =>
    $position === 'left'
      ? css`
          left: 12px;
        `
      : css`
          right: 12px;
        `}

  svg {
    width: 16px;
    height: 16px;
  }
`;
