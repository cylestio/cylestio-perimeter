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
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.white};
  font-size: 13px;
  font-family: ${({ theme, $mono }) =>
    $mono ? theme.typography.fontMono : theme.typography.fontDisplay};
  transition: all 200ms ease;
  outline: none;

  ${({ $mono }) =>
    $mono &&
    css`
      font-size: 12px;
    `}

  &::placeholder {
    color: ${({ theme }) => theme.colors.white30};
  }

  &:focus {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
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
