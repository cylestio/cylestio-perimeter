import type { FC } from 'react';
import { 
  Plus, 
  Wrench, 
  CheckCircle, 
  Shield, 
  XCircle, 
  Ban, 
  AlertTriangle,
  History 
} from 'lucide-react';

import type { AuditLogEntry } from '@api/types/findings';

import {
  TrailWrapper,
  TimelineItem,
  TimelineIconWrapper,
  TimelineContent,
  TimelineAction,
  TimelineReason,
  TimelineMeta,
  TimelineUser,
  TimelineDot,
  EmptyTrail,
} from './AuditTrail.styles';

export interface AuditTrailProps {
  entries: AuditLogEntry[];
  className?: string;
}

type ActionType = 'CREATED' | 'STATUS_CHANGE' | 'FIXING' | 'FIXED' | 'VERIFIED' | 'DISMISSED' | 'IGNORED' | 'REOPENED';

const getActionType = (action: string): ActionType => {
  const upper = action.toUpperCase();
  if (upper.includes('CREATE')) return 'CREATED';
  if (upper.includes('FIXING') || upper.includes('START_FIX')) return 'FIXING';
  if (upper.includes('VERIFIED')) return 'VERIFIED';
  if (upper.includes('FIXED') || upper.includes('COMPLETE_FIX')) return 'FIXED';
  if (upper.includes('DISMISSED')) return 'DISMISSED';
  if (upper.includes('IGNORED')) return 'IGNORED';
  if (upper.includes('REOPEN')) return 'REOPENED';
  return 'STATUS_CHANGE';
};

const getActionIcon = (action: ActionType) => {
  switch (action) {
    case 'CREATED':
      return <Plus size={12} />;
    case 'FIXING':
      return <Wrench size={12} />;
    case 'FIXED':
      return <CheckCircle size={12} />;
    case 'VERIFIED':
      return <Shield size={12} />;
    case 'DISMISSED':
      return <XCircle size={12} />;
    case 'IGNORED':
      return <Ban size={12} />;
    case 'REOPENED':
      return <AlertTriangle size={12} />;
    default:
      return <History size={12} />;
  }
};

const getActionLabel = (action: string, newValue?: string): string => {
  const actionType = getActionType(action);
  switch (actionType) {
    case 'CREATED':
      return 'Recommendation created';
    case 'FIXING':
      return 'Fix started';
    case 'FIXED':
      return 'Fix completed';
    case 'VERIFIED':
      return 'Fix verified';
    case 'DISMISSED':
      return 'Dismissed (Risk Accepted)';
    case 'IGNORED':
      return 'Marked as False Positive';
    case 'REOPENED':
      return 'Reopened';
    default:
      return newValue ? `Status changed to ${newValue}` : action;
  }
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * AuditTrail - Timeline display of recommendation status changes
 * 
 * Shows chronological history of:
 * - Creation
 * - Status changes (FIXING, FIXED, VERIFIED)
 * - Dismissals with reasons
 * - Reopenings
 */
export const AuditTrail: FC<AuditTrailProps> = ({ entries, className }) => {
  if (!entries || entries.length === 0) {
    return (
      <EmptyTrail className={className}>
        <History size={32} />
        <p>No audit history yet</p>
      </EmptyTrail>
    );
  }

  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
  );

  return (
    <TrailWrapper className={className}>
      {sortedEntries.map((entry) => {
        const actionType = getActionType(entry.action);
        return (
          <TimelineItem key={entry.id}>
            <TimelineIconWrapper $action={actionType}>
              {getActionIcon(actionType)}
            </TimelineIconWrapper>
            <TimelineContent>
              <TimelineAction>
                {getActionLabel(entry.action, entry.new_value)}
              </TimelineAction>
              
              {entry.reason && (
                <TimelineReason>"{entry.reason}"</TimelineReason>
              )}
              
              <TimelineMeta>
                {entry.performed_by && (
                  <>
                    <TimelineUser>{entry.performed_by}</TimelineUser>
                    <TimelineDot>•</TimelineDot>
                  </>
                )}
                <span>{formatRelativeTime(entry.performed_at)}</span>
              </TimelineMeta>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </TrailWrapper>
  );
};

