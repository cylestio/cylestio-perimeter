import type { FC } from 'react';
import { Avatar } from '@ui/core/Avatar';
import {
  CardContainer,
  CardHeader,
  AgentInfo,
  AgentName,
  AgentId,
  RiskStatusBadge,
  CardBody,
  EvaluatingContainer,
  EvaluatingText,
  ProgressBarContainer,
  ProgressBarFill,
  StatsGrid,
  StatItem,
  StatValue,
  StatLabel,
  CardFooter,
  LastSeen,
  ViewButton,
} from './AgentCard.styles';

// Types
export type RiskStatus = 'evaluating' | 'ok';

export interface AgentCardProps {
  id: string;
  name: string;
  /** @deprecated Use name prop - initials are now auto-generated */
  initials?: string;
  totalSessions: number;
  totalErrors: number;
  totalTools: number;
  lastSeen: string;
  riskStatus: RiskStatus;
  currentSessions?: number;
  minSessionsRequired?: number;
  hasCriticalFinding?: boolean;
  onClick?: () => void;
}

// Component
export const AgentCard: FC<AgentCardProps> = ({
  id,
  name,
  totalSessions,
  totalErrors,
  totalTools,
  lastSeen,
  riskStatus,
  currentSessions = 0,
  minSessionsRequired = 5,
  hasCriticalFinding = false,
  onClick,
}) => {
  const isEvaluating = riskStatus === 'evaluating';
  const progressPercent = Math.min(
    (currentSessions / minSessionsRequired) * 100,
    100
  );

  return (
    <CardContainer
      $riskStatus={riskStatus}
      $hasCritical={hasCriticalFinding}
      $clickable={!!onClick}
      onClick={onClick}
      data-testid="agent-card"
    >
      <CardHeader>
        <Avatar name={id} size="lg" />
        <AgentInfo>
          <AgentName>{name}</AgentName>
          <AgentId>{id}</AgentId>
        </AgentInfo>
        <RiskStatusBadge $riskStatus={riskStatus}>
          {riskStatus === 'ok' ? 'OK' : 'Evaluating'}
        </RiskStatusBadge>
      </CardHeader>

      <CardBody>
        {isEvaluating && (
          <EvaluatingContainer>
            <EvaluatingText>
              {currentSessions}/{minSessionsRequired} sessions needed
            </EvaluatingText>
            <ProgressBarContainer>
              <ProgressBarFill $percent={progressPercent} />
            </ProgressBarContainer>
          </EvaluatingContainer>
        )}

        <StatsGrid>
          <StatItem>
            <StatValue $color="cyan">{totalSessions}</StatValue>
            <StatLabel>Sessions</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $color={totalErrors > 0 ? 'red' : 'green'}>
              {totalErrors}
            </StatValue>
            <StatLabel>Errors</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $color="purple">{totalTools}</StatValue>
            <StatLabel>Tools</StatLabel>
          </StatItem>
        </StatsGrid>
      </CardBody>

      <CardFooter>
        <LastSeen $critical={hasCriticalFinding}>
          {hasCriticalFinding ? '⚠ Action required' : `Last seen: ${lastSeen}`}
        </LastSeen>
        <ViewButton>View →</ViewButton>
      </CardFooter>
    </CardContainer>
  );
};
