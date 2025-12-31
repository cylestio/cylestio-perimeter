import { useCallback, useEffect, useState, type FC } from 'react';

import {
  Activity,
  AlertTriangle,
  Bot,
  Clock,
  DollarSign,
  Zap,
  Wrench,
  MessageSquare,
  TrendingUp,
  Timer,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchAgent } from '@api/endpoints/agent';
import { fetchDashboard, fetchProductionReadiness } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import type { AgentResponse, ToolAnalytics } from '@api/types/agent';
import type { APIAgent, DashboardResponse, ProductionReadinessResponse } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import { formatDuration, formatLatency, formatTokens, formatCost, formatThroughput } from '@utils/formatting';

import { Avatar, Badge, TimeAgo } from '@ui/core';
import { Card } from '@ui/core/Card';
import { Table, type Column } from '@ui/data-display/Table';
import { EmptyState } from '@ui/feedback/EmptyState';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';
import { StatsRow } from '@ui/layout/Grid';

import { LineChart, BarChart } from '@domain/charts';
import { StatCard } from '@domain/metrics/StatCard';
import { ProductionReadiness } from '@domain/security/ProductionReadiness';

import { usePageMeta } from '../../context';
import {
  ChartsRow,
  ToolsList,
  ToolItem,
  ToolName,
  ToolCount,
} from './Overview.styles';

export interface OverviewProps {
  className?: string;
}

// Aggregated metrics from all agents
interface AggregatedMetrics {
  totalSessions: number;
  totalErrors: number;
  totalTools: number;
  activeAgents: number;
  avgLatency: number;
  totalTokens: number;
  totalCost: number;
  toolsUsage: Record<string, number>;
}

const aggregateMetrics = (agents: APIAgent[]): AggregatedMetrics => {
  const toolsUsage: Record<string, number> = {};

  // Aggregate tool usage from agents (placeholder - would come from actual data)
  // For now, we'll track total tools per agent

  return {
    totalSessions: agents.reduce((sum, a) => sum + a.total_sessions, 0),
    totalErrors: agents.reduce((sum, a) => sum + a.total_errors, 0),
    totalTools: agents.reduce((sum, a) => sum + a.total_tools, 0),
    activeAgents: agents.filter(a => a.active_sessions > 0).length,
    avgLatency: 0, // Would come from actual session data
    totalTokens: 0, // Would come from actual usage data
    totalCost: 0, // Would come from actual usage data
    toolsUsage,
  };
};

// Column definitions for recent sessions table
const recentSessionsColumns: Column<SessionListItem>[] = [
  {
    key: 'last_activity',
    header: 'Last Activity',
    render: (session) => <TimeAgo timestamp={session.last_activity} />,
  },
  {
    key: 'agent_id',
    header: 'System Prompt',
    render: (session) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Avatar name={session.agent_id} size="sm" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          {session.agent_id_short || session.agent_id.slice(0, 8)}
        </span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (session) => {
      if (session.is_active) {
        return <Badge variant="success">ACTIVE</Badge>;
      }
      if (session.errors > 0) {
        return <Badge variant="critical">ERROR</Badge>;
      }
      return <Badge variant="info">COMPLETE</Badge>;
    },
  },
];

