import { useState, useCallback, type FC } from 'react';
import { useParams, Link } from 'react-router-dom';

import { fetchSession } from '@api/endpoints/session';
import type { SessionResponse, TimelineEvent } from '@api/types/session';
import { usePolling } from '@hooks/usePolling';
import { buildAgentBreadcrumbs, agentLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Timeline } from '@ui/data-display/Timeline';
import { Section } from '@ui/layout/Section';

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
  const { sessionId, agentId } = useParams<{ sessionId: string; agentId: string }>();
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

  // Set breadcrumbs with agent context
  usePageMeta({
    breadcrumbs: buildAgentBreadcrumbs(
      agentId,
      ...(data?.session.agent_id
        ? [{ label: `System prompt ${data.session.agent_id.substring(0, 12)}...`, href: agentLink(agentId, `/system-prompt/${data.session.agent_id}`) }]
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
                label: 'SYSTEM PROMPT ID',
                badge: (
                  <Link
                    to={agentLink(agentId, `/system-prompt/${session.agent_id}`)}
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
          <Section>
            <Section.Header>
              <Section.Title>Event Timeline ({timeline.length} events)</Section.Title>
            </Section.Header>
            <TimelineContent>
              {timeline.length > 0 ? (
                <Timeline
                  events={timeline as TimelineEvent[]}
                  sessionId={sessionId}
                  systemPrompt={session.system_prompt}
                  onReplay={handleReplay}
                />
              ) : (
                <EmptyTimeline>
                  <p>No events found for this session.</p>
                </EmptyTimeline>
              )}
            </TimelineContent>
          </Section>
        </SessionMain>
      </SessionLayout>

      {/* Replay Panel */}
      <ReplayPanel
        isOpen={!!replayEventId}
        onClose={handleCloseReplay}
        sessionId={sessionId || ''}
        eventId={replayEventId || ''}
        events={data.timeline}
      />
    </>
  );
};
