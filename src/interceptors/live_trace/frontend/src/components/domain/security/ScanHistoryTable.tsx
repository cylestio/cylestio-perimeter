import { useMemo, type FC } from 'react';

import { Loader2, CheckCircle, XCircle, Eye, FileSearch, Wrench } from 'lucide-react';

import type { AnalysisSession } from '@api/types/findings';
import { TimeAgo } from '@ui/core/TimeAgo';
import { Table, type Column } from '@ui/data-display/Table';
import { EmptyState } from '@ui/feedback/EmptyState';

import {
  StatusIcon,
  TypeBadge,
  FindingsCell,
  SeverityDot,
  NoFindings,
  ActionsCell,
  IconButton,
  AgentCell,
} from './ScanHistoryTable.styles';

export interface ScanHistoryTableProps {
  sessions: AnalysisSession[];
  loading?: boolean;
  onViewSession?: (sessionId: string) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

// Helper to extract severity counts from a session
// Note: AnalysisSession doesn't have severity_breakdown, so we'll show findings_count
const getSeverityBreakdown = (session: AnalysisSession) => {
  // For now, we don't have severity breakdown in AnalysisSession
  // This could be extended if the API provides it
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: session.findings_count,
  };
};

export const ScanHistoryTable: FC<ScanHistoryTableProps> = ({
  sessions,
  loading = false,
  onViewSession,
  emptyMessage = 'No scans yet',
  emptyDescription = 'Run a security scan to see results here.',
  className,
}) => {
  const columns: Column<AnalysisSession>[] = useMemo(
    () => [
      {
        key: 'status',
        header: '',
        width: '48px',
        render: (row) => {
          const isInProgress = row.status === 'IN_PROGRESS';
          const hasFailed = row.findings_count > 0;
          const status = isInProgress
            ? 'in_progress'
            : hasFailed
              ? 'fail'
              : 'pass';

          return (
            <StatusIcon $status={status}>
              {isInProgress ? (
                <Loader2 size={18} />
              ) : hasFailed ? (
                <XCircle size={18} />
              ) : (
                <CheckCircle size={18} />
              )}
            </StatusIcon>
          );
        },
      },
      {
        key: 'created_at',
        header: 'Time',
        width: '140px',
        render: (row) => <TimeAgo timestamp={row.created_at} />,
        sortable: true,
      },
      {
        key: 'session_type',
        header: 'Type',
        width: '100px',
        render: (row) => (
          <TypeBadge $type={row.session_type}>
            {row.session_type === 'STATIC' && <FileSearch size={10} />}
            {row.session_type === 'AUTOFIX' && <Wrench size={10} />}
            {row.session_type}
          </TypeBadge>
        ),
        sortable: true,
      },
      {
        key: 'findings_count',
        header: 'Findings',
        width: '120px',
        render: (row) => {
          if (row.status === 'IN_PROGRESS') {
            return <NoFindings>Scanning...</NoFindings>;
          }
          if (row.findings_count === 0) {
            return <NoFindings>No issues</NoFindings>;
          }

          const severity = getSeverityBreakdown(row);

          return (
            <FindingsCell>
              {severity.critical > 0 && (
                <SeverityDot $severity="critical">{severity.critical}</SeverityDot>
              )}
              {severity.high > 0 && (
                <SeverityDot $severity="high">{severity.high}</SeverityDot>
              )}
              {severity.medium > 0 && (
                <SeverityDot $severity="medium">{severity.medium}</SeverityDot>
              )}
              {severity.low > 0 && (
                <SeverityDot $severity="low">{severity.low}</SeverityDot>
              )}
              {/* If we don't have breakdown, just show total */}
              {severity.total > 0 &&
                severity.critical === 0 &&
                severity.high === 0 &&
                severity.medium === 0 &&
                severity.low === 0 && (
                  <span>{severity.total} issues</span>
                )}
            </FindingsCell>
          );
        },
        sortable: true,
      },
      {
        key: 'agent_id',
        header: 'Agent',
        render: (row) => (
          <AgentCell title={row.agent_id || 'Unknown'}>
            {row.agent_id || 'Unknown'}
          </AgentCell>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '60px',
        align: 'right',
        render: (row) => (
          <ActionsCell>
            {row.status === 'COMPLETED' && onViewSession && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSession(row.session_id);
                }}
                title="View details"
              >
                <Eye size={16} />
              </IconButton>
            )}
          </ActionsCell>
        ),
      },
    ],
    [onViewSession]
  );

  const table = (
    <Table
      columns={columns}
      data={sessions}
      loading={loading}
      onRowClick={
        onViewSession
          ? (row) => row.status === 'COMPLETED' && onViewSession(row.session_id)
          : undefined
      }
      keyExtractor={(row) => row.session_id}
      emptyState={
        <EmptyState
          icon={<FileSearch size={40} />}
          title={emptyMessage}
          description={emptyDescription}
        />
      }
    />
  );

  if (className) {
    return <div className={className}>{table}</div>;
  }

  return table;
};
