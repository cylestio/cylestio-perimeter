import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

import type { APIAgent } from '@api/types/dashboard';
import { formatAgentName } from '@utils/formatting';

import { Avatar } from '@ui/core/Avatar';
import { Tooltip } from '@ui/overlays/Tooltip';

import {
  AgentListItemContainer,
  AgentInfo,
  AgentName,
  AgentMeta,
  SessionCount,
  StatusIcon,
} from './AgentListItem.styles';

// Types
type AgentStatus = 'evaluating' | 'ok' | 'requires_action';

export interface AgentListItemProps {
  agent: APIAgent;
  active?: boolean;
  collapsed?: boolean;
  /** Use 'to' for React Router navigation (preferred) */
  to?: string;
  onClick?: () => void;
}

// Helper to determine status from agent data
const getAgentStatus = (agent: APIAgent): AgentStatus => {
  if (agent.analysis_summary?.action_required) {
    return 'requires_action';
  }
  return agent.risk_status;
};

// Status tooltip text
const statusTooltips: Record<Exclude<AgentStatus, 'ok'>, string> = {
  evaluating: 'Evaluating agent behavior',
  requires_action: 'Action required',
};

// Component
export const AgentListItem: FC<AgentListItemProps> = ({
  agent,
  active = false,
  collapsed = false,
  to,
  onClick,
}) => {
  const name = formatAgentName(agent.id);
  const agentStatus = getAgentStatus(agent);

  // Render status icon with tooltip
  const renderStatusIcon = () => {
    if (agentStatus === 'ok') return null;

    const icon = (
      <StatusIcon $status={agentStatus}>
        {agentStatus === 'evaluating' && <Loader2 size={12} />}
        {agentStatus === 'requires_action' && <AlertTriangle size={12} />}
      </StatusIcon>
    );

    return (
      <Tooltip content={statusTooltips[agentStatus]} position="right">
        {icon}
      </Tooltip>
    );
  };

  // Common props for the container
  const containerProps = {
    $active: active,
    $collapsed: collapsed,
    title: collapsed ? name : undefined,
  };

  // Content for collapsed view
  if (collapsed) {
    if (to) {
      return (
        <AgentListItemContainer as={Link} to={to} {...containerProps}>
          <Avatar name={agent.id} size="md" />
        </AgentListItemContainer>
      );
    }
    return (
      <AgentListItemContainer onClick={onClick} role="button" tabIndex={0} {...containerProps}>
        <Avatar name={agent.id} size="md" />
      </AgentListItemContainer>
    );
  }

  // Full content
  const content = (
    <>
      <Avatar name={agent.id} size="md" />
      <AgentInfo>
        <AgentName>
          {name}
          {renderStatusIcon()}
        </AgentName>
        <AgentMeta>{agent.last_seen_relative}</AgentMeta>
      </AgentInfo>
      <SessionCount>{agent.total_sessions}</SessionCount>
    </>
  );

  // Use React Router Link for navigation
  if (to) {
    return (
      <AgentListItemContainer as={Link} to={to} {...containerProps}>
        {content}
      </AgentListItemContainer>
    );
  }

  // Fallback to onClick handler
  return (
    <AgentListItemContainer onClick={onClick} role="button" tabIndex={0} {...containerProps}>
      {content}
    </AgentListItemContainer>
  );
};
