import { useCallback, useEffect, useState, type FC } from 'react';

import { Bot, Calendar, Clock, FileSearch, Shield, ArrowRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { fetchWorkflowFindings, fetchAnalysisSessions, type AnalysisSession } from '@api/endpoints/workflow';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { Finding, FindingsSummary } from '@api/types/findings';
import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { workflowLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';

import { FindingsTab } from '@domain/findings';
import { SessionsTable } from '@domain/sessions';

import { usePageMeta } from '../../context';
import {
  WorkflowLayout,
  WorkflowHeader,
  WorkflowInfo,
  WorkflowName,
  WorkflowId,
  WorkflowStats,
  StatBadge,
  StatValue,
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionContent,
  AgentList,
  AgentListItem,
  AgentIcon,
  AgentInfo,
  AgentIdText,
  AgentMeta,
  EmptyContent,
  SessionList,
  SessionCard,
  SessionHeader,
  SessionInfo,
  SessionId,
  SessionMeta,
  SessionMetaItem,
} from './WorkflowDetail.styles';

export interface WorkflowDetailProps {
  className?: string;
}

export const WorkflowDetail: FC<WorkflowDetailProps> = ({ className }) => {
  const { workflowId } = useParams<{ workflowId: string }>();

  // State
  const [agents, setAgents] = useState<APIAgent[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsSummary, setFindingsSummary] = useState<FindingsSummary | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [liveSessions, setLiveSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [analysisSessionsLoading, setAnalysisSessionsLoading] = useState(false);
  const [liveSessionsLoading, setLiveSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch workflow data (agents in this workflow)
  const fetchWorkflowData = useCallback(async () => {
    if (!workflowId) return;

    try {
      const data = await fetchDashboard(workflowId);
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch workflow data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  // Fetch findings for this workflow
  const fetchFindings = useCallback(async () => {
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

  // Fetch analysis sessions for this workflow
  const fetchAnalysisSessionsData = useCallback(async () => {
    if (!workflowId) return;

    setAnalysisSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(workflowId);
      setAnalysisSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch analysis sessions:', err);
    } finally {
      setAnalysisSessionsLoading(false);
    }
  }, [workflowId]);

  // Fetch live sessions for this workflow
  const fetchLiveSessions = useCallback(async () => {
    if (!workflowId) return;

    setLiveSessionsLoading(true);
    try {
      const data = await fetchSessions({ workflow_id: workflowId, limit: 10 });
      setLiveSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch live sessions:', err);
    } finally {
      setLiveSessionsLoading(false);
    }
  }, [workflowId]);

  // Fetch data on mount
  useEffect(() => {
    fetchWorkflowData();
    fetchFindings();
    fetchAnalysisSessionsData();
    fetchLiveSessions();
  }, [fetchWorkflowData, fetchFindings, fetchAnalysisSessionsData, fetchLiveSessions]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Workflows', href: '/' },
      { label: workflowId || '' },
    ],
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Failed to load workflow" description={error} />;
  }

  const openCount = findingsSummary?.open_count || 0;

  // Helper to format timestamps
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to get duration in minutes
  const getDuration = (start: number, end: number) => {
    const minutes = Math.round((end - start) / 60);
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  // Count sessions by status
  const inProgressCount = analysisSessions.filter(s => s.status === 'IN_PROGRESS').length;

  return (
    <WorkflowLayout className={className} data-testid="workflow-detail">
      {/* Header */}
      <WorkflowHeader>
        <WorkflowInfo>
          <WorkflowName>Workflow</WorkflowName>
          <WorkflowId>{workflowId}</WorkflowId>
        </WorkflowInfo>
        <WorkflowStats>
          <StatBadge>
            <Bot size={14} />
            <StatValue>{agents.length}</StatValue> agents
          </StatBadge>
          {analysisSessions.length > 0 && (
            <StatBadge>
              <FileSearch size={14} />
              <StatValue>{analysisSessions.length}</StatValue> scans
            </StatBadge>
          )}
          {findingsSummary && (
            <StatBadge>
              <Shield size={14} />
              <StatValue>{findingsSummary.total_findings}</StatValue> findings
            </StatBadge>
          )}
        </WorkflowStats>
      </WorkflowHeader>

      {/* Recent Sessions */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            Recent Sessions
            {liveSessions.length > 0 && (
              <Link
                to={`/workflow/${workflowId}/sessions`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: 'var(--color-white50)',
                  textDecoration: 'none',
                }}
              >
                View All <ArrowRight size={12} />
              </Link>
            )}
          </SectionTitle>
        </SectionHeader>
        <SectionContent style={{ padding: 0 }}>
          <SessionsTable
            sessions={liveSessions}
            workflowId={workflowId || 'unassigned'}
            loading={liveSessionsLoading}
            emptyMessage="No sessions recorded for this workflow yet. Sessions will appear here once agents start processing requests."
          />
        </SectionContent>
      </SectionCard>

      {/* Analysis Sessions */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            Analysis Sessions ({analysisSessions.length})
            {inProgressCount > 0 && (
              <Badge variant="medium">{inProgressCount} in progress</Badge>
            )}
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          {analysisSessionsLoading ? (
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
                      Started {formatDate(session.created_at)}
                    </SessionMetaItem>
                    {session.completed_at && (
                      <SessionMetaItem>
                        <Clock size={12} />
                        Duration: {getDuration(session.created_at, session.completed_at)}
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
              <p>No analysis sessions yet.</p>
              <p style={{ fontSize: '12px' }}>
                Run a security scan using the MCP tools to create analysis sessions.
              </p>
            </EmptyContent>
          )}
        </SectionContent>
      </SectionCard>

      {/* Security Findings */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            Security Findings
            {openCount > 0 && (
              <Badge variant="critical">{openCount} open</Badge>
            )}
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <FindingsTab
            findings={findings}
            summary={findingsSummary || undefined}
            isLoading={findingsLoading}
          />
        </SectionContent>
      </SectionCard>

      {/* Agents List */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            Agents ({agents.length})
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          {agents.length > 0 ? (
            <AgentList>
              {agents.map((agent) => (
                <AgentListItem
                  key={agent.id}
                  as={Link}
                  to={workflowLink(workflowId, `/agent/${agent.id}`)}
                >
                  <AgentIcon>
                    <Bot size={16} />
                  </AgentIcon>
                  <AgentInfo>
                    <AgentIdText>{agent.id_short || agent.id.substring(0, 12)}</AgentIdText>
                    <AgentMeta>
                      {agent.total_sessions} sessions | {agent.active_sessions} active
                    </AgentMeta>
                  </AgentInfo>
                  <Badge variant={agent.risk_status === 'ok' ? 'success' : 'info'}>
                    {agent.risk_status === 'ok' ? 'OK' : 'EVALUATING'}
                  </Badge>
                </AgentListItem>
              ))}
            </AgentList>
          ) : (
            <EmptyContent>
              <p>No agents in this workflow yet.</p>
              <p style={{ fontSize: '12px' }}>
                Agents will appear here when they connect using this workflow ID.
              </p>
            </EmptyContent>
          )}
        </SectionContent>
      </SectionCard>
    </WorkflowLayout>
  );
};
