import { useCallback, useEffect, useState, type FC } from 'react';

import { Bot, Calendar, Clock, FileSearch, Shield, ArrowRight, Code, Activity, Lightbulb } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { fetchAgentWorkflowFindings, fetchAnalysisSessions, type AnalysisSession } from '@api/endpoints/agentWorkflow';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { Finding, FindingsSummary } from '@api/types/findings';
import type { APIAgent, SecurityAnalysis, AnalysisStage } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';

import { formatDateTime, formatDuration, getDurationMinutes } from '@utils/formatting';
import { agentWorkflowLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Page } from '@ui/layout/Page';
import { Section } from '@ui/layout/Section';

import { LifecycleProgress, type LifecycleStage } from '@domain/activity';
import { FindingsTab } from '@domain/findings';
import { SessionsTable } from '@domain/sessions';

import { usePageMeta } from '../../context';
import {
  AgentWorkflowHeader,
  AgentWorkflowInfo,
  AgentWorkflowName,
  AgentWorkflowId,
  AgentWorkflowStats,
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
} from './AgentWorkflowDetail.styles';

export interface AgentWorkflowDetailProps {
  className?: string;
}

export const AgentWorkflowDetail: FC<AgentWorkflowDetailProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  // State
  const [agents, setAgents] = useState<APIAgent[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsSummary, setFindingsSummary] = useState<FindingsSummary | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysis | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [liveSessions, setLiveSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [analysisSessionsLoading, setAnalysisSessionsLoading] = useState(false);
  const [liveSessionsLoading, setLiveSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent workflow data (agents + security analysis)
  const fetchAgentWorkflowData = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const data = await fetchDashboard(agentWorkflowId);
      setAgents(data.agents || []);
      setSecurityAnalysis(data.security_analysis ?? null);
    } catch (err) {
      console.error('Failed to fetch agent workflow data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent workflow');
    } finally {
      setLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch findings for this agent workflow
  const fetchFindings = useCallback(async () => {
    if (!agentWorkflowId) return;

    setFindingsLoading(true);
    try {
      const data = await fetchAgentWorkflowFindings(agentWorkflowId);
      setFindings(data.findings);
      setFindingsSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    } finally {
      setFindingsLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch analysis sessions for this agent workflow
  const fetchAnalysisSessionsData = useCallback(async () => {
    if (!agentWorkflowId) return;

    setAnalysisSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(agentWorkflowId);
      setAnalysisSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch analysis sessions:', err);
    } finally {
      setAnalysisSessionsLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch live sessions for this agent workflow
  const fetchLiveSessions = useCallback(async () => {
    if (!agentWorkflowId) return;

    setLiveSessionsLoading(true);
    try {
      const data = await fetchSessions({ agent_workflow_id: agentWorkflowId, limit: 10 });
      setLiveSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch live sessions:', err);
    } finally {
      setLiveSessionsLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch data on mount
  useEffect(() => {
    fetchAgentWorkflowData();
    fetchFindings();
    fetchAnalysisSessionsData();
    fetchLiveSessions();
  }, [fetchAgentWorkflowData, fetchFindings, fetchAnalysisSessionsData, fetchLiveSessions]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agent Workflows', href: '/' },
      { label: agentWorkflowId || '' },
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
    return <EmptyState title="Failed to load agent workflow" description={error} />;
  }

  const openCount = findingsSummary?.open_count || 0;

  // Count sessions by status
  const inProgressCount = analysisSessions.filter(s => s.status === 'IN_PROGRESS').length;

  // Derive stat string from analysis stage (frontend logic)
  const getStageStat = (stage: AnalysisStage | undefined): string | undefined => {
    if (!stage) return undefined;
    if (stage.status === 'active') return 'Running...';
    if (stage.status !== 'completed' || !stage.findings) return undefined;

    const { by_severity, by_status } = stage.findings;
    const critical = by_severity?.CRITICAL ?? 0;
    const high = by_severity?.HIGH ?? 0;
    const open = by_status?.OPEN ?? 0;

    if (critical > 0) return `${critical} critical`;
    if (high > 0) return `${high} high`;
    if (open > 0) return `${open} open`;
    return 'All clear';
  };

  // Convert backend security analysis to lifecycle stages
  const lifecycleStages: LifecycleStage[] = [
    {
      id: 'static',
      label: 'Static',
      icon: <Code size={16} />,
      status: securityAnalysis?.static.status ?? 'pending',
      stat: getStageStat(securityAnalysis?.static),
    },
    {
      id: 'dynamic',
      label: 'Dynamic',
      icon: <Activity size={16} />,
      status: securityAnalysis?.dynamic.status ?? 'pending',
      stat: getStageStat(securityAnalysis?.dynamic),
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Lightbulb size={16} />,
      status: securityAnalysis?.recommendations.status ?? 'pending',
      stat: getStageStat(securityAnalysis?.recommendations),
    },
  ];

  return (
    <Page className={className} data-testid="agent-workflow-detail">
      {/* Header */}
      <AgentWorkflowHeader>
        <AgentWorkflowInfo>
          <AgentWorkflowName>Agent Workflow</AgentWorkflowName>
          <AgentWorkflowId>{agentWorkflowId}</AgentWorkflowId>
        </AgentWorkflowInfo>
        <AgentWorkflowStats>
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
        </AgentWorkflowStats>
      </AgentWorkflowHeader>

      {/* Analysis Lifecycle Progress */}
      <Section>
        <Section.Header>
          <Section.Title>Analysis Progress</Section.Title>
        </Section.Header>
        <Section.Content>
          <LifecycleProgress stages={lifecycleStages} />
        </Section.Content>
      </Section>

      {/* Recent Sessions */}
      <SessionsTable
        sessions={liveSessions}
        agentWorkflowId={agentWorkflowId || 'unassigned'}
        loading={liveSessionsLoading}
        showAgentColumn
        emptyMessage="No sessions recorded for this agent workflow yet. Sessions will appear here once agents start processing requests."
        header={
          <>
            <Section.Title>Recent Sessions</Section.Title>
            {liveSessions.length > 0 && (
              <Link
                to={`/agent-workflow/${agentWorkflowId}/sessions`}
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
                  to={agentWorkflowLink(agentWorkflowId, `/agent/${agent.id}`)}
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
              <p>No agents in this agent workflow yet.</p>
              <p style={{ fontSize: '12px' }}>
                Agents will appear here when they connect using this agent workflow ID.
              </p>
            </EmptyContent>
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
