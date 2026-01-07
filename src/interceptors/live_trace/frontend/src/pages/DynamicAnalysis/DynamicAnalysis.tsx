import { useCallback, useEffect, useState, type FC } from 'react';

import { AlertTriangle, FileSearch, Play, RefreshCw, Shield, X, Clock, CheckCircle, Loader } from 'lucide-react';
import { useOutletContext, useParams } from 'react-router-dom';

import {
  fetchAnalysisSessions,
  fetchAgentWorkflowSecurityChecks,
  fetchStaticSummary,
  type AnalysisSession,
  type AgentSecurityData,
  type AgentWorkflowSecurityChecksSummary,
} from '@api/endpoints/agentWorkflow';
import type { SecurityAnalysis } from '@api/types/dashboard';

import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { AnalysisSessionsTable } from '@domain/analysis';
import { CorrelateHintCard } from '@domain/correlation';

import { GatheringData } from '@features/GatheringData';
import { SecurityChecksExplorer } from '@features/SecurityChecksExplorer';

import { usePageMeta } from '../../context';
import {
  PageStats,
  StatBadge,
  StatValue,
  LoaderContainer,
} from './DynamicAnalysis.styles';
import styled from 'styled-components';

// Context from App layout
interface DynamicAnalysisContext {
  securityAnalysis?: SecurityAnalysis;
}

export interface DynamicAnalysisProps {
  className?: string;
}

// Status card for on-demand analysis
const AnalysisStatusCard = styled.div<{ $variant?: 'ready' | 'running' | 'upToDate' | 'noData' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'ready':
        return theme.colors.yellow + '15';
      case 'running':
        return theme.colors.cyan + '15';
      case 'upToDate':
        return theme.colors.green + '15';
      default:
        return theme.colors.surface3;
    }
  }};
  border: 1px solid ${({ theme, $variant }) => {
    switch ($variant) {
      case 'ready':
        return theme.colors.yellow + '40';
      case 'running':
        return theme.colors.cyan + '40';
      case 'upToDate':
        return theme.colors.green + '40';
      default:
        return theme.colors.borderSubtle;
    }
  }};
`;

const StatusInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const StatusTitle = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

const StatusDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
`;

const AgentsStatusList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const AgentStatusBadge = styled.div<{ $hasNew?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $hasNew }) =>
    $hasNew ? theme.colors.yellow + '20' : theme.colors.surface3};
  border: 1px solid ${({ theme, $hasNew }) =>
    $hasNew ? theme.colors.yellow + '40' : theme.colors.borderSubtle};
  font-size: ${({ theme }) => theme.typography.textXs};
