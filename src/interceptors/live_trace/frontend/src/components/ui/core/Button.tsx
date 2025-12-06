import type { FC, ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { StyledButton, IconWrapper } from './Button.styles';

// Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
}

// Component
export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  fullWidth = false,
  loading = false,
  disabled,
  children,
  as = 'button',
  href,
  ...props
}) => {
  const renderIcon = () => {
    if (loading) {
      return (
        <IconWrapper $spin>
          <Loader2 />
        </IconWrapper>
      );
    }
    if (icon) {
      return <IconWrapper>{icon}</IconWrapper>;
    }
    return null;
  };

  const content = (
    <>
      {(iconPosition === 'left' || iconOnly) && renderIcon()}
      {!iconOnly && children}
      {iconPosition === 'right' && !iconOnly && renderIcon()}
    </>
  );

  return (
    <StyledButton
      as={as === 'a' ? 'a' : 'button'}
      href={as === 'a' ? href : undefined}
      $variant={variant}
      $size={size}
      $iconOnly={iconOnly}
      $fullWidth={fullWidth}
      $loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </StyledButton>
  );
};
