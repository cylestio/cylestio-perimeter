import type { FC, ReactNode } from 'react';

import { Check, X, AlertTriangle, Minus, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  StyledAnalysisStatusItem,
  StatusRingContainer,
  ItemContent,
  ItemLabel,
  ItemStat,
  ItemBadge,
} from './AnalysisStatusItem.styles';

// Types
export type AnalysisStatus = 'ok' | 'warning' | 'critical' | 'inactive' | 'running';

export interface AnalysisStatusItemProps {
  /** Display label (e.g., "Static Scan", "Dynamic Scan") */
  label: string;
  /** Current status */
  status: AnalysisStatus;
  /** Issue count (shown as badge) */
  count?: number;
  /** Additional stat text (e.g., "3 issues found") */
  stat?: string;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Whether this is a recommendations/fixes item (special styling) */
  isRecommendation?: boolean;
  /** Whether this item is currently active/selected */
  active?: boolean;
  /** Whether this item is disabled (e.g., not applicable for unassigned workflows) */
  disabled?: boolean;
  /** React Router navigation path */
  to?: string;
  /** Optional click handler */
  onClick?: () => void;
  className?: string;
}

// Helper to get icon for status
const getStatusIcon = (status: AnalysisStatus, isRecommendation?: boolean): ReactNode => {
  if (isRecommendation) {
    return <Lightbulb size={9} />;
  }
  switch (status) {
    case 'ok':
      return <Check size={9} strokeWidth={2.5} />;
    case 'warning':
      return <AlertTriangle size={8} />;
    case 'critical':
      return <X size={9} strokeWidth={2.5} />;
    case 'running':
      return null; // No icon when spinning
    case 'inactive':
    default:
      return <Minus size={8} />;
  }
};

// Ring with icon inside
const StatusRing: FC<{
  status: AnalysisStatus;
  isRecommendation?: boolean;
}> = ({ status, isRecommendation }) => {
  const size = 18;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isRunning = status === 'running';

  return (
    <StatusRingContainer $status={status} $isRecommendation={isRecommendation} $isRunning={isRunning}>
      <svg width={size} height={size} className="ring-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
        {/* Progress/spinner circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={isRunning ? `${circumference * 0.25} ${circumference * 0.75}` : circumference}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-circle"
        />
      </svg>
      <span className="ring-icon">
        {getStatusIcon(status, isRecommendation)}
      </span>
    </StatusRingContainer>
  );
};

// Main Component
export const AnalysisStatusItem: FC<AnalysisStatusItemProps> = ({
  label,
  status,
  count,
  stat,
  collapsed = false,
  isRecommendation = false,
  active = false,
  disabled = false,
  to,
  onClick,
  className,
}) => {
  const isClickable = (!!onClick || !!to) && !disabled;

  const innerContent = (
    <>
      <StatusRing status={status} isRecommendation={isRecommendation} />
      {!collapsed && (
        <>
          <ItemContent>
            <ItemLabel>{label}</ItemLabel>
            {stat && <ItemStat>{stat}</ItemStat>}
          </ItemContent>
          {count !== undefined && count > 0 && (
            <ItemBadge $status={status} $isRecommendation={isRecommendation}>
              {count}
            </ItemBadge>
          )}
        </>
      )}
    </>
  );

  // Use Link for navigation when `to` is provided
  if (to && !disabled) {
    const content = (
      <StyledAnalysisStatusItem
        as={Link}
        to={to}
        $collapsed={collapsed}
        $isRecommendation={isRecommendation}
        $active={active}
        $clickable={isClickable}
        $disabled={disabled}
        className={className}
      >
        {innerContent}
      </StyledAnalysisStatusItem>
    );

    return collapsed ? (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    ) : content;
  }

  // Fallback to div with onClick handler
  const content = (
    <StyledAnalysisStatusItem
      $collapsed={collapsed}
      $isRecommendation={isRecommendation}
      $active={active}
      $clickable={isClickable}
      $disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={className}
    >
      {innerContent}
    </StyledAnalysisStatusItem>
  );

  // Show tooltip when collapsed
  if (collapsed) {
    return (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
};
