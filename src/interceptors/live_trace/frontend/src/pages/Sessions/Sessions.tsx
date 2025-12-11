import { useState, useEffect, useCallback, type FC } from 'react';

import { useParams } from 'react-router-dom';

import { fetchSessions } from '@api/endpoints/session';
import type { SessionListItem } from '@api/types/session';
import { buildAgentBreadcrumbs } from '@utils/breadcrumbs';

import { Card } from '@ui/core/Card';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { PageHeader } from '@ui/layout/PageHeader';

import { SessionsTable } from '@domain/sessions';

import { usePageMeta } from '../../context';
import { PageContainer, LoadingContainer } from './Sessions.styles';

export const Sessions: FC = () => {
  const { agentId } = useParams<{ agentId: string }>();

  // Sessions data
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set page metadata
  usePageMeta({
    breadcrumbs: agentId
      ? buildAgentBreadcrumbs(agentId, { label: 'Sessions' })
      : [{ label: 'Sessions', href: '/sessions' }],
  });

  // Fetch sessions
  const loadSessions = useCallback(async () => {
    if (!agentId) return;

    try {
      setError(null);
      const data = await fetchSessions({
        workflow_id: agentId,
        limit: 100,
      });
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Refresh periodically
  useEffect(() => {
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  if (loading) {
    return (
      <LoadingContainer>
        <OrbLoader size="lg" />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Card>
          <Card.Content>
            <div style={{ color: 'var(--color-red)', textAlign: 'center', padding: 24 }}>
              {error}
            </div>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sessions"
        description={`${sessions.length} session${sessions.length !== 1 ? 's' : ''} from all system prompts in this agent`}
      />
      <Card>
        <Card.Content noPadding>
          <SessionsTable
            sessions={sessions}
            agentId={agentId || 'unassigned'}
            showAgentColumn={true}
            emptyMessage="No sessions recorded for this agent yet. Sessions will appear here once system prompts start processing requests."
          />
        </Card.Content>
      </Card>
    </PageContainer>
  );
};
