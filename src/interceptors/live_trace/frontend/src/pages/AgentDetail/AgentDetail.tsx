import { useCallback, type FC } from 'react';

import { Wrench, Code, Activity, Rocket } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import type { AgentResponse, AgentSession } from '@api/types/agent';
import { usePolling } from '@hooks/usePolling';
import { buildWorkflowBreadcrumbs, workflowLink } from '../../utils/breadcrumbs';
import {
  formatCompactNumber,
  timeAgo,
  getAgentStatus,
  BEHAVIORAL_TOOLTIPS,
} from '../../utils/formatting';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { ProgressBar } from '@ui/feedback/ProgressBar';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Table, type Column } from '@ui/data-display/Table';
import { Tooltip } from '@ui/overlays/Tooltip';

import { LifecycleProgress, type LifecycleStage } from '@domain/activity';
import { InfoCard } from '@domain/metrics/InfoCard';

import { usePageMeta } from '../../context';
import {
  AgentLayout,
  AgentSidebar,
  AgentMain,
  RiskHeroCard,
  RiskHeroHeader,
  RiskLabel,
  RiskScore,
  RiskSummary,
  MetricGrid,
  MetricCard,
  MetricLabel,
  MetricValue,
  AlertBanner,
  AlertContent,
  AlertTitle,
  AlertDescription,
  SummaryCard,
  SummaryHeader,
  SummaryTitle,
  SummaryContent,
  StatusBanner,
  StatusLeft,
  StatusRight,
  StatusLabel,
  StatusValue,
  StatusMeta,
  CheckSection,
  CheckSectionTitle,
  CheckList,
  CheckItem,
  CheckStatus,
  CheckName,
  CheckValue,
  BehavioralSection,
  BehavioralTitle,
  MetricRow,
  MetricRowHeader,
  MetricRowLabel,
  MetricRowValue,
  ProgressBarContainer,
  ProgressBarFill,
  ConfidenceRow,
  SessionsCard,
  SessionsHeader,
  SessionsTitle,
  SessionsContent,
  EmptySessions,
  ViewReportButton,
  FullReportLink,
  PIIWarning,
  PIIWarningText,
  ActiveSessionsNote,
  EvaluationCard,
  EvaluationHeader,
  EvaluationTitle,
  EvaluationCounter,
  EvaluationDescription,
} from './AgentDetail.styles';

interface Check {
  name: string;
  status: string;
  value?: string | number;
  categoryName?: string;
}

