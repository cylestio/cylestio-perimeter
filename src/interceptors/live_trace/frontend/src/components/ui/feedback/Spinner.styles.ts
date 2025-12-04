import styled, { css } from 'styled-components';
import { spin } from '@theme/animations';
import type { SpinnerSize, SpinnerColor } from './Spinner';

const sizeStyles: Record<SpinnerSize, ReturnType<typeof css>> = {
  sm: css`
    width: 16px;
    height: 16px;
    border-width: 2px;
  `,
  md: css`
    width: 24px;
    height: 24px;
    border-width: 2px;
  `,
  lg: css`
    width: 32px;
    height: 32px;
    border-width: 3px;
  `,
};

interface StyledSpinnerProps {
  $size: SpinnerSize;
  $color: SpinnerColor;
}

export const StyledSpinner = styled.span<StyledSpinnerProps>`
  display: inline-block;
  border-style: solid;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;

  ${({ $size }) => sizeStyles[$size]}

  ${({ $color, theme }) => {
    switch ($color) {
      case 'cyan':
        return css`
          border-color: ${theme.colors.cyan};
          border-top-color: transparent;
        `;
      case 'white':
        return css`
          border-color: ${theme.colors.white};
          border-top-color: transparent;
        `;
      case 'current':
      default:
        return css`
          border-color: currentColor;
          border-top-color: transparent;
        `;
    }
  }}
`;
