import type { FC, ReactNode } from 'react';

import { Check, X, AlertTriangle, Minus, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  StyledSecurityCheckItem,
  StatusIndicatorContainer,
  TimelineConnector,
  ItemContent,
  ItemLabel,
  ItemStat,
  ItemBadge,
  EnterpriseBadge,
} from './SecurityCheckItem.styles';

// Types
export type SecurityCheckStatus = 'ok' | 'warning' | 'critical' | 'inactive' | 'running' | 'locked' | 'premium';

export type BadgeColor = 'red' | 'orange' | 'yellow' | 'green' | 'cyan';

export interface SecurityCheckItemProps {
  /** Display label (e.g., "Static Analysis", "Dynamic Analysis") */
  label: string;
  /** Current status */
  status: SecurityCheckStatus;
  /** Issue count (shown as badge) */
  count?: number;
  /** Badge color override - use to reflect severity of open findings */
  badgeColor?: BadgeColor;
  /** Additional stat text (e.g., "3 issues found") */
  stat?: string;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Whether this item is currently active/selected */
  active?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** React Router navigation path */
  to?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Whether to show timeline connector above */
  showConnectorAbove?: boolean;
  /** Whether to show timeline connector below */
  showConnectorBelow?: boolean;
  /** Whether this is the first item in the timeline */
  isFirst?: boolean;
  /** Whether this is the last item in the timeline */
  isLast?: boolean;
  /** Whether item is locked (enterprise only) */
  isLocked?: boolean;
  /** Custom icon override */
  icon?: ReactNode;
  /** Tooltip content when locked */
  lockedTooltip?: string;
  className?: string;
}

// Helper to get icon for status
const getStatusIcon = (status: SecurityCheckStatus, isLocked?: boolean, customIcon?: ReactNode): ReactNode => {
  if (customIcon) return customIcon;
  if (isLocked) {
    return <Lock size={10} />;
  }
  switch (status) {
    case 'ok':
      return <Check size={10} strokeWidth={2.5} />;
    case 'warning':
      return <AlertTriangle size={9} />;
    case 'critical':
      return <X size={10} strokeWidth={2.5} />;
    case 'premium':
      return <Crown size={10} />;
    case 'locked':
      return <Lock size={10} />;
    case 'running':
      return null;
    case 'inactive':
    default:
      return <Minus size={9} />;
  }
};

// Status indicator with ring
const StatusIndicator: FC<{
  status: SecurityCheckStatus;
  isLocked?: boolean;
  icon?: ReactNode;
}> = ({ status, isLocked, icon }) => {
  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isRunning = status === 'running';
  const isPremium = status === 'premium';

  return (
    <StatusIndicatorContainer $status={status} $isLocked={isLocked} $isRunning={isRunning}>
      <svg width={size} height={size} className="ring-svg">
        {/* Gradient definition for premium status */}
        {isPremium && (
          <defs>
            <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        )}
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPremium ? 'url(#premiumGradient)' : 'currentColor'}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Progress/status circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPremium ? 'url(#premiumGradient)' : 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={isRunning ? `${circumference * 0.25} ${circumference * 0.75}` : circumference}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-circle"
        />
      </svg>
      <span className="ring-icon">
        {getStatusIcon(status, isLocked, icon)}
      </span>
    </StatusIndicatorContainer>
  );
};

// Main Component
export const SecurityCheckItem: FC<SecurityCheckItemProps> = ({
  label,
  status,
  count,
  badgeColor,
  stat,
  collapsed = false,
  active = false,
  disabled = false,
  to,
  onClick,
  showConnectorAbove = false,
  showConnectorBelow = false,
  isFirst = false,
  isLast = false,
  isLocked = false,
  icon,
  lockedTooltip = 'Available for Enterprise customers',
  className,
}) => {
  // Determine if connector should be shown and its state
  const showTopConnector = !isFirst && showConnectorAbove;
  const showBottomConnector = !isLast && showConnectorBelow;

  // Determine connector color based on status
  const getConnectorStatus = (checkStatus: SecurityCheckStatus): 'pending' | 'active' | 'complete' | 'critical' | 'warning' => {
    if (checkStatus === 'ok' || checkStatus === 'premium') return 'complete';
    if (checkStatus === 'running') return 'active';
    if (checkStatus === 'critical') return 'critical';
    if (checkStatus === 'warning') return 'warning';
    return 'pending';
  };

  const isClickable = (!!onClick || !!to) && !disabled && !isLocked;
  const effectiveStatus = isLocked ? 'locked' : status;

  const innerContent = (
    <>
      <div className="status-column">
        {showTopConnector && (
          <TimelineConnector $position="top" $status={getConnectorStatus(status)} />
        )}
        <StatusIndicator status={effectiveStatus} isLocked={isLocked} icon={icon} />
        {showBottomConnector && (
          <TimelineConnector $position="bottom" $status={getConnectorStatus(status)} />
        )}
      </div>
      {!collapsed && (
        <>
          <ItemContent>
            <ItemLabel>{label}</ItemLabel>
            {stat && <ItemStat>{stat}</ItemStat>}
          </ItemContent>
          {isLocked && (
            <EnterpriseBadge>
              <Lock size={8} />
              Enterprise
            </EnterpriseBadge>
          )}
          {count !== undefined && count > 0 && !isLocked && (
            <ItemBadge $status={status} $badgeColor={badgeColor}>
              {count}
            </ItemBadge>
          )}
        </>
      )}
    </>
  );

  // Wrap locked items with tooltip
  const wrapWithTooltip = (content: React.ReactElement) => {
    if (isLocked && lockedTooltip) {
      return (
        <Tooltip content={lockedTooltip} position="right">
          {content}
        </Tooltip>
      );
    }
    if (collapsed) {
      return (
        <Tooltip content={label} position="right">
          {content}
        </Tooltip>
      );
    }
    return content;
  };

  // Use Link for navigation when `to` is provided
  if (to && !disabled && !isLocked) {
    return wrapWithTooltip(
      <StyledSecurityCheckItem
        as={Link}
        to={to}
        $collapsed={collapsed}
        $active={active}
        $clickable={isClickable}
        $disabled={disabled}
        $isLocked={isLocked}
        $status={effectiveStatus}
        className={className}
      >
        {innerContent}
      </StyledSecurityCheckItem>
    );
  }

  // Fallback to div with onClick handler
  return wrapWithTooltip(
    <StyledSecurityCheckItem
      $collapsed={collapsed}
      $active={active}
      $clickable={isClickable}
      $disabled={disabled || isLocked}
      $isLocked={isLocked}
      $status={effectiveStatus}
      onClick={disabled || isLocked ? undefined : onClick}
      className={className}
    >
      {innerContent}
    </StyledSecurityCheckItem>
  );
};
