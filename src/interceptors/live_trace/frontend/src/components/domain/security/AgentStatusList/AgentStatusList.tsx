import type { FC } from 'react';

import type { AgentCheckStatus, DynamicCheckStatus } from '@api/types/security';

import {
  ListContainer,
  AgentRow,
  AgentName,
  StatusBadge,
} from './AgentStatusList.styles';

export interface AgentStatusListProps {
  /** List of agent check statuses */
  agents: AgentCheckStatus[];
  /** Handler when an agent is clicked */
  onAgentClick: (agent: AgentCheckStatus) => void;
  /** Additional class name */
  className?: string;
}

// Get status label
const getStatusLabel = (status: DynamicCheckStatus): string => {
  switch (status) {
    case 'passed':
      return 'OK';
    case 'warning':
      return 'WARN';
    case 'critical':
      return 'FAIL';
    case 'analyzing':
      return 'ANALYZING';
    default:
      return '';
  }
};

/**
 * AgentStatusList displays a list of agents with their check status.
 * Shown inside an expanded AggregatedCheckItem.
 * Clicking an agent opens the drawer with full details.
 */
export const AgentStatusList: FC<AgentStatusListProps> = ({
  agents,
  onAgentClick,
  className,
}) => {
  // Sort agents: issues first (critical, then warning), then passed
  const sortedAgents = [...agents].sort((a, b) => {
    const statusOrder: Record<DynamicCheckStatus, number> = {
      critical: 0,
      warning: 1,
      analyzing: 2,
      passed: 3,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <ListContainer className={className}>
      {sortedAgents.map((agent) => (
        <AgentRow
          key={agent.agent_id}
          onClick={() => onAgentClick(agent)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAgentClick(agent);
            }
          }}
        >
          <AgentName>{agent.agent_name || agent.agent_id.slice(0, 16)}</AgentName>
          <StatusBadge $status={agent.status}>{getStatusLabel(agent.status)}</StatusBadge>
        </AgentRow>
      ))}
    </ListContainer>
  );
};
