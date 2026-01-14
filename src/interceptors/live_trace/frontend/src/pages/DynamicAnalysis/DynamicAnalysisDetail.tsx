import { useCallback, useEffect, useState, type FC } from 'react';

import { Activity, ArrowLeft, Calendar, Shield, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchAnalysisSessionDetails,
  type AnalysisSessionDetailsResponse,
  type AnalysisSessionAgentData,
} from '@api/endpoints/analysisSession';
import { DynamicAnalysisIcon } from '@constants/pageIcons';

import { Button } from '@ui/core/Button';
import { TimeAgo } from '@ui/core';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';
import { Tabs, type Tab } from '@ui/navigation/Tabs';

import { DynamicChecksGrid } from '@domain/security';

import { usePageMeta } from '../../context';

import {
  MetadataCard,
  MetadataItem,
  MetadataValue,
  MetadataDivider,
  StatsGroup,
  StatBadge,
  StatDot,
  TabsWrapper,
  EmptyAgentState,
  LoaderContainer,
  ErrorContainer,
  ErrorMessage,
} from './DynamicAnalysisDetail.styles';

export interface DynamicAnalysisDetailProps {
  className?: string;
}

export const DynamicAnalysisDetail: FC<DynamicAnalysisDetailProps> = ({ className }) => {
  const { agentWorkflowId, sessionId } = useParams<{
    agentWorkflowId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();

  // State
  const [data, setData] = useState<AnalysisSessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string>('');

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchAnalysisSessionDetails(sessionId);
      setData(response);

      // Set first agent as active if not already set
      if (response.agents.length > 0 && !activeAgentId) {
        setActiveAgentId(response.agents[0].agent_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis details');
    } finally {
      setLoading(false);
    }
  }, [sessionId, activeAgentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agent Workflows', href: '/' },
      { label: agentWorkflowId || '', href: `/agent-workflow/${agentWorkflowId}` },
      { label: 'Dynamic Analysis', href: `/agent-workflow/${agentWorkflowId}/dynamic-analysis` },
      { label: `Analysis ${sessionId?.slice(0, 12) || ''}...` },
    ],
  });

  // Build tabs from agents
  const tabs: Tab[] = (data?.agents || []).map((agent) => ({
    id: agent.agent_id,
    label: agent.agent_name || agent.agent_id.slice(0, 16),
    badge: agent.summary.critical > 0
      ? { variant: 'critical' as const, count: agent.summary.critical }
      : agent.summary.warnings > 0
        ? { variant: 'warning' as const, count: agent.summary.warnings }
        : undefined,
  }));

  // Get current agent data
  const currentAgent: AnalysisSessionAgentData | undefined = data?.agents.find(
    (a) => a.agent_id === activeAgentId
  );

  // Navigate back
  const handleBack = () => {
    navigate(`/agent-workflow/${agentWorkflowId}/dynamic-analysis`);
  };

  // Loading state
  if (loading) {
    return (
      <LoaderContainer $size="lg">
        <OrbLoader size="lg" />
      </LoaderContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <Page className={className}>
        <PageHeader
          icon={<DynamicAnalysisIcon size={24} />}
          title="Analysis Results"
          actions={
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={handleBack}>
              Back
            </Button>
          }
        />
        <ErrorContainer>
          <ErrorMessage>{error}</ErrorMessage>
          <Button variant="secondary" onClick={fetchData}>
            Try Again
          </Button>
        </ErrorContainer>
      </Page>
    );
  }

  // No data state
  if (!data) {
    return (
      <Page className={className}>
        <PageHeader
          icon={<DynamicAnalysisIcon size={24} />}
          title="Analysis Results"
          actions={
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={handleBack}>
              Back
            </Button>
          }
        />
        <EmptyAgentState>Analysis session not found.</EmptyAgentState>
      </Page>
    );
  }

  return (
    <Page className={className} data-testid="dynamic-analysis-detail">
      {/* Header */}
      <PageHeader
        icon={<DynamicAnalysisIcon size={24} />}
        title="Analysis Results"
        actions={
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={handleBack}>
            Back to Overview
          </Button>
        }
      />

      {/* Session Metadata */}
      <Section>
        <MetadataCard>
          <MetadataItem>
            <Calendar size={14} />
            {data.session.completed_at ? (
              <>
                Completed <TimeAgo timestamp={data.session.completed_at} />
              </>
            ) : (
              <>
                Started <TimeAgo timestamp={data.session.created_at} />
              </>
            )}
          </MetadataItem>
          <MetadataItem>
            <Activity size={14} />
            <MetadataValue>{data.session.sessions_analyzed || 0}</MetadataValue> sessions analyzed
          </MetadataItem>
          <MetadataItem>
            <Users size={14} />
            <MetadataValue>{data.agents.length}</MetadataValue> agent prompts
          </MetadataItem>

          <MetadataDivider />

          {/* Severity Stats */}
          <StatsGroup>
            <StatBadge $variant="critical">
              <StatDot $variant="critical" />
              {data.total_summary.critical} Critical
            </StatBadge>
            <StatBadge $variant="warning">
              <StatDot $variant="warning" />
              {data.total_summary.warnings} Warning
            </StatBadge>
            <StatBadge $variant="passed">
              <StatDot $variant="passed" />
              {data.total_summary.passed} Passed
            </StatBadge>
          </StatsGroup>
        </MetadataCard>
      </Section>

      {/* Agent Tabs */}
      {tabs.length > 1 && (
        <TabsWrapper>
          <Tabs tabs={tabs} activeTab={activeAgentId} onChange={setActiveAgentId} variant="pills" />
        </TabsWrapper>
      )}

      {/* Active Agent's Security Checks */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Shield size={16} />}>
            Security Checks
            {currentAgent && ` - ${currentAgent.agent_name || currentAgent.agent_id.slice(0, 16)}`}
          </Section.Title>
        </Section.Header>
        <Section.Content>
          {currentAgent && currentAgent.checks.length > 0 ? (
            <DynamicChecksGrid
              checks={currentAgent.checks}
              groupBy="category"
              showSummary={true}
            />
          ) : (
            <EmptyAgentState>
              {currentAgent
                ? 'No security checks for this agent.'
                : 'Select an agent to view security checks.'}
            </EmptyAgentState>
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
