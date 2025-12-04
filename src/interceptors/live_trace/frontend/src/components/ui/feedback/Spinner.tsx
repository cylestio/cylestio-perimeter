import type { FC } from 'react';
import { StyledSpinner } from './Spinner.styles';

// Types
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'cyan' | 'white' | 'current';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

// Component
export const Spinner: FC<SpinnerProps> = ({
  size = 'md',
  color = 'cyan',
  className,
}) => {
  return <StyledSpinner $size={size} $color={color} className={className} />;
};
