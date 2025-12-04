import type { FC } from 'react';
import { useState } from 'react';
import { Avatar } from '@ui/core/Avatar';
import { Badge } from '@ui/core/Badge';
import { Input } from '@ui/form/Input';
import { PageHeader } from '@ui/layout/PageHeader';
import { usePageMeta } from '../../context';
import { ActivityFeed, type ActivityItem } from '@domain/activity/ActivityFeed';
import { mockSessions, type Session } from '@api/mocks/sessions';
import { Search } from 'lucide-react';
import {
  SplitView,
  SessionList,
  SessionListHeader,
  SessionListTitle,
  SessionListItems,
  SessionItem,
  SessionInfo,
  SessionAgent,
  SessionMeta,
  SessionDetail,
  DetailHeader,
  DetailTitle,
  DetailStats,
  DetailStat,
  StatLabel,
  StatValue,
  DetailContent,
  EventsTitle,
  EmptyDetail,
} from './Sessions.styles';

const formatDuration = (ms: number): string => {
  if (ms === 0) return 'In progress';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sessionEventsToActivity = (session: Session): ActivityItem[] => {
  return session.events.map((event) => ({
    id: event.id,
    type: event.type === 'finding' ? 'found' :
          event.type === 'error' ? 'found' :
          event.type === 'warning' ? 'scan' : 'session',
    title: event.name,
    detail: event.details,
    timestamp: formatTime(event.timestamp),
  }));
};

export const Sessions: FC = () => {
  usePageMeta({
    breadcrumbs: [{ label: 'Sessions' }],
  });

  const [selectedSession, setSelectedSession] = useState<Session | null>(mockSessions[0]);
  const [search, setSearch] = useState('');

  const filteredSessions = search
    ? mockSessions.filter((s) =>
        s.agent.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      )
    : mockSessions;

  return (
    <>
      <PageHeader
        title="Sessions"
        description="View and analyze agent session activity"
      />

      <SplitView>
        <SessionList>
          <SessionListHeader>
            <SessionListTitle>Agent Sessions</SessionListTitle>
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </SessionListHeader>
          <SessionListItems>
            {filteredSessions.map((session) => (
              <SessionItem
                key={session.id}
                $active={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
              >
                <Avatar
                  initials={session.agentInitials}
                  size="sm"
                  status={session.status === 'active' ? 'online' :
                         session.status === 'failed' ? 'error' : 'offline'}
                />
                <SessionInfo>
                  <SessionAgent>{session.agent}</SessionAgent>
                  <SessionMeta>
                    {formatTime(session.startTime)} · {session.requestCount} requests
                  </SessionMeta>
                </SessionInfo>
                <Badge
                  variant={session.status === 'active' ? 'success' :
                          session.status === 'failed' ? 'critical' : 'info'}
                  size="sm"
                >
                  {session.status}
                </Badge>
              </SessionItem>
            ))}
          </SessionListItems>
        </SessionList>

        <SessionDetail>
          {selectedSession ? (
            <>
              <DetailHeader>
                <DetailTitle>{selectedSession.agent} Session</DetailTitle>
                <Badge
                  variant={selectedSession.status === 'active' ? 'success' :
                          selectedSession.status === 'failed' ? 'critical' : 'info'}
                >
                  {selectedSession.status}
                </Badge>
                <DetailStats>
                  <DetailStat>
                    <StatLabel>Duration</StatLabel>
                    <StatValue>{formatDuration(selectedSession.duration)}</StatValue>
                  </DetailStat>
                  <DetailStat>
                    <StatLabel>Requests</StatLabel>
                    <StatValue>{selectedSession.requestCount}</StatValue>
                  </DetailStat>
                  <DetailStat>
                    <StatLabel>Findings</StatLabel>
                    <StatValue>{selectedSession.findingsCount}</StatValue>
                  </DetailStat>
                </DetailStats>
              </DetailHeader>
              <DetailContent>
                <EventsTitle>Session Events</EventsTitle>
                <ActivityFeed items={sessionEventsToActivity(selectedSession)} />
              </DetailContent>
            </>
          ) : (
            <EmptyDetail>Select a session to view details</EmptyDetail>
          )}
        </SessionDetail>
      </SplitView>
    </>
  );
};
