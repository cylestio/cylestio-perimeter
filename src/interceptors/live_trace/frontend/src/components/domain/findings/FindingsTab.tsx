import { useState, useMemo } from 'react';
import type { FC } from 'react';

import type { Finding, FindingsSummary, FindingSeverity, FindingStatus } from '@api/types/findings';

import { EmptyState } from '@ui/feedback/EmptyState';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { ToggleGroup } from '@ui/navigation/ToggleGroup';
import type { ToggleOption } from '@ui/navigation/ToggleGroup';

import { FindingCard } from './FindingCard';
import {
  FindingsTabWrapper,
  SummaryBar,
  SummaryItem,
  SummaryLabel,
  SummaryValue,
  FilterSection,
  FindingsList,
  ErrorMessage,
  LoadingWrapper,
} from './FindingsTab.styles';

export interface FindingsTabProps {
  findings: Finding[];
  summary?: FindingsSummary;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

type SeverityFilter = 'ALL' | FindingSeverity;
type StatusFilter = 'ALL' | FindingStatus;

const severityOrder: Record<FindingSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const sortFindings = (findings: Finding[]): Finding[] => {
  return [...findings].sort((a, b) => {
    // Sort by severity first
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by date (most recent first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export const FindingsTab: FC<FindingsTabProps> = ({
  findings,
  summary,
  isLoading = false,
  error,
  className,
}) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Build severity filter options with counts
  const severityOptions: ToggleOption[] = useMemo(() => {
    const options: ToggleOption[] = [{ id: 'ALL', label: 'All Severities', active: severityFilter === 'ALL' }];

    if (summary?.by_severity) {
      const severities: FindingSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      severities.forEach((severity) => {
        const count = summary.by_severity[severity] || 0;
        if (count > 0) {
          options.push({
            id: severity,
            label: `${severity} (${count})`,
            active: severityFilter === severity,
          });
        }
      });
    }

    return options;
  }, [summary, severityFilter]);

  // Build status filter options with counts
  const statusOptions: ToggleOption[] = useMemo(() => {
    const options: ToggleOption[] = [{ id: 'ALL', label: 'All Status', active: statusFilter === 'ALL' }];

    if (summary) {
      if (summary.open_count > 0) {
        options.push({
          id: 'OPEN',
          label: `Open (${summary.open_count})`,
          active: statusFilter === 'OPEN',
        });
      }
      if (summary.fixed_count > 0) {
        options.push({
          id: 'FIXED',
          label: `Fixed (${summary.fixed_count})`,
          active: statusFilter === 'FIXED',
        });
      }
      if (summary.ignored_count > 0) {
        options.push({
          id: 'IGNORED',
          label: `Ignored (${summary.ignored_count})`,
          active: statusFilter === 'IGNORED',
        });
      }
    }

    return options;
  }, [summary, statusFilter]);

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    let filtered = findings;

    if (severityFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.severity === severityFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    return sortFindings(filtered);
  }, [findings, severityFilter, statusFilter]);

  // Loading state
  if (isLoading) {
    return (
      <FindingsTabWrapper className={className}>
        <LoadingWrapper>
          <OrbLoader size="lg" />
        </LoadingWrapper>
      </FindingsTabWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <FindingsTabWrapper className={className}>
        <ErrorMessage>{error}</ErrorMessage>
      </FindingsTabWrapper>
    );
  }

  // Empty state
  if (findings.length === 0) {
    return (
      <FindingsTabWrapper className={className}>
        <EmptyState
          title="No findings"
          description="No security findings detected for this agent"
        />
      </FindingsTabWrapper>
    );
  }

  return (
    <FindingsTabWrapper className={className}>
      {summary && (
        <SummaryBar>
          <SummaryItem>
            <SummaryLabel>Total Findings</SummaryLabel>
            <SummaryValue>{summary.total_findings}</SummaryValue>
          </SummaryItem>
          <SummaryItem $severity="CRITICAL">
            <SummaryLabel>Critical</SummaryLabel>
            <SummaryValue>{summary.by_severity.CRITICAL || 0}</SummaryValue>
          </SummaryItem>
          <SummaryItem $severity="HIGH">
            <SummaryLabel>High</SummaryLabel>
            <SummaryValue>{summary.by_severity.HIGH || 0}</SummaryValue>
          </SummaryItem>
          <SummaryItem $severity="MEDIUM">
            <SummaryLabel>Medium</SummaryLabel>
            <SummaryValue>{summary.by_severity.MEDIUM || 0}</SummaryValue>
          </SummaryItem>
          <SummaryItem $severity="LOW">
            <SummaryLabel>Low</SummaryLabel>
            <SummaryValue>{summary.by_severity.LOW || 0}</SummaryValue>
          </SummaryItem>
        </SummaryBar>
      )}

      <FilterSection>
        <ToggleGroup
          options={severityOptions}
          onChange={(id) => setSeverityFilter(id as SeverityFilter)}
        />
        <ToggleGroup
          options={statusOptions}
          onChange={(id) => setStatusFilter(id as StatusFilter)}
        />
      </FilterSection>

      {filteredFindings.length === 0 ? (
        <EmptyState
          title="No matching findings"
          description="Try adjusting your filters"
        />
      ) : (
        <FindingsList>
          {filteredFindings.map((finding) => (
            <FindingCard key={finding.finding_id} finding={finding} />
          ))}
        </FindingsList>
      )}
    </FindingsTabWrapper>
  );
};
