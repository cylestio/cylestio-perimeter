import type { FC } from 'react';
import { StyledSkeleton, SkeletonLines } from './Skeleton.styles';

// Types
export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'rect' | 'circle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

// Component
export const Skeleton: FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <SkeletonLines className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <StyledSkeleton
            key={index}
            $variant="text"
            $width={index === lines - 1 ? '70%' : width}
            $height={height}
          />
        ))}
      </SkeletonLines>
    );
  }

  return (
    <StyledSkeleton
      $variant={variant}
      $width={width}
      $height={height}
      className={className}
    />
  );
};
