import { useCallback, type FC } from 'react';

import { AlertTriangle } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import type { AgentResponse, AgentSession } from '@api/types/agent';
import { usePolling } from '@hooks/usePolling';
import { buildAgentBreadcrumbs, agentLink } from '../../utils/breadcrumbs';
import {
  formatCompactNumber,
  getAgentStatus,
  BEHAVIORAL_TOOLTIPS,
} from '../../utils/formatting';

import { Badge, TimeAgo } from '@ui/core';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { ProgressBar } from '@ui/feedback/ProgressBar';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Table, type Column as TableColumn } from '@ui/data-display/Table';
import { Tooltip } from '@ui/overlays/Tooltip';
import { Page } from '@ui/layout/Page';
import { Section } from '@ui/layout/Section';

import { ClusterVisualization } from '@domain/visualization';

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
  ScoresColumn,
  ChartColumn,
  ChartLabel,
  MetricRow,
  MetricRowHeader,
  MetricRowLabel,
  MetricRowValue,
  ConfidenceRow,
  WaitingMessage,
  PlaceholderMessage,
  EmptySessions,
  ActiveSessionsNote,
} from './AgentDetail.styles';

interface Check {
  name: string;
  status: string;
  value?: string | number;
  categoryName?: string;
}

// Table columns for sessions
const getSessionColumns = (agentId: string): TableColumn<AgentSession>[] => [
  {
    key: 'id',
    header: 'Session ID',
    render: (session) => (
      <Link
        to={`/agent/${agentId}/session/${session.id}`}
        style={{
          color: 'var(--color-cyan)',
          textDecoration: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}
      >
        {session.id.substring(0, 16)}
        {session.id.length > 16 ? '...' : ''}
      </Link>
    ),
  },
  {
    key: 'is_active',
    header: 'Status',
    render: (session) =>
      session.is_active ? (
        <Badge variant="success">ACTIVE</Badge>
      ) : (
        <Badge variant="info">COMPLETE</Badge>
      ),
  },
  {
    key: 'duration_minutes',
    header: 'Duration',
    render: (session) => `${session.duration_minutes.toFixed(1)}m`,
  },
  {
    key: 'message_count',
    header: 'Messages',
  },
  {
    key: 'total_tokens',
    header: 'Tokens',
    render: (session) => formatCompactNumber(session.total_tokens),
  },
  {
    key: 'tool_uses',
    header: 'Tools',
  },
  {
    key: 'error_rate',
    header: 'Error Rate',
    render: (session) =>
      session.error_rate > 0 ? (
        <span
          style={{
            color:
              session.error_rate > 20
                ? 'var(--color-red)'
                : session.error_rate > 10
                  ? 'var(--color-orange)'
                  : 'var(--color-white-50)',
          }}
        >
          {session.error_rate.toFixed(1)}%
        </span>
      ) : (
        <span style={{ color: 'var(--color-green)' }}>0%</span>
      ),
  },
  {
    key: 'last_activity',
    header: 'Last Activity',
    render: (session) => (
      <TimeAgo timestamp={session.last_activity} />
    ),
  },
];

export const AgentDetail: FC = () => {
  const { agentId, systemPromptId } = useParams<{ agentId: string; systemPromptId: string }>();

  const fetchFn = useCallback(() => {
    if (!systemPromptId) return Promise.reject(new Error('No system prompt ID'));
    return fetchAgent(systemPromptId);
  }, [systemPromptId]);

  const { data, error, loading } = usePolling<AgentResponse>(fetchFn, {
    interval: 2000,
    enabled: !!systemPromptId,
  });

  // Set breadcrumbs with agent context
  usePageMeta({
    breadcrumbs: buildAgentBreadcrumbs(
      agentId,
      { label: 'System prompt' },
      { label: systemPromptId?.substring(0, 12) + '...' || '' }
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
    return <EmptyState title="Failed to load system prompt" description={error || 'System prompt not found'} />;
  }

  const agent = data.agent;
  const riskAnalysis = data.risk_analysis;
  const status = getAgentStatus(riskAnalysis);
  const reportLink = agentLink(agentId, `/system-prompt/${agent.id}/report`);

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

      {/* Stats Bar - full width */}
      <StatsBar>
        <StatItem>
          <StatValue>{agent.total_sessions}</StatValue>
          <StatLabel>sessions</StatLabel>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatValue>{formatCompactNumber(agent.total_messages)}</StatValue>
          <StatLabel>messages</StatLabel>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatValue>{formatCompactNumber(agent.total_tokens)}</StatValue>
          <StatLabel>tokens</StatLabel>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatValue>{agent.total_tools}</StatValue>
          <StatLabel>tools</StatLabel>
        </StatItem>
      </StatsBar>

      {/* Two-column Layout */}
      <ContentGrid>
        {/* Left Column: Operational */}
        <Column>
          <ColumnHeader>Operational</ColumnHeader>

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

                    {/* Side-by-side layout: Scores + Chart */}
                    <BehavioralGrid>
                      {/* Left column: Scores */}
                      <ScoresColumn>
                        {/* Stability */}
                        <MetricRow>
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
                        </MetricRow>

                        {/* Predictability */}
                        <MetricRow>
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
                        </MetricRow>

                        {/* Confidence */}
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
                      </ScoresColumn>

                      {/* Right column: Cluster Visualization */}
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
                          />
                        </ChartColumn>
                      )}
                    </BehavioralGrid>
                  </BehavioralMetrics>
                ) : (
                  <PlaceholderMessage>
                    Behavioral scores require cluster formation. Once the system prompt has more sessions with
                    similar patterns, detailed stability metrics will be available.
                  </PlaceholderMessage>
                )}
              </Section.Content>
            </Section>
          )}

          {/* Sessions Table */}
          <Section>
            <Section.Header>
              <Section.Title>Sessions ({data.sessions?.length || 0})</Section.Title>
            </Section.Header>
            <Section.Content noPadding>
              {data.sessions && data.sessions.length > 0 ? (
                <Table<AgentSession>
                  columns={getSessionColumns(agentId || 'unassigned')}
                  data={data.sessions}
                  keyExtractor={(session) => session.id}
                  emptyState={<EmptySessions>No sessions found for this system prompt.</EmptySessions>}
                />
              ) : (
                <EmptySessions>
                  <p>No sessions found for this system prompt.</p>
                </EmptySessions>
              )}
            </Section.Content>
          </Section>
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
            <Section.Content noPadding={status.evaluationStatus === 'INSUFFICIENT_DATA'}>
              {status.evaluationStatus === 'INSUFFICIENT_DATA' ? (
                <GatheringData
                  currentSessions={status.currentSessions || 0}
                  minSessionsRequired={status.minSessionsRequired || 5}
                />
              ) : status.hasRiskData ? (
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
                    <PIINote>PII detection unavailable for this system prompt</PIINote>
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
              ) : (
                <PlaceholderMessage>No security data available yet.</PlaceholderMessage>
              )}
            </Section.Content>
          </Section>

          {/* Future: Analysis Log Section */}
        </Column>
      </ContentGrid>
    </Page>
  );
};
