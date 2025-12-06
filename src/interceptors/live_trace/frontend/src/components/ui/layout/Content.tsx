import type { FC, ReactNode } from 'react';
import { StyledContent } from './Content.styles';

// Types
export type ContentMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ContentPadding = 'sm' | 'md' | 'lg';

export interface ContentProps {
  children: ReactNode;
  maxWidth?: ContentMaxWidth;
  padding?: ContentPadding;
}

// Component
export const Content: FC<ContentProps> = ({
  children,
  maxWidth = 'full',
  padding = 'lg',
}) => {
  return (
    <StyledContent $maxWidth={maxWidth} $padding={padding}>
      {children}
    </StyledContent>
  );
};
