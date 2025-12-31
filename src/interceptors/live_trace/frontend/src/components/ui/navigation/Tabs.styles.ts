import styled, { css } from 'styled-components';
import type { TabsVariant } from './Tabs';

interface TabsContainerProps {
  $variant: TabsVariant;
}

export const TabsContainer = styled.div<TabsContainerProps>`
  display: flex;
  gap: 4px;

  ${({ $variant, theme }) =>
    $variant === 'default' &&
    css`
      border-bottom: 1px solid ${theme.colors.borderMedium};
    `}
`;

interface TabButtonProps {
  $active?: boolean;
  $disabled?: boolean;
  $variant: TabsVariant;
}

export const TabButton = styled.button<TabButtonProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 150ms ease;
  border-radius: ${({ $variant, theme }) =>
    $variant === 'pills'
      ? theme.radii.md
      : `${theme.radii.md} ${theme.radii.md} 0 0`};

  ${({ $variant, $active, $disabled, theme }) => {
    if ($disabled) {
      return css`
        color: ${theme.colors.white30};
        cursor: not-allowed;
      `;
    }

    if ($variant === 'pills') {
      if ($active) {
        return css`
          background: ${theme.colors.cyan};
          color: ${theme.colors.void};
        `;
      }
      return css`
        color: ${theme.colors.white50};

        &:hover {
          background: ${theme.colors.white04};
          color: ${theme.colors.white70};
        }
      `;
    }

    // Default variant
    if ($active) {
      return css`
        background: ${theme.colors.surface3};
        color: ${theme.colors.white};
        border-bottom: 2px solid ${theme.colors.cyan};
        margin-bottom: -1px;
      `;
    }

    return css`
      color: ${theme.colors.white70};

      &:hover {
        background: ${theme.colors.white08};
        color: ${theme.colors.white};
      }
    `;
  }}
`;

export const TabCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  opacity: 0.7;
`;
