import styled, { css } from 'styled-components';
import type { TextSize, TextColor, TextWeight } from './Text';

const sizeStyles: Record<TextSize, ReturnType<typeof css>> = {
  xs: css`
    font-size: ${({ theme }) => theme.typography.textXs};
  `,
  sm: css`
    font-size: ${({ theme }) => theme.typography.textSm};
  `,
  base: css`
    font-size: ${({ theme }) => theme.typography.textBase};
  `,
  md: css`
    font-size: ${({ theme }) => theme.typography.textMd};
  `,
  lg: css`
    font-size: ${({ theme }) => theme.typography.textLg};
  `,
};

const colorStyles: Record<TextColor, ReturnType<typeof css>> = {
  primary: css`
    color: ${({ theme }) => theme.colors.white90};
  `,
  secondary: css`
    color: ${({ theme }) => theme.colors.white70};
  `,
  muted: css`
    color: ${({ theme }) => theme.colors.white50};
  `,
  disabled: css`
    color: ${({ theme }) => theme.colors.white30};
  `,
  cyan: css`
    color: ${({ theme }) => theme.colors.cyan};
  `,
  green: css`
    color: ${({ theme }) => theme.colors.green};
  `,
  orange: css`
    color: ${({ theme }) => theme.colors.orange};
  `,
  red: css`
    color: ${({ theme }) => theme.colors.red};
  `,
  purple: css`
    color: ${({ theme }) => theme.colors.purple};
  `,
};

const weightStyles: Record<TextWeight, ReturnType<typeof css>> = {
  normal: css`
    font-weight: ${({ theme }) => theme.typography.weightNormal};
  `,
  medium: css`
    font-weight: ${({ theme }) => theme.typography.weightMedium};
  `,
  semibold: css`
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  `,
  bold: css`
    font-weight: ${({ theme }) => theme.typography.weightBold};
  `,
};

interface StyledTextProps {
  $size: TextSize;
  $color: TextColor;
  $weight: TextWeight;
  $mono: boolean;
  $truncate: boolean;
}

export const StyledText = styled.span<StyledTextProps>`
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme, $mono }) =>
    $mono ? theme.typography.fontMono : theme.typography.fontDisplay};

  ${({ $size }) => sizeStyles[$size]}
  ${({ $color }) => colorStyles[$color]}
  ${({ $weight }) => weightStyles[$weight]}

  ${({ $truncate }) =>
    $truncate &&
    css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `}
`;
