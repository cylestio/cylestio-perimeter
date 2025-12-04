import { useState, useEffect, type FC } from 'react';

import { Activity, AlertTriangle, Bot, CheckCircle, Target } from 'lucide-react';

import type { APIAgent, APISession } from '@api/types/dashboard';
import { fetchDashboard } from '@api/endpoints/dashboard';
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
});

// Helper to map API session status to SessionItem status
const getSessionStatus = (session: APISession): 'ACTIVE' | 'COMPLETE' | 'ERROR' => {
  if (session.is_active) return 'ACTIVE';
  if (session.errors > 0) return 'ERROR';
  return 'COMPLETE';
};

export const Portfolio: FC = () => {
  usePageMeta({
    breadcrumbs: [{ label: 'Portfolio' }],
  });

  const [agents, setAgents] = useState<APIAgent[]>([]);
  const [sessions, setSessions] = useState<APISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboard();
        setAgents(data.agents);
        setSessions(data.sessions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Calculate summary stats from agents
  const totalAgents = agents.length;
  const totalErrors = agents.reduce((sum, a) => sum + a.total_errors, 0);
  const totalSessions = agents.reduce((sum, a) => sum + a.total_sessions, 0);
  const activeAgents = agents.filter((a) => a.active_sessions > 0).length;

  return (
    <>
      <Stack gap="lg">
        {/* Overview Stats - 5 columns */}
        <StatsRow columns={5}>
          <StatCard
            icon={<Bot size={16} />}
            iconColor="cyan"
            label="Total Agents"
            value={loading ? '-' : totalAgents}
            detail={`${activeAgents} active sessions`}
            size="sm"
          />
          <StatCard
            icon={<AlertTriangle size={16} />}
            iconColor="red"
            label="Total Errors"
            value={loading ? '-' : totalErrors}
            valueColor={totalErrors > 0 ? 'red' : undefined}
            detail="Across all agents"
            size="sm"
          />
          <StatCard
            icon={<CheckCircle size={16} />}
            iconColor="green"
            label="OK Status"
            value={
              loading ? '-' : agents.filter((a) => a.risk_status === 'ok').length
            }
            valueColor="green"
            detail="Evaluated agents"
            size="sm"
          />
          <StatCard
            icon={<Activity size={16} />}
            iconColor="purple"
            label="Total Sessions"
            value={loading ? '-' : totalSessions}
            valueColor="purple"
            detail="All time"
            size="sm"
          />
          <StatCard
            icon={<Target size={16} />}
            iconColor="orange"
            label="Evaluating"
            value={
              loading
                ? '-'
                : agents.filter((a) => a.risk_status === 'evaluating').length
            }
            valueColor="orange"
            detail="Need more sessions"
            size="sm"
          />
        </StatsRow>

        {/* Two Column Layout: Agents Grid + Activity Feed */}
        <TwoColumn
          main={
            <AgentsGrid>
              {loading ? (
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
              ) : (
                agents.map((agent) => (
                  <AgentCard key={agent.id} {...transformAgent(agent)} />
                ))
              )}
            </AgentsGrid>
          }
          sidebar={
            <Card>
              <Card.Header title="Recent Sessions" />
              <Card.Content>
                {loading ? (
                  <SessionsList>
                    <Skeleton variant="rect" height={60} />
                    <Skeleton variant="rect" height={60} />
                    <Skeleton variant="rect" height={60} />
                  </SessionsList>
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
