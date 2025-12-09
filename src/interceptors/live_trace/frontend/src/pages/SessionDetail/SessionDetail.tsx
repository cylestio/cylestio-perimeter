import { useState, useCallback, type FC } from 'react';
import { useParams, Link } from 'react-router-dom';

import { fetchSession } from '@api/endpoints/session';
import type { SessionResponse, TimelineEvent } from '@api/types/session';
import { usePolling } from '@hooks/usePolling';
import { buildWorkflowBreadcrumbs, workflowLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Timeline } from '@ui/data-display/Timeline';

import { InfoCard } from '@domain/metrics/InfoCard';

import { usePageMeta } from '../../context';
import { ReplayPanel } from './ReplayPanel';
import {
  SessionLayout,
  SessionSidebar,
  SessionMain,
  MetricCard,
  MetricInfo,
  MetricLabel,
  MetricSubtext,
  MetricValue,
  TimelineCard,
  TimelineHeader,
  TimelineTitle,
  TimelineContent,
  EmptyTimeline,
} from './SessionDetail.styles';

// Utility to format numbers
function formatNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
  return value.toString();
}

export const SessionDetail: FC = () => {
  const { sessionId, workflowId } = useParams<{ sessionId: string; workflowId: string }>();
  const [replayEventId, setReplayEventId] = useState<string | null>(null);

  // Fetch session data with polling
  const fetchFn = useCallback(() => {
    if (!sessionId) return Promise.reject(new Error('No session ID'));
    return fetchSession(sessionId);
  }, [sessionId]);

  const { data, error, loading } = usePolling<SessionResponse>(fetchFn, {
    interval: 2000,
    enabled: !!sessionId,
  });

  // Set breadcrumbs with workflow context
  usePageMeta({
    breadcrumbs: buildWorkflowBreadcrumbs(
      workflowId,
      ...(data?.session.agent_id
        ? [{ label: `Agent ${data.session.agent_id.substring(0, 12)}...`, href: workflowLink(workflowId, `/agent/${data.session.agent_id}`) }]
        : []),
      { label: 'Session' },
      { label: sessionId?.substring(0, 12) + '...' || '' }
    ),
  });

  const handleReplay = (eventId: string) => {
    setReplayEventId(eventId);
  };

  const handleCloseReplay = () => {
    setReplayEventId(null);
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Failed to load session"
        description={error || 'Session not found'}
      />
    );
  }

  const session = data.session;
  const timeline = data.timeline || [];

  return (
    <>
      <SessionLayout>
        <SessionSidebar>
          {/* Session Info Card */}
          <InfoCard
            title="Session Info"
            primaryLabel="SESSION ID"
            primaryValue={session.id}
            stats={[
              {
                label: 'AGENT ID',
                badge: (
                  <Link
                    to={workflowLink(workflowId, `/agent/${session.agent_id}`)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--color-cyan)',
                      textDecoration: 'none',
                    }}
                  >
                    {session.agent_id.substring(0, 16)}...
                  </Link>
                ),
              },
              {
                label: 'STATUS',
                badge: session.is_active ? (
                  <Badge variant="success">ACTIVE</Badge>
                ) : (
                  <Badge variant="info">COMPLETE</Badge>
                ),
              },
              { label: 'DURATION', value: `${session.duration_minutes.toFixed(1)} minutes` },
            ]}
          />

          {/* Session Metrics */}
          <MetricCard>
            <MetricInfo>
              <MetricLabel>Total Events</MetricLabel>
            </MetricInfo>
            <MetricValue>{session.total_events}</MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricInfo>
              <MetricLabel>Messages</MetricLabel>
              <MetricSubtext>LLM exchanges</MetricSubtext>
            </MetricInfo>
            <MetricValue>{session.message_count}</MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricInfo>
              <MetricLabel>Total Tokens</MetricLabel>
            </MetricInfo>
            <MetricValue>{formatNumber(session.total_tokens)}</MetricValue>
          </MetricCard>

          <MetricCard>
            <MetricInfo>
              <MetricLabel>Tool Uses</MetricLabel>
              <MetricSubtext>
                {session.errors > 0 ? (
                  <span style={{ color: 'var(--color-red)' }}>{session.errors} errors</span>
                ) : (
                  'no errors'
                )}
              </MetricSubtext>
            </MetricInfo>
            <MetricValue>{session.tool_uses}</MetricValue>
          </MetricCard>
        </SessionSidebar>

        <SessionMain>
          <TimelineCard>
            <TimelineHeader>
              <TimelineTitle>Event Timeline ({timeline.length} events)</TimelineTitle>
            </TimelineHeader>
            <TimelineContent>
              {timeline.length > 0 ? (
                <Timeline
                  events={timeline as TimelineEvent[]}
                  sessionId={sessionId}
                  onReplay={handleReplay}
                />
              ) : (
                <EmptyTimeline>
                  <p>No events found for this session.</p>
                </EmptyTimeline>
              )}
            </TimelineContent>
          </TimelineCard>
        </SessionMain>
      </SessionLayout>

      {/* Replay Panel */}
      <ReplayPanel
        isOpen={!!replayEventId}
        onClose={handleCloseReplay}
        sessionId={sessionId || ''}
        eventId={replayEventId || ''}
        events={data.events}
      />
    </>
  );
};
