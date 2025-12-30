import { useCallback, type FC } from 'react';

import { useParams, Link, useNavigate } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import type { AgentResponse, SecurityCategory } from '@api/types/agent';
import type { DynamicSecurityCheck, DynamicCategoryId, DynamicCategoryDefinition } from '@api/types/security';
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

import { InfoCard } from '@domain/metrics/InfoCard';
import { ClusterVisualization } from '@domain/visualization';
import { DynamicChecksGrid } from '@domain/security';

import { buildVisualizationNodes } from '../utils/behavioral';

import { usePageMeta } from '../../context';
import {
  ReportLayout,
  ReportSidebar,
  ReportMain,
  CategoryCard,
  CategoryHeader,
  CategoryTitleRow,
  CategoryTitle,
  CategoryBadges,
  CategoryDescription,
  CategoryContent,
  MetricsPills,
  MetricPill,
  MetricPillLabel,
  MetricPillValue,
  ToolsSection,
  SectionLabel,
  ToolsList,
  ToolTag,
  ToolName,
  ToolCount,
  ToolUnused,
  ChecksSection,
  BehavioralCard,
  BehavioralHeader,
  BehavioralContent,
  ScoresRow,
  ScoreItem,
  ScoreLabel,
  ScoreLabelText,
  ScoreValue,
  ScoreBar,
  ScoreBarFill,
  ScoreSeparator,
  InterpretationBox,
  OutliersSection,
  OutlierCard,
  OutlierHeader,
  OutlierCauses,
  OutlierCausesList,
  ClustersSection,
  ClusterCard,
  ClusterHeader,
  ClusterName,
  ClusterSize,
  ClusterInsights,
  ClusterTools,
  WaitingBanner,
  WaitingContent,
  WaitingTitle,
  WaitingDescription,
} from './AgentReport.styles';
import {
  RiskHeroCard,
  RiskHeroHeader,
  RiskLabel,
  RiskScore,
  RiskSummary,
  MetricGrid,
  MetricCard,
  MetricLabel,
  MetricValue,
  EvaluationCounter,
  EvaluationDescription,
  ActiveSessionsNote,
} from '../AgentDetail/AgentDetail.styles';

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

// Helper to get category icon
const getCategoryIcon = (categoryId: string): string => {
  switch (categoryId) {
    case 'ENVIRONMENT':
      return '⚙️';
    case 'RESOURCE_MANAGEMENT':
      return '📊';
    case 'OPERATIONAL_RELIABILITY':
      return '🔧';
    case 'PRIVACY_COMPLIANCE':
      return '🔒';
    default:
      return '📋';
  }
};

// Helper to get severity from category
const getCategorySeverity = (
  category: SecurityCategory
): 'critical' | 'warning' | 'ok' => {
  if (category.critical_checks > 0) return 'critical';
  if (category.warning_checks > 0) return 'warning';
  return 'ok';
};

