import type { FC, ReactNode } from 'react';
import { StyledMain } from './Main.styles';

// Types
export interface MainProps {
  children: ReactNode;
}

// Component
export const Main: FC<MainProps> = ({ children }) => {
  return <StyledMain>{children}</StyledMain>;
};
