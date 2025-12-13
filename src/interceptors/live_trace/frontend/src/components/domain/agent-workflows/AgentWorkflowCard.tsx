import type { FC } from 'react';

import { Folder } from 'lucide-react';

import {
  CardContainer,
  CardHeader,
  IconContainer,
  AgentWorkflowInfo,
  AgentWorkflowName,
  AgentWorkflowId,
  CardBody,
  StatsGrid,
  StatItem,
  StatValue,
  StatLabel,
  CardFooter,
  ViewButton,
} from './AgentWorkflowCard.styles';

export interface AgentWorkflowCardProps {
  id: string;
  name: string;
  agentCount: number;
  sessionCount?: number;
  onClick?: () => void;
}

export const AgentWorkflowCard: FC<AgentWorkflowCardProps> = ({
  id,
  name,
  agentCount,
  sessionCount = 0,
  onClick,
}) => {
  return (
    <CardContainer $clickable={!!onClick} onClick={onClick} data-testid="agent-workflow-card">
      <CardHeader>
        <IconContainer>
          <Folder size={20} />
        </IconContainer>
        <AgentWorkflowInfo>
          <AgentWorkflowName>{name}</AgentWorkflowName>
          <AgentWorkflowId>{id}</AgentWorkflowId>
        </AgentWorkflowInfo>
      </CardHeader>

      <CardBody>
        <StatsGrid>
          <StatItem>
            <StatValue $color="cyan">{agentCount}</StatValue>
            <StatLabel>Agents</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $color="purple">{sessionCount}</StatValue>
            <StatLabel>Sessions</StatLabel>
          </StatItem>
        </StatsGrid>
      </CardBody>

      <CardFooter>
        <ViewButton>View Agent Workflow →</ViewButton>
      </CardFooter>
    </CardContainer>
  );
};
