import { useState, useEffect, useCallback, useMemo, type FC } from 'react';

import { Layers } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { BehavioralCluster } from '@api/types/agent';
import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Card } from '@ui/core/Card';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Pagination } from '@ui/navigation/Pagination';
import { ToggleGroup } from '@ui/navigation/ToggleGroup';
import type { ToggleOption } from '@ui/navigation/ToggleGroup';

import { SessionsTable, SystemPromptFilter } from '@domain/sessions';
import type { SystemPromptOption } from '@domain/sessions';

import { usePageMeta } from '../../context';
import {
  LoadingContainer,
  FilterSection,
  ClusterFilterBar,
  ClusterFilterLabel,
  ClusterDivider,
  ClusterToggleWrapper,
} from './Sessions.styles';

const PAGE_SIZE = 10;

export const Sessions: FC = () => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sessions data
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agents for filtering
  const [agents, setAgents] = useState<APIAgent[]>([]);

  // Behavioral clusters for selected agent
  const [clusters, setClusters] = useState<BehavioralCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  // Pagination state (filters are in URL)
  const [currentPage, setCurrentPage] = useState(1);

  // Read filters from URL query params
  const selectedAgent = searchParams.get('agent_id');
  const clusterId = searchParams.get('cluster_id');

  // Update URL params helper
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);


  // Set page metadata
  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Sessions' })
      : [{ label: 'Sessions', href: '/sessions' }],
  });

  // Fetch agents for filter options
  const loadAgents = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const data = await fetchDashboard(agentWorkflowId);
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
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
        agent_id: selectedAgent || undefined,
        cluster_id: clusterId || undefined,
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
  }, [agentWorkflowId, selectedAgent, clusterId, currentPage]);

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

  // Fetch behavioral clusters when agent is selected
  const loadClusters = useCallback(async () => {
    if (!selectedAgent) {
      setClusters([]);
      return;
    }

    try {
      setClustersLoading(true);
      const data = await fetchAgent(selectedAgent);
      const behavioralClusters = data.risk_analysis?.behavioral_analysis?.clusters || [];
      setClusters(behavioralClusters);
    } catch (err) {
      console.error('Failed to fetch behavioral clusters:', err);
      setClusters([]);
    } finally {
      setClustersLoading(false);
    }
  }, [selectedAgent]);

  // Load clusters when agent changes
  useEffect(() => {
    loadClusters();
  }, [loadClusters]);

  // Handle agent selection - update URL params
  const handleAgentSelect = (id: string | null) => {
    // Clear cluster when changing agent since clusters are agent-specific
    updateSearchParams({ agent_id: id, cluster_id: null });
    setCurrentPage(1);
  };

  // Handle cluster selection - update URL params
  const handleClusterSelect = (clusterId: string | null) => {
    updateSearchParams({ cluster_id: clusterId });
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

  // Build cluster toggle options
  const clusterOptions: ToggleOption[] = useMemo(() => {
    if (clusters.length === 0) return [];

    const options: ToggleOption[] = [
      {
        id: 'ALL',
        label: 'All clusters',
        active: clusterId === null,
      },
    ];

    clusters.forEach((cluster) => {
      options.push({
        id: cluster.cluster_id,
        label: `${cluster.cluster_id.replace('_', ' ')} (${cluster.size})`,
        active: clusterId === cluster.cluster_id,
      });
    });

    return options;
  }, [clusters, clusterId]);

  // Handle cluster toggle change
  const handleClusterToggle = (optionId: string) => {
    if (optionId === 'ALL') {
      handleClusterSelect(null);
    } else {
      handleClusterSelect(optionId);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Build description text
  const descriptionText = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${totalCount} session${totalCount !== 1 ? 's' : ''}`);

    if (clusterId) {
      parts.push(`in ${clusterId.replace('_', ' ')}`);
    }

    if (selectedAgent) {
      const selected = agents.find((a) => a.id === selectedAgent);
      const name = selected?.id_short || selectedAgent.substring(0, 12);
      parts.push(`from agent ${name}`);
    } else if (!clusterId) {
      parts.push('from all agents in this agent workflow');
    }

    return parts.join(' ');
  }, [totalCount, selectedAgent, agents, clusterId]);

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

      <FilterSection>
        {/* Agent filter */}
        <SystemPromptFilter
          systemPrompts={agentOptions}
          selectedId={selectedAgent}
          onSelect={handleAgentSelect}
        />

        {/* Cluster filter - only show when agent is selected and has clusters */}
        {selectedAgent && clusterOptions.length > 0 && (
          <ClusterFilterBar>
            <ClusterFilterLabel>
              <Layers />
              Behavior Cluster
            </ClusterFilterLabel>
            <ClusterDivider />
            <ClusterToggleWrapper>
              {clustersLoading ? (
                <OrbLoader size="sm" />
              ) : (
                <ToggleGroup options={clusterOptions} onChange={handleClusterToggle} />
              )}
            </ClusterToggleWrapper>
          </ClusterFilterBar>
        )}
      </FilterSection>

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
