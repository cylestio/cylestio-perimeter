import styled, { css } from 'styled-components';
import type { HeadingSize } from './Heading';

const sizeStyles: Record<HeadingSize, ReturnType<typeof css>> = {
  xs: css`
    font-size: ${({ theme }) => theme.typography.textSm};
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  `,
  sm: css`
    font-size: ${({ theme }) => theme.typography.textMd};
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  `,
  md: css`
    font-size: ${({ theme }) => theme.typography.textLg};
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  `,
  lg: css`
    font-size: ${({ theme }) => theme.typography.textXl};
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  `,
  xl: css`
    font-size: ${({ theme }) => theme.typography.text2xl};
    font-weight: ${({ theme }) => theme.typography.weightBold};
  `,
  '2xl': css`
    font-size: ${({ theme }) => theme.typography.text3xl};
    font-weight: ${({ theme }) => theme.typography.weightBold};
  `,
  '3xl': css`
    font-size: ${({ theme }) => theme.typography.text4xl};
    font-weight: ${({ theme }) => theme.typography.weightExtrabold};
  `,
  '4xl': css`
    font-size: ${({ theme }) => theme.typography.text5xl};
    font-weight: ${({ theme }) => theme.typography.weightExtrabold};
  `,
};

interface StyledHeadingProps {
  $size: HeadingSize;
  $gradient: boolean;
}

export const StyledHeading = styled.h1<StyledHeadingProps>`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  color: ${({ theme }) => theme.colors.white90};
  letter-spacing: ${({ theme }) => theme.typography.trackingTight};
  line-height: ${({ theme }) => theme.typography.lineHeightTight};
  margin: 0;

  ${({ $size }) => sizeStyles[$size]}

  ${({ $gradient }) =>
    $gradient &&
    css`
      background: linear-gradient(
        135deg,
        ${({ theme }) => theme.colors.cyan} 0%,
        ${({ theme }) => theme.colors.green} 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `}
`;