`;

// Analysis status types
interface DynamicAnalysisStatus {
  workflow_id: string;
  can_trigger: boolean;
  is_running: boolean;
  total_unanalyzed_sessions: number;
  agents_with_new_sessions: number;
  agents_status: Array<{
    agent_id: string;
    display_name: string | null;
    total_sessions: number;
    unanalyzed_count: number;
  }>;
  last_analysis: {
    session_id: string;
    status: string;
    created_at: number;
    completed_at: number | null;
    sessions_analyzed: number;
    findings_count: number;
  } | null;
}

const MAX_SESSIONS_DISPLAYED = 5;

export const DynamicAnalysis: FC<DynamicAnalysisProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const { securityAnalysis } = useOutletContext<DynamicAnalysisContext>() || {};

  // State
  const [agentsData, setAgentsData] = useState<AgentSecurityData[]>([]);
  const [checksSummary, setChecksSummary] = useState<AgentWorkflowSecurityChecksSummary | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<DynamicAnalysisStatus | null>(null);
  const [staticFindingsCount, setStaticFindingsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [checksLoading, setChecksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Get dynamic analysis session progress
  const sessionsProgress = securityAnalysis?.dynamic?.sessions_progress;
  const isGatheringSessions = sessionsProgress &&
    securityAnalysis?.dynamic?.status === 'running' &&
    analysisSessions.length === 0;

  // Fetch dynamic analysis status
  const fetchAnalysisStatus = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const response = await fetch(`/api/workflow/${agentWorkflowId}/dynamic-analysis-status`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch analysis status:', err);
    }
  }, [agentWorkflowId]);

  // Fetch security checks for this agent workflow (grouped by agent)
  const fetchChecksData = useCallback(async () => {
    if (!agentWorkflowId) return;

    setChecksLoading(true);
    try {
      const data = await fetchAgentWorkflowSecurityChecks(agentWorkflowId);
      setAgentsData(data.agents);
      setChecksSummary(data.total_summary);
    } catch (err) {
      console.error('Failed to fetch security checks:', err);
    } finally {
      setChecksLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch analysis sessions for this agent workflow (DYNAMIC only)
  const fetchSessionsData = useCallback(async () => {
    if (!agentWorkflowId) return;

    setSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(agentWorkflowId);
      // Filter to only DYNAMIC sessions
      const filteredSessions = (data.sessions || []).filter(
        (session) => session.session_type === 'DYNAMIC'
      );
      setAnalysisSessions(filteredSessions);
    } catch (err) {
      console.error('Failed to fetch analysis sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, [agentWorkflowId]);

  // Trigger on-demand analysis
  const handleTriggerAnalysis = useCallback(async (force: boolean = false) => {
    if (!agentWorkflowId || triggerLoading) return;

    setTriggerLoading(true);
    try {
      const url = force
        ? `/api/workflow/${agentWorkflowId}/trigger-dynamic-analysis?force=true`
        : `/api/workflow/${agentWorkflowId}/trigger-dynamic-analysis`;

      const response = await fetch(url, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh all data after triggering
        await Promise.all([
          fetchAnalysisStatus(),
          fetchSessionsData(),
          fetchChecksData(),
        ]);
      } else {
        const error = await response.json();
        console.error('Failed to trigger analysis:', error);
      }
    } catch (err) {
      console.error('Failed to trigger analysis:', err);
    } finally {
      setTriggerLoading(false);
    }
  }, [agentWorkflowId, triggerLoading, fetchAnalysisStatus, fetchSessionsData, fetchChecksData]);

  // Fetch static findings count for correlation hint
  const fetchStaticCount = useCallback(async () => {
    if (!agentWorkflowId) return;
    try {
      const staticData = await fetchStaticSummary(agentWorkflowId);
      const totalFindings = staticData?.checks?.reduce((acc, c) => acc + c.findings_count, 0) || 0;
      setStaticFindingsCount(totalFindings);
    } catch (err) {
      console.error('Failed to fetch static summary:', err);
    }
  }, [agentWorkflowId]);

  // Fetch data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchChecksData(), fetchSessionsData(), fetchAnalysisStatus(), fetchStaticCount()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchChecksData, fetchSessionsData, fetchAnalysisStatus, fetchStaticCount]);

  // Poll for status updates - faster when running, slower otherwise
  useEffect(() => {
    // Poll every 3s when running, 10s otherwise (to detect new sessions)
    const interval = analysisStatus?.is_running ? 3000 : 10000;

    const pollInterval = setInterval(() => {
      fetchAnalysisStatus();
    }, interval);

    return () => clearInterval(pollInterval);
  }, [analysisStatus?.is_running, fetchAnalysisStatus]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agent Workflows', href: '/' },
      { label: agentWorkflowId || '', href: `/agent-workflow/${agentWorkflowId}` },
      { label: 'Dynamic Analysis' },
    ],
  });

  if (loading) {
    return (
      <LoaderContainer $size="lg">
        <OrbLoader size="lg" />
      </LoaderContainer>
    );
  }

  const inProgressCount = analysisSessions.filter((s) => s.status === 'IN_PROGRESS').length;

  // Determine status variant
  const getStatusVariant = (): 'ready' | 'running' | 'upToDate' | 'noData' => {
    if (!analysisStatus) return 'noData';
    if (analysisStatus.is_running) return 'running';
    if (analysisStatus.can_trigger) return 'ready';
    if (analysisStatus.last_analysis) return 'upToDate';
    return 'noData';
  };

  const statusVariant = getStatusVariant();

  // Format last analysis time
  const formatLastAnalysis = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <Page className={className} data-testid="dynamic-analysis">
      {/* Header */}
      <PageHeader
        title="Dynamic Analysis"
        description={`Agent Workflow: ${agentWorkflowId}`}
        actions={
          <PageStats>
            <StatBadge>
              <FileSearch size={14} />
              <StatValue>{analysisSessions.length}</StatValue> scans
            </StatBadge>
            {checksSummary && (
              <>
                <StatBadge>
                  <Shield size={14} />
                  <StatValue>{checksSummary.total_checks}</StatValue> checks
                </StatBadge>
                {checksSummary.critical > 0 && (
                  <StatBadge $variant="critical">
                    <X size={14} />
                    <StatValue>{checksSummary.critical}</StatValue> critical
                  </StatBadge>
                )}
                {checksSummary.warnings > 0 && (
                  <StatBadge $variant="warning">
                    <AlertTriangle size={14} />
                    <StatValue>{checksSummary.warnings}</StatValue> warnings
                  </StatBadge>
                )}
              </>
            )}
          </PageStats>
        }
      />

      {/* On-Demand Analysis Status */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Play size={16} />}>Run Analysis</Section.Title>
        </Section.Header>
        <Section.Content>
          <AnalysisStatusCard $variant={statusVariant}>
            <StatusInfo>
              <StatusTitle>
                {statusVariant === 'running' && (
                  <>
                    <Loader size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                    Analysis In Progress...
                  </>
                )}
                {statusVariant === 'ready' && (
                  <>
                    <Clock size={16} style={{ marginRight: 8 }} />
                    New Sessions Ready for Analysis
                  </>
                )}
                {statusVariant === 'upToDate' && (
                  <>
                    <CheckCircle size={16} style={{ marginRight: 8 }} />
                    Analysis Up to Date
                  </>
                )}
                {statusVariant === 'noData' && (
                  <>
                    <AlertTriangle size={16} style={{ marginRight: 8 }} />
                    No Runtime Data Yet
                  </>
                )}
              </StatusTitle>
              <StatusDescription>
                {statusVariant === 'running' && 'Security checks are being performed on runtime data...'}
                {statusVariant === 'ready' && (
                  <>
                    {analysisStatus?.total_unanalyzed_sessions} new session(s) from{' '}
                    {analysisStatus?.agents_with_new_sessions} agent(s) ready to analyze.
                    {analysisStatus?.last_analysis && (
                      <> Last analysis: {formatLastAnalysis(analysisStatus.last_analysis.completed_at)}</>
                    )}
                  </>
                )}
                {statusVariant === 'upToDate' && (
                  <>
                    All sessions have been analyzed. Last analysis:{' '}
                    {formatLastAnalysis(analysisStatus?.last_analysis?.completed_at || null)}
                  </>
                )}
                {statusVariant === 'noData' && (
                  <>
                    Run your agent through the proxy to capture runtime sessions for analysis.
                    Proxy URL: <code>http://localhost:4000/agent-workflow/{agentWorkflowId}</code>
                  </>
                )}
              </StatusDescription>

              {/* Per-agent status badges */}
              {analysisStatus?.agents_status && analysisStatus.agents_status.length > 0 && (
                <AgentsStatusList>
                  {analysisStatus.agents_status.map((agent) => (
                    <AgentStatusBadge key={agent.agent_id} $hasNew={agent.unanalyzed_count > 0}>
                      <span>{agent.display_name || agent.agent_id.slice(0, 8)}...</span>
                      {agent.unanalyzed_count > 0 ? (
                        <Badge variant="high" size="sm">{agent.unanalyzed_count} new</Badge>
                      ) : (
                        <Badge variant="medium" size="sm">{agent.total_sessions} sessions</Badge>
                      )}
                    </AgentStatusBadge>
                  ))}
                </AgentsStatusList>
              )}
            </StatusInfo>

            <Button
              variant={statusVariant === 'ready' ? 'primary' : 'secondary'}
              size="md"
              disabled={triggerLoading || (statusVariant === 'noData')}
              onClick={() => {
                // Use force=true when re-running (no new sessions but has previous analysis)
                const useForce = statusVariant === 'upToDate';
                handleTriggerAnalysis(useForce);
              }}
            >
              {triggerLoading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} />
                  {statusVariant === 'ready' ? 'Run Analysis' : 'Re-run Analysis'}
                </>
              )}
            </Button>
          </AnalysisStatusCard>
        </Section.Content>
      </Section>

      {/* Phase 5: Correlation Hint Card - Show when both static and dynamic data exist */}
      {staticFindingsCount > 0 && analysisSessions.length > 0 && (
        <Section>
          <CorrelateHintCard
            staticFindingsCount={staticFindingsCount}
            dynamicSessionsCount={analysisSessions.length}
            connectedIde="cursor"
          />
        </Section>
      )}

      {/* Session Progress - Show when gathering sessions */}
      {isGatheringSessions && sessionsProgress && (
        <Section>
          <Section.Header>
            <Section.Title>Gathering Data for Risk Analysis</Section.Title>
            <Badge variant="medium">
              {sessionsProgress.current} / {sessionsProgress.required}
            </Badge>
          </Section.Header>
          <Section.Content noPadding>
            <GatheringData
              currentSessions={sessionsProgress.current}
              minSessionsRequired={sessionsProgress.required}
            />
          </Section.Content>
        </Section>
      )}

      {/* Analysis Sessions - Table with limit */}
      <Section>
        <Section.Header>
          <Section.Title>
            Analysis History ({Math.min(analysisSessions.length, MAX_SESSIONS_DISPLAYED)})
          </Section.Title>
          {inProgressCount > 0 && <Badge variant="medium">{inProgressCount} in progress</Badge>}
        </Section.Header>
        <Section.Content noPadding>
          <AnalysisSessionsTable
            sessions={analysisSessions}
            agentWorkflowId={agentWorkflowId || ''}
            loading={sessionsLoading}
            maxRows={MAX_SESSIONS_DISPLAYED}
            emptyMessage="No dynamic analysis sessions yet."
            emptyDescription="Click 'Run Analysis' above to analyze runtime behavior."
          />
        </Section.Content>
      </Section>

      {/* Security Checks - Explorer with Agent Navigation */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Shield size={16} />}>Latest Security Checks</Section.Title>
          {checksSummary && checksSummary.agents_analyzed > 0 && (
            <Badge variant="medium">{checksSummary.agents_analyzed} agents</Badge>
          )}
        </Section.Header>
        <Section.Content>
          {checksLoading ? (
            <LoaderContainer $size="md">
              <OrbLoader size="md" />
            </LoaderContainer>
          ) : (
            <SecurityChecksExplorer
              agents={agentsData}
              agentWorkflowId={agentWorkflowId || ''}
            />
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
