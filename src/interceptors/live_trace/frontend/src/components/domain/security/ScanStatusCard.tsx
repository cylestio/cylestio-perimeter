import type { FC } from 'react';
import { FileSearch, Clock, Files, Bot, Play, RefreshCw } from 'lucide-react';

import type { StaticSummaryScan, StaticSummaryChecks, CheckStatus, GateStatus } from '@api/types/findings';
import { formatDateTime } from '@utils/formatting';

import { GateProgress } from './GateProgress';
import {
  CardWrapper,
  CardHeader,
  CardTitle,
  LastScanInfo,
  LastScanTime,
  ScanMeta,
  ScanActions,
  ScanButton,
  GateSection,
  SeveritySummary,
  SeverityItem,
  SeverityCount,
  SeverityLabel,
  EmptyState,
  EmptyIcon,
  EmptyTitle,
  EmptyDescription,
} from './ScanStatusCard.styles';

export interface ScanStatusCardProps {
  /** Last scan information (null if no scans yet) */
  lastScan: StaticSummaryScan | null;
  /** Check summary with pass/fail/info counts */
  summary: StaticSummaryChecks | null;
  /** Severity counts */
  severityCounts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Array of check statuses for gate progress */
  checkStatuses?: { status: CheckStatus }[];
  /** Callback when user clicks "Run Scan" */
  onRunScan?: () => void;
  className?: string;
}

/**
 * ScanStatusCard displays the status of the last security scan,
 * gate progress, and severity summary.
 */
export const ScanStatusCard: FC<ScanStatusCardProps> = ({
  lastScan,
  summary,
  severityCounts,
  checkStatuses,
  onRunScan,
  className,
}) => {
  // If no scan has been run yet
  if (!lastScan) {
    return (
      <CardWrapper className={className}>
        <EmptyState>
          <EmptyIcon>
            <FileSearch size={24} />
          </EmptyIcon>
          <EmptyTitle>No scans yet</EmptyTitle>
          <EmptyDescription>
            Ask your AI assistant to scan your agent for security issues, or use the /scan command.
          </EmptyDescription>
          {onRunScan && (
            <ScanButton onClick={onRunScan}>
              <Play size={14} />
              Run Security Scan
            </ScanButton>
          )}
        </EmptyState>
      </CardWrapper>
    );
  }

  const gateStatus: GateStatus = summary?.gate_status || 'UNBLOCKED';
  const hasSeverityCounts = severityCounts && (
    severityCounts.critical > 0 ||
    severityCounts.high > 0 ||
    severityCounts.medium > 0 ||
    severityCounts.low > 0
  );

  return (
    <CardWrapper className={className}>
      <CardHeader>
        <LastScanInfo>
          <CardTitle>
            <FileSearch size={16} />
            Scan Status
          </CardTitle>
          <LastScanTime>
            <Clock size={12} />
            Last scan: {formatDateTime(lastScan.timestamp)}
          </LastScanTime>
          <ScanMeta>
            {lastScan.files_analyzed !== undefined && (
              <span>
                <Files size={10} /> {lastScan.files_analyzed} files analyzed
              </span>
            )}
            {lastScan.scanned_by && (
              <span>
                {' · '}
                <Bot size={10} /> by {lastScan.scanned_by}
              </span>
            )}
            {lastScan.duration_ms !== undefined && (
              <span>
                {' · '}
                {(lastScan.duration_ms / 1000).toFixed(1)}s
              </span>
            )}
          </ScanMeta>
        </LastScanInfo>
        
        {onRunScan && (
          <ScanActions>
            <ScanButton onClick={onRunScan}>
              <RefreshCw size={14} />
              Re-scan
            </ScanButton>
          </ScanActions>
        )}
      </CardHeader>

      {/* Gate Progress */}
      {checkStatuses && checkStatuses.length > 0 && (
        <GateSection>
          <GateProgress
            checks={checkStatuses}
            gateStatus={gateStatus}
            showStats={true}
          />
        </GateSection>
      )}

      {/* Severity Summary */}
      {hasSeverityCounts && (
        <SeveritySummary>
          {severityCounts.critical > 0 && (
            <SeverityItem $severity="CRITICAL">
              <SeverityCount>{severityCounts.critical}</SeverityCount>
              <SeverityLabel>Critical</SeverityLabel>
            </SeverityItem>
          )}
          {severityCounts.high > 0 && (
            <SeverityItem $severity="HIGH">
              <SeverityCount>{severityCounts.high}</SeverityCount>
              <SeverityLabel>High</SeverityLabel>
            </SeverityItem>
          )}
          {severityCounts.medium > 0 && (
            <SeverityItem $severity="MEDIUM">
              <SeverityCount>{severityCounts.medium}</SeverityCount>
              <SeverityLabel>Medium</SeverityLabel>
            </SeverityItem>
          )}
          {severityCounts.low > 0 && (
            <SeverityItem $severity="LOW">
              <SeverityCount>{severityCounts.low}</SeverityCount>
              <SeverityLabel>Low</SeverityLabel>
            </SeverityItem>
          )}
        </SeveritySummary>
      )}
    </CardWrapper>
  );
};
