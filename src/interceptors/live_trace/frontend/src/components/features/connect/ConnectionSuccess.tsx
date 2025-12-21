import type { FC } from 'react';

import { Check, ArrowRight } from 'lucide-react';

import { Button } from '@ui/core/Button';

import {
  SuccessContainer,
  TopRow,
  BottomRow,
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
  workflowCount: number;
  agentCount: number;
  onViewAgentWorkflows: () => void;
}

export const ConnectionSuccess: FC<ConnectionSuccessProps> = ({
  workflowCount,
  agentCount,
  onViewAgentWorkflows,
}) => (
  <SuccessContainer>
    <TopRow>
      <IconContainer>
        <Check size={24} strokeWidth={2.5} />
      </IconContainer>
      <ContentSection>
        <Title>Connection Successful</Title>
        <Subtitle>
          Your workflow{workflowCount !== 1 ? 's are' : ' is'} now being monitored
        </Subtitle>
      </ContentSection>
    </TopRow>

    <BottomRow>
      <StatsSection>
        <Stat>
          <StatValue>{workflowCount}</StatValue>
          <StatLabel>Workflow{workflowCount !== 1 ? 's' : ''}</StatLabel>
        </Stat>
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
    </BottomRow>
  </SuccessContainer>
);