// Table columns for sessions - workflowId is passed in to generate workflow-aware links
const getSessionColumns = (workflowId: string): Column<AgentSession>[] => [
  {
    key: 'id',
    header: 'Session ID',
    render: (session) => (
      <Link
        to={`/workflow/${workflowId}/session/${session.id}`}
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
    key: 'created_at',
    header: 'Created',
    render: (session) => (
      <span style={{ color: 'var(--color-white-50)' }}>{timeAgo(session.created_at)}</span>
    ),
  },
  {
    key: 'last_activity',
    header: 'Last Activity',
    render: (session) => (
      <span style={{ color: 'var(--color-white-50)' }}>{timeAgo(session.last_activity)}</span>
    ),
  },
];

export const AgentDetail: FC = () => {
  const { agentId, workflowId } = useParams<{ agentId: string; workflowId: string }>();

  const fetchFn = useCallback(() => {
    if (!agentId) return Promise.reject(new Error('No agent ID'));
    return fetchAgent(agentId);
  }, [agentId]);

  const { data, error, loading } = usePolling<AgentResponse>(fetchFn, {
    interval: 2000,
    enabled: !!agentId,
  });

  // Set breadcrumbs with workflow context
  usePageMeta({
    breadcrumbs: buildWorkflowBreadcrumbs(
      workflowId,
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

  // Build lifecycle stages
  const getLifecycleStages = (): LifecycleStage[] => {
    return [
      {
        id: 'dev',
        label: 'DEV',
        icon: <Wrench size={16} />,
        status: 'completed' as const,
      },
      {
        id: 'static',
        label: 'STATIC',
        icon: <Code size={16} />,
        status: 'active' as const,
        stat: 'View in Workflow',
      },
      {
        id: 'dynamic',
        label: 'DYNAMIC',
        icon: <Activity size={16} />,
        status: agent?.total_sessions ? ('active' as const) : ('pending' as const),
        stat: agent?.total_sessions ? `${agent.total_sessions} sessions` : undefined,
      },
      {
        id: 'prod',
        label: 'PROD',
        icon: <Rocket size={16} />,
        status: 'pending' as const,
        stat: 'Enterprise',
      },
    ];
  };

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

  return (
    <AgentLayout>
      <AgentSidebar>
        {/* Agent Identity Card */}
        <InfoCard
          title="Agent Identity"
          primaryLabel="AGENT ID"
          primaryValue={agent.id}
          stats={[
            { label: 'FIRST SEEN', value: timeAgo(agent.first_seen) },
            { label: 'LAST SEEN', value: timeAgo(agent.last_seen) },
          ]}
        />

        {/* Risk Score Hero */}
        {status.hasRiskData && (
          <RiskHeroCard>
            <RiskHeroHeader>
              <RiskLabel>Overall Status</RiskLabel>
              <FullReportLink as={Link} to={workflowLink(workflowId, `/agent/${agent.id}/report`)}>
                Full Report →
              </FullReportLink>
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

        {/* PII Detection Warning */}
        {riskAnalysis?.summary?.pii_disabled && (
          <PIIWarning>
            <PIIWarningText>PII Detection Unavailable</PIIWarningText>
          </PIIWarning>
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
      </AgentSidebar>

      <AgentMain>
        {/* Lifecycle Progress */}
        <LifecycleProgress stages={getLifecycleStages()} />

        {/* Evaluation Progress Banner */}
        {status.evaluationStatus === 'INSUFFICIENT_DATA' && (
          <EvaluationCard>
            <EvaluationHeader>
              <EvaluationTitle>Gathering Data for Risk Analysis</EvaluationTitle>
              <EvaluationCounter>
                {status.currentSessions} / {status.minSessionsRequired}
              </EvaluationCounter>
            </EvaluationHeader>
            <ProgressBar
              value={(status.currentSessions || 0) / (status.minSessionsRequired || 5)}
              variant="default"
            />
            <EvaluationDescription style={{ marginTop: '12px' }}>
              We need at least {status.minSessionsRequired} sessions to provide meaningful risk
              analysis. Keep using your agent to build up session history.
            </EvaluationDescription>
          </EvaluationCard>
        )}

        {/* Behavioral Analysis Waiting Banner */}
        {status.hasRiskData && status.behavioralStatus === 'WAITING_FOR_COMPLETION' && (
          <AlertBanner $variant="info">
            <OrbLoader size="sm" />
            <AlertContent>
              <AlertTitle $color="var(--color-purple)">
                Behavioral Analysis In Progress
              </AlertTitle>
              <AlertDescription>
                Waiting for {status.activeSessions} active session
                {status.activeSessions !== 1 ? 's' : ''} to complete (
                {status.completedSessions} of {status.totalSessions} completed). Sessions are
                marked complete after 30 seconds of inactivity.
              </AlertDescription>
            </AlertContent>
          </AlertBanner>
        )}

        {/* Security & Behavioral Assessment Summary */}
        {status.hasRiskData && (
          <SummaryCard>
            <SummaryHeader>
              <SummaryTitle>Security & Behavioral Assessment Summary</SummaryTitle>
              <ViewReportButton as={Link} to={workflowLink(workflowId, `/agent/${agent.id}/report`)}>
                View Full Report →
              </ViewReportButton>
            </SummaryHeader>
            <SummaryContent>
              {/* Status Banner */}
              <StatusBanner $isError={status.hasCriticalIssues}>
                <StatusLeft>
                  <StatusLabel>Overall Status</StatusLabel>
                  <StatusValue $color={status.statusColor}>
                    {status.hasCriticalIssues ? 'ATTENTION REQUIRED' : 'ALL SYSTEMS OK'}
                  </StatusValue>
                </StatusLeft>
                <StatusRight>
                  <StatusLabel>Total Checks</StatusLabel>
                  <StatusValue $color="var(--color-cyan)">{status.totalChecks}</StatusValue>
                  <StatusMeta>
                    {status.criticalCount} critical, {status.warningCount} warnings
                  </StatusMeta>
                </StatusRight>
              </StatusBanner>

              {/* Failed Checks */}
              {failedChecks.length > 0 && (
                <CheckSection>
                  <CheckSectionTitle $color="var(--color-red)">
                    Failed Checks ({failedChecks.length})
                  </CheckSectionTitle>
                  <CheckList>
                    {failedChecks.map((check, idx) => (
                      <CheckItem key={idx} $isLast={idx === failedChecks.length - 1}>
                        <CheckStatus $color="var(--color-red)">FAIL</CheckStatus>
                        <CheckName>
                          <span style={{ color: 'var(--color-red)' }}>{check.name}</span>
                          {check.value !== undefined && (
                            <CheckValue> ({String(check.value)})</CheckValue>
                          )}
                        </CheckName>
                        <Badge variant="critical">{check.categoryName}</Badge>
                      </CheckItem>
                    ))}
                  </CheckList>
                </CheckSection>
              )}

              {/* Warning Checks */}
              {warningChecks.length > 0 && (
                <CheckSection>
                  <CheckSectionTitle $color="var(--color-orange)">
                    Warnings ({warningChecks.length})
                  </CheckSectionTitle>
                  <CheckList>
                    {warningChecks.map((check, idx) => (
                      <CheckItem key={idx} $isLast={idx === warningChecks.length - 1}>
                        <CheckStatus $color="var(--color-orange)">WARN</CheckStatus>
                        <CheckName>
                          <span style={{ color: 'var(--color-orange)' }}>{check.name}</span>
                          {check.value !== undefined && (
                            <CheckValue> ({String(check.value)})</CheckValue>
                          )}
                        </CheckName>
                        <Badge variant="medium">{check.categoryName}</Badge>
                      </CheckItem>
                    ))}
                  </CheckList>
                </CheckSection>
              )}

              {/* All Passed */}
              {failedChecks.length === 0 && warningChecks.length === 0 && (
                <AlertBanner $variant="success">
                  <AlertContent>
                    <AlertTitle>All Checks Passed</AlertTitle>
                    <AlertDescription>
                      No critical or warning issues detected in security assessment.
                    </AlertDescription>
                  </AlertContent>
                </AlertBanner>
              )}

              {/* Behavioral Snapshot */}
              {riskAnalysis?.behavioral_analysis &&
                status.behavioralStatus === 'COMPLETE' && (
                  <BehavioralSection>
                    <BehavioralTitle>Behavioral Snapshot</BehavioralTitle>

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

                    {(riskAnalysis.behavioral_analysis.num_clusters ?? 0) >= 1 ? (
                      <>
                        {/* Stability */}
                        <MetricRow>
                          <MetricRowHeader>
                            <Tooltip content={BEHAVIORAL_TOOLTIPS.stability}>
                              <MetricRowLabel>
                                <span>Stability</span>
                                <span>ⓘ</span>
                              </MetricRowLabel>
                            </Tooltip>
                            <MetricRowValue>
                              {Math.round(
                                (riskAnalysis.behavioral_analysis.stability_score ?? 0) * 100
                              )}
                              %
                            </MetricRowValue>
                          </MetricRowHeader>
                          <ProgressBarContainer>
                            <ProgressBarFill
                              $width={
                                (riskAnalysis.behavioral_analysis.stability_score ?? 0) * 100
                              }
                            />
                          </ProgressBarContainer>
                        </MetricRow>

                        {/* Predictability */}
                        <MetricRow>
                          <MetricRowHeader>
                            <Tooltip content={BEHAVIORAL_TOOLTIPS.predictability}>
                              <MetricRowLabel>
                                <span>Predictability</span>
                                <span>ⓘ</span>
                              </MetricRowLabel>
                            </Tooltip>
                            <MetricRowValue>
                              {Math.round(
                                (riskAnalysis.behavioral_analysis.predictability_score ?? 0) * 100
                              )}
                              %
                            </MetricRowValue>
                          </MetricRowHeader>
                          <ProgressBarContainer>
                            <ProgressBarFill
                              $width={
                                (riskAnalysis.behavioral_analysis.predictability_score ?? 0) * 100
                              }
                            />
                          </ProgressBarContainer>
                        </MetricRow>

                        {/* Confidence */}
                        <ConfidenceRow>
                          <Tooltip content={BEHAVIORAL_TOOLTIPS.confidence}>
                            <MetricRowLabel>
                              <span>Confidence</span>
                              <span>ⓘ</span>
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
                      </>
                    ) : (
                      <div
                        style={{
                          padding: '12px',
                          background: 'var(--color-surface)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border-medium)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-white-50)',
                            margin: 0,
                          }}
                        >
                          Behavioral scores require cluster formation. Once the agent has more
                          sessions with similar patterns, detailed stability metrics will be
                          available.
                        </p>
                      </div>
                    )}
                  </BehavioralSection>
                )}
            </SummaryContent>
          </SummaryCard>
        )}

        {/* Sessions Table */}
        <SessionsCard>
          <SessionsHeader>
            <SessionsTitle>Sessions ({data.sessions?.length || 0})</SessionsTitle>
          </SessionsHeader>
          <SessionsContent>
            {data.sessions && data.sessions.length > 0 ? (
              <Table<AgentSession>
                columns={getSessionColumns(workflowId || 'unassigned')}
                data={data.sessions}
                keyExtractor={(session) => session.id}
                emptyState={<EmptySessions>No sessions found for this agent.</EmptySessions>}
              />
            ) : (
              <EmptySessions>
                <p>No sessions found for this agent.</p>
              </EmptySessions>
            )}
          </SessionsContent>
        </SessionsCard>
      </AgentMain>
    </AgentLayout>
  );
};
