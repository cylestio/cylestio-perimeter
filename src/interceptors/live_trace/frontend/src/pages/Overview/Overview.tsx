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
  Code,
  Search,
  Play,
  Rocket,
  Shield,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchSessions } from '@api/endpoints/session';
import { fetchGateStatus } from '@api/endpoints/agentWorkflow';
import type { APIAgent, DashboardResponse } from '@api/types/dashboard';
import type { SessionListItem } from '@api/types/session';
import type { GateStatusResponse } from '@api/types/findings';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import { formatDuration } from '@utils/formatting';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Card } from '@ui/core/Card';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';
import { StatsRow } from '@ui/layout/Grid';

import { StatCard } from '@domain/metrics/StatCard';
import { LifecycleProgress, type LifecycleStage } from '@domain/activity/LifecycleProgress';
import { ProductionGateCard } from '@domain/security/ProductionGateCard';

import { usePageMeta } from '../../context';
import {
  MetricsGrid,
  MetricCard,
  MetricIcon,
  MetricContent,
  MetricLabel,
  MetricValue,
  MetricChange,
  ChartsRow,
  ChartCard,
  ChartTitle,
  ChartPlaceholder,
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

export const Overview: FC<OverviewProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const navigate = useNavigate();

  // State
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [gateStatus, setGateStatus] = useState<GateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const [dashData, sessionsData, gateData] = await Promise.all([
        fetchDashboard(agentWorkflowId),
        fetchSessions({ agent_workflow_id: agentWorkflowId, limit: 100 }),
        fetchGateStatus(agentWorkflowId).catch(() => null), // Don't fail if gate status fails
      ]);
      setDashboardData(dashData);
      setSessions(sessionsData.sessions || []);
      setGateStatus(gateData);
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

  // Calculate lifecycle stages based on security analysis data
  const getLifecycleStages = (): LifecycleStage[] => {
    const secAnalysis = dashboardData?.security_analysis;
    
    // Dev stage - based on IDE connection (we'll show as active if we have any data)
    const devStatus = dashboardData ? 'completed' : 'pending';
    
    // Static stage - based on static analysis
    const staticStatus = secAnalysis?.static?.status === 'completed' ? 'completed' :
                         secAnalysis?.static?.status === 'active' ? 'active' : 'pending';
    const staticFindings = secAnalysis?.static?.findings;
    const staticStat = staticFindings ? `${staticFindings.total || 0} findings` : undefined;
    
    // Dynamic stage - based on dynamic analysis
    const dynamicStatus = secAnalysis?.dynamic?.status === 'completed' ? 'completed' :
                          secAnalysis?.dynamic?.status === 'active' ? 'active' : 'pending';
    const dynamicStat = secAnalysis?.dynamic?.sessions_progress 
      ? `${secAnalysis.dynamic.sessions_progress.current}/${secAnalysis.dynamic.sessions_progress.required}` 
      : undefined;
    
    // Production stage - based on gate status
    const productionStatus = gateStatus && !gateStatus.is_blocked ? 'completed' : 
                             staticStatus === 'completed' && dynamicStatus === 'completed' ? 'active' : 'pending';
    const productionStat = gateStatus?.is_blocked 
      ? `${gateStatus.blocking_count} blocking` 
      : productionStatus === 'completed' ? 'Ready' : undefined;

    return [
      { id: 'dev', label: 'Dev', icon: <Code size={16} />, status: devStatus, stat: 'Connected' },
      { id: 'static', label: 'Static', icon: <Search size={16} />, status: staticStatus, stat: staticStat },
      { id: 'dynamic', label: 'Dynamic', icon: <Play size={16} />, status: dynamicStatus, stat: dynamicStat },
      { id: 'production', label: 'Production', icon: <Rocket size={16} />, status: productionStatus, stat: productionStat },
    ];
  };

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

  // Calculate average session duration from sessions
  const avgDuration = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
    : 0;

  // Calculate sessions with errors
  const sessionsWithErrors = sessions.filter(s => s.errors > 0).length;
  const errorRate = sessions.length > 0 ? (sessionsWithErrors / sessions.length) * 100 : 0;

  const lifecycleStages = getLifecycleStages();

  return (
    <Page className={className} data-testid="overview">
      {/* Header */}
      <PageHeader
        title="Overview"
        description={`Aggregated metrics for agent workflow: ${agentWorkflowId}`}
      />

      {/* Lifecycle Progress */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Shield size={16} />}>Security Lifecycle</Section.Title>
        </Section.Header>
        <Section.Content>
          <Card>
            <LifecycleProgress stages={lifecycleStages} />
          </Card>
        </Section.Content>
      </Section>

      {/* Production Gate Status */}
      {gateStatus && (
        <Section>
          <Section.Header>
            <Section.Title icon={<Rocket size={16} />}>Production Gate</Section.Title>
          </Section.Header>
          <Section.Content>
            <ProductionGateCard
              isBlocked={gateStatus.is_blocked}
              blockingCount={gateStatus.blocking_count}
              blockingCritical={gateStatus.blocking_critical}
              blockingHigh={gateStatus.blocking_high}
              onViewAll={() => navigate(`/agent-workflow/${agentWorkflowId}/recommendations?blocking_only=true`)}
            />
          </Section.Content>
        </Section>
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
          <MetricsGrid>
            <MetricCard>
              <MetricIcon $color="cyan">
                <Timer size={20} />
              </MetricIcon>
              <MetricContent>
                <MetricLabel>Avg Latency</MetricLabel>
                <MetricValue>--</MetricValue>
                <MetricChange $positive>Coming soon</MetricChange>
              </MetricContent>
            </MetricCard>
            <MetricCard>
              <MetricIcon $color="green">
                <MessageSquare size={20} />
              </MetricIcon>
              <MetricContent>
                <MetricLabel>Total Tokens</MetricLabel>
                <MetricValue>--</MetricValue>
                <MetricChange>Coming soon</MetricChange>
              </MetricContent>
            </MetricCard>
            <MetricCard>
              <MetricIcon $color="orange">
                <DollarSign size={20} />
              </MetricIcon>
              <MetricContent>
                <MetricLabel>Est. Cost</MetricLabel>
                <MetricValue>--</MetricValue>
                <MetricChange>Coming soon</MetricChange>
              </MetricContent>
            </MetricCard>
            <MetricCard>
              <MetricIcon $color="purple">
                <Zap size={20} />
              </MetricIcon>
              <MetricContent>
                <MetricLabel>Throughput</MetricLabel>
                <MetricValue>--</MetricValue>
                <MetricChange>Coming soon</MetricChange>
              </MetricContent>
            </MetricCard>
          </MetricsGrid>
        </Section.Content>
      </Section>

      {/* Charts Section - Placeholders */}
      <ChartsRow>
        <ChartCard>
          <ChartTitle>Sessions Over Time</ChartTitle>
          <ChartPlaceholder>
            <Activity size={32} />
            <span>Chart coming soon</span>
          </ChartPlaceholder>
        </ChartCard>
        <ChartCard>
          <ChartTitle>Error Rate Trend</ChartTitle>
          <ChartPlaceholder>
            <AlertTriangle size={32} />
            <span>Chart coming soon</span>
          </ChartPlaceholder>
        </ChartCard>
      </ChartsRow>

      {/* Tool Usage Section */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Wrench size={16} />}>Tool Usage Summary</Section.Title>
        </Section.Header>
        <Section.Content>
          {metrics.totalTools > 0 ? (
            <Card>
              <Card.Content>
                <ToolsList>
                  <ToolItem>
                    <ToolName>Tools discovered across all agents</ToolName>
                    <ToolCount>{metrics.totalTools}</ToolCount>
                  </ToolItem>
                </ToolsList>
                <p style={{ fontSize: '12px', color: 'var(--color-white50)', marginTop: '16px' }}>
                  Detailed tool usage breakdown coming soon. Visit individual agents for more details.
                </p>
              </Card.Content>
            </Card>
          ) : (
            <Card>
              <Card.Content>
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-white50)' }}>
                  <Wrench size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No tools discovered yet</p>
                  <p style={{ fontSize: '12px' }}>Tools will appear here as your agent uses them during sessions.</p>
                </div>
              </Card.Content>
            </Card>
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
