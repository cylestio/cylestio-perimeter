import { useCallback, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Activity, AlertTriangle, Bot, CheckCircle, Target } from 'lucide-react';

import type { APIAgent, APISession, DashboardResponse } from '@api/types/dashboard';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { formatAgentName, formatDuration } from '@utils/formatting';
import { usePolling } from '@hooks/usePolling';

import { Card } from '@ui/core/Card';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Skeleton } from '@ui/feedback/Skeleton';
import { StatsRow, TwoColumn, Stack } from '@ui/layout/Grid';

import { SessionItem } from '@domain/activity';
import { AgentCard } from '@domain/agents';
import { StatCard } from '@domain/metrics/StatCard';

import { usePageMeta } from '../../context';
import { AgentsGrid, SessionsList } from './Portfolio.styles';

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
const getSessionStatus = (session: APISession): 'ACTIVE' | 'COMPLETE' | 'ERROR' => {
  if (session.is_active) return 'ACTIVE';
  if (session.errors > 0) return 'ERROR';
  return 'COMPLETE';
};

export const Portfolio: FC = () => {
  const navigate = useNavigate();

  usePageMeta({
    breadcrumbs: [{ label: 'Portfolio' }],
  });

  // Use polling for live updates every 2 seconds
  const fetchFn = useCallback(() => fetchDashboard(), []);
  const { data, error, loading } = usePolling<DashboardResponse>(fetchFn, {
    interval: 2000,
    enabled: true,
  });

  const agents = data?.agents ?? [];
  const sessions = data?.sessions ?? [];

  // Calculate summary stats from agents
  const totalAgents = agents.length;
  const totalErrors = agents.reduce((sum, a) => sum + a.total_errors, 0);
  const totalSessions = agents.reduce((sum, a) => sum + a.total_sessions, 0);
  const activeAgents = agents.filter((a) => a.active_sessions > 0).length;

  const isLoading = loading && !data;

  return (
    <>
      <Stack gap="lg">
        {/* Overview Stats - 5 columns */}
        <StatsRow columns={5}>
          <StatCard
            icon={<Bot size={16} />}
            iconColor="cyan"
            label="Total Agents"
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
            detail="Across all agents"
            size="sm"
          />
          <StatCard
            icon={<CheckCircle size={16} />}
            iconColor="green"
            label="OK Status"
            value={isLoading ? '-' : agents.filter((a) => a.risk_status === 'ok').length}
            valueColor="green"
            detail="Evaluated agents"
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
              ) : error ? (
                <EmptyState
                  icon={<AlertTriangle size={24} />}
                  title="Failed to load agents"
                  description={error}
                />
              ) : agents.length === 0 ? (
                <EmptyState
                  icon={<Bot size={24} />}
                  title="No agents yet"
                  description="Connect your first agent to get started. Go to the Connect page for instructions."
                />
              ) : (
                agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    {...transformAgent(agent)}
                    onClick={() => navigate(`/portfolio/agent/${agent.id}`)}
                  />
                ))
              )}
            </AgentsGrid>
          }
          sidebar={
            <Card>
              <Card.Header title="Recent Sessions" />
              <Card.Content>
                {isLoading ? (
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
                    {sessions.slice(0, 10).map((session) => (
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
                        onClick={() => navigate(`/portfolio/session/${session.id}`)}
                      />
                    ))}
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
