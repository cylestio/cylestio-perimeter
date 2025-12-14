import { useState, useEffect, useCallback, useMemo, type FC } from 'react';

import { useParams } from 'react-router-dom';

import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { APIAgentStep } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Card } from '@ui/core/Card';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Pagination } from '@ui/navigation/Pagination';

import { SessionsTable, SystemPromptFilter } from '@domain/sessions';
import type { SystemPromptOption } from '@domain/sessions';

import { usePageMeta } from '../../context';
import { LoadingContainer } from './Sessions.styles';

const PAGE_SIZE = 10;

export const Sessions: FC = () => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  // Sessions data
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agent steps for filtering
  const [agentSteps, setAgentSteps] = useState<APIAgentStep[]>([]);

  // Filter and pagination state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Set page metadata
  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Sessions' })
      : [{ label: 'Sessions', href: '/sessions' }],
  });

  // Fetch agent steps for filter options
  const loadAgentSteps = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const data = await fetchDashboard(agentWorkflowId);
      setAgentSteps(data.agent_steps || []);
    } catch (err) {
      console.error('Failed to fetch agent steps:', err);
    }
  }, [agentWorkflowId]);

  // Fetch sessions with current filters and pagination
  const loadSessions = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      setError(null);
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await fetchSessions({
        agent_workflow_id: agentWorkflowId,
        agent_step_id: selectedAgent || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setSessions(data.sessions);
      setTotalCount(data.total_count);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [agentWorkflowId, selectedAgent, currentPage]);

  // Initial load of agent steps
  useEffect(() => {
    loadAgentSteps();
  }, [loadAgentSteps]);

  // Initial load and reload when filters change
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Refresh periodically
  useEffect(() => {
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  // Reset to page 1 when filter changes
  const handleAgentSelect = (id: string | null) => {
    setSelectedAgent(id);
    setCurrentPage(1);
  };

  // Build agent step options for filter
  const agentStepOptions: SystemPromptOption[] = useMemo(() => {
    return agentSteps.map((agentStep) => ({
      id: agentStep.id,
      id_short: agentStep.id_short,
      sessionCount: agentStep.total_sessions,
    }));
  }, [agentSteps]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Build description text
  const descriptionText = useMemo(() => {
    if (selectedAgent) {
      const selected = agentSteps.find((a) => a.id === selectedAgent);
      const name = selected?.id_short || selectedAgent.substring(0, 12);
      return `${totalCount} session${totalCount !== 1 ? 's' : ''} from agent step ${name}`;
    }
    return `${totalCount} session${totalCount !== 1 ? 's' : ''} from all agent steps in this agent workflow`;
  }, [totalCount, selectedAgent, agentSteps]);

  if (loading) {
    return (
      <LoadingContainer>
        <OrbLoader size="lg" />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Page>
        <Card>
          <Card.Content>
            <div style={{ color: 'var(--color-red)', textAlign: 'center', padding: 24 }}>
              {error}
            </div>
          </Card.Content>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Sessions"
        description={descriptionText}
      />

      <SystemPromptFilter
        systemPrompts={agentStepOptions}
        selectedId={selectedAgent}
        onSelect={handleAgentSelect}
      />

      <Card>
        <Card.Content noPadding>
          <SessionsTable
            sessions={sessions}
            agentWorkflowId={agentWorkflowId || 'unassigned'}
            showAgentColumn={!selectedAgent}
            emptyMessage="No sessions recorded for this agent workflow yet. Sessions will appear here once agents start processing requests."
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card.Content>
      </Card>
    </Page>
  );
};
