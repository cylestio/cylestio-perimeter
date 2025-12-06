import type { FC } from 'react';
import {
  OrbLoaderContainer,
  OrbOuter,
  OrbInner,
  FullPageWrapper,
  LoadingText,
} from './OrbLoader.styles';

// Types
export type OrbLoaderSize = 'sm' | 'md' | 'lg' | 'xl';
export type OrbLoaderVariant = 'morph' | 'whip';

export interface OrbLoaderProps {
  size?: OrbLoaderSize;
  variant?: OrbLoaderVariant;
  className?: string;
}

export interface FullPageLoaderProps {
  text?: string;
  variant?: OrbLoaderVariant;
}

// Component
export const OrbLoader: FC<OrbLoaderProps> = ({
  size = 'md',
  variant = 'morph',
  className,
}) => {
  return (
    <OrbLoaderContainer $size={size} $variant={variant} className={className}>
      <OrbOuter $size={size} $variant={variant}>
        <OrbInner $size={size} $variant={variant} />
      </OrbOuter>
    </OrbLoaderContainer>
  );
};

// Full-page variant for page transitions
export const FullPageLoader: FC<FullPageLoaderProps> = ({
  text = 'Loading',
  variant = 'morph',
}) => {
  return (
    <FullPageWrapper>
      <OrbLoader size="xl" variant={variant} />
      <LoadingText>{text}</LoadingText>
    </FullPageWrapper>
  );
};
