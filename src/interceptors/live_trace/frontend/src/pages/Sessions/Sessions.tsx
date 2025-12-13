import { useState, useEffect, useCallback, useMemo, type FC } from 'react';

import { useParams } from 'react-router-dom';

import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { buildWorkflowBreadcrumbs } from '@utils/breadcrumbs';

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
  const { workflowId } = useParams<{ workflowId: string }>();

  // Sessions data
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agents for filtering
  const [agents, setAgents] = useState<APIAgent[]>([]);

  // Filter and pagination state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Set page metadata
  usePageMeta({
    breadcrumbs: workflowId
      ? buildWorkflowBreadcrumbs(workflowId, { label: 'Sessions' })
      : [{ label: 'Sessions', href: '/sessions' }],
  });

  // Fetch agents for filter options
  const loadAgents = useCallback(async () => {
    if (!workflowId) return;

    try {
      const data = await fetchDashboard(workflowId);
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, [workflowId]);

  // Fetch sessions with current filters and pagination
  const loadSessions = useCallback(async () => {
    if (!workflowId) return;

    try {
      setError(null);
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await fetchSessions({
        workflow_id: workflowId,
        agent_id: selectedAgent || undefined,
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
  }, [workflowId, selectedAgent, currentPage]);

  // Initial load of agents
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

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

  // Build agent options for filter
  const agentOptions: SystemPromptOption[] = useMemo(() => {
    return agents.map((agent) => ({
      id: agent.id,
      id_short: agent.id_short,
      sessionCount: agent.total_sessions,
    }));
  }, [agents]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Build description text
  const descriptionText = useMemo(() => {
    if (selectedAgent) {
      const selected = agents.find((a) => a.id === selectedAgent);
      const name = selected?.id_short || selectedAgent.substring(0, 12);
      return `${totalCount} session${totalCount !== 1 ? 's' : ''} from agent ${name}`;
    }
    return `${totalCount} session${totalCount !== 1 ? 's' : ''} from all agents in this workflow`;
  }, [totalCount, selectedAgent, agents]);

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
        systemPrompts={agentOptions}
        selectedId={selectedAgent}
        onSelect={handleAgentSelect}
      />

      <Card>
        <Card.Content noPadding>
          <SessionsTable
            sessions={sessions}
            workflowId={workflowId || 'unassigned'}
            showAgentColumn={!selectedAgent}
            emptyMessage="No sessions recorded for this workflow yet. Sessions will appear here once agents start processing requests."
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
