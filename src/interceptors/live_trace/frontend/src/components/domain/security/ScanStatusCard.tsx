import type { FC } from 'react';

import { Clock, FileSearch, User, Search } from 'lucide-react';

import { TimeAgo } from '@ui/core/TimeAgo';

import { GateProgress, type CheckStatus, type GateStatus } from './GateProgress';
import {
  StatusCardWrapper,
  StatusCardHeader,
  HeaderLeft,
  ScanTitle,
  ScanMeta,
  MetaItem,
  MetaSeparator,
  StatusCardBody,
  GateSection,
  SeveritySummary,
  SeverityItem,
  SeverityCount,
  SeverityLabel,
  EmptyState,
  EmptyTitle,
  EmptyDescription,
} from './ScanStatusCard.styles';

export interface LastScanInfo {
  /** ISO timestamp of the scan */
  timestamp: string;
  /** Who/what performed the scan */
  scannedBy?: string;
  /** Number of files analyzed */
  filesAnalyzed?: number;
  /** Duration in milliseconds */
  durationMs?: number;
}

export interface SeverityCounts {
  CRITICAL?: number;
  HIGH?: number;
  MEDIUM?: number;
  LOW?: number;
}

export interface ScanStatusCardProps {
  /** Last scan info, if any */
  lastScan?: LastScanInfo | null;
  /** Array of check statuses for the gate progress */
  checks: { status: CheckStatus }[];
  /** Overall gate status */
  gateStatus: GateStatus;
  /** Severity breakdown of findings */
  severityCounts?: SeverityCounts;
  className?: string;
}

/**
 * ScanStatusCard - Shows the status of the last security scan
 * 
 * Displays:
 * - Last scan timestamp and metadata
 * - Gate progress indicator
 * - Severity breakdown summary
 */
export const ScanStatusCard: FC<ScanStatusCardProps> = ({
  lastScan,
  checks,
  gateStatus,
  severityCounts,
  className,
}) => {
  // If no scan has been run, show empty state
  if (!lastScan) {
    return (
      <StatusCardWrapper className={className}>
        <EmptyState>
          <Search size={32} style={{ opacity: 0.4 }} />
          <EmptyTitle>No scans yet</EmptyTitle>
          <EmptyDescription>
            Ask Cursor or Claude Code to scan your agent for security issues.
          </EmptyDescription>
        </EmptyState>
      </StatusCardWrapper>
    );
  }

  const hasSeverityCounts = severityCounts && (
    (severityCounts.CRITICAL || 0) +
    (severityCounts.HIGH || 0) +
    (severityCounts.MEDIUM || 0) +
    (severityCounts.LOW || 0)
  ) > 0;

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <StatusCardWrapper className={className}>
      <StatusCardHeader>
        <HeaderLeft>
          <ScanTitle>Scan Status</ScanTitle>
          <ScanMeta>
            <MetaItem>
              <Clock size={14} />
              <TimeAgo timestamp={lastScan.timestamp} />
            </MetaItem>
            {lastScan.scannedBy && (
              <>
                <MetaSeparator>•</MetaSeparator>
                <MetaItem>
                  <User size={14} />
                  {lastScan.scannedBy}
                </MetaItem>
              </>
            )}
            {lastScan.filesAnalyzed && (
              <>
                <MetaSeparator>•</MetaSeparator>
                <MetaItem>
                  <FileSearch size={14} />
                  {lastScan.filesAnalyzed} files
                </MetaItem>
              </>
            )}
            {lastScan.durationMs && (
              <>
                <MetaSeparator>•</MetaSeparator>
                <MetaItem>
                  {formatDuration(lastScan.durationMs)}
                </MetaItem>
              </>
            )}
          </ScanMeta>
        </HeaderLeft>
      </StatusCardHeader>

      <StatusCardBody>
        <GateSection>
          <GateProgress checks={checks} gateStatus={gateStatus} />
        </GateSection>

        {hasSeverityCounts && (
          <SeveritySummary>
            {(severityCounts.CRITICAL || 0) > 0 && (
              <SeverityItem $severity="CRITICAL">
                <SeverityCount>{severityCounts.CRITICAL}</SeverityCount>
                <SeverityLabel>Critical</SeverityLabel>
              </SeverityItem>
            )}
            {(severityCounts.HIGH || 0) > 0 && (
              <SeverityItem $severity="HIGH">
                <SeverityCount>{severityCounts.HIGH}</SeverityCount>
                <SeverityLabel>High</SeverityLabel>
              </SeverityItem>
            )}
            {(severityCounts.MEDIUM || 0) > 0 && (
              <SeverityItem $severity="MEDIUM">
                <SeverityCount>{severityCounts.MEDIUM}</SeverityCount>
                <SeverityLabel>Medium</SeverityLabel>
              </SeverityItem>
            )}
            {(severityCounts.LOW || 0) > 0 && (
              <SeverityItem $severity="LOW">
                <SeverityCount>{severityCounts.LOW}</SeverityCount>
                <SeverityLabel>Low</SeverityLabel>
              </SeverityItem>
            )}
          </SeveritySummary>
        )}
      </StatusCardBody>
    </StatusCardWrapper>
  );
};
