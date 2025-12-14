import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

import type { APIAgentStep } from '@api/types/dashboard';
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
} from './AgentStepListItem.styles';

// Types
type AgentStepStatus = 'evaluating' | 'ok' | 'requires_action';

export interface AgentStepListItemProps {
  agentStep: APIAgentStep;
  active?: boolean;
  collapsed?: boolean;
  /** Use 'to' for React Router navigation (preferred) */
  to?: string;
  onClick?: () => void;
}

// Helper to determine status from agent step data
const getAgentStepStatus = (agentStep: APIAgentStep): AgentStepStatus => {
  if (agentStep.analysis_summary?.action_required) {
    return 'requires_action';
  }
  return agentStep.risk_status;
};

// Status tooltip text
const statusTooltips: Record<Exclude<AgentStepStatus, 'ok'>, string> = {
  evaluating: 'Evaluating agent step behavior',
  requires_action: 'Action required',
};

// Component
export const AgentStepListItem: FC<AgentStepListItemProps> = ({
  agentStep,
  active = false,
  collapsed = false,
  to,
  onClick,
}) => {
  const name = formatAgentName(agentStep.id);
  const agentStepStatus = getAgentStepStatus(agentStep);

  // Render status icon with tooltip
  const renderStatusIcon = () => {
    if (agentStepStatus === 'ok') return null;

    const icon = (
      <StatusIcon $status={agentStepStatus}>
        {agentStepStatus === 'evaluating' && <Loader2 size={12} />}
        {agentStepStatus === 'requires_action' && <AlertTriangle size={12} />}
      </StatusIcon>
    );

    return (
      <Tooltip content={statusTooltips[agentStepStatus]} position="right">
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
          <Avatar name={agentStep.id} size="md" />
        </AgentListItemContainer>
      );
    }
    return (
      <AgentListItemContainer onClick={onClick} role="button" tabIndex={0} {...containerProps}>
        <Avatar name={agentStep.id} size="md" />
      </AgentListItemContainer>
    );
  }

  // Full content
  const content = (
    <>
      <Avatar name={agentStep.id} size="md" />
      <AgentInfo>
        <AgentName>
          {name}
          {renderStatusIcon()}
        </AgentName>
        <AgentMeta>{agentStep.last_seen_relative}</AgentMeta>
      </AgentInfo>
      <SessionCount>{agentStep.total_sessions}</SessionCount>
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
