import type { FC, ReactNode } from 'react';
import { StyledCode } from './Code.styles';

// Types
export type CodeVariant = 'inline' | 'block';

export interface CodeProps {
  variant?: CodeVariant;
  children: ReactNode;
  className?: string;
}

// Component
export const Code: FC<CodeProps> = ({
  variant = 'inline',
  children,
  className,
}) => {
  return (
    <StyledCode $variant={variant} className={className}>
      {children}
    </StyledCode>
  );
};
