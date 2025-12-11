import type { FC, ReactNode } from 'react';

import { Clock, ExternalLink, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { AnalysisSession } from '@api/types/findings';

import { Badge, TimeAgo } from '@ui/core';
import { Table, type Column } from '@ui/data-display/Table';

import {
  formatDuration,
  getDurationMinutes,
  extractAgentFromSessionId,
} from '@utils/formatting';

import {
  AgentLink,
  SessionIdCell,
  MetaCell,
  EmptyStateWrapper,
} from './AnalysisSessionsTable.styles';

export interface AnalysisSessionsTableProps {
  sessions: AnalysisSession[];
  agentId: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  maxRows?: number;
}

// Get agent name - prefer agent_id, fallback to extracting from session_id
const getAgentName = (session: AnalysisSession): string | null => {
  if (session.agent_id) {
    return session.agent_id.length > 20 ? session.agent_id.slice(0, 20) : session.agent_id;
  }
  const extracted = extractAgentFromSessionId(session.session_id);
  if (extracted) {
    return extracted.length > 20 ? extracted.slice(0, 20) : extracted;
  }
  return null;
};

// Get agent ID for linking - prefer agent_id, fallback to extracted
const getAgentId = (session: AnalysisSession): string | null => {
  return session.agent_id || extractAgentFromSessionId(session.session_id);
};

export const AnalysisSessionsTable: FC<AnalysisSessionsTableProps> = ({
  sessions,
  agentId,
  loading = false,
  emptyMessage = 'No analysis sessions yet.',
  emptyDescription = 'Analysis sessions will appear here after running.',
  maxRows,
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
      key: 'agent_id',
      header: 'System prompt',
      width: '180px',
      render: (session) => {
        const agentName = getAgentName(session);
        const systemPromptId = getAgentId(session);
        if (!agentName || !systemPromptId) return <MetaCell>-</MetaCell>;
        return (
          <AgentLink as={Link} to={`/agent/${agentId}/system-prompt/${systemPromptId}`}>
            {agentName}
            <ExternalLink size={10} />
          </AgentLink>
        );
      },
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
      key: 'findings_count',
      header: 'Checks',
      width: '80px',
      align: 'center',
      sortable: true,
      render: (session) => (
        <MetaCell>
          <Shield size={12} />
          {session.findings_count}
        </MetaCell>
      ),
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
    />
  );
};
