import { useState, useEffect, useCallback, type FC } from 'react';

import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import { Activity, AlertTriangle, Bot, CheckCircle, Target } from 'lucide-react';

import type { APIAgent } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { fetchSessions } from '@api/endpoints/session';
import { buildWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import { formatAgentName, formatDuration } from '@utils/formatting';

import { Card } from '@ui/core/Card';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Skeleton } from '@ui/feedback/Skeleton';
import { StatsRow, TwoColumn, Stack } from '@ui/layout/Grid';

import { SessionItem } from '@domain/activity';
import { AgentCard } from '@domain/agents';
import { StatCard } from '@domain/metrics/StatCard';

import { usePageMeta } from '../../context';
import { AgentsGrid, SessionsList } from './Portfolio.styles';

// Context type from App.tsx outlet
interface PortfolioContext {
  agents: APIAgent[];
  sessionsCount: number;
  loading: boolean;
}

// Transform API agent to AgentCard props
const transformAgent = (agent: APIAgent) => ({
  id: agent.id,
  name: formatAgentName(agent.id),
  totalSessions: agent.total_sessions,
  totalErrors: agent.total_errors,
  totalTools: agent.total_tools,
  lastSeen: agent.last_seen_relative,
  riskStatus: agent.risk_status,
  currentSessions: agent.current_sessions,
  minSessionsRequired: agent.min_sessions_required,
  hasCriticalFinding: agent.analysis_summary?.action_required ?? false,
  // Behavioral metrics (when evaluation complete)
  stability: agent.analysis_summary?.behavioral?.stability,
  predictability: agent.analysis_summary?.behavioral?.predictability,
  confidence: agent.analysis_summary?.behavioral?.confidence as 'high' | 'medium' | 'low' | undefined,
  failedChecks: agent.analysis_summary?.failed_checks ?? 0,
  warnings: agent.analysis_summary?.warnings ?? 0,
});

// Helper to map API session status to SessionItem status
const getSessionStatus = (session: SessionListItem): 'ACTIVE' | 'COMPLETE' | 'ERROR' => {
  if (session.is_active) return 'ACTIVE';
  if (session.errors > 0) return 'ERROR';
  return 'COMPLETE';
};

export const Portfolio: FC = () => {
  const navigate = useNavigate();
  const { workflowId } = useParams<{ workflowId?: string }>();
  const { agents, loading } = useOutletContext<PortfolioContext>();

  // Fetch sessions from the new API
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions({
        workflow_id: workflowId || undefined,
        limit: 10,
      });
      setSessions(data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [workflowId]);

  // Fetch sessions on mount and when workflowId changes
  useEffect(() => {
    loadSessions();
    // Refresh sessions periodically
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  usePageMeta({
    breadcrumbs: workflowId
      ? buildWorkflowBreadcrumbs(workflowId, { label: 'System prompts' })
      : [{ label: 'Agents', href: '/' }],
  });

  // Calculate summary stats from agents
  const totalAgents = agents.length;
  const totalErrors = agents.reduce((sum, a) => sum + a.total_errors, 0);
  const totalSessions = agents.reduce((sum, a) => sum + a.total_sessions, 0);
  const activeAgents = agents.filter((a) => a.active_sessions > 0).length;

  const isLoading = loading && agents.length === 0;

  return (
    <>
      <Stack gap="lg">
        {/* Overview Stats - 5 columns */}
        <StatsRow columns={5}>
          <StatCard
            icon={<Bot size={16} />}
            iconColor="cyan"
            label="Total System Prompts"
            value={isLoading ? '-' : totalAgents}
            detail={`${activeAgents} active sessions`}
            size="sm"
          />
          <StatCard
            icon={<AlertTriangle size={16} />}
            iconColor="red"
            label="Total Errors"
            value={isLoading ? '-' : totalErrors}
            valueColor={totalErrors > 0 ? 'red' : undefined}
            detail="Across all system prompts"
            size="sm"
          />
          <StatCard
            icon={<CheckCircle size={16} />}
            iconColor="green"
            label="OK Status"
            value={isLoading ? '-' : agents.filter((a) => a.risk_status === 'ok').length}
            valueColor="green"
            detail="Evaluated system prompts"
            size="sm"
          />
          <StatCard
            icon={<Activity size={16} />}
            iconColor="purple"
            label="Total Sessions"
            value={isLoading ? '-' : totalSessions}
            valueColor="purple"
            detail="All time"
            size="sm"
          />
          <StatCard
            icon={<Target size={16} />}
            iconColor="orange"
            label="Evaluating"
            value={isLoading ? '-' : agents.filter((a) => a.risk_status === 'evaluating').length}
            valueColor="orange"
            detail="Need more sessions"
            size="sm"
          />
        </StatsRow>

        {/* Two Column Layout: Agents Grid + Activity Feed */}
        <TwoColumn
          main={
            <AgentsGrid>
              {isLoading ? (
                // Loading skeletons
                <>
                  <Skeleton variant="rect" height={200} />
                  <Skeleton variant="rect" height={200} />
                  <Skeleton variant="rect" height={200} />
                  <Skeleton variant="rect" height={200} />
                </>
              ) : agents.length === 0 ? (
                <EmptyState
                  icon={<Bot size={24} />}
                  title="No system prompts yet"
                  description="Connect your first system prompt to get started. Go to the Connect page for instructions."
                />
              ) : (
                agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    {...transformAgent(agent)}
                    onClick={() => {
                      const agentWorkflowId = workflowId || agent.workflow_id || 'unassigned';
                      navigate(`/workflow/${agentWorkflowId}/agent/${agent.id}`);
                    }}
                  />
                ))
              )}
            </AgentsGrid>
          }
          sidebar={
            <Card>
              <Card.Header title="Recent Sessions" />
              <Card.Content>
                {sessionsLoading ? (
                  <SessionsList>
                    <Skeleton variant="rect" height={60} />
                    <Skeleton variant="rect" height={60} />
                    <Skeleton variant="rect" height={60} />
                  </SessionsList>
                ) : sessions.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: 'var(--color-white-50)',
                      fontSize: '13px',
                    }}
                  >
                    No sessions yet
                  </div>
                ) : (
                  <SessionsList>
                    {sessions.map((session) => {
                      // Use session's workflow_id if available, or get from URL, or from agent
                      const agent = agents.find(a => a.id === session.agent_id);
                      const sessionWorkflowId = session.workflow_id || workflowId || agent?.workflow_id || 'unassigned';
                      return (
                        <SessionItem
                          key={session.id}
                          agentId={session.agent_id}
                          agentName={formatAgentName(session.agent_id)}
                          sessionId={session.id.slice(0, 8)}
                          status={getSessionStatus(session)}
                          isActive={session.is_active}
                          duration={formatDuration(session.duration_minutes)}
                          lastActivity={session.last_activity_relative}
                          hasErrors={session.errors > 0}
                          onClick={() => navigate(`/workflow/${sessionWorkflowId}/session/${session.id}`)}
                        />
                      );
                    })}
                  </SessionsList>
                )}
              </Card.Content>
            </Card>
          }
        />
      </Stack>
    </>
  );
};
