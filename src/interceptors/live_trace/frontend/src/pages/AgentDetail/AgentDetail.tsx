import { useCallback, useState, useEffect, useMemo, type FC } from 'react';

import { AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import { fetchSessions } from '@api/endpoints/session';
import type { AgentResponse } from '@api/types/agent';
import type { SessionListItem } from '@api/types/session';
import type { DynamicSecurityCheck, DynamicCategoryId, DynamicCategoryDefinition } from '@api/types/security';
import type { ClusterNodeData } from '@domain/visualization';
import { usePolling } from '@hooks/usePolling';
import { buildAgentWorkflowBreadcrumbs, agentWorkflowLink } from '../../utils/breadcrumbs';
import {
  getAgentStatus,
  BEHAVIORAL_TOOLTIPS,
} from '../../utils/formatting';

import { Badge, TimeAgo } from '@ui/core';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { ProgressBar } from '@ui/feedback/ProgressBar';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Tooltip } from '@ui/overlays/Tooltip';
import { Page } from '@ui/layout/Page';
import { Section } from '@ui/layout/Section';
import { Pagination } from '@ui/navigation/Pagination';

import { ClusterVisualization } from '@domain/visualization';
import { SessionsTable } from '@domain/sessions';
import { DynamicChecksGrid } from '@domain/security';
import {
  TokenUsageInsights,
  ModelUsageAnalytics,
  ToolUsageAnalytics,
} from '@domain/analytics';

import { GatheringData } from '@features/GatheringData';

import { buildVisualizationNodes } from '../utils/behavioral';
import { usePageMeta } from '../../context';
import {
  ButtonLink,
  ContentGrid,
  Column,
  ColumnHeader,
  AgentHeader,
  AgentHeaderLeft,
  AgentTitle,
  AgentMeta,
  CriticalAlertBanner,
  AlertText,
  SecurityStatusRow,
  SecurityCounts,
  PIINote,
  BehavioralMetrics,
  BehavioralGrid,
  ScoresRow,
  ScoreItem,
  ChartColumn,
  ChartLabel,
  MetricRowHeader,
  MetricRowLabel,
  MetricRowValue,
  ConfidenceRow,
  WaitingMessage,
  PlaceholderMessage,
  ActiveSessionsNote,
} from './AgentDetail.styles';

// Category definitions for DynamicChecksGrid
const CATEGORY_DEFINITIONS: Record<DynamicCategoryId, DynamicCategoryDefinition> = {
  RESOURCE_MANAGEMENT: {
    name: 'Resource Management',
    description: 'Token and tool usage boundaries',
    icon: 'bar-chart',
    order: 1,
  },
  ENVIRONMENT: {
    name: 'Environment & Supply Chain',
    description: 'Model version pinning and tool adoption',
    icon: 'settings',
    order: 2,
  },
  BEHAVIORAL: {
    name: 'Behavioral Stability',
    description: 'Behavioral consistency and predictability',
    icon: 'brain',
    order: 3,
  },
  PRIVACY_COMPLIANCE: {
    name: 'Privacy & PII Compliance',
    description: 'PII exposure detection and reporting',
    icon: 'lock',
    order: 4,
  },
};

const PAGE_SIZE = 10;

