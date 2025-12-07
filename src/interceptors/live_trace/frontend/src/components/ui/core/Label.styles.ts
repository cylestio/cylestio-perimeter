import styled, { css } from 'styled-components';
import type { LabelSize, LabelColor } from './Label';

const sizeStyles: Record<LabelSize, ReturnType<typeof css>> = {
  xs: css`
    font-size: ${({ theme }) => theme.typography.textXs};
  `,
  sm: css`
    font-size: ${({ theme }) => theme.typography.textSm};
  `,
};

const colorStyles: Record<LabelColor, ReturnType<typeof css>> = {
  default: css`
    color: ${({ theme }) => theme.colors.white70};
  `,
  cyan: css`
    color: ${({ theme }) => theme.colors.cyan};
  `,
  muted: css`
    color: ${({ theme }) => theme.colors.white30};
  `,
};

interface StyledLabelProps {
  $size: LabelSize;
  $color: LabelColor;
  $uppercase: boolean;
}

export const StyledLabel = styled.label<StyledLabelProps>`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};

  ${({ $size }) => sizeStyles[$size]}
  ${({ $color }) => colorStyles[$color]}

  ${({ $uppercase }) =>
    $uppercase &&
    css`
      text-transform: uppercase;
      letter-spacing: ${({ theme }) => theme.typography.trackingWider};
    `}
`;

export const RequiredAsterisk = styled.span`
  color: ${({ theme }) => theme.colors.red};
  margin-left: 4px;
`;
