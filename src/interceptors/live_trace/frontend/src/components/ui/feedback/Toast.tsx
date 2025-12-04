import type { FC } from 'react';
import { useEffect } from 'react';
import { Info, Check, AlertTriangle, X } from 'lucide-react';
import {
  StyledToast,
  IconWrapper,
  Content,
  Title,
  Description,
  CloseButton,
} from './Toast.styles';

// Types
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  variant?: ToastVariant;
  title: string;
  description?: string;
  onClose?: () => void;
  duration?: number;
  className?: string;
}

// Component
const variantIcons: Record<ToastVariant, FC<{ size?: number }>> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: X,
};

export const Toast: FC<ToastProps> = ({
  variant = 'info',
  title,
  description,
  onClose,
  duration,
  className,
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const Icon = variantIcons[variant];

  return (
    <StyledToast $variant={variant} className={className}>
      <IconWrapper $variant={variant}>
        <Icon />
      </IconWrapper>
      <Content>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </Content>
      {onClose && (
        <CloseButton onClick={onClose} aria-label="Close">
          <X />
        </CloseButton>
      )}
    </StyledToast>
  );
};
