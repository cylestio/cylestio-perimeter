import styled, { css } from 'styled-components';
import type { CodeVariant } from './Code';

const variantStyles: Record<CodeVariant, ReturnType<typeof css>> = {
  inline: css`
    display: inline;
    padding: 2px 6px;
    background: ${({ theme }) => theme.colors.surface2};
    border-radius: ${({ theme }) => theme.radii.sm};
    font-size: ${({ theme }) => theme.typography.textSm};
  `,
  block: css`
    display: block;
    padding: 16px;
    background: ${({ theme }) => theme.colors.void};
    border-radius: ${({ theme }) => theme.radii.lg};
    font-size: ${({ theme }) => theme.typography.textBase};
    overflow-x: auto;
    white-space: pre;
  `,
};

interface StyledCodeProps {
  $variant: CodeVariant;
}

export const StyledCode = styled.code<StyledCodeProps>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white90};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};

  ${({ $variant }) => variantStyles[$variant]}
`;
