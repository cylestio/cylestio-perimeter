import { useCallback, useEffect, useState, type FC } from 'react';

import { AlertTriangle, FileSearch, Loader2, Play, Shield, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchAnalysisSessions,
  fetchAgentSecurityChecks,
  fetchAgentBehavioralAnalysis,
  fetchDynamicAnalysisStatus,
  triggerDynamicAnalysis,
  type AnalysisSession,
  type SystemPromptSecurityData,
  type AgentSecurityChecksSummary,
  type AgentBehavioralAnalysisResponse,
  type DynamicAnalysisStatus,
} from '@api/endpoints/agent';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Section } from '@ui/layout/Section';

import { AnalysisSessionsTable } from '@domain/analysis';
import { BehavioralInsights } from '@domain/dynamic';

import { SecurityChecksExplorer } from '@features/SecurityChecksExplorer';

import { usePageMeta } from '../../context';
import {
  DynamicAnalysisLayout,
  PageHeader,
  PageInfo,
  PageTitle,
  PageSubtitle,
  PageStats,
  StatBadge,
  StatValue,
  LoaderContainer,
  AnalysisStatusCard,
  AnalysisStatusInfo,
  AnalysisStatusTitle,
  AnalysisStatusSubtitle,
  RunAnalysisButton,
  SessionsBadge,
  SpinningLoader,
} from './DynamicAnalysis.styles';

export interface DynamicAnalysisProps {
  className?: string;
}

const MAX_SESSIONS_DISPLAYED = 5;

