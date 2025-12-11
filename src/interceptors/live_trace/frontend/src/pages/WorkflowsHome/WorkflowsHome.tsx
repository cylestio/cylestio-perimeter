import { useState, useEffect, useCallback, type FC } from 'react';

import { useNavigate } from 'react-router-dom';
import { Folder, Bot } from 'lucide-react';

import type { APIAgent } from '@api/types/dashboard';
import type { APIWorkflow } from '@api/types/workflows';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchWorkflows } from '@api/endpoints/dashboard';
import { formatAgentName } from '@utils/formatting';

import { Badge } from '@ui/core/Badge';
import { Table, type Column } from '@ui/data-display/Table';
import { Skeleton } from '@ui/feedback/Skeleton';
import { Stack } from '@ui/layout/Grid';

import { WorkflowCard } from '@domain/workflows';

import { usePageMeta } from '../../context';
import {
  PageContainer,
  HeroSection,
  HeroTitle,
  HeroHighlight,
  HeroSubtitle,
  SectionHeader,
  SectionTitle,
  SectionBadge,
  WorkflowsGrid,
  UnassignedSection,
  EmptyWorkflows,
  EmptyIcon,
  EmptyTitle,
  EmptyDescription,
} from './WorkflowsHome.styles';

// Table row type for unassigned agents
interface AgentRow {
  id: string;
  name: string;
  sessions: number;
  errors: number;
  lastSeen: string;
  status: 'evaluating' | 'ok';
}

// Transform API agent to table row
const toAgentRow = (agent: APIAgent): AgentRow => ({
  id: agent.id,
  name: formatAgentName(agent.id),
  sessions: agent.total_sessions,
  errors: agent.total_errors,
  lastSeen: agent.last_seen_relative,
  status: agent.risk_status,
});

// Table columns for unassigned system prompts
const agentColumns: Column<AgentRow>[] = [
  {
    key: 'name',
    header: 'System prompt',
    render: (row) => (
      <span style={{ fontWeight: 500 }}>{row.name}</span>
    ),
  },
  {
    key: 'id',
    header: 'ID',
    render: (row) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.5 }}>
        {row.id.slice(0, 12)}...
      </span>
    ),
  },
  {
    key: 'sessions',
    header: 'Sessions',
    align: 'center',
    sortable: true,
  },
  {
    key: 'errors',
    header: 'Errors',
    align: 'center',
    sortable: true,
    render: (row) => (
      <span style={{ color: row.errors > 0 ? 'var(--color-red)' : 'inherit' }}>
        {row.errors}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (row) => (
      <Badge variant={row.status === 'ok' ? 'success' : 'medium'} size="sm">
        {row.status === 'ok' ? 'OK' : 'Evaluating'}
      </Badge>
    ),
  },
  {
    key: 'lastSeen',
    header: 'Last Seen',
    align: 'right',
  },
];

export const WorkflowsHome: FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<APIWorkflow[]>([]);
  const [unassignedAgents, setUnassignedAgents] = useState<APIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  usePageMeta({
    breadcrumbs: [{ label: 'Agents', href: '/' }],
  });

  const loadData = useCallback(async () => {
    try {
      const [workflowsRes, unassignedRes] = await Promise.all([
        fetchWorkflows(),
        fetchDashboard('unassigned'),
      ]);
      setWorkflows(workflowsRes.workflows.filter(w => w.id !== null));
      setUnassignedAgents(unassignedRes.agents);
    } catch (error) {
      console.error('Failed to load workflows data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh data periodically
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleWorkflowClick = (workflowId: string) => {
    navigate(`/workflow/${workflowId}`);
  };

  const handleAgentClick = (agent: AgentRow) => {
    navigate(`/workflow/unassigned/agent/${agent.id}`);
  };

  const hasWorkflows = workflows.length > 0;
  const hasUnassignedAgents = unassignedAgents.length > 0;

  return (
    <PageContainer>
      <Stack gap="lg">
        {/* Hero Section */}
        <HeroSection>
          <HeroTitle>
            Your <HeroHighlight>Agents</HeroHighlight>
          </HeroTitle>
          <HeroSubtitle>
            Agents organize your system prompts by project. Each agent can have its own
            static analysis, security scans, and recommendations. Select an agent
            to view detailed insights.
          </HeroSubtitle>
        </HeroSection>

        {/* Agents Grid */}
        <div>
          <SectionHeader>
            <SectionTitle>
              <Folder size={18} />
              Agents
              {hasWorkflows && <SectionBadge>{workflows.length}</SectionBadge>}
            </SectionTitle>
          </SectionHeader>

          <WorkflowsGrid>
            {loading ? (
              <>
                <Skeleton variant="rect" height={180} />
                <Skeleton variant="rect" height={180} />
                <Skeleton variant="rect" height={180} />
              </>
            ) : hasWorkflows ? (
              workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  id={workflow.id!}
                  name={workflow.name}
                  agentCount={workflow.agent_count}
                  sessionCount={workflow.session_count}
                  onClick={() => handleWorkflowClick(workflow.id!)}
                />
              ))
            ) : (
              <EmptyWorkflows>
                <EmptyIcon>
                  <Folder size={24} />
                </EmptyIcon>
                <EmptyTitle>No agents yet</EmptyTitle>
                <EmptyDescription>
                  Connect a system prompt with an agent ID to create your first agent.
                  Go to the Connect page for instructions.
                </EmptyDescription>
              </EmptyWorkflows>
            )}
          </WorkflowsGrid>
        </div>

        {/* Unassigned System Prompts Section - only show if there are any */}
        {(hasUnassignedAgents || loading) && (
          <UnassignedSection>
            <Table
              header={
                <SectionTitle>
                  <Bot size={18} />
                  Unassigned System Prompts
                  {hasUnassignedAgents && <SectionBadge>{unassignedAgents.length}</SectionBadge>}
                </SectionTitle>
              }
              columns={agentColumns}
              data={unassignedAgents.map(toAgentRow)}
              loading={loading}
              onRowClick={handleAgentClick}
              keyExtractor={(row) => row.id}
              emptyState={
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-white-50)' }}>
                  No unassigned system prompts
                </div>
              }
            />
          </UnassignedSection>
        )}
      </Stack>
    </PageContainer>
  );
};
