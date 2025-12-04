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
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.white};
  font-size: 13px;
  font-family: ${({ theme, $mono }) =>
    $mono ? theme.typography.fontMono : theme.typography.fontDisplay};
  transition: all 200ms ease;
  outline: none;
  resize: ${({ $resize }) => $resize || 'vertical'};

  ${({ $mono }) =>
    $mono &&
    css`
      font-size: 12px;
      line-height: 1.6;
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
