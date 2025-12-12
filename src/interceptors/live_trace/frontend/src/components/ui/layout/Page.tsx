import type { FC, ReactNode, HTMLAttributes } from 'react';

import { StyledPage } from './Page.styles';

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** When true, page takes full width without max-width constraint */
  fullWidth?: boolean;
}

export const Page: FC<PageProps> = ({ children, fullWidth = false, ...rest }) => {
  return (
    <StyledPage $fullWidth={fullWidth} {...rest}>
      {children}
    </StyledPage>
  );
};
