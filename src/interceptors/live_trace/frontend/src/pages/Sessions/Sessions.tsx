import { useState, useEffect, useCallback, useMemo, type FC } from 'react';

import { Filter, Hash, Layers, Tag } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions, fetchSessionTags } from '@api/endpoints/session';
import type { BehavioralCluster } from '@api/types/agent';
import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem, SessionTagSuggestion } from '@api/types/session';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Card } from '@ui/core/Card';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Pagination } from '@ui/navigation/Pagination';
import { ToggleGroup } from '@ui/navigation/ToggleGroup';
import type { ToggleOption } from '@ui/navigation/ToggleGroup';

import { SessionsTable, TagFilter, SessionFilter } from '@domain/sessions';
import type { TagSuggestion } from '@domain/sessions';

import { usePageMeta } from '../../context';
import {
  LoadingContainer,
  FilterSection,
  FilterCard,
  FilterRow,
  FilterLabel,
  FilterContent,
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

  // Available tags (fetched from backend, not derived from paginated sessions)
  const [availableTags, setAvailableTags] = useState<SessionTagSuggestion[]>([]);

  // Pagination state (filters are in URL)
  const [currentPage, setCurrentPage] = useState(1);

  // Read filters from URL query params
  const selectedAgent = searchParams.get('agent_id');
  const clusterId = searchParams.get('cluster_id');
  // Tags are stored as comma-separated string in URL
  const tagsParam = searchParams.get('tags');
  const tagFilters = useMemo(() => {
    if (!tagsParam) return [];
    return tagsParam.split(',').map(t => t.trim()).filter(Boolean);
  }, [tagsParam]);
  // Session filter (single select from 'session' tag)
  const sessionFilter = searchParams.get('session');

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

  // Fetch available tags from all sessions (not just current page)
  const loadTags = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const data = await fetchSessionTags({ agent_workflow_id: agentWorkflowId });
      setAvailableTags(data.tags);
    } catch (err) {
      console.error('Failed to fetch session tags:', err);
    }
  }, [agentWorkflowId]);

  // Fetch sessions with current filters and pagination
  const loadSessions = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      setError(null);
      const offset = (currentPage - 1) * PAGE_SIZE;
      // Combine tag filters with session filter (if set)
      const allTags = [...tagFilters];
      if (sessionFilter) {
        allTags.push(`session:${sessionFilter}`);
      }
      const data = await fetchSessions({
        agent_workflow_id: agentWorkflowId,
        agent_id: selectedAgent || undefined,
        cluster_id: clusterId || undefined,
        tags: allTags.length > 0 ? allTags : undefined,
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
  }, [agentWorkflowId, selectedAgent, clusterId, tagFilters, sessionFilter, currentPage]);

  // Initial load of agents and tags
  useEffect(() => {
    loadAgents();
    loadTags();
  }, [loadAgents, loadTags]);

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
  const agentOptions = useMemo(() => {
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

  // Handle tag filter change
  const handleTagFilterChange = (filters: string[]) => {
    // Store all tags as comma-separated string in URL
    const tags = filters.length > 0 ? filters.join(',') : null;
    updateSearchParams({ tags });
    setCurrentPage(1);
  };

  // Extract session options from available tags (fetched from backend)
  const sessionOptions = useMemo(() => {
    const sessionSuggestion = availableTags.find((t) => t.key === 'session');
    return sessionSuggestion?.values || [];
  }, [availableTags]);

  // Filter out 'session' from tag suggestions for the TagFilter component
  // Convert SessionTagSuggestion to TagSuggestion format (extract just the value strings)
  const filteredTagSuggestions: TagSuggestion[] = useMemo(() => {
    return availableTags
      .filter((t) => t.key !== 'session')
      .map((t) => ({ key: t.key, values: t.values.map((v) => v.value) }));
  }, [availableTags]);

  // Handle session filter change
  const handleSessionSelect = (sessionValue: string | null) => {
    updateSearchParams({ session: sessionValue });
    setCurrentPage(1);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Build description text
  const descriptionText = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${totalCount} session${totalCount !== 1 ? 's' : ''}`);

    if (sessionFilter) {
      parts.push(`in "${sessionFilter}"`);
    }

    if (clusterId) {
      parts.push(`in ${clusterId.replace('_', ' ')}`);
    }

    if (tagFilters.length > 0) {
      if (tagFilters.length === 1) {
        parts.push(`with tag "${tagFilters[0]}"`);
      } else {
        parts.push(`with ${tagFilters.length} tags`);
      }
    }

    if (selectedAgent) {
      const selected = agents.find((a) => a.id === selectedAgent);
      const name = selected?.id_short || selectedAgent.substring(0, 12);
      parts.push(`from agent ${name}`);
    } else if (!clusterId && tagFilters.length === 0 && !sessionFilter) {
      parts.push('from all agents in this agent workflow');
    }

    return parts.join(' ');
  }, [totalCount, selectedAgent, agents, clusterId, tagFilters, sessionFilter]);

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
        {/* Main filter card with session, prompt, and tag filters */}
        <FilterCard>
          {/* Session filter row - only show if session options exist */}
          {sessionOptions.length > 0 && (
            <FilterRow>
              <FilterLabel>
                <Hash />
                Session
              </FilterLabel>
              <FilterContent>
                <SessionFilter
                  value={sessionFilter}
                  onChange={handleSessionSelect}
                  options={sessionOptions}
                />
              </FilterContent>
            </FilterRow>
          )}

          {/* Prompt filter row - only show if multiple agents */}
          {agentOptions.length > 1 && (
            <FilterRow>
              <FilterLabel>
                <Filter />
                Prompt
              </FilterLabel>
              <FilterContent>
                <ToggleGroup
                  options={[
                    { id: 'ALL', label: `All (${agentOptions.reduce((sum, a) => sum + a.sessionCount, 0)})`, active: selectedAgent === null },
                    ...agentOptions.map(a => ({ id: a.id, label: `${a.id_short} (${a.sessionCount})`, active: selectedAgent === a.id })),
                  ]}
                  onChange={(id) => handleAgentSelect(id === 'ALL' ? null : id)}
                />
              </FilterContent>
            </FilterRow>
          )}

          {/* Tag filter row */}
          <FilterRow>
            <FilterLabel>
              <Tag />
              Tags
            </FilterLabel>
            <FilterContent>
              <TagFilter
                value={tagFilters}
                onChange={handleTagFilterChange}
                suggestions={filteredTagSuggestions}
                placeholder="Filter by tag..."
              />
            </FilterContent>
          </FilterRow>
        </FilterCard>

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
