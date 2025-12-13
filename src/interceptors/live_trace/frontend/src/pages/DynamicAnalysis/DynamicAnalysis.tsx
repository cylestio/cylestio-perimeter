import { useCallback, useEffect, useState, type FC } from 'react';

import { AlertTriangle, FileSearch, Shield, X } from 'lucide-react';
import { useOutletContext, useParams } from 'react-router-dom';

import {
  fetchAnalysisSessions,
  fetchWorkflowSecurityChecks,
  type AnalysisSession,
  type AgentSecurityData,
  type WorkflowSecurityChecksSummary,
} from '@api/endpoints/workflow';
import type { SecurityAnalysis } from '@api/types/dashboard';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { AnalysisSessionsTable } from '@domain/analysis';

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

const MAX_SESSIONS_DISPLAYED = 5;

export const DynamicAnalysis: FC<DynamicAnalysisProps> = ({ className }) => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { securityAnalysis } = useOutletContext<DynamicAnalysisContext>() || {};

  // State
  const [agentsData, setAgentsData] = useState<AgentSecurityData[]>([]);
  const [checksSummary, setChecksSummary] = useState<WorkflowSecurityChecksSummary | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [checksLoading, setChecksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Get dynamic analysis session progress
  const sessionsProgress = securityAnalysis?.dynamic?.sessions_progress;
  const isGatheringSessions = sessionsProgress && 
    securityAnalysis?.dynamic?.status === 'active' && 
    analysisSessions.length === 0;

  // Fetch security checks for this workflow (grouped by agent)
  const fetchChecksData = useCallback(async () => {
    if (!workflowId) return;

    setChecksLoading(true);
    try {
      const data = await fetchWorkflowSecurityChecks(workflowId);
      setAgentsData(data.agents);
      setChecksSummary(data.total_summary);
    } catch (err) {
      console.error('Failed to fetch security checks:', err);
    } finally {
      setChecksLoading(false);
    }
  }, [workflowId]);

  // Fetch analysis sessions for this workflow (DYNAMIC only)
  const fetchSessionsData = useCallback(async () => {
    if (!workflowId) return;

    setSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(workflowId);
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
  }, [workflowId]);

  // Fetch data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchChecksData(), fetchSessionsData()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchChecksData, fetchSessionsData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Workflows', href: '/' },
      { label: workflowId || '', href: `/workflow/${workflowId}` },
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
    <Page className={className} data-testid="dynamic-analysis">
      {/* Header */}
      <PageHeader
        title="Dynamic Analysis"
        description={`Workflow: ${workflowId}`}
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
            Recent Analysis Sessions ({Math.min(analysisSessions.length, MAX_SESSIONS_DISPLAYED)})
          </Section.Title>
          {inProgressCount > 0 && <Badge variant="medium">{inProgressCount} in progress</Badge>}
        </Section.Header>
        <Section.Content noPadding>
          <AnalysisSessionsTable
            sessions={analysisSessions}
            workflowId={workflowId || ''}
            loading={sessionsLoading}
            maxRows={MAX_SESSIONS_DISPLAYED}
            emptyMessage="No dynamic analysis sessions yet."
            emptyDescription="Dynamic analysis runs automatically after agents collect enough sessions."
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
              workflowId={workflowId || ''}
            />
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
