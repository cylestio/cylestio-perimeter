import type { FC, ReactNode } from 'react';
import {
  StyledStatsRow,
  StyledTwoColumn,
  TwoColumnMain,
  TwoColumnSidebar,
  StyledThreeColumn,
  StyledStack,
} from './Grid.styles';

// Types
export interface StatsRowProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export interface TwoColumnProps {
  main: ReactNode;
  sidebar: ReactNode;
  gap?: 'sm' | 'md' | 'lg';
}

export interface ThreeColumnProps {
  children: ReactNode;
  gap?: 'sm' | 'md' | 'lg';
}

export interface StackProps {
  children: ReactNode;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// StatsRow Component - 4-column grid for stat cards
export const StatsRow: FC<StatsRowProps> = ({ children, columns = 4 }) => {
  return <StyledStatsRow $columns={columns}>{children}</StyledStatsRow>;
};

// TwoColumn Component - 2:1 ratio grid layout
export const TwoColumn: FC<TwoColumnProps> = ({ main, sidebar, gap = 'md' }) => {
  return (
    <StyledTwoColumn $gap={gap}>
      <TwoColumnMain>{main}</TwoColumnMain>
      <TwoColumnSidebar>{sidebar}</TwoColumnSidebar>
    </StyledTwoColumn>
  );
};

// ThreeColumn Component - Equal 3-column grid
export const ThreeColumn: FC<ThreeColumnProps> = ({ children, gap = 'md' }) => {
  return <StyledThreeColumn $gap={gap}>{children}</StyledThreeColumn>;
};

// Stack Component - Vertical stack with customizable gap
export const Stack: FC<StackProps> = ({ children, gap = 'md' }) => {
  return <StyledStack $gap={gap}>{children}</StyledStack>;
};
