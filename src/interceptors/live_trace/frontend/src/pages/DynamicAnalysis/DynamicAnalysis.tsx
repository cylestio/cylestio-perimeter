import { useCallback, useEffect, useState, type FC } from 'react';

import { AlertTriangle, FileSearch, Shield, X, Clock } from 'lucide-react';
import { useOutletContext, useParams } from 'react-router-dom';

import {
  fetchAnalysisSessions,
  fetchAgentWorkflowSecurityChecks,
  fetchStaticSummary,
  type AnalysisSession,
  type AgentSecurityData,
  type AgentWorkflowSecurityChecksSummary,
} from '@api/endpoints/agentWorkflow';
import { fetchConfig } from '@api/endpoints/config';
import type { ConfigResponse } from '@api/types/config';
import type { SecurityAnalysis } from '@api/types/dashboard';
import { DynamicAnalysisIcon } from '@constants/pageIcons';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { AnalysisSessionsTable } from '@domain/analysis';
import { CorrelateHintCard } from '@domain/correlation';
import { AgentSetupSection } from '@domain/agent';
import { DynamicOverviewCard, type DynamicAgentStatus } from '@domain/security';

import { GatheringData } from '@features/GatheringData';
import { SecurityChecksExplorer } from '@features/SecurityChecksExplorer';

import { usePageMeta } from '../../context';
import {
  PageStats,
  StatBadge,
  StatValue,
  LoaderContainer,
} from './DynamicAnalysis.styles';

// Context from App layout
interface DynamicAnalysisContext {
  securityAnalysis?: SecurityAnalysis;
}

export interface DynamicAnalysisProps {
  className?: string;
}

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
  const [serverConfig, setServerConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checksLoading, setChecksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Get dynamic analysis session progress
  const sessionsProgress = securityAnalysis?.dynamic?.sessions_progress;
  const isGatheringSessions = sessionsProgress &&
    securityAnalysis?.dynamic?.status === 'running' &&
    analysisSessions.length === 0;

  // Fetch server config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchConfig();
        setServerConfig(config);
      } catch {
        setServerConfig(null);
      }
    };
    loadConfig();
  }, []);

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

  // Derived state (computed early for useEffect dependency)
  const hasRuntimeData = analysisSessions.length > 0 || (analysisStatus?.agents_status?.length ?? 0) > 0;

  // Poll for status updates - faster when running, slower otherwise
  useEffect(() => {
    // Poll every 3s when running, 5s otherwise (to detect new sessions)
    const interval = analysisStatus?.is_running ? 3000 : 5000;

    const pollInterval = setInterval(() => {
      fetchAnalysisStatus();
      // Also refresh sessions when waiting for data
      if (!hasRuntimeData) {
        fetchSessionsData();
      }
    }, interval);

    return () => clearInterval(pollInterval);
  }, [analysisStatus?.is_running, fetchAnalysisStatus, fetchSessionsData, hasRuntimeData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agent Workflows', href: '/' },
      { label: agentWorkflowId || '', href: `/agent-workflow/${agentWorkflowId}` },
      { label: 'Dynamic Analysis' },
    ],
  });

  const inProgressCount = analysisSessions.filter((s) => s.status === 'IN_PROGRESS').length;

  // Determine overview card status
  const getOverviewStatus = (): 'running' | 'ready' | 'upToDate' | 'empty' => {
    if (!hasRuntimeData) return 'empty';
    if (analysisStatus?.is_running) return 'running';
    if (analysisStatus?.can_trigger) return 'ready';
    if (analysisStatus?.last_analysis) return 'upToDate';
    return 'empty';
  };

  const overviewStatus = getOverviewStatus();

  // Calculate total sessions
  const totalSessions = analysisStatus?.agents_status?.reduce((acc, a) => acc + a.total_sessions, 0) || 0;

  if (loading) {
    return (
      <LoaderContainer $size="lg">
        <OrbLoader size="lg" />
      </LoaderContainer>
    );
  }

  return (
    <Page className={className} data-testid="dynamic-analysis">
      {/* Header */}
      <PageHeader
        icon={<DynamicAnalysisIcon size={24} />}
        title="Dynamic Analysis"
        actions={
          hasRuntimeData ? (
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
          ) : undefined
        }
      />

      {/* Agent Setup Section - Collapsible when has data */}
      <AgentSetupSection
        serverConfig={serverConfig}
        hasActivity={hasRuntimeData}
        isLoading={loading}
        agentWorkflowId={agentWorkflowId}
        collapsible={hasRuntimeData}
        defaultExpanded={!hasRuntimeData}
      />

      {/* Dynamic Overview Card */}
      <DynamicOverviewCard
        status={overviewStatus}
        triggerLoading={triggerLoading}
        unanalyzedSessions={analysisStatus?.total_unanalyzed_sessions || 0}
        agentsWithNewSessions={analysisStatus?.agents_with_new_sessions || 0}
        agentsStatus={analysisStatus?.agents_status as DynamicAgentStatus[] || []}
        lastAnalysisTime={analysisStatus?.last_analysis?.completed_at}
        findingsCount={analysisStatus?.last_analysis?.findings_count || 0}
        sessionsAnalyzed={analysisStatus?.last_analysis?.sessions_analyzed || 0}
        totalSessions={totalSessions}
        onRunAnalysis={hasRuntimeData ? handleTriggerAnalysis : undefined}
      />

      {/* Only show remaining sections if we have runtime data */}
      {hasRuntimeData && (
        <>
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
              <Section.Title icon={<Clock size={16} />}>
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
        </>
      )}
    </Page>
  );
};
