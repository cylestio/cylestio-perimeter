import { useCallback, useEffect, useState, type FC } from 'react';

import { Bot, Calendar, Clock, FileSearch, Shield, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { 
  fetchWorkflowFindings, 
  fetchAnalysisSessions, 
  fetchWorkflowState,
  type AnalysisSession,
  type WorkflowState,
} from '@api/endpoints/workflow';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { Finding, FindingsSummary } from '@api/types/findings';
import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { workflowLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Section } from '@ui/layout/Section';

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
  LifecycleBanner,
  LifecycleIcon,
  LifecycleContent,
  LifecycleTitle,
  LifecycleMessage,
  LifecycleStages,
  LifecycleStage,
  StageArrow,
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
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
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

  // Fetch workflow state
  const fetchState = useCallback(async () => {
    if (!workflowId) return;

    try {
      const state = await fetchWorkflowState(workflowId);
      setWorkflowState(state);
    } catch (err) {
      console.error('Failed to fetch workflow state:', err);
    }
  }, [workflowId]);

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
    fetchFindingsData();
    fetchAnalysisSessionsData();
    fetchLiveSessions();
    fetchState();
  }, [fetchWorkflowData, fetchFindingsData, fetchAnalysisSessionsData, fetchLiveSessions, fetchState]);

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

  // Helper to format timestamps (handles both ISO strings and Unix timestamps)
  const formatDate = (timestamp: string | number | null | undefined) => {
    if (!timestamp) return 'Invalid Date';
    try {
      const date = typeof timestamp === 'string' 
        ? new Date(timestamp)
        : new Date(timestamp * 1000);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper to get duration in minutes (handles both ISO strings and Unix timestamps)
  const getDuration = (start: string | number | null | undefined, end: string | number | null | undefined) => {
    if (!start || !end) return 'N/A';
    try {
      const startDate = typeof start === 'string' ? new Date(start) : new Date(start * 1000);
      const endDate = typeof end === 'string' ? new Date(end) : new Date(end * 1000);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'N/A';
      const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      if (minutes < 1) return 'Less than a minute';
      if (minutes === 1) return '1 minute';
      return `${minutes} minutes`;
    } catch {
      return 'N/A';
    }
  };

  // Count sessions by status
  const inProgressCount = analysisSessions.filter(s => s.status === 'IN_PROGRESS').length;

  // Get lifecycle state info
  const getLifecycleInfo = () => {
    if (!workflowState) return null;
    
    switch (workflowState.state) {
      case 'COMPLETE':
        return {
          icon: <CheckCircle size={20} color="#10b981" />,
          title: 'Complete Analysis Available',
          message: 'Both static and dynamic analysis data available for this workflow.',
        };
      case 'STATIC_ONLY':
        return {
          icon: <AlertCircle size={20} color="#f59e0b" />,
          title: 'Static Analysis Only',
          message: workflowState.recommendation || 'Run dynamic testing to validate findings.',
        };
      case 'DYNAMIC_ONLY':
        return {
          icon: <AlertCircle size={20} color="#f59e0b" />,
          title: 'Dynamic Data Only',
          message: workflowState.recommendation || 'Run static analysis from your IDE for correlation.',
        };
      default:
        return {
          icon: <AlertCircle size={20} color="#6366f1" />,
          title: 'Get Started',
          message: workflowState.recommendation || 'Run static or dynamic analysis to begin.',
        };
    }
  };

  const lifecycleInfo = getLifecycleInfo();

  return (
    <WorkflowLayout className={className} data-testid="workflow-detail">
      {/* Lifecycle Banner */}
      {workflowState && lifecycleInfo && (
        <LifecycleBanner $state={workflowState.state}>
          <LifecycleIcon>{lifecycleInfo.icon}</LifecycleIcon>
          <LifecycleContent>
            <LifecycleTitle>{lifecycleInfo.title}</LifecycleTitle>
            <LifecycleMessage>{lifecycleInfo.message}</LifecycleMessage>
            <LifecycleStages>
              <LifecycleStage 
                $active={!workflowState.has_static_analysis && !workflowState.has_dynamic_sessions} 
                $complete={false}
              >
                Development
              </LifecycleStage>
              <StageArrow><ArrowRight size={12} /></StageArrow>
              <LifecycleStage 
                $active={workflowState.has_static_analysis && !workflowState.has_dynamic_sessions}
                $complete={workflowState.has_static_analysis}
              >
                Static Scan {workflowState.has_static_analysis && `(${workflowState.findings_count})`}
              </LifecycleStage>
              <StageArrow><ArrowRight size={12} /></StageArrow>
              <LifecycleStage 
                $active={workflowState.has_dynamic_sessions}
                $complete={workflowState.has_dynamic_sessions}
              >
                Dynamic Test {workflowState.has_dynamic_sessions && `(${workflowState.dynamic_agents_count})`}
              </LifecycleStage>
              <StageArrow><ArrowRight size={12} /></StageArrow>
              <LifecycleStage $active={false} $complete={false}>
                Production 🔒
              </LifecycleStage>
            </LifecycleStages>
          </LifecycleContent>
        </LifecycleBanner>
      )}

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
      <SessionsTable
        sessions={liveSessions}
        workflowId={workflowId || 'unassigned'}
        loading={liveSessionsLoading}
        emptyMessage="No sessions recorded for this workflow yet. Sessions will appear here once agents start processing requests."
        header={
          <>
            <Section.Title>Recent Sessions</Section.Title>
            {liveSessions.length > 0 && (
              <Link
                to={`/workflow/${workflowId}/sessions`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--color-white50)',
                  textDecoration: 'none',
                }}
              >
                View All <ArrowRight size={12} />
              </Link>
            )}
          </>
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

      {/* Agents List */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Bot size={16} />}>Agents ({agents.length})</Section.Title>
        </Section.Header>
        <Section.Content>
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
        </Section.Content>
      </Section>
    </WorkflowLayout>
  );
};
