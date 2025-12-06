import type { FC, ReactNode } from 'react';
import { StyledText } from './Text.styles';

// Types
export type TextSize = 'xs' | 'sm' | 'base' | 'md' | 'lg';
export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'cyan'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextProps {
  size?: TextSize;
  color?: TextColor;
  weight?: TextWeight;
  mono?: boolean;
  as?: 'p' | 'span' | 'div' | 'label';
  truncate?: boolean;
  children: ReactNode;
  className?: string;
}

// Component
export const Text: FC<TextProps> = ({
  size = 'base',
  color = 'primary',
  weight = 'normal',
  mono = false,
  as = 'span',
  truncate = false,
  children,
  className,
}) => {
  return (
    <StyledText
      as={as}
      $size={size}
      $color={color}
      $weight={weight}
      $mono={mono}
      $truncate={truncate}
      className={className}
    >
      {children}
    </StyledText>
  );
};