export const AgentReport: FC = () => {
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

  // Set breadcrumbs with agent workflow context
  usePageMeta({
    breadcrumbs: buildAgentWorkflowBreadcrumbs(
      agentWorkflowId,
      { label: 'Agent', href: agentWorkflowLink(agentWorkflowId, `/agent/${agentId}`) },
      { label: agentId?.substring(0, 12) + '...' || '', href: agentWorkflowLink(agentWorkflowId, `/agent/${agentId}`) },
      { label: 'Full Report' }
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
    return <EmptyState title="Failed to load report" description={error || 'Agent not found'} />;
  }

  const agent = data.agent;
  const riskAnalysis = data.risk_analysis;
  const status = getAgentStatus(riskAnalysis);

  // Helper to convert category checks to DynamicSecurityCheck format
  const convertChecks = (
    categoryId: string,
    category: SecurityCategory
  ): DynamicSecurityCheck[] => {
    return (category.checks || []).map((check) => ({
      check_id: check.check_id,
      agent_id: agent.id,
      category_id: categoryId as DynamicCategoryId,
      check_type: check.name.toLowerCase().replace(/\s+/g, '_'),
      status: check.status as DynamicSecurityCheck['status'],
      title: check.name,
      value: check.value !== undefined ? String(check.value) : undefined,
      description: check.description,
      recommendations: check.recommendations,
    }));
  };

  return (
    <Page>
      <ReportLayout>
        <ReportSidebar>
        {/* Agent Identity Card */}
        <InfoCard
          title="Agent Identity"
          primaryLabel="ID"
          primaryValue={agent.id}
          stats={[
            { label: 'FIRST SEEN', badge: <TimeAgo timestamp={agent.first_seen} /> },
            { label: 'LAST SEEN', badge: <TimeAgo timestamp={agent.last_seen} /> },
          ]}
        />

        {/* Risk Score Hero */}
        {status.hasRiskData && (
          <RiskHeroCard>
            <RiskHeroHeader>
              <RiskLabel>Overall Status</RiskLabel>
            </RiskHeroHeader>
            <RiskScore $color={status.statusColor}>{status.statusText}</RiskScore>
            <RiskSummary>
              {status.hasCriticalIssues || status.hasWarnings ? (
                <>
                  {status.criticalCount > 0 && (
                    <span style={{ color: 'var(--color-red)' }}>
                      {status.criticalCount} Critical
                    </span>
                  )}
                  {status.criticalCount > 0 && status.warningCount > 0 && (
                    <span style={{ color: 'var(--color-white-50)' }}> | </span>
                  )}
                  {status.warningCount > 0 && (
                    <span style={{ color: 'var(--color-orange)' }}>
                      {status.warningCount} Warning{status.warningCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--color-green)' }}>All Systems OK</span>
              )}
            </RiskSummary>
          </RiskHeroCard>
        )}

        {/* Quick Metrics */}
        <MetricGrid>
          <MetricCard>
            <MetricLabel>Sessions</MetricLabel>
            <MetricValue>{agent.total_sessions}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Messages</MetricLabel>
            <MetricValue>{formatCompactNumber(agent.total_messages)}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Tokens</MetricLabel>
            <MetricValue>{formatCompactNumber(agent.total_tokens)}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Tools</MetricLabel>
            <MetricValue>{agent.total_tools}</MetricValue>
          </MetricCard>
        </MetricGrid>
      </ReportSidebar>

      <ReportMain>
        {/* Evaluation Progress Banner */}
        {status.evaluationStatus === 'INSUFFICIENT_DATA' && (
          <Section>
            <Section.Header>
              <Section.Title>Gathering Data for Risk Analysis</Section.Title>
              <EvaluationCounter>
                {status.currentSessions} / {status.minSessionsRequired}
              </EvaluationCounter>
            </Section.Header>
            <Section.Content>
              <ProgressBar
                value={(status.currentSessions || 0) / (status.minSessionsRequired || 5)}
                variant="default"
              />
              <EvaluationDescription style={{ marginTop: '12px' }}>
                We need at least {status.minSessionsRequired} sessions to provide meaningful risk
                analysis. Keep using your agent to build up session history.
              </EvaluationDescription>
            </Section.Content>
          </Section>
        )}

        {/* Behavioral Analysis Waiting Banner */}
        {status.hasRiskData && status.behavioralStatus === 'WAITING_FOR_COMPLETION' && (
          <WaitingBanner>
            <OrbLoader size="sm" />
            <WaitingContent>
              <WaitingTitle>Behavioral Analysis In Progress</WaitingTitle>
              <WaitingDescription>
                Waiting for {status.activeSessions} active session
                {status.activeSessions !== 1 ? 's' : ''} to complete (
                {status.completedSessions} of {status.totalSessions} completed). Sessions are
                marked complete after 30 seconds of inactivity.
              </WaitingDescription>
            </WaitingContent>
          </WaitingBanner>
        )}

        {/* Security Assessment Categories */}
        {status.hasRiskData &&
          riskAnalysis?.security_report?.categories &&
          Object.entries(riskAnalysis.security_report.categories).map(
            ([categoryId, category]) => (
              <CategoryCard key={categoryId}>
                <CategoryHeader $severity={getCategorySeverity(category)}>
                  <CategoryTitleRow>
                    <CategoryTitle>
                      {getCategoryIcon(categoryId)} {category.category_name}
                    </CategoryTitle>
                    <CategoryBadges>
                      {categoryId === 'PRIVACY_COMPLIANCE' && (
                        <a
                          href="https://github.com/microsoft/presidio/"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-cyan)',
                            textDecoration: 'none',
                          }}
                        >
                          Powered by Microsoft Presidio ↗
                        </a>
                      )}
                      {category.critical_checks > 0 && (
                        <Badge variant="critical">{category.critical_checks} critical</Badge>
                      )}
                      {category.warning_checks > 0 && (
                        <Badge variant="medium">{category.warning_checks} warnings</Badge>
                      )}
                    </CategoryBadges>
                  </CategoryTitleRow>
                  <CategoryDescription>{category.description}</CategoryDescription>
                </CategoryHeader>

                <CategoryContent>
                  {/* Metrics */}
                  {category.metrics && Object.keys(category.metrics).length > 0 && (
                    <MetricsPills>
                      {categoryId === 'ENVIRONMENT' && (
                        <>
                          <MetricPill>
                            <MetricPillLabel>Model</MetricPillLabel>
                            <MetricPillValue>
                              {(category.metrics as Record<string, unknown>).model as string ||
                                'N/A'}
                            </MetricPillValue>
                          </MetricPill>
                          <MetricPill>
                            <MetricPillLabel>Avg. Tool Coverage</MetricPillLabel>
                            <MetricPillValue>
                              {(category.metrics as Record<string, number>).avg_tools_coverage
                                ? `${Math.round((category.metrics as Record<string, number>).avg_tools_coverage * 100)}%`
                                : '0%'}
                            </MetricPillValue>
                          </MetricPill>
                          <MetricPill>
                            <MetricPillLabel>Avg. Tool Calls</MetricPillLabel>
                            <MetricPillValue>
                              {(category.metrics as Record<string, number>).avg_tool_calls?.toFixed(
                                1
                              ) ?? '0'}
                            </MetricPillValue>
                          </MetricPill>
                        </>
                      )}
                      {categoryId === 'RESOURCE_MANAGEMENT' && (
                        <>
                          <MetricPill>
                            <MetricPillLabel>Avg. Tokens</MetricPillLabel>
                            <MetricPillValue>
                              {formatCompactNumber(
                                (category.metrics as Record<string, number>).avg_tokens || 0
                              )}
                            </MetricPillValue>
                          </MetricPill>
                          <MetricPill>
                            <MetricPillLabel>Avg. Session Duration</MetricPillLabel>
                            <MetricPillValue>
                              {(
                                category.metrics as Record<string, number>
                              ).avg_duration_minutes?.toFixed(1) ?? '0'}{' '}
                              min
                            </MetricPillValue>
                          </MetricPill>
                        </>
                      )}
                    </MetricsPills>
                  )}

                  {/* Tools Section for Environment */}
                  {categoryId === 'ENVIRONMENT' &&
                    agent.available_tools &&
                    agent.available_tools.length > 0 && (
                      <ToolsSection>
                        <SectionLabel>TOOLS ({agent.available_tools.length})</SectionLabel>
                        <ToolsList>
                          {(() => {
                            const usedTools = agent.available_tools
                              .filter(
                                (tool) => (agent.tool_usage_details?.[tool] || 0) > 0
                              )
                              .sort((a, b) => {
                                const countA = agent.tool_usage_details?.[a] || 0;
                                const countB = agent.tool_usage_details?.[b] || 0;
                                return countB - countA;
                              });

                            const unusedTools = agent.available_tools
                              .filter(
                                (tool) => (agent.tool_usage_details?.[tool] || 0) === 0
                              )
                              .sort();

                            return [...usedTools, ...unusedTools];
                          })().map((tool) => {
                            const usageCount = agent.tool_usage_details?.[tool] || 0;
                            const isUsed = usageCount > 0;

                            return (
                              <ToolTag key={tool} $isUsed={isUsed}>
                                <ToolName $isUsed={isUsed}>{tool}</ToolName>
                                {isUsed ? (
                                  <ToolCount>{usageCount}×</ToolCount>
                                ) : (
                                  <ToolUnused>unused</ToolUnused>
                                )}
                              </ToolTag>
                            );
                          })}
                        </ToolsList>
                      </ToolsSection>
                    )}

                  {/* Report Checks */}
                  {category.checks && category.checks.length > 0 && (
                    <ChecksSection>
                      <SectionLabel>REPORT CHECKS</SectionLabel>
                      <DynamicChecksGrid
                        checks={convertChecks(categoryId, category)}
                        categoryDefinitions={CATEGORY_DEFINITIONS}
                        groupBy="none"
                        variant="list"
                        clickable={true}
                        showSummary={false}
                        agentWorkflowId={agentWorkflowId}
                      />
                    </ChecksSection>
                  )}
                </CategoryContent>
              </CategoryCard>
            )
          )}

        {/* Behavioral Insights Section */}
        {status.hasRiskData && riskAnalysis?.behavioral_analysis && (
          <BehavioralCard>
            <BehavioralHeader>
              <CategoryTitleRow>
                <CategoryTitle>Behavioral Insights</CategoryTitle>
                <CategoryBadges>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-white-50)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {riskAnalysis.behavioral_analysis.num_clusters} clusters •{' '}
                    {riskAnalysis.behavioral_analysis.num_outliers} outliers
                  </span>
                </CategoryBadges>
              </CategoryTitleRow>
              <CategoryDescription>
                Analyze behavior, flag outliers, and forecast the probability your agent stays on
                track, predictable, and stable.
              </CategoryDescription>
            </BehavioralHeader>

            <BehavioralContent>
              {/* Behavioral Scores */}
              {(riskAnalysis.behavioral_analysis.num_clusters ?? 0) >= 1 ? (
                <>
                  {/* Active Sessions Note */}
                  {(status.activeSessions || 0) > 0 && (
                    <ActiveSessionsNote>
                      <OrbLoader size="sm" />
                      <span>
                        Based on{' '}
                        <strong>
                          {status.completedSessions} analyzed session
                          {status.completedSessions !== 1 ? 's' : ''}
                        </strong>{' '}
                        —{' '}
                        <span style={{ color: 'var(--color-purple)' }}>
                          {status.activeSessions} session
                          {status.activeSessions !== 1 ? 's' : ''} still running
                        </span>
                      </span>
                    </ActiveSessionsNote>
                  )}

                  <ScoresRow>
                    {/* Stability */}
                    <ScoreItem>
                      <Tooltip content={BEHAVIORAL_TOOLTIPS.stability}>
                        <ScoreLabel>
                          <ScoreLabelText>Stability</ScoreLabelText>
                          <span style={{ opacity: 0.5, fontSize: '11px' }}>ⓘ</span>
                        </ScoreLabel>
                      </Tooltip>
                      <ScoreValue>
                        {Math.round(
                          (riskAnalysis.behavioral_analysis.stability_score ?? 0) * 100
                        )}
                        %
                      </ScoreValue>
                      <ScoreBar>
                        <ScoreBarFill
                          $width={(riskAnalysis.behavioral_analysis.stability_score ?? 0) * 100}
                        />
                      </ScoreBar>
                    </ScoreItem>

                    <ScoreSeparator />

                    {/* Predictability */}
                    <ScoreItem>
                      <Tooltip content={BEHAVIORAL_TOOLTIPS.predictability}>
                        <ScoreLabel>
                          <ScoreLabelText>Predictability</ScoreLabelText>
                          <span style={{ opacity: 0.5, fontSize: '11px' }}>ⓘ</span>
                        </ScoreLabel>
                      </Tooltip>
                      <ScoreValue>
                        {Math.round(
                          (riskAnalysis.behavioral_analysis.predictability_score ?? 0) * 100
                        )}
                        %
                      </ScoreValue>
                      <ScoreBar>
                        <ScoreBarFill
                          $width={
                            (riskAnalysis.behavioral_analysis.predictability_score ?? 0) * 100
                          }
                        />
                      </ScoreBar>
                    </ScoreItem>

                    <ScoreSeparator />

                    {/* Confidence */}
                    <ScoreItem>
                      <Tooltip content={BEHAVIORAL_TOOLTIPS.confidence}>
                        <ScoreLabel>
                          <ScoreLabelText>Confidence</ScoreLabelText>
                          <span style={{ opacity: 0.5, fontSize: '11px' }}>ⓘ</span>
                        </ScoreLabel>
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
                    </ScoreItem>
                  </ScoresRow>

                  {/* Cluster Visualization */}
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
                        height={200}
                        showLegend={true}
                        onNodeClick={handleClusterNodeClick}
                      />
                    );
                  })()}
                </>
              ) : (
                <InterpretationBox>
                  Behavioral scores require cluster formation. Once the agent has more sessions
                  with similar patterns, clustering will occur and detailed stability metrics will
                  be available.
                </InterpretationBox>
              )}

              {/* Interpretation */}
              {riskAnalysis.behavioral_analysis.interpretation && (
                <InterpretationBox>
                  {riskAnalysis.behavioral_analysis.interpretation}
                </InterpretationBox>
              )}

              {/* Outlier Sessions */}
              {riskAnalysis.behavioral_analysis.outliers &&
                riskAnalysis.behavioral_analysis.outliers.length > 0 && (
                  <OutliersSection>
                    <SectionLabel>
                      OUTLIER SESSIONS ({riskAnalysis.behavioral_analysis.num_outliers})
                    </SectionLabel>
                    {riskAnalysis.behavioral_analysis.outliers.map((outlier) => (
                      <OutlierCard key={outlier.session_id} $severity={outlier.severity}>
                        <OutlierHeader>
                          <Link
                            to={agentWorkflowLink(agentWorkflowId, `/session/${outlier.session_id}`)}
                            style={{
                              fontSize: '13px',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--color-cyan)',
                              textDecoration: 'none',
                            }}
                          >
                            {outlier.session_id.substring(0, 32)}...
                          </Link>
                          <Badge
                            variant={
                              outlier.severity === 'high'
                                ? 'critical'
                                : outlier.severity === 'medium'
                                  ? 'medium'
                                  : 'low'
                            }
                          >
                            {outlier.severity}
                          </Badge>
                        </OutlierHeader>
                        {outlier.primary_causes && outlier.primary_causes.length > 0 && (
                          <OutlierCauses>
                            <strong>Causes:</strong>
                            <OutlierCausesList>
                              {outlier.primary_causes.slice(0, 2).map((cause, i) => (
                                <li key={i}>{cause}</li>
                              ))}
                            </OutlierCausesList>
                          </OutlierCauses>
                        )}
                      </OutlierCard>
                    ))}
                  </OutliersSection>
                )}

              {/* Behavioral Clusters */}
              {riskAnalysis.behavioral_analysis.clusters &&
                riskAnalysis.behavioral_analysis.clusters.length > 0 && (
                  <ClustersSection>
                    <SectionLabel>
                      BEHAVIORAL CLUSTERS ({riskAnalysis.behavioral_analysis.num_clusters})
                    </SectionLabel>
                    {riskAnalysis.behavioral_analysis.clusters.map((cluster) => (
                      <ClusterCard
                        key={cluster.cluster_id}
                        $isLowConfidence={cluster.confidence === 'low'}
                      >
                        <ClusterHeader>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClusterName>{cluster.cluster_id}</ClusterName>
                            {cluster.confidence === 'low' && (
                              <Badge variant="medium">LOW CONFIDENCE</Badge>
                            )}
                          </div>
                          <ClusterSize>
                            {cluster.size} sessions ({cluster.percentage}%)
                          </ClusterSize>
                        </ClusterHeader>
                        <ClusterInsights>{cluster.insights}</ClusterInsights>
                        {cluster.characteristics.common_tools &&
                          cluster.characteristics.common_tools.length > 0 && (
                            <ClusterTools>
                              {cluster.characteristics.common_tools.slice(0, 3).map((tool) => (
                                <Badge key={tool} variant="info">
                                  {tool}
                                </Badge>
                              ))}
                              {cluster.characteristics.common_tools.length > 3 && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--color-white-50)',
                                  }}
                                >
                                  +{cluster.characteristics.common_tools.length - 3}
                                </span>
                              )}
                            </ClusterTools>
                          )}
                      </ClusterCard>
                    ))}
                  </ClustersSection>
                )}
            </BehavioralContent>
          </BehavioralCard>
        )}
        </ReportMain>
      </ReportLayout>
    </Page>
  );
};
