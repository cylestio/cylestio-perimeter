import { useState, useEffect, useCallback, useMemo, type FC } from 'react';

import { useParams } from 'react-router-dom';

import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { buildAgentBreadcrumbs } from '@utils/breadcrumbs';

import { Card } from '@ui/core/Card';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { PageHeader } from '@ui/layout/PageHeader';
import { Pagination } from '@ui/navigation/Pagination';

import { SessionsTable, SystemPromptFilter } from '@domain/sessions';
import type { SystemPromptOption } from '@domain/sessions';

import { usePageMeta } from '../../context';
import { PageContainer, LoadingContainer } from './Sessions.styles';

const PAGE_SIZE = 10;

export const Sessions: FC = () => {
  const { agentId } = useParams<{ agentId: string }>();

  // Sessions data
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // System prompts for filtering
  const [systemPrompts, setSystemPrompts] = useState<APIAgent[]>([]);

  // Filter and pagination state
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Set page metadata
  usePageMeta({
    breadcrumbs: agentId
      ? buildAgentBreadcrumbs(agentId, { label: 'Sessions' })
      : [{ label: 'Sessions', href: '/sessions' }],
  });

  // Fetch system prompts (agents) for filter options
  const loadSystemPrompts = useCallback(async () => {
    if (!agentId) return;

    try {
      const data = await fetchDashboard(agentId);
      setSystemPrompts(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch system prompts:', err);
    }
  }, [agentId]);

  // Fetch sessions with current filters and pagination
  const loadSessions = useCallback(async () => {
    if (!agentId) return;

    try {
      setError(null);
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await fetchSessions({
        workflow_id: agentId,
        agent_id: selectedSystemPrompt || undefined,
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
  }, [agentId, selectedSystemPrompt, currentPage]);

  // Initial load of system prompts
  useEffect(() => {
    loadSystemPrompts();
  }, [loadSystemPrompts]);

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
  const handleSystemPromptSelect = (id: string | null) => {
    setSelectedSystemPrompt(id);
    setCurrentPage(1);
  };

  // Build system prompt options for filter
  const systemPromptOptions: SystemPromptOption[] = useMemo(() => {
    return systemPrompts.map((agent) => ({
      id: agent.id,
      id_short: agent.id_short,
      sessionCount: agent.total_sessions,
    }));
  }, [systemPrompts]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Build description text
  const descriptionText = useMemo(() => {
    if (selectedSystemPrompt) {
      const selected = systemPrompts.find((sp) => sp.id === selectedSystemPrompt);
      const name = selected?.id_short || selectedSystemPrompt.substring(0, 12);
      return `${totalCount} session${totalCount !== 1 ? 's' : ''} from system prompt ${name}`;
    }
    return `${totalCount} session${totalCount !== 1 ? 's' : ''} from all system prompts in this agent`;
  }, [totalCount, selectedSystemPrompt, systemPrompts]);

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
        description={descriptionText}
      />

      <SystemPromptFilter
        systemPrompts={systemPromptOptions}
        selectedId={selectedSystemPrompt}
        onSelect={handleSystemPromptSelect}
      />

      <Card>
        <Card.Content noPadding>
          <SessionsTable
            sessions={sessions}
            agentId={agentId || 'unassigned'}
            showAgentColumn={!selectedSystemPrompt}
            emptyMessage="No sessions recorded for this agent yet. Sessions will appear here once system prompts start processing requests."
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card.Content>
      </Card>
    </PageContainer>
  );
};
