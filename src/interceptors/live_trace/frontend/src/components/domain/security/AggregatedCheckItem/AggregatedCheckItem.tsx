import type { FC, ReactNode } from 'react';

import { Check, X, AlertTriangle, Loader2, ChevronRight, Info } from 'lucide-react';

import type { AggregatedCheck, DynamicCheckStatus } from '@api/types/security';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  ItemContainer,
  ItemWrapper,
  StatusIconContainer,
  ContentContainer,
  TitleWithInfo,
  CheckTitle,
  InfoIcon,
  SummaryText,
  RightSection,
  ChevronIcon,
  ExpandedContent,
} from './AggregatedCheckItem.styles';

export interface AggregatedCheckItemProps {
  /** The aggregated check data */
  check: AggregatedCheck;
  /** Whether this item is expanded */
  expanded: boolean;
  /** Toggle expand handler */
  onToggle: () => void;
  /** Children to render when expanded (AgentStatusList) */
  children?: ReactNode;
  /** Additional class name */
  className?: string;
}

// Get status icon
const getStatusIcon = (status: DynamicCheckStatus, size = 14) => {
  switch (status) {
    case 'passed':
      return <Check size={size} strokeWidth={2.5} />;
    case 'warning':
      return <AlertTriangle size={size} />;
    case 'critical':
      return <X size={size} strokeWidth={2.5} />;
    case 'analyzing':
      return <Loader2 size={size} />;
    default:
      return null;
  }
};

// Format summary text
const formatSummary = (summary: AggregatedCheck['summary']): string => {
  if (summary.issues === 0) {
    return `All ${summary.total} agents passed`;
  }
  return `${summary.issues}/${summary.total} agents have issues`;
};

/**
 * AggregatedCheckItem displays a single check aggregated across all agents.
 * Shows worst status icon, title, and a summary of how many agents have issues.
 * Can be expanded to show per-agent details.
 */
export const AggregatedCheckItem: FC<AggregatedCheckItemProps> = ({
  check,
  expanded,
  onToggle,
  children,
  className,
}) => {
  const isAnalyzing = check.worst_status === 'analyzing';
  const hasIssues = check.summary.issues > 0;

  return (
    <ItemContainer className={className}>
      <ItemWrapper
        $status={check.worst_status}
        $expanded={expanded}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={expanded}
      >
        <StatusIconContainer $status={check.worst_status} $isAnalyzing={isAnalyzing}>
          {getStatusIcon(check.worst_status)}
        </StatusIconContainer>

        <ContentContainer>
          {check.description ? (
            <Tooltip content={check.description} position="top">
              <TitleWithInfo>
                <CheckTitle>{check.title}</CheckTitle>
                <InfoIcon>
                  <Info size={12} />
                </InfoIcon>
              </TitleWithInfo>
            </Tooltip>
          ) : (
            <CheckTitle>{check.title}</CheckTitle>
          )}
        </ContentContainer>

        <RightSection>
          <SummaryText $hasIssues={hasIssues}>{formatSummary(check.summary)}</SummaryText>
          <ChevronIcon $expanded={expanded}>
            <ChevronRight size={16} />
          </ChevronIcon>
        </RightSection>
      </ItemWrapper>

      <ExpandedContent $expanded={expanded}>{children}</ExpandedContent>
    </ItemContainer>
  );
};
