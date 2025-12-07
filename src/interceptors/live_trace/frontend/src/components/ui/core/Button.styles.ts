import styled, { css } from 'styled-components';
import type { ButtonVariant, ButtonSize } from './Button';

const variantStyles: Record<ButtonVariant, ReturnType<typeof css>> = {
  primary: css`
    background: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.void};
    border: none;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme }) => theme.colors.white90};
    border: 1px solid ${({ theme }) => theme.colors.borderMedium};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.white15};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.white50};
    border: none;

    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.colors.white90};
      background: ${({ theme }) => theme.colors.white04};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.red};
    color: ${({ theme }) => theme.colors.white};
    border: none;

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }
  `,
  success: css`
    background: ${({ theme }) => theme.colors.green};
    color: ${({ theme }) => theme.colors.void};
    border: none;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  `,
};

const sizeStyles: Record<ButtonSize, ReturnType<typeof css>> = {
  sm: css`
    padding: 6px 12px;
    font-size: ${({ theme }) => theme.typography.textSm};
    min-height: 28px;
  `,
  md: css`
    padding: 10px 16px;
    font-size: ${({ theme }) => theme.typography.textBase};
    min-height: 36px;
  `,
  lg: css`
    padding: 14px 24px;
    font-size: 15px;
    min-height: 44px;
  `,
};

const iconOnlySizes: Record<ButtonSize, ReturnType<typeof css>> = {
  sm: css`
    width: 28px;
    height: 28px;
    padding: 0;
  `,
  md: css`
    width: 36px;
    height: 36px;
    padding: 0;
  `,
  lg: css`
    width: 44px;
    height: 44px;
    padding: 0;
  `,
};

interface StyledButtonProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $iconOnly: boolean;
  $fullWidth: boolean;
  $loading: boolean;
}

export const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  text-decoration: none;
  white-space: nowrap;

  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size, $iconOnly }) => ($iconOnly ? iconOnlySizes[$size] : sizeStyles[$size])}

  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }

  ${({ $loading }) =>
    $loading &&
    css`
      pointer-events: none;
    `}
`;

export const IconWrapper = styled.span<{ $spin?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  ${({ $spin }) =>
    $spin &&
    css`
      animation: spin 0.8s linear infinite;

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}

  svg {
    width: 16px;
    height: 16px;
  }
`;
