import type { FC, ReactNode } from 'react';
import { StyledShell } from './Shell.styles';

// Types
export interface ShellProps {
  children: ReactNode;
}

// Component
export const Shell: FC<ShellProps> = ({ children }) => {
  return <StyledShell>{children}</StyledShell>;
};
