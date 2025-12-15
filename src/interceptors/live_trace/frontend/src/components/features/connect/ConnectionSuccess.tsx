import type { FC } from 'react';

import { Check, ArrowRight } from 'lucide-react';

import { Button } from '@ui/core/Button';

import {
  SuccessContainer,
  IconContainer,
  ContentSection,
  Title,
  Subtitle,
  StatsSection,
  Stat,
  StatValue,
  StatLabel,
  ActionSection,
} from './ConnectionSuccess.styles';

export interface ConnectionSuccessProps {
  agentCount: number;
  onViewAgentWorkflows: () => void;
}

export const ConnectionSuccess: FC<ConnectionSuccessProps> = ({
  agentCount,
  onViewAgentWorkflows,
}) => (
  <SuccessContainer>
    <IconContainer>
      <Check size={24} strokeWidth={2.5} />
    </IconContainer>

    <ContentSection>
      <Title>Connection Successful</Title>
      <Subtitle>
        Your agent{agentCount !== 1 ? 's are' : ' is'} now being monitored
      </Subtitle>
    </ContentSection>

    <StatsSection>
      <Stat>
        <StatValue>{agentCount}</StatValue>
        <StatLabel>Agent{agentCount !== 1 ? 's' : ''}</StatLabel>
      </Stat>
    </StatsSection>

    <ActionSection>
      <Button
        variant="primary"
        size="md"
        icon={<ArrowRight size={16} />}
        onClick={onViewAgentWorkflows}
      >
        View Agent Workflows
      </Button>
    </ActionSection>
  </SuccessContainer>
);
