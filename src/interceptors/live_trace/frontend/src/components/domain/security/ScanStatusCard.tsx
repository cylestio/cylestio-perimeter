import { useState, type FC } from 'react';
import { FileSearch, Clock, Files, Bot, Play, RefreshCw, History, ChevronDown, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

import type { StaticSummaryScan, StaticSummaryChecks, CheckStatus, GateStatus, ScanHistoryEntry, HistoricalSummary } from '@api/types/findings';
import { formatDateTime, timeAgo } from '@utils/formatting';

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
  ScanHistoryToggle,
  ScanHistoryPanel,
  ScanHistoryList,
  ScanHistoryItem,
  ScanHistoryTimestamp,
  ScanHistoryDetails,
  ScanHistoryBadge,
  CurrentBadge,
  HistoricalStatsSection,
  HistoricalStatItem,
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
  /** Scan history with findings breakdown per scan */
  scanHistory?: ScanHistoryEntry[];
  /** Historical findings summary (resolved issues) */
  historicalSummary?: HistoricalSummary;
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
  scanHistory,
  historicalSummary,
  onRunScan,
  className,
}) => {
  const [showHistory, setShowHistory] = useState(false);

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

  const gateStatus: GateStatus = summary?.gate_status || 'OPEN';
  const hasSeverityCounts = severityCounts && (
    severityCounts.critical > 0 ||
    severityCounts.high > 0 ||
    severityCounts.medium > 0 ||
    severityCounts.low > 0
  );
  const totalScans = scanHistory?.length ?? 1;

  // Helper to format findings count for a scan
  const formatScanFindings = (entry: ScanHistoryEntry): string => {
    const { severity_breakdown, findings_count } = entry;
    if (findings_count === 0) return 'No issues found';

    const parts: string[] = [];
    if (severity_breakdown.critical > 0) parts.push(`${severity_breakdown.critical} critical`);
    if (severity_breakdown.high > 0) parts.push(`${severity_breakdown.high} high`);
    if (severity_breakdown.medium > 0) parts.push(`${severity_breakdown.medium} medium`);
    if (severity_breakdown.low > 0) parts.push(`${severity_breakdown.low} low`);

    return parts.length > 0 ? parts.join(', ') : `${findings_count} issues`;
  };

  // Determine badge variant based on findings
  const getScanBadgeVariant = (entry: ScanHistoryEntry): 'findings' | 'clean' | 'scan' | 'autofix' => {
    if (entry.session_type === 'AUTOFIX') return 'autofix';
    if (entry.findings_count === 0) return 'clean';
    if (entry.severity_breakdown.critical > 0 || entry.severity_breakdown.high > 0) return 'findings';
    return 'scan';
  };

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
          {(lastScan.files_analyzed || lastScan.scanned_by || lastScan.duration_ms) && (
            <ScanMeta>
              {lastScan.files_analyzed && (
                <span>
                  <Files size={10} /> {lastScan.files_analyzed} files analyzed
                </span>
              )}
              {lastScan.scanned_by && (
                <span>
                  {lastScan.files_analyzed && ' · '}
                  <Bot size={10} /> by {lastScan.scanned_by}
                </span>
              )}
              {lastScan.duration_ms && (
                <span>
                  {(lastScan.files_analyzed || lastScan.scanned_by) && ' · '}
                  {(lastScan.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </ScanMeta>
          )}
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

      {/* Scan History Toggle */}
      {totalScans > 1 && (
        <ScanHistoryToggle
          onClick={() => setShowHistory(!showHistory)}
          $expanded={showHistory}
        >
          <History size={14} />
          View scan history ({totalScans} scans)
          <ChevronDown size={14} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </ScanHistoryToggle>
      )}

      {/* Scan History Panel */}
      {showHistory && scanHistory && scanHistory.length > 0 && (
        <ScanHistoryPanel>
          <ScanHistoryList>
            {scanHistory.map((entry, index) => (
              <ScanHistoryItem key={entry.session_id} $isCurrent={index === 0}>
                <ScanHistoryTimestamp>
                  {formatDateTime(entry.created_at)}
                  {index === 0 && <CurrentBadge>Current</CurrentBadge>}
                </ScanHistoryTimestamp>
                <ScanHistoryDetails>
                  <ScanHistoryBadge $variant={getScanBadgeVariant(entry)}>
                    {entry.session_type === 'AUTOFIX' ? (
                      <><Wrench size={10} /> Autofix</>
                    ) : entry.findings_count > 0 ? (
                      <><AlertTriangle size={10} /> {formatScanFindings(entry)}</>
                    ) : (
                      <><CheckCircle size={10} /> Clean scan</>
                    )}
                  </ScanHistoryBadge>
                  <span style={{ fontSize: '11px', color: 'var(--color-white50)' }}>
                    {timeAgo(entry.created_at)}
                  </span>
                </ScanHistoryDetails>
              </ScanHistoryItem>
            ))}
          </ScanHistoryList>

          {/* Historical summary */}
          {historicalSummary && historicalSummary.total_resolved > 0 && (
            <HistoricalStatsSection>
              <HistoricalStatItem $variant="fixed">
                <CheckCircle size={12} />
                {historicalSummary.fixed} fixed
              </HistoricalStatItem>
              {historicalSummary.resolved > 0 && (
                <HistoricalStatItem $variant="resolved">
                  <CheckCircle size={12} />
                  {historicalSummary.resolved} auto-resolved
                </HistoricalStatItem>
              )}
              {historicalSummary.dismissed > 0 && (
                <HistoricalStatItem $variant="dismissed">
                  {historicalSummary.dismissed} dismissed
                </HistoricalStatItem>
              )}
            </HistoricalStatsSection>
          )}
        </ScanHistoryPanel>
      )}

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
