import type { FC } from 'react';

import { Check, FolderOpen, Clock } from 'lucide-react';

import type { IDEConnectionStatus } from '@api/types/ide';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { TimeAgo } from '@ui/core/TimeAgo';

import {
  StatusBanner,
  StatusIconWrapper,
  StatusContent,
  StatusTitle,
  StatusDetails,
  StatusDetail,
  LiveBadge,
  LiveDot,
} from './IDEConnectionBanner.styles';

export interface IDEConnectionBannerProps {
  connectionStatus: IDEConnectionStatus | null;
  isLoading: boolean;
  className?: string;
}

function getIDEDisplayName(ideType: string): string {
  switch (ideType) {
    case 'cursor':
      return 'Cursor';
    case 'claude-code':
      return 'Claude Code';
    default:
      return ideType;
  }
}

export const IDEConnectionBanner: FC<IDEConnectionBannerProps> = ({
  connectionStatus,
  isLoading,
  className,
}) => {
  const hasActivity = connectionStatus?.has_activity ?? false;
  const ideMetadata = connectionStatus?.ide;

  if (isLoading) {
    return (
      <StatusBanner $connected={false} className={className}>
        <StatusIconWrapper $connected={false}>
          <OrbLoader size="sm" />
        </StatusIconWrapper>
        <StatusContent>
          <StatusTitle>Checking connection...</StatusTitle>
        </StatusContent>
      </StatusBanner>
    );
  }

  // Has IDE metadata from heartbeat - show rich status
  if (hasActivity && ideMetadata) {
    return (
      <StatusBanner $connected={true} className={className}>
        <StatusIconWrapper $connected={true}>
          <Check size={24} />
        </StatusIconWrapper>
        <StatusContent>
          <StatusTitle>Connected to {getIDEDisplayName(ideMetadata.ide_type)}</StatusTitle>
          <StatusDetails>
            <StatusDetail>
              <FolderOpen size={12} />
              {ideMetadata.workspace_path || 'Unknown workspace'}
            </StatusDetail>
            <StatusDetail>
              <Clock size={12} />
              {connectionStatus?.last_seen ? (
                <TimeAgo timestamp={connectionStatus.last_seen} />
              ) : (
                'Unknown'
              )}
            </StatusDetail>
          </StatusDetails>
        </StatusContent>
        <LiveBadge>
          <LiveDot />
          Live
        </LiveBadge>
      </StatusBanner>
    );
  }

  // Has activity but no IDE metadata - show basic status
  if (hasActivity) {
    return (
      <StatusBanner $connected={true} className={className}>
        <StatusIconWrapper $connected={true}>
          <Check size={24} />
        </StatusIconWrapper>
        <StatusContent>
          <StatusTitle>IDE Activity Detected</StatusTitle>
          <StatusDetails>
            <StatusDetail>
              <Clock size={12} />
              Last activity{' '}
              {connectionStatus?.last_seen ? (
                <TimeAgo timestamp={connectionStatus.last_seen} />
              ) : (
                'unknown'
              )}
            </StatusDetail>
          </StatusDetails>
        </StatusContent>
      </StatusBanner>
    );
  }

  return (
    <StatusBanner $connected={false} className={className}>
      <StatusIconWrapper $connected={false}>
        <OrbLoader size="sm" />
      </StatusIconWrapper>
      <StatusContent>
        <StatusTitle>Waiting for connection...</StatusTitle>
        <StatusDetails>
          <StatusDetail>Follow the instructions below to connect your IDE</StatusDetail>
        </StatusDetails>
      </StatusContent>
    </StatusBanner>
  );
};
