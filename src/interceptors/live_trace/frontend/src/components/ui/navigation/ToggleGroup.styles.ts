import styled, { css } from 'styled-components';

export const ToggleGroupContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.surface2};
`;

interface ToggleButtonProps {
  $active?: boolean;
}

export const ToggleButton = styled.button<ToggleButtonProps>`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 150ms ease;
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};

  ${({ $active, theme }) =>
    $active
      ? css`
          border-color: ${theme.colors.cyan};
          color: ${theme.colors.cyan};
        `
      : css`
          color: ${theme.colors.white50};

          &:hover {
            border-color: ${theme.colors.white30};
            color: ${theme.colors.white70};
          }
        `}
`;
