import { useState, useEffect, useCallback, type FC } from 'react';

import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import { Activity, AlertTriangle, Bot, CheckCircle, Target } from 'lucide-react';

import type { APIAgentStep } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { fetchSessions } from '@api/endpoints/session';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import { formatAgentName, formatDuration } from '@utils/formatting';

import { Card } from '@ui/core/Card';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Skeleton } from '@ui/feedback/Skeleton';
import { Page } from '@ui/layout/Page';
import { StatsRow, TwoColumn, Stack } from '@ui/layout/Grid';

import { SessionItem } from '@domain/activity';
import { AgentStepCard } from '@domain/agent-steps';
import { StatCard } from '@domain/metrics/StatCard';

import { usePageMeta } from '../../context';
import { AgentStepsGrid, SessionsList } from './Portfolio.styles';

// Context type from App.tsx outlet
interface PortfolioContext {
  agentSteps: APIAgentStep[];
  sessionsCount: number;
  loading: boolean;
}

// Transform API agent step to AgentStepCard props
const transformAgentStep = (agentStep: APIAgentStep) => ({
  id: agentStep.id,
  name: formatAgentName(agentStep.id),
  totalSessions: agentStep.total_sessions,
  totalErrors: agentStep.total_errors,
  totalTools: agentStep.total_tools,
  lastSeen: agentStep.last_seen_relative,
  riskStatus: agentStep.risk_status,
  currentSessions: agentStep.current_sessions,
  minSessionsRequired: agentStep.min_sessions_required,
  hasCriticalFinding: agentStep.analysis_summary?.action_required ?? false,
  // Behavioral metrics (when evaluation complete)
  stability: agentStep.analysis_summary?.behavioral?.stability,
  predictability: agentStep.analysis_summary?.behavioral?.predictability,
  confidence: agentStep.analysis_summary?.behavioral?.confidence as 'high' | 'medium' | 'low' | undefined,
  failedChecks: agentStep.analysis_summary?.failed_checks ?? 0,
  warnings: agentStep.analysis_summary?.warnings ?? 0,
});

// Helper to map API session status to SessionItem status
const getSessionStatus = (session: SessionListItem): 'ACTIVE' | 'COMPLETE' | 'ERROR' => {
  if (session.is_active) return 'ACTIVE';
  if (session.errors > 0) return 'ERROR';
  return 'COMPLETE';
};

export const Portfolio: FC = () => {
  const navigate = useNavigate();
  const { agentWorkflowId } = useParams<{ agentWorkflowId?: string }>();
  const { agentSteps, loading } = useOutletContext<PortfolioContext>();

  // Fetch sessions from the new API
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions({
        agent_workflow_id: agentWorkflowId || undefined,
        limit: 10,
      });
      setSessions(data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch sessions on mount and when agentStepId changes
  useEffect(() => {
    loadSessions();
    // Refresh sessions periodically
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Agent Steps' })
      : [{ label: 'Agent Workflows', href: '/' }],
  });

  // Calculate summary stats from agent steps
  const totalAgentSteps = agentSteps.length;
  const totalErrors = agentSteps.reduce((sum, a) => sum + a.total_errors, 0);
  const totalSessions = agentSteps.reduce((sum, a) => sum + a.total_sessions, 0);
  const activeAgentSteps = agentSteps.filter((a) => a.active_sessions > 0).length;

  const isLoading = loading && agentSteps.length === 0;

  return (
    <Page>
      <Stack gap="lg">
        {/* Overview Stats - 5 columns */}
        <StatsRow columns={5}>
          <StatCard
            icon={<Bot size={16} />}
            iconColor="cyan"
            label="Total Agent Steps"
            value={isLoading ? '-' : totalAgentSteps}
            detail={`${activeAgentSteps} active sessions`}
            size="sm"
          />
          <StatCard
            icon={<AlertTriangle size={16} />}
            iconColor="red"
            label="Total Errors"
            value={isLoading ? '-' : totalErrors}
            valueColor={totalErrors > 0 ? 'red' : undefined}
            detail="Across all agent steps"
            size="sm"
          />
          <StatCard
            icon={<CheckCircle size={16} />}
            iconColor="green"
            label="OK Status"
            value={isLoading ? '-' : agentSteps.filter((a) => a.risk_status === 'ok').length}
            valueColor="green"
            detail="Evaluated agent steps"
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
            value={isLoading ? '-' : agentSteps.filter((a) => a.risk_status === 'evaluating').length}
            valueColor="orange"
            detail="Need more sessions"
            size="sm"
          />
        </StatsRow>

        {/* Two Column Layout: Agent Steps Grid + Activity Feed */}
        <TwoColumn
          main={
            <AgentStepsGrid>
              {isLoading ? (
                // Loading skeletons
                <>
                  <Skeleton variant="rect" height={200} />
                  <Skeleton variant="rect" height={200} />
                  <Skeleton variant="rect" height={200} />
                  <Skeleton variant="rect" height={200} />
                </>
              ) : agentSteps.length === 0 ? (
                <EmptyState
                  icon={<Bot size={24} />}
                  title="No agent steps yet"
                  description="Connect your first agent to get started. Go to the Connect page for instructions."
                />
              ) : (
                agentSteps.map((agentStep) => (
                  <AgentStepCard
                    key={agentStep.id}
                    {...transformAgentStep(agentStep)}
                    onClick={() => {
                      const currentAgentWorkflowId = agentWorkflowId || agentStep.agent_workflow_id || 'unassigned';
                      navigate(`/agent-workflow/${currentAgentWorkflowId}/agent-step/${agentStep.id}`);
                    }}
                  />
                ))
              )}
            </AgentStepsGrid>
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
                      // Use session's agent_workflow_id if available, or get from URL, or from agent step
                      const agentStep = agentSteps.find(a => a.id === session.agent_step_id);
                      const sessionAgentWorkflowId = session.agent_workflow_id || agentWorkflowId || agentStep?.agent_workflow_id || 'unassigned';
                      return (
                        <SessionItem
                          key={session.id}
                          agentStepId={session.agent_step_id}
                          agentStepName={formatAgentName(session.agent_step_id)}
                          sessionId={session.id.slice(0, 8)}
                          status={getSessionStatus(session)}
                          isActive={session.is_active}
                          duration={formatDuration(session.duration_minutes)}
                          lastActivity={session.last_activity_relative}
                          hasErrors={session.errors > 0}
                          onClick={() => navigate(`/agent-workflow/${sessionAgentWorkflowId}/session/${session.id}`)}
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
    </Page>
  );
};
