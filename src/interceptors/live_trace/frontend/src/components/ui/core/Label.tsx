import type { FC, ReactNode } from 'react';
import { StyledLabel, RequiredAsterisk } from './Label.styles';

// Types
export type LabelSize = 'xs' | 'sm';
export type LabelColor = 'default' | 'cyan' | 'muted';

export interface LabelProps {
  size?: LabelSize;
  color?: LabelColor;
  uppercase?: boolean;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

// Component
export const Label: FC<LabelProps> = ({
  size = 'sm',
  color = 'default',
  uppercase = false,
  required = false,
  htmlFor,
  children,
  className,
}) => {
  return (
    <StyledLabel
      $size={size}
      $color={color}
      $uppercase={uppercase}
      htmlFor={htmlFor}
      className={className}
    >
      {children}
      {required && <RequiredAsterisk>*</RequiredAsterisk>}
    </StyledLabel>
  );
};
