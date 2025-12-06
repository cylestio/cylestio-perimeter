import styled, { css } from 'styled-components';
import type { SurfaceNodeType } from './SurfaceNode';

const getTypeColor = ($type: SurfaceNodeType, theme: { colors: Record<string, string> }) => {
  switch ($type) {
    case 'entry':
      return theme.colors.cyan;
    case 'tool':
      return theme.colors.purple;
    case 'exit':
      return theme.colors.orange;
  }
};

interface StyledSurfaceNodeProps {
  $type: SurfaceNodeType;
  $risky?: boolean;
}

export const StyledSurfaceNode = styled.span<StyledSurfaceNodeProps>`
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};
  border-left: 3px solid ${({ theme, $type }) => getTypeColor($type, theme)};

  ${({ $risky, theme }) =>
    $risky &&
    css`
      border-left-color: ${theme.colors.red};
      background: ${theme.colors.redSoft};
      color: ${theme.colors.red};
    `}
`;
