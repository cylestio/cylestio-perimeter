import { useCallback, useState, useEffect, type FC } from 'react';

import { AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import { fetchSessions } from '@api/endpoints/session';
import type { AgentResponse } from '@api/types/agent';
import type { SessionListItem } from '@api/types/session';
import type { ClusterNodeData } from '@domain/visualization';
import { usePolling } from '@hooks/usePolling';
import { buildAgentWorkflowBreadcrumbs, agentWorkflowLink } from '../../utils/breadcrumbs';
import {
  formatCompactNumber,
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
  StatsBar,
  StatGroup,
  StatGroupLabel,
  StatGroupItems,
  StatItem,
  StatValue,
  StatLabel,
  StatDivider,
  SecurityStatusRow,
  SecurityCounts,
  PIINote,
  CheckList,
  CheckItem,
  CheckStatus,
  CheckName,
  CheckValue,
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
  ToolUtilizationContainer,
  ToolUtilizationMetric,
  CircularProgress,
  CircularProgressSvg,
  CircularProgressTrack,
  CircularProgressFill,
  CircularProgressContent,
  CircularProgressValue,
  ToolUtilizationLabel,
  ToolUtilizationPrimary,
  ToolUtilizationSecondary,
  ToolUtilizationDivider,
  ToolsList,
  ToolTag,
  ToolName,
  ToolCount,
  ToolUnused,
  ModelValue,
  ModelCount,
  ModelTooltipList,
  ModelTooltipItem,
  ModelTooltipName,
  ModelTooltipCount,
} from './AgentDetail.styles';

interface Check {
  name: string;
  status: string;
  value?: string | number;
  categoryName?: string;
}

// Tooltip descriptions for stats
const STAT_TOOLTIPS = {
  sessions: 'Total number of conversation sessions with this agent',
  messages: 'Total messages exchanged across all sessions',
  tokens: 'Total tokens consumed (input + output) across all sessions',
  tools: 'Total number of tool calls made by the agent',
  avgDuration: 'Average session duration in minutes',
  avgTokens: 'Average tokens consumed per session',
  avgCost: 'Average cost per session based on model pricing',
  model: 'LLM model(s) used by this agent',
};

// Helper to format model name for display (shorten long names)
const formatModelName = (model: string): string => {
  // Common model name shortenings
  const shortenings: Record<string, string> = {
    'claude-3-5-sonnet-20241022': 'claude-3.5-sonnet',
    'claude-3-opus-20240229': 'claude-3-opus',
    'claude-3-sonnet-20240229': 'claude-3-sonnet',
    'claude-3-haiku-20240307': 'claude-3-haiku',
    'gpt-4-turbo-preview': 'gpt-4-turbo',
    'gpt-4-0125-preview': 'gpt-4-turbo',
    'gpt-3.5-turbo-0125': 'gpt-3.5-turbo',
  };
  return shortenings[model] || model;
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

  if (error || !data) {
    return <EmptyState title="Failed to load agent" description={error || 'Agent not found'} />;
  }

  const agent = data.agent;
  const riskAnalysis = data.risk_analysis;
  const status = getAgentStatus(riskAnalysis);
  const reportLink = agentWorkflowLink(agentWorkflowId, `/agent/${agent.id}/report`);

  // Build failed and warning check lists
  const failedChecks: Check[] = [];
  const warningChecks: Check[] = [];

  if (status.hasRiskData && riskAnalysis?.security_report?.categories) {
    Object.values(riskAnalysis.security_report.categories).forEach((category) => {
      category.checks?.forEach((check) => {
        if (check.status === 'critical') {
          failedChecks.push({ ...check, categoryName: category.category_name });
        } else if (check.status === 'warning') {
          warningChecks.push({ ...check, categoryName: category.category_name });
        }
      });
    });
  }

  const allIssues = [...failedChecks, ...warningChecks];

  // Check if both sections need gathering data
  const needsBehavioralGathering = !riskAnalysis?.behavioral_analysis;
  const needsSecurityGathering = !status.hasRiskData;
  const showFullWidthGathering = needsBehavioralGathering && needsSecurityGathering;

  // Calculate average metrics
  const avgDuration = agent.avg_duration_minutes || 0;
  const avgTokens = agent.total_sessions > 0
    ? (data.analytics?.token_summary?.total_tokens ?? 0) / agent.total_sessions
    : 0;
  const avgCost = agent.total_sessions > 0
    ? (data.analytics?.token_summary?.total_cost ?? 0) / agent.total_sessions
    : 0;

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

      {/* Stats Bar - grouped with tooltips */}
      <StatsBar>
        {/* Model Group */}
        {data.analytics?.models && data.analytics.models.length > 0 && (
          <StatGroup>
            <StatGroupLabel>Model</StatGroupLabel>
            <StatGroupItems>
              {data.analytics.models.length === 1 ? (
                <Tooltip content={STAT_TOOLTIPS.model}>
                  <StatItem>
                    <ModelValue title={data.analytics.models[0].model}>
                      {formatModelName(data.analytics.models[0].model)}
                    </ModelValue>
                    <StatLabel>{data.analytics.models[0].requests} requests</StatLabel>
                  </StatItem>
                </Tooltip>
              ) : (
                <Tooltip
                  content={
                    <ModelTooltipList>
                      {data.analytics.models
                        .sort((a, b) => b.requests - a.requests)
                        .map((m) => (
                          <ModelTooltipItem key={m.model}>
                            <ModelTooltipName>{formatModelName(m.model)}</ModelTooltipName>
                            <ModelTooltipCount>{m.requests} req</ModelTooltipCount>
                          </ModelTooltipItem>
                        ))}
                    </ModelTooltipList>
                  }
                >
                  <StatItem>
                    <ModelCount>{data.analytics.models.length} models</ModelCount>
                    <StatLabel>
                      {data.analytics.models.reduce((sum, m) => sum + m.requests, 0)} requests
                    </StatLabel>
                  </StatItem>
                </Tooltip>
              )}
            </StatGroupItems>
          </StatGroup>
        )}

        {/* Averages Group */}
        <StatGroup>
          <StatGroupLabel>Averages</StatGroupLabel>
          <StatGroupItems>
            <Tooltip content={STAT_TOOLTIPS.avgCost}>
              <StatItem>
                <StatValue>${avgCost.toFixed(3)}</StatValue>
                <StatLabel>cost</StatLabel>
              </StatItem>
            </Tooltip>
            <StatDivider />
            <Tooltip content={STAT_TOOLTIPS.avgDuration}>
              <StatItem>
                <StatValue>{avgDuration.toFixed(1)}m</StatValue>
                <StatLabel>duration</StatLabel>
              </StatItem>
            </Tooltip>
            <StatDivider />
            <Tooltip content={STAT_TOOLTIPS.avgTokens}>
              <StatItem>
                <StatValue>{formatCompactNumber(avgTokens)}</StatValue>
                <StatLabel>tokens</StatLabel>
              </StatItem>
            </Tooltip>
          </StatGroupItems>
        </StatGroup>

        {/* Totals Group */}
        <StatGroup>
          <StatGroupLabel>Totals</StatGroupLabel>
          <StatGroupItems>
            <Tooltip content={STAT_TOOLTIPS.sessions}>
              <StatItem>
                <StatValue>{agent.total_sessions}</StatValue>
                <StatLabel>sessions</StatLabel>
              </StatItem>
            </Tooltip>
            <StatDivider />
            <Tooltip content={STAT_TOOLTIPS.messages}>
              <StatItem>
                <StatValue>{formatCompactNumber(agent.total_messages)}</StatValue>
                <StatLabel>messages</StatLabel>
              </StatItem>
            </Tooltip>
            <StatDivider />
            <Tooltip content={STAT_TOOLTIPS.tokens}>
              <StatItem>
                <StatValue>{formatCompactNumber(agent.total_tokens)}</StatValue>
                <StatLabel>tokens</StatLabel>
              </StatItem>
            </Tooltip>
          </StatGroupItems>
        </StatGroup>
      </StatsBar>

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
                          <ClusterVisualization
                            nodes={buildVisualizationNodes(
                              riskAnalysis.behavioral_analysis.clusters,
                              riskAnalysis.behavioral_analysis.outliers
                            )}
                            height={160}
                            showLegend={true}
                            onNodeClick={handleClusterNodeClick}
                          />
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

                  {/* Issues list */}
                  {allIssues.length > 0 && (
                    <CheckList>
                      {allIssues.map((check, idx) => (
                        <CheckItem key={idx} $isLast={idx === allIssues.length - 1}>
                          <CheckStatus
                            $color={
                              check.status === 'critical' ? 'var(--color-red)' : 'var(--color-orange)'
                            }
                          >
                            {check.status === 'critical' ? 'FAIL' : 'WARN'}
                          </CheckStatus>
                          <CheckName
                            style={{
                              color:
                                check.status === 'critical' ? 'var(--color-red)' : 'var(--color-orange)',
                            }}
                          >
                            {check.name}
                            {check.value !== undefined && (
                              <CheckValue> ({String(check.value)})</CheckValue>
                            )}
                          </CheckName>
                          <Badge variant={check.status === 'critical' ? 'critical' : 'medium'}>
                            {check.categoryName}
                          </Badge>
                        </CheckItem>
                      ))}
                    </CheckList>
                  )}
                </>
              )}
            </Section.Content>
          </Section>

          {/* Future: Analysis Log Section */}
        </Column>
      </ContentGrid>
      )}

      {/* Tool Utilization Section */}
      {agent.available_tools && agent.available_tools.length > 0 && (() => {
        const usedTools = agent.available_tools
          .filter((tool) => (agent.tool_usage_details?.[tool] || 0) > 0)
          .sort((a, b) => {
            const countA = agent.tool_usage_details?.[a] || 0;
            const countB = agent.tool_usage_details?.[b] || 0;
            return countB - countA;
          });

        const unusedTools = agent.available_tools
          .filter((tool) => (agent.tool_usage_details?.[tool] || 0) === 0)
          .sort();

        const percent = Math.round(agent.tools_utilization_percent);
        const progressColor =
          percent >= 70 ? 'var(--color-green)' : percent >= 40 ? 'var(--color-orange)' : 'var(--color-red)';

        return (
          <Section>
            <Section.Header>
              <Section.Title>Tool Utilization (avg/session)</Section.Title>
            </Section.Header>
            <Section.Content>
              <ToolUtilizationContainer>
                <ToolUtilizationMetric>
                  <CircularProgress>
                    <CircularProgressSvg viewBox="0 0 40 40">
                      <CircularProgressTrack cx="20" cy="20" r="15" />
                      <CircularProgressFill cx="20" cy="20" r="15" $percent={percent} $color={progressColor} />
                    </CircularProgressSvg>
                    <CircularProgressContent>
                      <CircularProgressValue>{percent}%</CircularProgressValue>
                    </CircularProgressContent>
                  </CircularProgress>
                  <ToolUtilizationLabel>
                    <ToolUtilizationPrimary>
                      {usedTools.length} of {agent.available_tools.length}
                    </ToolUtilizationPrimary>
                    <ToolUtilizationSecondary>tools used</ToolUtilizationSecondary>
                  </ToolUtilizationLabel>
                </ToolUtilizationMetric>
                <ToolUtilizationDivider />
                <ToolsList>
                  {usedTools.map((tool) => {
                    const totalCount = agent.tool_usage_details?.[tool] || 0;
                    const avgPerSession = agent.total_sessions > 0
                      ? (totalCount / agent.total_sessions).toFixed(1)
                      : '0';
                    return (
                      <ToolTag key={tool} $isUsed={true}>
                        <ToolName $isUsed={true}>{tool}</ToolName>
                        <ToolCount>~{avgPerSession}</ToolCount>
                      </ToolTag>
                    );
                  })}
                  {unusedTools.map((tool) => (
                    <ToolTag key={tool} $isUsed={false}>
                      <ToolName $isUsed={false}>{tool}</ToolName>
                      <ToolUnused>unused</ToolUnused>
                    </ToolTag>
                  ))}
                </ToolsList>
              </ToolUtilizationContainer>
            </Section.Content>
          </Section>
        );
      })()}

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
