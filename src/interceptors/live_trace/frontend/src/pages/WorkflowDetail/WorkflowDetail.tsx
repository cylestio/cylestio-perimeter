import { useCallback, useEffect, useState, type FC } from 'react';

import { Bot, Calendar, Clock, FileSearch, Shield, CheckCircle, AlertCircle, ArrowRight, Link2, Activity, Zap } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { 
  fetchWorkflowFindings, 
  fetchAnalysisSessions, 
  fetchWorkflowState,
  fetchWorkflowCorrelation,
  type AnalysisSession,
  type WorkflowState,
  type WorkflowCorrelation,
} from '@api/endpoints/workflow';
import { fetchDashboard } from '@api/endpoints/dashboard';
import type { Finding, FindingsSummary } from '@api/types/findings';
import type { APIAgent } from '@api/types/dashboard';
import { workflowLink } from '../../utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';

import { FindingsTab } from '@domain/findings';

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
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [correlation, setCorrelation] = useState<WorkflowCorrelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
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

  // Fetch correlation data (only when both static and dynamic exist)
  const fetchCorrelation = useCallback(async () => {
    if (!workflowId) return;

    try {
      const data = await fetchWorkflowCorrelation(workflowId);
      setCorrelation(data);
    } catch (err) {
      console.error('Failed to fetch correlation:', err);
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
  const fetchSessions = useCallback(async () => {
    if (!workflowId) return;

    setSessionsLoading(true);
    try {
      const data = await fetchAnalysisSessions(workflowId);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch analysis sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, [workflowId]);

  // Fetch data on mount
  useEffect(() => {
    fetchWorkflowData();
    fetchFindings();
    fetchSessions();
    fetchState();
    fetchCorrelation();
  }, [fetchWorkflowData, fetchFindings, fetchSessions, fetchState, fetchCorrelation]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Portfolio', href: '/' },
      { label: 'Workflow' },
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
  const inProgressCount = sessions.filter(s => s.status === 'IN_PROGRESS').length;

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
          {sessions.length > 0 && (
            <StatBadge>
              <FileSearch size={14} />
              <StatValue>{sessions.length}</StatValue> scans
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

      {/* Correlation Section - Show when both static and dynamic exist */}
      {correlation && workflowState?.state === 'COMPLETE' && (
        <SectionCard style={{ borderColor: '#10b981', borderWidth: '2px' }}>
          <SectionHeader>
            <SectionTitle>
              <Link2 size={16} style={{ marginRight: '8px' }} />
              Static ↔ Dynamic Correlation
              <Badge variant="success">COMPLETE</Badge>
            </SectionTitle>
          </SectionHeader>
          <SectionContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ 
                background: 'rgba(99, 102, 241, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>
                  {correlation.static_findings_count}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Static Findings</div>
              </div>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {correlation.dynamic_sessions_count}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dynamic Sessions</div>
              </div>
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {correlation.dynamic_tools_used.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tools Exercised</div>
              </div>
            </div>

            {correlation.dynamic_tools_used.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Activity size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Runtime Tool Usage:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {correlation.dynamic_tools_used.map((tool) => (
                    <Badge key={tool} variant="medium">
                      <Zap size={10} style={{ marginRight: '4px' }} />
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {correlation.recommendations.length > 0 && (
              <div style={{ 
                background: 'rgba(99, 102, 241, 0.05)', 
                padding: '12px', 
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                <strong>Recommendation:</strong> {correlation.recommendations[0]}
              </div>
            )}
          </SectionContent>
        </SectionCard>
      )}

      {/* Correlation Prompt - Show when only one type exists */}
      {workflowState && (workflowState.state === 'STATIC_ONLY' || workflowState.state === 'DYNAMIC_ONLY') && (
        <SectionCard style={{ borderColor: '#f59e0b', borderWidth: '1px', borderStyle: 'dashed' }}>
          <SectionContent>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px'
            }}>
              <Link2 size={24} color="#f59e0b" />
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {workflowState.state === 'STATIC_ONLY' 
                    ? '🧪 Ready for Dynamic Validation' 
                    : '🔍 Static Analysis Recommended'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {workflowState.state === 'STATIC_ONLY'
                    ? `Run your agent through the proxy to validate ${workflowState.findings_count} static findings with actual runtime behavior.`
                    : `Run static analysis from your IDE using Agent Inspector to correlate with ${workflowState.dynamic_agents_count} dynamic sessions.`}
                </div>
              </div>
            </div>
          </SectionContent>
        </SectionCard>
      )}

      {/* Analysis Sessions */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            Analysis Sessions ({sessions.length})
            {inProgressCount > 0 && (
              <Badge variant="medium">{inProgressCount} in progress</Badge>
            )}
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          {sessionsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <OrbLoader size="md" />
            </div>
          ) : sessions.length > 0 ? (
            <SessionList>
              {sessions.map((session) => (
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
