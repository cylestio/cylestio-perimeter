import { useCallback, useEffect, useState, type FC } from 'react';

import { AlertTriangle, FileSearch, Shield, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

import {
  fetchAnalysisSessions,
  fetchWorkflowSecurityChecks,
  type AnalysisSession,
  type AgentSecurityData,
  type WorkflowSecurityChecksSummary,
} from '@api/endpoints/workflow';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Section } from '@ui/layout/Section';

import { AnalysisSessionsTable } from '@domain/analysis';

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
} from './DynamicAnalysis.styles';

export interface DynamicAnalysisProps {
  className?: string;
}

const MAX_SESSIONS_DISPLAYED = 5;

export const DynamicAnalysis: FC<DynamicAnalysisProps> = ({ className }) => {
  const { workflowId } = useParams<{ workflowId: string }>();

  // State
  const [agentsData, setAgentsData] = useState<AgentSecurityData[]>([]);
  const [checksSummary, setChecksSummary] = useState<WorkflowSecurityChecksSummary | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [checksLoading, setChecksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  const inProgressCount = analysisSessions.filter((s) => s.status === 'IN_PROGRESS').length;

  return (
    <DynamicAnalysisLayout className={className} data-testid="dynamic-analysis">
      {/* Header */}
      <PageHeader>
        <PageInfo>
          <PageTitle>Dynamic Analysis</PageTitle>
          <PageSubtitle>Workflow: {workflowId}</PageSubtitle>
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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <OrbLoader size="md" />
            </div>
          ) : (
            <SecurityChecksExplorer
              agents={agentsData}
              workflowId={workflowId || ''}
            />
          )}
        </Section.Content>
      </Section>
    </DynamicAnalysisLayout>
  );
};