export const Overview: FC<OverviewProps> = ({ className }) => {
  const navigate = useNavigate();
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  // State
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [agentData, setAgentData] = useState<AgentResponse | null>(null);
  const [productionReadiness, setProductionReadiness] = useState<ProductionReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const [dashData, sessionsData, readinessData] = await Promise.all([
        fetchDashboard(agentWorkflowId),
        fetchSessions({ agent_workflow_id: agentWorkflowId, limit: 100 }),
        fetchProductionReadiness(agentWorkflowId).catch(() => null), // Don't fail if readiness fails
      ]);
      setDashboardData(dashData);
      setSessions(sessionsData.sessions || []);
      setProductionReadiness(readinessData);

      // Fetch agent analytics if we have an agent
      if (dashData?.agents?.length > 0) {
        // Fetch detailed analytics for the first agent (workflow-level)
        const firstAgent = dashData.agents[0];
        try {
          const agentDetails = await fetchAgent(firstAgent.id);
          setAgentData(agentDetails);
        } catch (agentErr) {
          console.warn('Failed to fetch agent analytics:', agentErr);
          // Non-critical error - continue without analytics
        }
      }
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, [agentWorkflowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Overview' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Overview' }],
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Page>
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-white50)' }}>
          {error}
        </div>
      </Page>
    );
  }

  const agents = dashboardData?.agents || [];
  const metrics = aggregateMetrics(agents);
  const analytics = agentData?.analytics;

  // Calculate average session duration from sessions
  const avgDuration = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
    : 0;

  // Calculate sessions with errors
  const sessionsWithErrors = sessions.filter(s => s.errors > 0).length;
  const errorRate = sessions.length > 0 ? (sessionsWithErrors / sessions.length) * 100 : 0;

  // Calculate throughput (sessions per hour) based on time range
  const calculateThroughput = () => {
    if (sessions.length < 2) return 0;
    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstSession = new Date(sortedSessions[0].created_at);
    const lastSession = new Date(sortedSessions[sortedSessions.length - 1].created_at);
    const hoursSpan = Math.max((lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60), 1);
    return sessions.length / hoursSpan;
  };
  const throughput = calculateThroughput();

  // Get performance metrics from analytics
  const avgLatency = agentData?.agent?.avg_response_time_ms ?? 0;
  const totalTokens = analytics?.token_summary?.total_tokens ?? 0;
  const totalCost = analytics?.token_summary?.total_cost ?? 0;

  // Get tool analytics for detailed breakdown
  const toolsData: ToolAnalytics[] = analytics?.tools ?? [];

  // Prepare chart data for Sessions Over Time
  const sessionsChartData = (analytics?.timeline ?? []).map(point => ({
    date: point.date,
    value: point.requests,
  }));

  return (
    <Page className={className} data-testid="overview">
      {/* Header */}
      <PageHeader
        title="Overview"
        description={`Aggregated metrics for agent workflow: ${agentWorkflowId}`}
      />

      {/* Production Readiness */}
      {productionReadiness && agentWorkflowId && (
        <ProductionReadiness
          staticAnalysis={{
            status: productionReadiness.static_analysis.status,
            criticalCount: productionReadiness.static_analysis.critical_count,
          }}
          dynamicAnalysis={{
            status: productionReadiness.dynamic_analysis.status,
            criticalCount: productionReadiness.dynamic_analysis.critical_count,
          }}
          isBlocked={productionReadiness.gate.is_blocked}
          workflowId={agentWorkflowId}
        />
      )}

      {/* Key Metrics Row */}
      <StatsRow columns={5}>
        <StatCard
          icon={<Bot size={16} />}
          iconColor="cyan"
          label="Agents"
          value={agents.length}
          detail={`${metrics.activeAgents} active`}
          size="sm"
        />
        <StatCard
          icon={<Activity size={16} />}
          iconColor="purple"
          label="Total Sessions"
          value={metrics.totalSessions}
          valueColor="purple"
          detail="All time"
          size="sm"
        />
        <StatCard
          icon={<AlertTriangle size={16} />}
          iconColor="red"
          label="Total Errors"
          value={metrics.totalErrors}
          valueColor={metrics.totalErrors > 0 ? 'red' : undefined}
          detail={`${errorRate.toFixed(1)}% error rate`}
          size="sm"
        />
        <StatCard
          icon={<Clock size={16} />}
          iconColor="orange"
          label="Avg Duration"
          value={formatDuration(avgDuration)}
          valueColor="orange"
          detail="Per session"
          size="sm"
        />
        <StatCard
          icon={<Wrench size={16} />}
          iconColor="green"
          label="Tools Used"
          value={metrics.totalTools}
          valueColor="green"
          detail="Unique tools"
          size="sm"
        />
      </StatsRow>

      {/* Performance Metrics */}
      <Section>
        <Section.Header>
          <Section.Title icon={<TrendingUp size={16} />}>Performance Metrics</Section.Title>
        </Section.Header>
        <Section.Content>
          <StatsRow columns={4}>
            <StatCard
              icon={<Timer size={16} />}
              iconColor="cyan"
              label="Avg Latency"
              value={avgLatency > 0 ? formatLatency(avgLatency) : '--'}
              detail={avgLatency > 0 ? 'Per LLM call' : 'No data yet'}
              tooltip="Average response time across all LLM API calls in this workflow."
              size="sm"
            />
            <StatCard
              icon={<MessageSquare size={16} />}
              iconColor="green"
              label="Total Tokens"
              value={totalTokens > 0 ? formatTokens(totalTokens) : '--'}
              detail={totalTokens > 0 ? 'All sessions' : 'No data yet'}
              tooltip="Sum of input and output tokens consumed across all sessions."
              size="sm"
            />
            <StatCard
              icon={<DollarSign size={16} />}
              iconColor="orange"
              label="Est. Cost"
              value={totalCost > 0 ? formatCost(totalCost) : '--'}
              detail={totalCost > 0 ? 'Based on model pricing' : 'No data yet'}
              tooltip="Estimated cost based on token usage and current model pricing."
              size="sm"
            />
            <StatCard
              icon={<Zap size={16} />}
              iconColor="purple"
              label="Throughput"
              value={throughput > 0 ? formatThroughput(throughput) : '--'}
              detail={throughput > 0 ? 'Sessions per hour' : 'No data yet'}
              tooltip="Sessions completed per hour, calculated from the time range of available data."
              size="sm"
            />
          </StatsRow>
        </Section.Content>
      </Section>

      {/* Charts Section */}
      <ChartsRow>
        <Section>
          <Section.Header>
            <Section.Title>Sessions Over Time</Section.Title>
          </Section.Header>
          <Section.Content>
            <LineChart
              data={sessionsChartData}
              color="purple"
              height={200}
              formatValue={(v) => v.toString()}
              emptyMessage="No session data yet"
            />
          </Section.Content>
        </Section>
        <Section>
          <Section.Header>
            <Section.Title icon={<Activity size={16} />}>Recent Sessions</Section.Title>
          </Section.Header>
          <Section.Content noPadding>
            <Table<SessionListItem>
              columns={recentSessionsColumns}
              data={sessions.slice(0, 4)}
              keyExtractor={(session) => session.id}
              onRowClick={(session) => {
                navigate(`/agent-workflow/${agentWorkflowId}/session/${session.id}`);
              }}
              emptyState={
                <EmptyState
                  icon={<Activity size={24} />}
                  title="No sessions yet"
                  description="Sessions will appear here once activity is recorded."
                />
              }
            />
          </Section.Content>
        </Section>
      </ChartsRow>

      {/* Tool Usage Section */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Wrench size={16} />}>Tool Usage Summary</Section.Title>
        </Section.Header>
        <Section.Content>
          {toolsData.length > 0 ? (
            <Card>
              <Card.Content>
                <BarChart
                  data={toolsData.map(tool => ({
                    name: tool.tool,
                    value: tool.executions,
                  }))}
                  color="green"
                  height={Math.max(200, toolsData.length * 30)}
                  horizontal
                  maxBars={10}
                  formatValue={(v) => `${v} calls`}
                  emptyMessage="No tool usage data"
                />
                {toolsData.length > 0 && (
                  <ToolsList style={{ marginTop: '16px' }}>
                    {toolsData.slice(0, 5).map(tool => (
                      <ToolItem key={tool.tool}>
                        <ToolName>{tool.tool}</ToolName>
                        <ToolCount>
                          {tool.executions} calls
                          {tool.avg_duration_ms > 0 && ` (avg ${Math.round(tool.avg_duration_ms)}ms)`}
                        </ToolCount>
                      </ToolItem>
                    ))}
                  </ToolsList>
                )}
              </Card.Content>
            </Card>
          ) : metrics.totalTools > 0 ? (
            <Card>
              <Card.Content>
                <ToolsList>
                  <ToolItem>
                    <ToolName>Tools discovered across all agents</ToolName>
                    <ToolCount>{metrics.totalTools}</ToolCount>
                  </ToolItem>
                </ToolsList>
                <p style={{ fontSize: '12px', color: 'var(--color-white50)', marginTop: '16px' }}>
Detailed tool usage data will appear after tools are executed in sessions.
                </p>
              </Card.Content>
            </Card>
          ) : (
            <EmptyState
              icon={<Wrench size={32} />}
              title="No tools discovered yet"
              description="Tools will appear here as your agent uses them during sessions."
            />
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
