import type { FC } from 'react';
import { StyledSurfaceNode } from './SurfaceNode.styles';

// Types
export type SurfaceNodeType = 'entry' | 'tool' | 'exit';

export interface SurfaceNodeProps {
  label: string;
  type: SurfaceNodeType;
  risky?: boolean;
}

// Component
export const SurfaceNode: FC<SurfaceNodeProps> = ({
  label,
  type,
  risky = false,
}) => {
  return (
    <StyledSurfaceNode $type={type} $risky={risky}>
      {label}
    </StyledSurfaceNode>
  );
};
