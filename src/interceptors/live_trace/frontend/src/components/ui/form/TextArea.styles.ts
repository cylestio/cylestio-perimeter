import styled, { css } from 'styled-components';

interface TextAreaWrapperProps {
  $fullWidth?: boolean;
}

export const TextAreaWrapper = styled.div<TextAreaWrapperProps>`
  display: inline-flex;
  flex-direction: column;
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}
`;

interface StyledTextAreaProps {
  $hasError?: boolean;
  $mono?: boolean;
  $resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const StyledTextArea = styled.textarea<StyledTextAreaProps>`
  width: 100%;
  min-height: 100px;
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
  resize: ${({ $resize }) => $resize || 'vertical'};

  ${({ $mono, theme }) =>
    $mono &&
    css`
      font-size: ${theme.typography.textSm};
      line-height: ${theme.typography.lineHeightRelaxed};
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
