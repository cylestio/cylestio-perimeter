import type { FC } from 'react';

import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import { Activity, AlertTriangle, Bot, CheckCircle, Target } from 'lucide-react';

import type { APIAgent } from '@api/types/dashboard';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import { formatAgentName } from '@utils/formatting';

import { EmptyState } from '@ui/feedback/EmptyState';
import { Skeleton } from '@ui/feedback/Skeleton';
import { Page } from '@ui/layout/Page';
import { StatsRow, Stack } from '@ui/layout/Grid';

import { AgentCard } from '@domain/agents';
import { StatCard } from '@domain/metrics/StatCard';

import { usePageMeta } from '../../context';
import { AgentsGrid } from './Portfolio.styles';

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
  // Behavioral metrics (when evaluation complete) - convert 0-1 to 0-100 scale
  stability: agent.analysis_summary?.behavioral?.stability !== undefined
    ? Math.round(agent.analysis_summary.behavioral.stability * 100)
    : undefined,
  predictability: agent.analysis_summary?.behavioral?.predictability !== undefined
    ? Math.round(agent.analysis_summary.behavioral.predictability * 100)
    : undefined,
  confidence: agent.analysis_summary?.behavioral?.confidence as 'high' | 'medium' | 'low' | undefined,
  failedChecks: agent.analysis_summary?.failed_checks ?? 0,
  warnings: agent.analysis_summary?.warnings ?? 0,
});

export const Portfolio: FC = () => {
  const navigate = useNavigate();
  const { agentWorkflowId } = useParams<{ agentWorkflowId?: string }>();
  const { agents, loading } = useOutletContext<PortfolioContext>();

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Agents' })
      : [{ label: 'Agent Workflows', href: '/' }],
  });

  // Calculate summary stats from agents
  const totalAgents = agents.length;
  const totalErrors = agents.reduce((sum, a) => sum + a.total_errors, 0);
  const totalSessions = agents.reduce((sum, a) => sum + a.total_sessions, 0);
  const activeAgents = agents.filter((a) => a.active_sessions > 0).length;

  const isLoading = loading && agents.length === 0;

  return (
    <Page>
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

        {/* Agents Grid */}
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
              title="No agents yet"
              description="Connect your first agent to get started. Go to the Connect page for instructions."
            />
          ) : (
            agents.map((agent) => (
              <AgentCard
                key={agent.id}
                {...transformAgent(agent)}
                onClick={() => {
                  const currentAgentWorkflowId = agentWorkflowId || agent.agent_workflow_id || 'unassigned';
                  navigate(`/agent-workflow/${currentAgentWorkflowId}/agent/${agent.id}`);
                }}
              />
            ))
          )}
        </AgentsGrid>
      </Stack>
    </Page>
  );
};
