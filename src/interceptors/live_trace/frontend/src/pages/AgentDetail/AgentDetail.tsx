import { useCallback, useEffect, useState, type FC } from 'react';

import { Bot, Calendar, Clock, FileSearch, Shield, ArrowRight, Code, Activity, Lightbulb } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { fetchAgentFindings, fetchAnalysisSessions, type AnalysisSession } from '@api/endpoints/agent';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { Finding, FindingsSummary } from '@api/types/findings';
import type { APIAgent, SecurityAnalysis, AnalysisStage } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';

import { formatDateTime, formatDuration, getDurationMinutes } from '@utils/formatting';
import { agentLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Section } from '@ui/layout/Section';

import { LifecycleProgress, type LifecycleStage } from '@domain/activity';
import { FindingsTab } from '@domain/findings';
import { SessionsTable } from '@domain/sessions';

import { usePageMeta } from '../../context';
import {
  AgentLayout,
  AgentHeader,
  AgentHeaderInfo,
  AgentHeaderName,
  AgentHeaderId,
  AgentHeaderStats,
  StatBadge,
  StatValue,
  SystemPromptList,
  SystemPromptListItem,
  SystemPromptIcon,
  SystemPromptInfo,
  SystemPromptIdText,
  SystemPromptMeta,
  EmptyContent,
  SessionList,
  SessionCard,
  SessionHeader,
  SessionInfo,
  SessionId,
  SessionMeta,
  SessionMetaItem,
} from './AgentDetail.styles';

export interface AgentDetailProps {
  className?: string;
}

export const AgentDetail: FC<AgentDetailProps> = ({ className }) => {
  const { agentId } = useParams<{ agentId: string }>();

  // State
  const [systemPrompts, setSystemPrompts] = useState<APIAgent[]>([]);
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

  // Fetch agent data (system prompts + security analysis)
  const fetchAgentData = useCallback(async () => {
    if (!agentId) return;

    try {
      const data = await fetchDashboard(agentId);
      setSystemPrompts(data.agents || []);
      setSecurityAnalysis(data.security_analysis ?? null);
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Fetch findings for this agent
  const fetchFindings = useCallback(async () => {
    if (!agentId) return;

    setFindingsLoading(true);
    try {
      const data = await fetchAgentFindings(agentId);
      setFindings(data.findings);
      setFindingsSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    } finally {
      setFindingsLoading(false);
    }
  }, [agentId]);

  // Fetch analysis sessions for this agent
  const fetchAnalysisSessionsData = useCallback(async () => {
    if (!agentId) return;

    setAnalysisSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(agentId);
      setAnalysisSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch analysis sessions:', err);
    } finally {
      setAnalysisSessionsLoading(false);
    }
  }, [agentId]);

  // Fetch live sessions for this agent
  const fetchLiveSessions = useCallback(async () => {
    if (!agentId) return;

    setLiveSessionsLoading(true);
    try {
      const data = await fetchSessions({ agent_id: agentId, limit: 10 });
      setLiveSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch live sessions:', err);
    } finally {
      setLiveSessionsLoading(false);
    }
  }, [agentId]);

  // Fetch data on mount
  useEffect(() => {
    fetchAgentData();
    fetchFindings();
    fetchAnalysisSessionsData();
    fetchLiveSessions();
  }, [fetchAgentData, fetchFindings, fetchAnalysisSessionsData, fetchLiveSessions]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agents', href: '/' },
      { label: agentId || '' },
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
    return <EmptyState title="Failed to load agent" description={error} />;
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
    <AgentLayout className={className} data-testid="agent-detail">
      {/* Header */}
      <AgentHeader>
        <AgentHeaderInfo>
          <AgentHeaderName>Agent</AgentHeaderName>
          <AgentHeaderId>{agentId}</AgentHeaderId>
        </AgentHeaderInfo>
        <AgentHeaderStats>
          <StatBadge>
            <Bot size={14} />
            <StatValue>{systemPrompts.length}</StatValue> system prompts
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
        </AgentHeaderStats>
      </AgentHeader>

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
        agentId={agentId || 'unassigned'}
        loading={liveSessionsLoading}
        showAgentColumn
        emptyMessage="No sessions recorded for this agent yet. Sessions will appear here once system prompts start processing requests."
        header={
          <>
            <Section.Title>Recent Sessions</Section.Title>
            {liveSessions.length > 0 && (
              <Link
                to={`/agent/${agentId}/sessions`}
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

      {/* System Prompts List */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Bot size={16} />}>System Prompts ({systemPrompts.length})</Section.Title>
        </Section.Header>
        <Section.Content>
          {systemPrompts.length > 0 ? (
            <SystemPromptList>
              {systemPrompts.map((systemPrompt) => (
                <SystemPromptListItem
                  key={systemPrompt.id}
                  as={Link}
                  to={agentLink(agentId, `/system-prompt/${systemPrompt.id}`)}
                >
                  <SystemPromptIcon>
                    <Bot size={16} />
                  </SystemPromptIcon>
                  <SystemPromptInfo>
                    <SystemPromptIdText>{systemPrompt.id_short || systemPrompt.id.substring(0, 12)}</SystemPromptIdText>
                    <SystemPromptMeta>
                      {systemPrompt.total_sessions} sessions | {systemPrompt.active_sessions} active
                    </SystemPromptMeta>
                  </SystemPromptInfo>
                  <Badge variant={systemPrompt.risk_status === 'ok' ? 'success' : 'info'}>
                    {systemPrompt.risk_status === 'ok' ? 'OK' : 'EVALUATING'}
                  </Badge>
                </SystemPromptListItem>
              ))}
            </SystemPromptList>
          ) : (
            <EmptyContent>
              <p>No system prompts in this agent yet.</p>
              <p style={{ fontSize: '12px' }}>
                System prompts will appear here when they connect using this agent ID.
              </p>
            </EmptyContent>
          )}
        </Section.Content>
      </Section>
    </AgentLayout>
  );
};