export const DynamicAnalysis: FC<DynamicAnalysisProps> = ({ className }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();

  // State
  const [agentsData, setAgentsData] = useState<SystemPromptSecurityData[]>([]);
  const [checksSummary, setChecksSummary] = useState<AgentSecurityChecksSummary | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [behavioralData, setBehavioralData] = useState<AgentBehavioralAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checksLoading, setChecksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Phase 4.5: Analysis status and trigger state
  const [analysisStatus, setAnalysisStatus] = useState<DynamicAnalysisStatus | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // Phase 4.5: Removed old sessions_progress logic - now using analysisStatus from dedicated endpoint

  // Fetch security checks for this agent (grouped by system prompt)
  const fetchChecksData = useCallback(async () => {
    if (!agentId) return;

    setChecksLoading(true);
    try {
      const data = await fetchAgentSecurityChecks(agentId);
      setAgentsData(data.system_prompts);
      setChecksSummary(data.total_summary);
    } catch (err) {
      console.error('Failed to fetch security checks:', err);
    } finally {
      setChecksLoading(false);
    }
  }, [agentId]);

  // Fetch analysis sessions for this agent (DYNAMIC only)
  const fetchSessionsData = useCallback(async () => {
    if (!agentId) return;

    setSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(agentId);
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
  }, [agentId]);

  // Fetch behavioral analysis data
  const fetchBehavioralData = useCallback(async () => {
    if (!agentId) return;

    try {
      const data = await fetchAgentBehavioralAnalysis(agentId);
      setBehavioralData(data);
    } catch (err) {
      console.error('Failed to fetch behavioral analysis:', err);
    }
  }, [agentId]);

  // Phase 4.5: Fetch dynamic analysis status
  const fetchAnalysisStatus = useCallback(async () => {
    if (!agentId) return;

    try {
      const data = await fetchDynamicAnalysisStatus(agentId);
      setAnalysisStatus(data);
    } catch (err) {
      console.error('Failed to fetch analysis status:', err);
    }
  }, [agentId]);

  // Phase 4.5: Handle trigger analysis
  const handleTriggerAnalysis = useCallback(async () => {
    if (!agentId || isTriggering) return;

    setIsTriggering(true);
    try {
      console.log('[DynamicAnalysis] Triggering analysis for agent:', agentId);
      const result = await triggerDynamicAnalysis(agentId);
      console.log('[DynamicAnalysis] Trigger result:', result);
      
      if (result.status === 'triggered') {
        // Refresh status immediately after triggering
        await fetchAnalysisStatus();
        
        // Poll for completion every 2 seconds
        let pollCount = 0;
        const maxPolls = 60; // 2 minutes max (60 * 2s)
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            const status = await fetchDynamicAnalysisStatus(agentId);
            console.log(`[DynamicAnalysis] Poll ${pollCount}:`, { is_running: status.is_running, unanalyzed: status.total_unanalyzed_sessions });
            setAnalysisStatus(status);
            
            // Stop polling when analysis completes or max polls reached
            if (!status.is_running || pollCount >= maxPolls) {
              clearInterval(pollInterval);
              console.log('[DynamicAnalysis] Polling stopped, refreshing all data...');
              // Refresh all data after analysis completes
              await Promise.all([fetchChecksData(), fetchSessionsData(), fetchBehavioralData()]);
            }
          } catch (err) {
            console.error('[DynamicAnalysis] Poll error:', err);
          }
        }, 2000);
      } else if (result.status === 'no_new_sessions') {
        console.log('[DynamicAnalysis] No new sessions to analyze');
        await fetchAnalysisStatus();
      } else if (result.status === 'already_running') {
        console.log('[DynamicAnalysis] Analysis already running');
        await fetchAnalysisStatus();
      }
    } catch (err) {
      console.error('[DynamicAnalysis] Failed to trigger analysis:', err);
    } finally {
      setIsTriggering(false);
    }
  }, [agentId, isTriggering, fetchAnalysisStatus, fetchChecksData, fetchSessionsData, fetchBehavioralData]);

  // Fetch data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchChecksData(), 
        fetchSessionsData(), 
        fetchBehavioralData(),
        fetchAnalysisStatus(),
      ]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchChecksData, fetchSessionsData, fetchBehavioralData, fetchAnalysisStatus]);

  // Phase 4.5: Auto-refresh analysis status every 10 seconds to detect new sessions
  useEffect(() => {
    if (loading) return; // Don't poll while initial load is happening
    
    const pollInterval = setInterval(async () => {
      try {
        await fetchAnalysisStatus();
      } catch (err) {
        console.error('Failed to poll analysis status:', err);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [loading, fetchAnalysisStatus]);

  // Handle viewing outlier session
  const handleViewOutlier = useCallback((sessionId: string) => {
    navigate(`/agent/${agentId}/session/${sessionId}`);
  }, [navigate, agentId]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agents', href: '/' },
      { label: agentId || '', href: `/agent/${agentId}` },
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

  return (
    <DynamicAnalysisLayout className={className} data-testid="dynamic-analysis">
      {/* Header */}
      <PageHeader>
        <PageInfo>
          <PageTitle>Dynamic Analysis</PageTitle>
          <PageSubtitle>Agent: {agentId}</PageSubtitle>
        </PageInfo>
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
      </PageHeader>

      {/* Phase 4.5: Analysis Status Card with Run Analysis Button */}
      <AnalysisStatusCard>
        <AnalysisStatusInfo>
          <AnalysisStatusTitle>
            {analysisStatus?.is_running ? (
              <>
                <SpinningLoader>
                  <Loader2 size={16} />
                </SpinningLoader>
                Analyzing...
              </>
            ) : analysisStatus?.total_unanalyzed_sessions ? (
              <>
                <SessionsBadge>{analysisStatus.total_unanalyzed_sessions} new</SessionsBadge>
                sessions ready to analyze
              </>
            ) : analysisStatus?.total_active_sessions ? (
              <>
                <SessionsBadge>{analysisStatus.total_active_sessions} active</SessionsBadge>
                sessions in progress (waiting to complete)
              </>
            ) : analysisStatus?.last_analysis ? (
              '✓ All sessions analyzed'
            ) : (
              'No sessions yet'
            )}
          </AnalysisStatusTitle>
          <AnalysisStatusSubtitle>
            {analysisStatus?.last_analysis ? (
              <>Last analysis: {new Date(analysisStatus.last_analysis.completed_at).toLocaleString()} • {analysisStatus.last_analysis.sessions_analyzed} sessions</>
            ) : analysisStatus?.total_active_sessions ? (
              'Sessions will be ready to analyze after they complete (30s of inactivity)'
            ) : (
              'Run your agent to collect sessions, then analyze to see security insights'
            )}
          </AnalysisStatusSubtitle>
        </AnalysisStatusInfo>
        
        <RunAnalysisButton
          onClick={handleTriggerAnalysis}
          disabled={!analysisStatus?.can_trigger || isTriggering}
          $loading={analysisStatus?.is_running || isTriggering}
        >
          {analysisStatus?.is_running || isTriggering ? (
            <>
              <Loader2 size={14} />
              Analyzing...
            </>
          ) : (
            <>
              <Play size={14} />
              Run Analysis
            </>
          )}
        </RunAnalysisButton>
      </AnalysisStatusCard>

      {/* Behavioral Insights - Agent Inspector exclusive feature */}
      {behavioralData?.has_data && (
        <Section>
          <Section.Content noPadding>
            <BehavioralInsights
              stability={behavioralData.aggregate.stability_score}
              predictability={behavioralData.aggregate.predictability_score}
              outlierCount={behavioralData.aggregate.total_outliers}
              totalSessions={behavioralData.aggregate.total_sessions}
              outlierSessions={behavioralData.by_system_prompt
                .flatMap(sp => sp.outlier_sessions || [])
                .slice(0, 5)}
              interpretation={behavioralData.by_system_prompt[0]?.interpretation}
              onViewOutlier={handleViewOutlier}
            />
          </Section.Content>
        </Section>
      )}

      {/* Phase 4.5: Removed "Gathering Data" section - replaced by AnalysisStatusCard above */}

      {/* Analysis Sessions - Table with limit */}
      <Section>
        <Section.Header>
          <Section.Title>
            Recent Analysis Sessions ({Math.min(analysisSessions.length, MAX_SESSIONS_DISPLAYED)})
          </Section.Title>
          {inProgressCount > 0 && <Badge variant="medium">{inProgressCount} in progress</Badge>}
        </Section.Header>
        <Section.Content noPadding>
          <AnalysisSessionsTable
            sessions={analysisSessions}
            agentId={agentId || ''}
            loading={sessionsLoading}
            maxRows={MAX_SESSIONS_DISPLAYED}
            emptyMessage="No dynamic analysis sessions yet."
            emptyDescription="Dynamic analysis runs automatically after system prompts collect enough sessions."
          />
        </Section.Content>
      </Section>

      {/* Security Checks - Explorer with Agent Navigation */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Shield size={16} />}>Latest Security Checks</Section.Title>
          {checksSummary && checksSummary.system_prompts_analyzed > 0 && (
            <Badge variant="medium">{checksSummary.system_prompts_analyzed} system prompts</Badge>
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
              agentId={agentId || ''}
            />
          )}
        </Section.Content>
      </Section>
    </DynamicAnalysisLayout>
  );
};
