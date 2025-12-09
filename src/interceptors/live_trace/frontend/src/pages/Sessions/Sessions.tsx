import { useState, useEffect, useCallback, type FC } from 'react';

import { useParams } from 'react-router-dom';

import { fetchSessions } from '@api/endpoints/session';
import type { SessionListItem } from '@api/types/session';
import { buildWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Card } from '@ui/core/Card';
import { OrbLoader } from '@ui/feedback/OrbLoader';

import { SessionsTable } from '@domain/sessions';

import { usePageMeta } from '../../context';
import { PageContainer, LoadingContainer } from './Sessions.styles';

export const Sessions: FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();

  // Sessions data
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set page metadata
  usePageMeta({
    breadcrumbs: workflowId
      ? buildWorkflowBreadcrumbs(workflowId, { label: 'Sessions' })
      : [{ label: 'Sessions', href: '/sessions' }],
  });

  // Fetch sessions
  const loadSessions = useCallback(async () => {
    if (!workflowId) return;

    try {
      setError(null);
      const data = await fetchSessions({
        workflow_id: workflowId,
        limit: 100,
      });
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

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
      <Card>
        <Card.Header
          title="Sessions"
          subtitle={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
        />
        <Card.Content noPadding>
          <SessionsTable
            sessions={sessions}
            workflowId={workflowId || 'unassigned'}
            showAgentColumn={true}
            emptyMessage="No sessions recorded for this workflow yet. Sessions will appear here once agents start processing requests."
          />
        </Card.Content>
      </Card>
    </PageContainer>
  );
};
