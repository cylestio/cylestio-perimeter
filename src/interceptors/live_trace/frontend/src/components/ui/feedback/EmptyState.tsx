import type { FC, ReactNode } from 'react';
import {
  EmptyStateWrapper,
  IconContainer,
  Title,
  Description,
  ActionWrapper,
} from './EmptyState.styles';
import { Button } from '../core/Button';

// Types
export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

// Component
export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <EmptyStateWrapper className={className}>
      {icon && <IconContainer>{icon}</IconContainer>}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && (
        <ActionWrapper>
          <Button variant={action.variant || 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        </ActionWrapper>
      )}
    </EmptyStateWrapper>
  );
};
