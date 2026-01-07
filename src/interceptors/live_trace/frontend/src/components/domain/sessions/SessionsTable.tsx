import type { FC, ReactNode } from 'react';

import { Link } from 'react-router-dom';

import type { SessionListItem } from '@api/types/session';
import { formatCompactNumber } from '@utils/formatting';

import { Avatar, Badge, TimeAgo } from '@ui/core';
import { Table, type Column } from '@ui/data-display/Table';
import { EmptyState } from '@ui/feedback/EmptyState';

import { SessionTags } from './SessionTags';

// Props
export interface SessionsTableProps {
  /** Sessions data to display */
  sessions: SessionListItem[];
  /** Agent Workflow ID for generating links */
  agentWorkflowId: string;
  /** Loading state */
  loading?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Whether to show the agent column */
  showAgentColumn?: boolean;
  /** Optional header content - when provided, table renders with border container */
  header?: ReactNode;
}

// Column definitions
const getColumns = (agentWorkflowId: string, showAgentColumn: boolean): Column<SessionListItem>[] => {
  const columns: Column<SessionListItem>[] = [
    {
      key: 'id',
      header: 'Session ID',
      width: '160px',
      render: (session) => (
        <Link
          to={`/agent-workflow/${agentWorkflowId}/session/${session.id}`}
          style={{
            color: 'var(--color-cyan)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          }}
        >
          {session.id_short}
        </Link>
      ),
    },
  ];

  // Optionally show agent column
  if (showAgentColumn) {
    columns.push({
      key: 'agent_id',
      header: 'Prompt',
      render: (session) => (
        <Link
          to={`/agent-workflow/${agentWorkflowId}/agent/${session.agent_id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-white-70)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          }}
        >
          <Avatar name={session.agent_id} size="sm" />
          {session.agent_id}
        </Link>
      ),
    });
  }

  columns.push(
    {
      key: 'status',
      header: 'Status',
      render: (session) => {
        if (session.is_active) {
          return <Badge variant="success">ACTIVE</Badge>;
        }
        if (session.errors > 0) {
          return <Badge variant="critical">ERROR</Badge>;
        }
        return <Badge variant="info">COMPLETE</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (session) => <TimeAgo timestamp={session.created_at} />,
      sortable: true,
    },
    {
      key: 'duration_minutes',
      header: 'Duration',
      render: (session) => `${session.duration_minutes.toFixed(1)}m`,
    },
    {
      key: 'message_count',
      header: 'Messages',
      sortable: true,
    },
    {
      key: 'total_tokens',
      header: 'Tokens',
      render: (session) => formatCompactNumber(session.total_tokens),
      sortable: true,
    },
    {
      key: 'tool_uses',
      header: 'Tools',
      sortable: true,
    },
    {
      key: 'error_rate',
      header: 'Error Rate',
      render: (session) =>
        session.error_rate > 0 ? (
          <span
            style={{
              color:
                session.error_rate > 20
                  ? 'var(--color-red)'
                  : session.error_rate > 10
                    ? 'var(--color-orange)'
                    : 'var(--color-white-50)',
            }}
          >
            {session.error_rate.toFixed(1)}%
          </span>
        ) : (
          <span style={{ color: 'var(--color-green)' }}>0%</span>
        ),
      sortable: true,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (session) => (
        <SessionTags tags={session.tags} maxTags={3} />
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Activity',
      render: (session) => (
        <TimeAgo timestamp={session.last_activity} />
      ),
      sortable: true,
    }
  );

  return columns;
};

// Component
export const SessionsTable: FC<SessionsTableProps> = ({
  sessions,
  agentWorkflowId,
  loading = false,
  emptyMessage = 'No sessions found',
  showAgentColumn = false,
  header,
}) => {
  const columns = getColumns(agentWorkflowId, showAgentColumn);

  return (
    <Table
      columns={columns}
      data={sessions}
      loading={loading}
      keyExtractor={(session) => session.id}
      header={header}
      emptyState={
        <EmptyState
          title="No Sessions"
          description={emptyMessage}
        />
      }
    />
  );
};
