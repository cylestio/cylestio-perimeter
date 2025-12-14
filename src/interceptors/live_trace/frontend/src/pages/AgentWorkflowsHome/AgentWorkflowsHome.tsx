import { useState, useEffect, useCallback, type FC } from 'react';

import { useNavigate } from 'react-router-dom';
import { Folder, Bot } from 'lucide-react';

import type { APIAgentStep } from '@api/types/dashboard';
import type { APIAgentWorkflow } from '@api/types/agentWorkflows';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { fetchAgentWorkflows } from '@api/endpoints/dashboard';
import { formatAgentName } from '@utils/formatting';

import { Badge } from '@ui/core/Badge';
import { Table, type Column } from '@ui/data-display/Table';
import { Skeleton } from '@ui/feedback/Skeleton';
import { Page } from '@ui/layout/Page';
import { Stack } from '@ui/layout/Grid';

import { AgentWorkflowCard } from '@domain/agent-workflows';

import { usePageMeta } from '../../context';
import {
  HeroSection,
  HeroTitle,
  HeroHighlight,
  HeroSubtitle,
  SectionHeader,
  SectionTitle,
  SectionBadge,
  AgentWorkflowsGrid,
  UnassignedSection,
  EmptyAgentWorkflows,
  EmptyIcon,
  EmptyTitle,
  EmptyDescription,
} from './AgentWorkflowsHome.styles';

// Table row type for unassigned agent steps
interface AgentStepRow {
  id: string;
  name: string;
  sessions: number;
  errors: number;
  lastSeen: string;
  status: 'evaluating' | 'ok';
}

// Transform API agent step to table row
const toAgentStepRow = (agentStep: APIAgentStep): AgentStepRow => ({
  id: agentStep.id,
  name: formatAgentName(agentStep.id),
  sessions: agentStep.total_sessions,
  errors: agentStep.total_errors,
  lastSeen: agentStep.last_seen_relative,
  status: agentStep.risk_status,
});

// Table columns for unassigned agent steps
const agentStepColumns: Column<AgentStepRow>[] = [
  {
    key: 'name',
    header: 'Agent Step',
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

export const AgentWorkflowsHome: FC = () => {
  const navigate = useNavigate();
  const [agentWorkflows, setAgentWorkflows] = useState<APIAgentWorkflow[]>([]);
  const [unassignedAgentSteps, setUnassignedAgentSteps] = useState<APIAgentStep[]>([]);
  const [loading, setLoading] = useState(true);

  usePageMeta({
    breadcrumbs: [{ label: 'Agent Workflows', href: '/' }],
  });

  const loadData = useCallback(async () => {
    try {
      const [agentWorkflowsRes, unassignedRes] = await Promise.all([
        fetchAgentWorkflows(),
        fetchDashboard('unassigned'),
      ]);
      console.log('agentWorkflowsRes', agentWorkflowsRes);
      setAgentWorkflows(agentWorkflowsRes.agent_workflows.filter(w => w.id !== null));
      setUnassignedAgentSteps(unassignedRes.agent_steps);
    } catch (error) {
      console.error('Failed to load agent workflows data:', error);
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

  const handleAgentWorkflowClick = (agentWorkflowId: string) => {
    navigate(`/agent-workflow/${agentWorkflowId}`);
  };

  const handleAgentStepClick = (agentStep: AgentStepRow) => {
    navigate(`/agent-workflow/unassigned/agent-step/${agentStep.id}`);
  };

  const hasAgentWorkflows = agentWorkflows.length > 0;
  const hasUnassignedAgentSteps = unassignedAgentSteps.length > 0;

  return (
    <Page>
      <Stack gap="lg">
        {/* Hero Section */}
        <HeroSection>
          <HeroTitle>
            Your <HeroHighlight>Agent Workflows</HeroHighlight>
          </HeroTitle>
          <HeroSubtitle>
            Agent Workflows organize your agents by project. Each agent workflow can have its own
            static analysis, security scans, and recommendations. Select an agent workflow
            to view detailed insights.
          </HeroSubtitle>
        </HeroSection>

        {/* Agent Workflows Grid */}
        <div>
          <SectionHeader>
            <SectionTitle>
              <Folder size={18} />
              Agent Workflows
              {hasAgentWorkflows && <SectionBadge>{agentWorkflows.length}</SectionBadge>}
            </SectionTitle>
          </SectionHeader>

          <AgentWorkflowsGrid>
            {loading ? (
              <>
                <Skeleton variant="rect" height={180} />
                <Skeleton variant="rect" height={180} />
                <Skeleton variant="rect" height={180} />
              </>
            ) : hasAgentWorkflows ? (
              agentWorkflows.map((agentWorkflow) => (
                <AgentWorkflowCard
                  key={agentWorkflow.id}
                  id={agentWorkflow.id!}
                  name={agentWorkflow.name}
                  agentCount={agentWorkflow.agent_count}
                  sessionCount={agentWorkflow.session_count}
                  onClick={() => handleAgentWorkflowClick(agentWorkflow.id!)}
                />
              ))
            ) : (
              <EmptyAgentWorkflows>
                <EmptyIcon>
                  <Folder size={24} />
                </EmptyIcon>
                <EmptyTitle>No agent workflows yet</EmptyTitle>
                <EmptyDescription>
                  Connect an agent with an agent workflow ID to create your first agent workflow.
                  Go to the Connect page for instructions.
                </EmptyDescription>
              </EmptyAgentWorkflows>
            )}
          </AgentWorkflowsGrid>
        </div>

        {/* Unassigned Agent Steps Section - only show if there are any */}
        {(hasUnassignedAgentSteps || loading) && (
          <UnassignedSection>
            <Table
              header={
                <SectionTitle>
                  <Bot size={18} />
                  Unassigned Agent Steps
                  {hasUnassignedAgentSteps && <SectionBadge>{unassignedAgentSteps.length}</SectionBadge>}
                </SectionTitle>
              }
              columns={agentStepColumns}
              data={unassignedAgentSteps.map(toAgentStepRow)}
              loading={loading}
              onRowClick={handleAgentStepClick}
              keyExtractor={(row) => row.id}
              emptyState={
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-white-50)' }}>
                  No unassigned agent steps
                </div>
              }
            />
          </UnassignedSection>
        )}
      </Stack>
    </Page>
  );
};
