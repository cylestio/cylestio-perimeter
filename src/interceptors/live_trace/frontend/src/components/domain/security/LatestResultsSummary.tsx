import type { FC } from 'react';

import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { TimeAgo } from '@ui/core';

import {
  SummaryBar,
  TitleSection,
  StatusDot,
  TitleText,
  Title,
  Timestamp,
  Divider,
  StatsSection,
  StatItem,
  StatValue,
  StatLabel,
  FindingsGroup,
  FindingItem,
  FindingDot,
  ViewButton,
  EmptyBar,
} from './LatestResultsSummary.styles';

export interface LatestResultsSummaryProps {
  /** Analysis session ID to link to */
  analysisSessionId: string;
  /** When the analysis completed (unix timestamp in seconds) */
  completedAt: number | null;
  /** Number of sessions analyzed */
  sessionsAnalyzed: number;
  /** Total number of agents */
  agentsTotal: number;
  /** Number of agents that had results */
  agentsWithResults: number;
  /** Findings summary */
  summary: {
    critical: number;
    warnings: number;
    passed: number;
  };
  /** Agent workflow ID for routing */
  agentWorkflowId: string;
  className?: string;
}

export const LatestResultsSummary: FC<LatestResultsSummaryProps> = ({
  analysisSessionId,
  completedAt,
  sessionsAnalyzed,
  agentsTotal,
  summary,
  agentWorkflowId,
  className,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/agent-workflow/${agentWorkflowId}/dynamic-analysis/${analysisSessionId}`);
  };

  const hasResults = summary.critical > 0 || summary.warnings > 0 || summary.passed > 0;

  // Determine overall status for the indicator dot
  const getOverallStatus = (): 'critical' | 'warning' | 'success' => {
    if (summary.critical > 0) return 'critical';
    if (summary.warnings > 0) return 'warning';
    return 'success';
  };

  if (!hasResults && sessionsAnalyzed === 0) {
    return (
      <EmptyBar className={className}>
        No analysis results yet. Run an analysis to see results here.
      </EmptyBar>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <SummaryBar className={className} $status={overallStatus}>
      {/* Title + Status */}
      <TitleSection>
        <StatusDot $status={overallStatus} />
        <TitleText>
          <Title>Latest Analysis</Title>
          {completedAt && (
            <Timestamp>
              <TimeAgo timestamp={new Date(completedAt * 1000).toISOString()} />
            </Timestamp>
          )}
        </TitleText>
      </TitleSection>

      <Divider />

      {/* Stats */}
      <StatsSection>
        <StatItem>
          <StatValue>{sessionsAnalyzed}</StatValue>
          <StatLabel>sessions</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue $variant={agentsTotal === 0 ? 'muted' : undefined}>{agentsTotal}</StatValue>
          <StatLabel>agent prompts</StatLabel>
        </StatItem>

        <Divider />

        {/* Findings with colored indicators */}
        <FindingsGroup>
          <FindingItem $variant="critical">
            <FindingDot $variant="critical" />
            {summary.critical} Critical
          </FindingItem>
          <FindingItem $variant="warning">
            <FindingDot $variant="warning" />
            {summary.warnings} Warning
          </FindingItem>
          <FindingItem $variant="passed">
            <FindingDot $variant="passed" />
            {summary.passed} Passed
          </FindingItem>
        </FindingsGroup>
      </StatsSection>

      {/* CTA */}
      <ViewButton onClick={handleViewDetails} $status={overallStatus}>
        View Analysis Results
        <ArrowRight size={14} />
      </ViewButton>
    </SummaryBar>
  );
};
