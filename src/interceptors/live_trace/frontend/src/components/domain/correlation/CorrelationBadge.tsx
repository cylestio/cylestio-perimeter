import type { FC } from 'react';
import { Info } from 'lucide-react';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  Badge,
  BadgeIcon,
  BadgeLabel,
  TooltipContent,
  type CorrelationState,
} from './CorrelationBadge.styles';

export interface CorrelationBadgeProps {
  /** The correlation state of the finding */
  state: CorrelationState;
  /** Optional evidence string to display in tooltip */
  evidence?: string;
  /** Optional className for styling */
  className?: string;
}

interface StateConfig {
  icon: string;
  label: string;
  description: string;
}

const getStateConfig = (state: CorrelationState): StateConfig => {
  switch (state) {
    case 'VALIDATED':
      return {
        icon: '🔴',
        label: 'Validated',
        description: 'Confirmed at runtime - active risk!',
      };
    case 'UNEXERCISED':
      return {
        icon: '📋',
        label: 'Unexercised',
        description: 'Never triggered at runtime - test gap',
      };
    case 'RUNTIME_ONLY':
      return {
        icon: '🔵',
        label: 'Runtime Only',
        description: 'Found at runtime, no static counterpart',
      };
    case 'THEORETICAL':
      return {
        icon: '📚',
        label: 'Theoretical',
        description: 'Static finding, but safe at runtime',
      };
    default:
      return {
        icon: '❓',
        label: state,
        description: 'Unknown correlation state',
      };
  }
};

/**
 * CorrelationBadge displays the correlation state of a finding.
 * 
 * Correlation states:
 * - VALIDATED: Static finding confirmed by runtime evidence (highest priority)
 * - UNEXERCISED: Static finding never triggered at runtime (test gap)
 * - RUNTIME_ONLY: Issue found at runtime, no static counterpart
 * - THEORETICAL: Static finding but safe at runtime (lowest priority)
 */
export const CorrelationBadge: FC<CorrelationBadgeProps> = ({
  state,
  evidence,
  className,
}) => {
  const config = getStateConfig(state);

  const badge = (
    <Badge $state={state} className={className}>
      <BadgeIcon>{config.icon}</BadgeIcon>
      <BadgeLabel>{config.label}</BadgeLabel>
      {evidence && <Info size={10} />}
    </Badge>
  );

  if (evidence) {
    return (
      <Tooltip 
        content={
          <TooltipContent>
            <strong>{config.description}</strong>
            <br />
            {evidence}
          </TooltipContent>
        }
      >
        {badge}
      </Tooltip>
    );
  }

  return (
    <Tooltip content={config.description}>
      {badge}
    </Tooltip>
  );
};

export type { CorrelationState };
