import { useCallback, useEffect, useState, type FC } from 'react';

import { Calendar, Clock, FileSearch, Shield } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { fetchWorkflowFindings, fetchAnalysisSessions, type AnalysisSession } from '@api/endpoints/workflow';
import type { Finding, FindingsSummary } from '@api/types/findings';

import { formatDateTime, formatDuration, getDurationMinutes } from '@utils/formatting';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { FindingsTab } from '@domain/findings';

import { usePageMeta } from '../../context';
import {
  PageStats,
  StatBadge,
  StatValue,
  SessionList,
  SessionCard,
  SessionHeader,
  SessionInfo,
  SessionId,
  SessionMeta,
  SessionMetaItem,
  EmptyContent,
} from './StaticAnalysis.styles';

export interface StaticAnalysisProps {
  className?: string;
}

export const StaticAnalysis: FC<StaticAnalysisProps> = ({ className }) => {
  const { workflowId } = useParams<{ workflowId: string }>();

  // State
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsSummary, setFindingsSummary] = useState<FindingsSummary | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Fetch findings for this workflow
  const fetchFindingsData = useCallback(async () => {
    if (!workflowId) return;

    setFindingsLoading(true);
    try {
      const data = await fetchWorkflowFindings(workflowId);
      setFindings(data.findings);
      setFindingsSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    } finally {
      setFindingsLoading(false);
    }
  }, [workflowId]);

  // Fetch analysis sessions for this workflow (STATIC and AUTOFIX only)
  const fetchSessionsData = useCallback(async () => {
    if (!workflowId) return;

    setSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(workflowId);
      // Filter to only STATIC and AUTOFIX sessions
      const filteredSessions = (data.sessions || []).filter(
        (session) => session.session_type === 'STATIC' || session.session_type === 'AUTOFIX'
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
      await Promise.all([fetchFindingsData(), fetchSessionsData()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchFindingsData, fetchSessionsData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Workflows', href: '/' },
      { label: workflowId || '', href: `/workflow/${workflowId}` },
      { label: 'Static Analysis' },
    ],
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  const openCount = findingsSummary?.open_count || 0;
  const inProgressCount = analysisSessions.filter(s => s.status === 'IN_PROGRESS').length;

  return (
    <Page className={className} data-testid="static-analysis">
      {/* Header */}
      <PageHeader
        title="Static Analysis"
        description={`Workflow: ${workflowId}`}
        actions={
          <PageStats>
            <StatBadge>
              <FileSearch size={14} />
              <StatValue>{analysisSessions.length}</StatValue> scans
            </StatBadge>
            {findingsSummary && (
              <StatBadge>
                <Shield size={14} />
                <StatValue>{findingsSummary.total_findings}</StatValue> findings
              </StatBadge>
            )}
          </PageStats>
        }
      />

      {/* Analysis Sessions */}
      <Section>
        <Section.Header>
          <Section.Title>
            Analysis Sessions ({analysisSessions.length})
          </Section.Title>
          {inProgressCount > 0 && (
            <Badge variant="medium">{inProgressCount} in progress</Badge>
          )}
        </Section.Header>
        <Section.Content>
          {sessionsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <OrbLoader size="md" />
            </div>
          ) : analysisSessions.length > 0 ? (
            <SessionList>
              {analysisSessions.map((session) => (
                <SessionCard key={session.session_id}>
                  <SessionHeader>
                    <SessionInfo>
                      <Badge variant={
                        session.session_type === 'STATIC' ? 'info' :
                        session.session_type === 'AUTOFIX' ? 'success' : 'medium'
                      }>
                        {session.session_type}
                      </Badge>
                      <SessionId>{session.session_id}</SessionId>
                    </SessionInfo>
                    <Badge variant={session.status === 'COMPLETED' ? 'success' : 'medium'}>
                      {session.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </SessionHeader>
                  <SessionMeta>
                    <SessionMetaItem>
                      <Calendar size={12} />
                      Started {formatDateTime(session.created_at)}
                    </SessionMetaItem>
                    {session.completed_at && (
                      <SessionMetaItem>
                        <Clock size={12} />
                        Duration: {formatDuration(getDurationMinutes(session.created_at, session.completed_at) || 0)}
                      </SessionMetaItem>
                    )}
                    <SessionMetaItem>
                      <Shield size={12} />
                      {session.findings_count} findings
                    </SessionMetaItem>
                    {session.risk_score !== undefined && session.risk_score !== null && (
                      <SessionMetaItem>
                        Risk: {session.risk_score}/100
                      </SessionMetaItem>
                    )}
                  </SessionMeta>
                </SessionCard>
              ))}
            </SessionList>
          ) : (
            <EmptyContent>
              <p>No static analysis sessions yet.</p>
              <p style={{ fontSize: '12px' }}>
                Run a security scan using the MCP tools to create analysis sessions.
              </p>
            </EmptyContent>
          )}
        </Section.Content>
      </Section>

      {/* Security Findings */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Shield size={16} />}>Security Findings</Section.Title>
          {openCount > 0 && <Badge variant="critical">{openCount} open</Badge>}
        </Section.Header>
        <Section.Content>
          <FindingsTab
            findings={findings}
            summary={findingsSummary || undefined}
            isLoading={findingsLoading}
          />
        </Section.Content>
      </Section>
    </Page>
  );
};
