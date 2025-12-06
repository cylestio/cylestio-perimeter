import type { FC } from 'react';

import { Avatar } from '@ui/core/Avatar';
import { Badge } from '@ui/core/Badge';
import { Text } from '@ui/core/Text';

import { SessionItemWrapper, SessionInfo, SessionMeta } from './SessionItem.styles';

export type SessionStatus = 'ACTIVE' | 'COMPLETE' | 'ERROR';

export interface SessionItemProps {
  /** Agent ID used for avatar and display name */
  agentId: string;
  /** Display name for the agent (formatted) */
  agentName: string;
  /** Session ID (usually truncated for display) */
  sessionId: string;
  /** Session status */
  status: SessionStatus;
  /** Whether the session is currently active */
  isActive: boolean;
  /** Formatted duration string (e.g., "1h 30m") */
  duration: string;
  /** Relative time of last activity (e.g., "2d ago") */
  lastActivity: string;
  /** Whether the session has errors */
  hasErrors?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

const getStatusBadgeVariant = (
  status: SessionStatus,
  hasErrors: boolean
): 'success' | 'critical' | 'info' => {
  if (hasErrors) return 'critical';
  switch (status) {
    case 'ACTIVE':
      return 'info';
    case 'COMPLETE':
      return 'success';
    case 'ERROR':
      return 'critical';
    default:
      return 'info';
  }
};

const getAvatarStatus = (
  isActive: boolean,
  hasErrors: boolean
): 'online' | 'offline' | 'error' => {
  if (hasErrors) return 'error';
  return isActive ? 'online' : 'offline';
};

export const SessionItem: FC<SessionItemProps> = ({
  agentId,
  agentName,
  sessionId,
  status,
  isActive,
  duration,
  lastActivity,
  hasErrors = false,
  onClick,
  className,
}) => {
  return (
    <SessionItemWrapper
      $isActive={isActive}
      onClick={onClick}
      className={className}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Avatar
        name={agentId}
        size="sm"
        status={getAvatarStatus(isActive, hasErrors)}
      />
      <SessionInfo>
        <Text size="sm" weight="medium">
          {agentName}
        </Text>
        <Text size="xs" color="muted">
          {sessionId}
        </Text>
      </SessionInfo>
      <SessionMeta>
        <Badge variant={getStatusBadgeVariant(status, hasErrors)} size="sm">
          {status}
        </Badge>
        <Text size="xs" color="muted">
          {duration} · {lastActivity}
        </Text>
      </SessionMeta>
    </SessionItemWrapper>
  );
};
