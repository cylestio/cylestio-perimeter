import type { FC, ReactNode } from 'react';
import { StyledHeading } from './Heading.styles';

// Types
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export interface HeadingProps {
  level?: HeadingLevel;
  size?: HeadingSize;
  gradient?: boolean;
  children: ReactNode;
  className?: string;
}

const defaultSizes: Record<HeadingLevel, HeadingSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
};

// Component
export const Heading: FC<HeadingProps> = ({
  level = 2,
  size,
  gradient = false,
  children,
  className,
}) => {
  const tag = `h${level}` as const;
  const resolvedSize = size ?? defaultSizes[level];

  return (
    <StyledHeading
      as={tag}
      $size={resolvedSize}
      $gradient={gradient}
      className={className}
    >
      {children}
    </StyledHeading>
  );
};
