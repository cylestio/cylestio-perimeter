import type { FC } from 'react';

import { Folder } from 'lucide-react';

import {
  CardContainer,
  CardHeader,
  IconContainer,
  AgentInfo,
  AgentName,
  AgentId,
  CardBody,
  StatsGrid,
  StatItem,
  StatValue,
  StatLabel,
  CardFooter,
  ViewButton,
} from './AgentCard.styles';

export interface AgentCardProps {
  id: string;
  name: string;
  agentCount: number;
  sessionCount?: number;
  onClick?: () => void;
}

export const AgentCard: FC<AgentCardProps> = ({
  id,
  name,
  agentCount,
  sessionCount = 0,
  onClick,
}) => {
  return (
    <CardContainer $clickable={!!onClick} onClick={onClick} data-testid="agent-card">
      <CardHeader>
        <IconContainer>
          <Folder size={20} />
        </IconContainer>
        <AgentInfo>
          <AgentName>{name}</AgentName>
          <AgentId>{id}</AgentId>
        </AgentInfo>
      </CardHeader>

      <CardBody>
        <StatsGrid>
          <StatItem>
            <StatValue $color="cyan">{agentCount}</StatValue>
            <StatLabel>System prompts</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $color="purple">{sessionCount}</StatValue>
            <StatLabel>Sessions</StatLabel>
          </StatItem>
        </StatsGrid>
      </CardBody>

      <CardFooter>
        <ViewButton>View Agent →</ViewButton>
      </CardFooter>
    </CardContainer>
  );
};
