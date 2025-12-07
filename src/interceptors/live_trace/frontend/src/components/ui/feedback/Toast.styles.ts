import styled, { css } from 'styled-components';
import type { ToastVariant } from './Toast';

interface StyledToastProps {
  $variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, ReturnType<typeof css>> = {
  info: css`
    border-color: ${({ theme }) => theme.colors.cyan};
    border-left-color: ${({ theme }) => theme.colors.cyan};
  `,
  success: css`
    border-color: ${({ theme }) => theme.colors.green};
    border-left-color: ${({ theme }) => theme.colors.green};
  `,
  warning: css`
    border-color: ${({ theme }) => theme.colors.orange};
    border-left-color: ${({ theme }) => theme.colors.orange};
  `,
  error: css`
    border-color: ${({ theme }) => theme.colors.red};
    border-left-color: ${({ theme }) => theme.colors.red};
  `,
};

const iconBgColors: Record<ToastVariant, string> = {
  info: 'cyanSoft',
  success: 'greenSoft',
  warning: 'orangeSoft',
  error: 'redSoft',
};

const iconColors: Record<ToastVariant, string> = {
  info: 'cyan',
  success: 'green',
  warning: 'orange',
  error: 'red',
};

export const StyledToast = styled.div<StyledToastProps>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid;
  border-left-width: 4px;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 16px;
  min-width: 320px;
  max-width: 420px;

  ${({ $variant }) => variantStyles[$variant]}
`;

interface IconWrapperProps {
  $variant: ToastVariant;
}

export const IconWrapper = styled.div<IconWrapperProps>`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${({ $variant, theme }) => {
    const bg = iconBgColors[$variant];
    const fg = iconColors[$variant];
    return css`
      background: ${theme.colors[bg as keyof typeof theme.colors]};
      color: ${theme.colors[fg as keyof typeof theme.colors]};
    `;
  }}

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

export const Title = styled.span`
  display: block;
  margin-bottom: 2px;
  font-size: ${({ theme }) => theme.typography.textBase};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
`;

export const Description = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  margin: -4px -4px -4px 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.white30};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.white50};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
