import type { FC, ReactNode } from 'react';

import { Clock, Activity, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

import type { AnalysisSession } from '@api/types/findings';

import { Badge, TimeAgo } from '@ui/core';
import { Table, type Column } from '@ui/data-display/Table';

import {
  formatDuration,
  getDurationMinutes,
} from '@utils/formatting';

import {
  SessionIdCell,
  MetaCell,
  SeverityCell,
  EmptyStateWrapper,
} from './AnalysisSessionsTable.styles';

export interface AnalysisSessionsTableProps {
  sessions: AnalysisSession[];
  agentWorkflowId: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  maxRows?: number;
  /** Callback when a row is clicked */
  onRowClick?: (session: AnalysisSession) => void;
}

export const AnalysisSessionsTable: FC<AnalysisSessionsTableProps> = ({
  sessions,
  loading = false,
  emptyMessage = 'No analysis sessions yet.',
  emptyDescription = 'Analysis sessions will appear here after running.',
  maxRows,
  onRowClick,
}) => {
  const displayedSessions = maxRows ? sessions.slice(0, maxRows) : sessions;

  const columns: Column<AnalysisSession>[] = [
    {
      key: 'session_type',
      header: 'Type',
      width: '80px',
      render: (session) => (
        <Badge variant="info">{session.session_type}</Badge>
      ),
    },
    {
      key: 'session_id',
      header: 'Session ID',
      render: (session) => (
        <SessionIdCell>{session.session_id}</SessionIdCell>
      ),
    },
    {
      key: 'created_at',
      header: 'Started',
      width: '140px',
      sortable: true,
      render: (session) => (
        <TimeAgo timestamp={session.created_at} />
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      width: '80px',
      render: (session) => {
        const minutes = getDurationMinutes(session.created_at, session.completed_at);
        if (minutes === null) return <MetaCell>-</MetaCell>;
        return (
          <MetaCell>
            <Clock size={12} />
            {formatDuration(minutes)}
          </MetaCell>
        );
      },
    },
    {
      key: 'sessions_analyzed',
      header: 'Sessions',
      width: '90px',
      align: 'center',
      sortable: true,
      render: (session) => {
        const count = session.sessions_analyzed;
        if (count === null || count === undefined) return <MetaCell>-</MetaCell>;
        return (
          <MetaCell>
            <Activity size={12} />
            {count}
          </MetaCell>
        );
      },
    },
    {
      key: 'critical',
      header: 'Critical',
      width: '80px',
      align: 'center',
      sortable: true,
      render: (session) => {
        const count = session.critical ?? 0;
        return (
          <SeverityCell $variant={count > 0 ? 'critical' : 'muted'}>
            <XCircle size={12} />
            {count}
          </SeverityCell>
        );
      },
    },
    {
      key: 'warnings',
      header: 'Warning',
      width: '80px',
      align: 'center',
      sortable: true,
      render: (session) => {
        const count = session.warnings ?? 0;
        return (
          <SeverityCell $variant={count > 0 ? 'warning' : 'muted'}>
            <AlertTriangle size={12} />
            {count}
          </SeverityCell>
        );
      },
    },
    {
      key: 'passed',
      header: 'Passed',
      width: '80px',
      align: 'center',
      sortable: true,
      render: (session) => {
        const count = session.passed ?? 0;
        return (
          <SeverityCell $variant={count > 0 ? 'passed' : 'muted'}>
            <CheckCircle size={12} />
            {count}
          </SeverityCell>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'right',
      render: (session) => (
        <Badge variant={session.status === 'COMPLETED' ? 'success' : 'medium'}>
          {session.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
        </Badge>
      ),
    },
  ];

  const emptyState: ReactNode = (
    <EmptyStateWrapper>
      <p>{emptyMessage}</p>
      <p>{emptyDescription}</p>
    </EmptyStateWrapper>
  );

  return (
    <Table
      columns={columns}
      data={displayedSessions}
      loading={loading}
      emptyState={emptyState}
      keyExtractor={(session) => session.session_id}
      onRowClick={onRowClick}
    />
  );
};