export const AgentDetail: FC = () => {
  const { agentWorkflowId, agentId } = useParams<{ agentWorkflowId: string; agentId: string }>();
  const navigate = useNavigate();

  const fetchFn = useCallback(() => {
    if (!agentId) return Promise.reject(new Error('No agent ID'));
    return fetchAgent(agentId);
  }, [agentId]);

  // Handle cluster visualization node clicks
  // - Clusters: Navigate to Sessions page with both agent_id and cluster_id filters
  // - Outliers: Navigate directly to the session detail page
  const handleClusterNodeClick = useCallback((node: ClusterNodeData) => {
    if (!agentWorkflowId || !agentId) return;

    if (node.clusterId) {
      // Navigate to sessions filtered by both agent and cluster
      navigate(`/agent-workflow/${agentWorkflowId}/sessions?agent_id=${agentId}&cluster_id=${node.clusterId}`);
    } else if (node.sessionId) {
      // Navigate directly to the session
      navigate(`/agent-workflow/${agentWorkflowId}/session/${node.sessionId}`);
    }
  }, [agentWorkflowId, agentId, navigate]);

  const { data, error, loading } = usePolling<AgentResponse>(fetchFn, {
    interval: 2000,
    enabled: !!agentId,
  });

  // Sessions pagination state
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Fetch paginated sessions
  const loadSessions = useCallback(async () => {
    if (!agentId) return;
    setSessionsLoading(true);
    try {
      const offset = (sessionsPage - 1) * PAGE_SIZE;
      const result = await fetchSessions({
        agent_id: agentId,
        limit: PAGE_SIZE,
        offset,
      });
      setSessions(result.sessions);
      setSessionsTotal(result.total_count);
    } finally {
      setSessionsLoading(false);
    }
  }, [agentId, sessionsPage]);

  // Load sessions when component mounts or pagination changes
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Refresh sessions when main data refreshes
  useEffect(() => {
    if (data) {
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.agent?.total_sessions]);

  const totalPages = Math.ceil(sessionsTotal / PAGE_SIZE);

  // Derive status and links from data (safe to call before early returns)
  const agent = data?.agent;
  const riskAnalysis = data?.risk_analysis;
  const status = getAgentStatus(riskAnalysis ?? {});
  const reportLink = agentWorkflowLink(agentWorkflowId, `/agent/${agent?.id}/report`);

  // Convert security checks to DynamicSecurityCheck format for the grid
  // NOTE: This useMemo MUST be called before any early returns to maintain hook order
  const securityChecks: DynamicSecurityCheck[] = useMemo(() => {
    if (!status.hasRiskData || !riskAnalysis?.security_report?.categories || !agent) {
      return [];
    }

    const checks: DynamicSecurityCheck[] = [];
    Object.entries(riskAnalysis.security_report.categories).forEach(([categoryId, category]) => {
      category.checks?.forEach((check) => {
        checks.push({
          check_id: `${categoryId}_${check.name}`,
          agent_id: agent.id,
          category_id: categoryId as DynamicCategoryId,
          check_type: check.name.toLowerCase().replace(/\s+/g, '_'),
          status: check.status as DynamicSecurityCheck['status'],
          title: check.name,
          value: check.value !== undefined ? String(check.value) : undefined,
          description: check.description,
        });
      });
    });
    return checks;
  }, [status.hasRiskData, riskAnalysis?.security_report?.categories, agent]);

  // Set breadcrumbs with agent workflow context
  usePageMeta({
    breadcrumbs: buildAgentWorkflowBreadcrumbs(
      agentWorkflowId,
      { label: 'Agent' },
      { label: agentId?.substring(0, 12) + '...' || '' }
    ),
  });

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  if (error || !data || !agent) {
    return <EmptyState title="Failed to load agent" description={error || 'Agent not found'} />;
  }

  // Count issues
  const issueCount = securityChecks.filter(
    (c) => c.status === 'critical' || c.status === 'warning'
  ).length;

  // Check if both sections need gathering data
  const needsBehavioralGathering = !riskAnalysis?.behavioral_analysis;
  const needsSecurityGathering = !status.hasRiskData;
  const showFullWidthGathering = needsBehavioralGathering && needsSecurityGathering;

  return (
    <Page>
      {/* Agent Header */}
      <AgentHeader>
        <AgentHeaderLeft>
          <AgentTitle>{agent.id}</AgentTitle>
          <AgentMeta>
            <span>First seen: <TimeAgo timestamp={agent.first_seen} /></span>
            <span>Last seen: <TimeAgo timestamp={agent.last_seen} /></span>
          </AgentMeta>
        </AgentHeaderLeft>
        <ButtonLink $variant="secondary" to={reportLink}>
          Full Report
        </ButtonLink>
      </AgentHeader>

      {/* Critical Alert Banner */}
      {status.hasCriticalIssues && (
        <CriticalAlertBanner>
          <AlertTriangle size={18} />
          <AlertText>
            <strong>{status.criticalCount} critical</strong> issue
            {status.criticalCount !== 1 ? 's' : ''} require attention
          </AlertText>
          <ButtonLink $variant="ghost" to={reportLink}>
            View Issues
          </ButtonLink>
        </CriticalAlertBanner>
      )}

      {/* Full-width Gathering Data - shown when both sections need it */}
      {showFullWidthGathering && (
        <Section>
          <Section.Header>
            <Section.Title>Gathering Session Data</Section.Title>
          </Section.Header>
          <Section.Content noPadding>
            <GatheringData
              currentSessions={agent.total_sessions}
              minSessionsRequired={status.minSessionsRequired || 5}
            />
          </Section.Content>
        </Section>
      )}

      {/* Two-column Layout - only show when not showing full-width gathering */}
      {!showFullWidthGathering && (
        <ContentGrid>
          {/* Left Column: Operational */}
          <Column>
            <ColumnHeader>Operational</ColumnHeader>

            {/* Behavioral Analysis Section - Empty State */}
            {!riskAnalysis?.behavioral_analysis && (
              <Section>
                <Section.Header>
                  <Section.Title>Behavioral Analysis</Section.Title>
                </Section.Header>
                <Section.Content noPadding>
                  <GatheringData
                    currentSessions={agent.total_sessions}
                    minSessionsRequired={status.minSessionsRequired || 5}
                    title="Building Behavioral Profile"
                    description="Behavioral analysis requires session data to identify patterns. More sessions lead to more accurate insights about agent behavior, clustering, and anomaly detection."
                  />
                </Section.Content>
              </Section>
            )}

            {/* Behavioral Analysis Section */}
            {riskAnalysis?.behavioral_analysis && (
              <Section>
                <Section.Header>
                  <Section.Title>Behavioral Analysis</Section.Title>
                </Section.Header>
                <Section.Content>
                  {status.behavioralStatus === 'WAITING_FOR_COMPLETION' ? (
                    <WaitingMessage>
                      <OrbLoader size="sm" />
                      <span>
                        Waiting for {status.activeSessions} active session
                        {status.activeSessions !== 1 ? 's' : ''} to complete ({status.completedSessions}{' '}
                        of {status.totalSessions} completed)
                      </span>
                    </WaitingMessage>
                  ) : (riskAnalysis.behavioral_analysis.num_clusters ?? 0) >= 1 ? (
                    <BehavioralMetrics>
                      {/* Active sessions note */}
                      {(status.activeSessions || 0) > 0 && (
                        <ActiveSessionsNote>
                          <OrbLoader size="sm" />
                          <span>
                            Based on <strong>{status.completedSessions} analyzed sessions</strong> —{' '}
                            <span style={{ color: 'var(--color-purple)' }}>
                              {status.activeSessions} still running
                            </span>
                          </span>
                        </ActiveSessionsNote>
                      )}

                      {/* Chart on top, scores below */}
                      <BehavioralGrid>
                        {/* Cluster Visualization */}
                        {(riskAnalysis.behavioral_analysis.clusters?.length ?? 0) > 0 && (
                          <ChartColumn>
                            <ChartLabel>Cluster Map</ChartLabel>
                            {(() => {
                              const { nodes, links } = buildVisualizationNodes(
                                riskAnalysis.behavioral_analysis.clusters,
                                riskAnalysis.behavioral_analysis.outliers,
                                riskAnalysis.behavioral_analysis.centroid_distances
                              );
                              return (
                                <ClusterVisualization
                                  nodes={nodes}
                                  links={links}
                                  height={160}
                                  showLegend={true}
                                  onNodeClick={handleClusterNodeClick}
                                />
                              );
                            })()}
                          </ChartColumn>
                        )}

                        {/* Scores row: Stability, Predictability, Confidence */}
                        <ScoresRow>
                          {/* Stability */}
                          <ScoreItem>
                            <MetricRowHeader>
                              <Tooltip content={BEHAVIORAL_TOOLTIPS.stability}>
                                <MetricRowLabel>
                                  <span>Stability</span>
                                  <span>i</span>
                                </MetricRowLabel>
                              </Tooltip>
                              <MetricRowValue>
                                {Math.round((riskAnalysis.behavioral_analysis.stability_score ?? 0) * 100)}%
                              </MetricRowValue>
                            </MetricRowHeader>
                            <ProgressBar
                              value={(riskAnalysis.behavioral_analysis.stability_score ?? 0) * 100}
                              variant={
                                (riskAnalysis.behavioral_analysis.stability_score ?? 0) >= 0.8
                                  ? 'success'
                                  : (riskAnalysis.behavioral_analysis.stability_score ?? 0) >= 0.5
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            />
                          </ScoreItem>

                          {/* Predictability */}
                          <ScoreItem>
                            <MetricRowHeader>
                              <Tooltip content={BEHAVIORAL_TOOLTIPS.predictability}>
                                <MetricRowLabel>
                                  <span>Predictability</span>
                                  <span>i</span>
                                </MetricRowLabel>
                              </Tooltip>
                              <MetricRowValue>
                                {Math.round(
                                  (riskAnalysis.behavioral_analysis.predictability_score ?? 0) * 100
                                )}
                                %
                              </MetricRowValue>
                            </MetricRowHeader>
                            <ProgressBar
                              value={(riskAnalysis.behavioral_analysis.predictability_score ?? 0) * 100}
                              variant={
                                (riskAnalysis.behavioral_analysis.predictability_score ?? 0) >= 0.8
                                  ? 'success'
                                  : (riskAnalysis.behavioral_analysis.predictability_score ?? 0) >= 0.5
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            />
                          </ScoreItem>

                          {/* Confidence */}
                          <ScoreItem>
                            <ConfidenceRow>
                              <Tooltip content={BEHAVIORAL_TOOLTIPS.confidence}>
                                <MetricRowLabel>
                                  <span>Confidence</span>
                                  <span>i</span>
                                </MetricRowLabel>
                              </Tooltip>
                              <Badge
                                variant={
                                  riskAnalysis.behavioral_analysis.confidence === 'high'
                                    ? 'success'
                                    : riskAnalysis.behavioral_analysis.confidence === 'medium'
                                      ? 'info'
                                      : 'medium'
                                }
                              >
                                {riskAnalysis.behavioral_analysis.confidence === 'high'
                                  ? 'High'
                                  : riskAnalysis.behavioral_analysis.confidence === 'medium'
                                    ? 'Medium'
                                    : 'Low'}
                              </Badge>
                            </ConfidenceRow>
                          </ScoreItem>
                        </ScoresRow>
                      </BehavioralGrid>
                    </BehavioralMetrics>
                  ) : (
                    <PlaceholderMessage>
                      Behavioral scores require cluster formation. Once the agent has more sessions with
                      similar patterns, detailed stability metrics will be available.
                    </PlaceholderMessage>
                  )}
                </Section.Content>
              </Section>
            )}
          </Column>

          {/* Right Column: Security */}
          <Column>
            <ColumnHeader>Security</ColumnHeader>

            {/* Dynamic Security Assessment Section */}
            <Section>
              <Section.Header>
                <Section.Title>Dynamic Security Assessment</Section.Title>
                {status.hasRiskData && (
                  <ButtonLink $variant="ghost" to={reportLink}>
                    Full Report
                  </ButtonLink>
                )}
              </Section.Header>
              <Section.Content noPadding={!status.hasRiskData}>
                {!status.hasRiskData ? (
                  <GatheringData
                    currentSessions={agent.total_sessions}
                    minSessionsRequired={status.minSessionsRequired || 5}
                  />
                ) : (
                  <>
                    {/* Status summary row */}
                    <SecurityStatusRow>
                      <Badge variant={status.hasCriticalIssues ? 'critical' : 'success'}>
                        {status.hasCriticalIssues ? 'ATTENTION REQUIRED' : 'ALL SYSTEMS OK'}
                      </Badge>
                      <SecurityCounts>
                        {status.criticalCount > 0 && (
                          <span style={{ color: 'var(--color-red)' }}>
                            {status.criticalCount} critical
                          </span>
                        )}
                        {status.warningCount > 0 && (
                          <span style={{ color: 'var(--color-orange)' }}>
                            {status.warningCount} warning{status.warningCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span style={{ color: 'var(--color-white-50)' }}>{status.totalChecks} total</span>
                      </SecurityCounts>
                    </SecurityStatusRow>

                    {/* Inline PII note */}
                    {riskAnalysis?.summary?.pii_disabled && (
                      <PIINote>PII detection unavailable for this agent</PIINote>
                    )}

                    {/* Security checks list - showing only issues */}
                    {issueCount > 0 && (
                      <DynamicChecksGrid
                        checks={securityChecks}
                        categoryDefinitions={CATEGORY_DEFINITIONS}
                        groupBy="none"
                        variant="list"
                        clickable={true}
                        showSummary={false}
                        statusFilter={['critical', 'warning']}
                        agentWorkflowId={agentWorkflowId}
                      />
                    )}
                  </>
                )}
              </Section.Content>
            </Section>

            {/* Future: Analysis Log Section */}
          </Column>
        </ContentGrid>
      )}

      {/* Analytics Sections */}
      {data.analytics && (
        <>
          <TokenUsageInsights
            analytics={data.analytics}
            totalSessions={agent.total_sessions}
            avgDurationMinutes={agent.avg_duration_minutes}
          />
          <ModelUsageAnalytics analytics={data.analytics} />
          <ToolUsageAnalytics
            analytics={data.analytics}
            availableTools={agent.available_tools}
          />
        </>
      )}

      {/* Sessions Table - Full Width */}
      <Section>
        <Section.Header>
          <Section.Title>Sessions ({sessionsTotal})</Section.Title>
        </Section.Header>
        <Section.Content noPadding>
          <SessionsTable
            sessions={sessions}
            agentWorkflowId={agentWorkflowId || 'unassigned'}
            loading={sessionsLoading}
            showAgentColumn={false}
            emptyMessage="No sessions found for this agent."
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={sessionsPage}
              totalPages={totalPages}
              onPageChange={setSessionsPage}
            />
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
