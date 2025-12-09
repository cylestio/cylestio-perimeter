import type { FC } from 'react';

import { Folder } from 'lucide-react';

import {
  CardContainer,
  CardHeader,
  IconContainer,
  WorkflowInfo,
  WorkflowName,
  WorkflowId,
  CardBody,
  StatsGrid,
  StatItem,
  StatValue,
  StatLabel,
  CardFooter,
  ViewButton,
} from './WorkflowCard.styles';

export interface WorkflowCardProps {
  id: string;
  name: string;
  agentCount: number;
  sessionCount?: number;
  onClick?: () => void;
}

export const WorkflowCard: FC<WorkflowCardProps> = ({
  id,
  name,
  agentCount,
  sessionCount = 0,
  onClick,
}) => {
  return (
    <CardContainer $clickable={!!onClick} onClick={onClick} data-testid="workflow-card">
      <CardHeader>
        <IconContainer>
          <Folder size={20} />
        </IconContainer>
        <WorkflowInfo>
          <WorkflowName>{name}</WorkflowName>
          <WorkflowId>{id}</WorkflowId>
        </WorkflowInfo>
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
        <ViewButton>View Workflow →</ViewButton>
      </CardFooter>
    </CardContainer>
  );
};
