import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

import type { APIAgent } from '@api/types/dashboard';
import { formatAgentName } from '@utils/formatting';

import { Avatar } from '@ui/core/Avatar';
import { Tooltip } from '@ui/overlays/Tooltip';

import {
  SystemPromptListItemContainer,
  SystemPromptInfo,
  SystemPromptName,
  SystemPromptMeta,
  SessionCount,
  StatusIcon,
} from './SystemPromptListItem.styles';

// Types
type SystemPromptStatus = 'evaluating' | 'ok' | 'requires_action';

export interface SystemPromptListItemProps {
  systemPrompt: APIAgent;
  active?: boolean;
  collapsed?: boolean;
  /** Use 'to' for React Router navigation (preferred) */
  to?: string;
  onClick?: () => void;
}

// Helper to determine status from system prompt data
const getSystemPromptStatus = (systemPrompt: APIAgent): SystemPromptStatus => {
  if (systemPrompt.analysis_summary?.action_required) {
    return 'requires_action';
  }
  return systemPrompt.risk_status;
};

// Status tooltip text
const statusTooltips: Record<Exclude<SystemPromptStatus, 'ok'>, string> = {
  evaluating: 'Evaluating system prompt behavior',
  requires_action: 'Action required',
};

// Component
export const SystemPromptListItem: FC<SystemPromptListItemProps> = ({
  systemPrompt,
  active = false,
  collapsed = false,
  to,
  onClick,
}) => {
  const name = formatAgentName(systemPrompt.id);
  const status = getSystemPromptStatus(systemPrompt);

  // Render status icon with tooltip
  const renderStatusIcon = () => {
    if (status === 'ok') return null;

    const icon = (
      <StatusIcon $status={status}>
        {status === 'evaluating' && <Loader2 size={12} />}
        {status === 'requires_action' && <AlertTriangle size={12} />}
      </StatusIcon>
    );

    return (
      <Tooltip content={statusTooltips[status]} position="right">
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
        <SystemPromptListItemContainer as={Link} to={to} {...containerProps}>
          <Avatar name={systemPrompt.id} size="md" />
        </SystemPromptListItemContainer>
      );
    }
    return (
      <SystemPromptListItemContainer onClick={onClick} role="button" tabIndex={0} {...containerProps}>
        <Avatar name={systemPrompt.id} size="md" />
      </SystemPromptListItemContainer>
    );
  }

  // Full content
  const content = (
    <>
      <Avatar name={systemPrompt.id} size="md" />
      <SystemPromptInfo>
        <SystemPromptName>
          {name}
          {renderStatusIcon()}
        </SystemPromptName>
        <SystemPromptMeta>{systemPrompt.last_seen_relative}</SystemPromptMeta>
      </SystemPromptInfo>
      <SessionCount>{systemPrompt.total_sessions}</SessionCount>
    </>
  );

  // Use React Router Link for navigation
  if (to) {
    return (
      <SystemPromptListItemContainer as={Link} to={to} {...containerProps}>
        {content}
      </SystemPromptListItemContainer>
    );
  }

  // Fallback to onClick handler
  return (
    <SystemPromptListItemContainer onClick={onClick} role="button" tabIndex={0} {...containerProps}>
      {content}
    </SystemPromptListItemContainer>
  );
};
