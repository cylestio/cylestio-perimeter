import type { FC } from 'react';
import { 
  Plus, 
  Play, 
  Check, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import {
  TimelineContainer,
  TimelineItem,
  TimelineIcon,
  TimelineContent,
  TimelineAction,
  TimelineReason,
  TimelineMeta,
  MetaSeparator,
  EmptyState,
  FilesChanged,
  FileTag,
} from './AuditTrail.styles';

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by?: string;
  performed_at: string;
  details?: {
    reason?: string;
    notes?: string;
    files_modified?: string[];
    old_status?: string;
    new_status?: string;
    fix_method?: string;
    verification_result?: string;
  };
}

export interface AuditTrailProps {
  entries: AuditLogEntry[];
}

type ActionType = 'CREATED' | 'STARTED' | 'COMPLETED' | 'VERIFIED' | 'DISMISSED' | 'IGNORED' | 'REOPENED' | 'STATUS_CHANGED';

const ACTION_ICONS: Record<string, typeof Plus> = {
  CREATED: Plus,
  STARTED: Play,
  COMPLETED: Check,
  VERIFIED: CheckCircle,
  DISMISSED: XCircle,
  IGNORED: XCircle,
  REOPENED: RotateCcw,
  STATUS_CHANGED: ArrowRight,
};

const ACTION_LABELS: Record<string, string> = {
  RECOMMENDATION_CREATED: 'Recommendation created',
  FIX_STARTED: 'Fix started',
  FIX_COMPLETED: 'Fix completed',
  FIX_VERIFIED: 'Fix verified',
  RECOMMENDATION_DISMISSED: 'Dismissed (risk accepted)',
  RECOMMENDATION_IGNORED: 'Marked as false positive',
  STATUS_CHANGED: 'Status changed',
  REOPENED: 'Reopened',
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const getActionType = (action: string): ActionType => {
  if (action.includes('CREATED')) return 'CREATED';
  if (action.includes('STARTED')) return 'STARTED';
  if (action.includes('COMPLETED')) return 'COMPLETED';
  if (action.includes('VERIFIED')) return 'VERIFIED';
  if (action.includes('DISMISSED')) return 'DISMISSED';
  if (action.includes('IGNORED')) return 'IGNORED';
  if (action.includes('REOPENED')) return 'REOPENED';
  return 'STATUS_CHANGED';
};

export const AuditTrail: FC<AuditTrailProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <EmptyState>No audit history available</EmptyState>;
  }

  return (
    <TimelineContainer>
      {entries.map((entry) => {
        const actionType = getActionType(entry.action);
        const IconComponent = ACTION_ICONS[actionType] || ArrowRight;
        const actionLabel = ACTION_LABELS[entry.action] || entry.action;

        return (
          <TimelineItem key={entry.id}>
            <TimelineIcon $action={actionType}>
              <IconComponent size={14} />
            </TimelineIcon>
            <TimelineContent>
              <TimelineAction>{actionLabel}</TimelineAction>
              
              {/* Show reason for dismissals */}
              {entry.details?.reason && (
                <TimelineReason>"{entry.details.reason}"</TimelineReason>
              )}
              
              {/* Show notes for fixes */}
              {entry.details?.notes && !entry.details?.reason && (
                <TimelineReason>"{entry.details.notes}"</TimelineReason>
              )}
              
              {/* Show verification result */}
              {entry.details?.verification_result && (
                <TimelineReason>"{entry.details.verification_result}"</TimelineReason>
              )}
              
              {/* Show files modified */}
              {entry.details?.files_modified && entry.details.files_modified.length > 0 && (
                <FilesChanged>
                  {entry.details.files_modified.map((file) => (
                    <FileTag key={file}>{file}</FileTag>
                  ))}
                </FilesChanged>
              )}
              
              <TimelineMeta>
                {entry.performed_by && (
                  <>
                    <span>{entry.performed_by}</span>
                    <MetaSeparator>•</MetaSeparator>
                  </>
                )}
                <span>{formatRelativeTime(entry.performed_at)}</span>
                {entry.details?.fix_method && (
                  <>
                    <MetaSeparator>•</MetaSeparator>
                    <span>{entry.details.fix_method}</span>
                  </>
                )}
              </TimelineMeta>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </TimelineContainer>
  );
};
