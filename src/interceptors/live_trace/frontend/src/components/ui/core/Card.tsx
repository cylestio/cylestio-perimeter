import type { FC, ReactNode } from 'react';
import {
  StyledCard,
  StyledCardHeader,
  CardHeaderTitle,
  CardHeaderSubtitle,
  CardHeaderActions,
  StyledCardContent,
} from './Card.styles';

// Types
export type CardVariant = 'default' | 'elevated' | 'status';
export type CardStatus = 'critical' | 'high' | 'success';

export interface CardProps {
  variant?: CardVariant;
  status?: CardStatus;
  children: ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  actions?: ReactNode;
  className?: string;
}

export interface CardContentProps {
  noPadding?: boolean;
  children: ReactNode;
  className?: string;
}

// ===========================================
// CARD HEADER
// ===========================================

export const CardHeader: FC<CardHeaderProps> = ({
  title,
  subtitle,
  centered = false,
  actions,
  className,
}) => {
  return (
    <StyledCardHeader $centered={centered} className={className}>
      <CardHeaderTitle>{title}</CardHeaderTitle>
      {subtitle && <CardHeaderSubtitle>{subtitle}</CardHeaderSubtitle>}
      {actions && <CardHeaderActions>{actions}</CardHeaderActions>}
    </StyledCardHeader>
  );
};

// ===========================================
// CARD CONTENT
// ===========================================

export const CardContent: FC<CardContentProps> = ({ noPadding = false, children, className }) => {
  return (
    <StyledCardContent $noPadding={noPadding} className={className}>
      {children}
    </StyledCardContent>
  );
};

// ===========================================
// CARD (Compound Component)
// ===========================================

interface CardComponent extends FC<CardProps> {
  Header: typeof CardHeader;
  Content: typeof CardContent;
}

export const Card: CardComponent = ({ variant = 'default', status, children, className }) => {
  return (
    <StyledCard $variant={variant} $status={status} className={className}>
      {children}
    </StyledCard>
  );
};

// Attach subcomponents
Card.Header = CardHeader;
Card.Content = CardContent;
