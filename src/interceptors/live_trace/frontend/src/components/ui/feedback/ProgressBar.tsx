import type { FC } from 'react';
import { Track, Fill, ProgressBarWrapper, Label } from './ProgressBar.styles';

// Types
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger';
export type ProgressBarSize = 'sm' | 'md';

export interface ProgressBarProps {
  value: number;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

// Component
export const ProgressBar: FC<ProgressBarProps> = ({
  value,
  variant = 'default',
  size = 'md',
  showLabel = false,
  animated = false,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  if (showLabel) {
    return (
      <ProgressBarWrapper className={className}>
        <Track $size={size}>
          <Fill $variant={variant} $value={clampedValue} $animated={animated} />
        </Track>
        <Label>{Math.round(clampedValue)}%</Label>
      </ProgressBarWrapper>
    );
  }

  return (
    <Track $size={size} className={className}>
      <Fill $variant={variant} $value={clampedValue} $animated={animated} />
    </Track>
  );
};
