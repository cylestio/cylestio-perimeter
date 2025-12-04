import type { FC, ReactNode } from 'react';
import { Check, Shield, PlusCircle, Circle, AlertTriangle } from 'lucide-react';
import {
  StyledBadge,
  StyledSeverityDot,
  StyledModePill,
  PulseDot,
  StyledCorrelationBadge,
} from './Badge.styles';

// Types
export type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'info' | 'ai';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

// SeverityDot
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface SeverityDotProps {
  severity: Severity;
  glow?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

// ModePill
export interface ModePillProps {
  active?: boolean;
  pulsing?: boolean;
  children: ReactNode;
  className?: string;
}

// CorrelationBadge
export type CorrelationStatus = 'confirmed' | 'controlled' | 'discovered' | 'pending' | 'triggered';

export interface CorrelationBadgeProps {
  status: CorrelationStatus;
  className?: string;
}

// ===========================================
// BADGE
// ===========================================

export const Badge: FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  icon,
  children,
  className,
}) => {
  return (
    <StyledBadge $variant={variant} $size={size} className={className}>
      {icon}
      {children}
    </StyledBadge>
  );
};

// ===========================================
// SEVERITY DOT
// ===========================================

export const SeverityDot: FC<SeverityDotProps> = ({
  severity,
  glow,
  size = 'md',
  className,
}) => {
  // Default glow for critical and high
  const showGlow = glow ?? (severity === 'critical' || severity === 'high');

  return (
    <StyledSeverityDot
      $severity={severity}
      $glow={showGlow}
      $size={size}
      className={className}
    />
  );
};

// ===========================================
// MODE PILL
// ===========================================

export const ModePill: FC<ModePillProps> = ({
  active = true,
  pulsing = true,
  children,
  className,
}) => {
  return (
    <StyledModePill $active={active} className={className}>
      {active && pulsing && <PulseDot />}
      {children}
    </StyledModePill>
  );
};

// ===========================================
// CORRELATION BADGE
// ===========================================

const correlationConfig: Record<CorrelationStatus, { icon: FC<{ size?: number }>; label: string }> = {
  confirmed: { icon: Check, label: 'CONFIRMED' },
  controlled: { icon: Shield, label: 'CONTROLLED' },
  discovered: { icon: PlusCircle, label: 'DISCOVERED' },
  pending: { icon: Circle, label: 'PENDING' },
  triggered: { icon: AlertTriangle, label: 'TRIGGERED' },
};

export const CorrelationBadge: FC<CorrelationBadgeProps> = ({ status, className }) => {
  const config = correlationConfig[status];
  const Icon = config.icon;

  return (
    <StyledCorrelationBadge $status={status} className={className}>
      <Icon size={12} />
      {config.label}
    </StyledCorrelationBadge>
  );
};
