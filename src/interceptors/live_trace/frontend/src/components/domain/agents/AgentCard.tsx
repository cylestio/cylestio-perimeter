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
  BehavioralSection,
  BehavioralRow,
  BehavioralLabel,
  MiniProgressBarContainer,
  MiniProgressBarFill,
  BehavioralValue,
  ConfidenceBadge,
  WarningsText,
} from './AgentCard.styles';

// Types
export type RiskStatus = 'evaluating' | 'ok';

export type ConfidenceLevel = 'high' | 'medium' | 'low';


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
  // Behavioral metrics (shown when evaluation complete)
  stability?: number;
  predictability?: number;
  confidence?: ConfidenceLevel;
  failedChecks?: number;
  warnings?: number;
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
  stability,
  predictability,
  confidence,
  failedChecks = 0,
  warnings = 0,
  onClick,
}) => {
  const isEvaluating = riskStatus === 'evaluating';
  const progressPercent = Math.min(
    (currentSessions / minSessionsRequired) * 100,
    100
  );

  // Show behavioral section when evaluation is complete and we have metrics
  const showBehavioral =
    riskStatus === 'ok' &&
    (stability !== undefined || predictability !== undefined || confidence);

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

        {showBehavioral && (
          <BehavioralSection>
            {stability !== undefined && (
              <BehavioralRow>
                <BehavioralLabel>Stability</BehavioralLabel>
                <MiniProgressBarContainer>
                  <MiniProgressBarFill $percent={stability} $color="cyan" />
                </MiniProgressBarContainer>
                <BehavioralValue>{stability}%</BehavioralValue>
              </BehavioralRow>
            )}
            {predictability !== undefined && (
              <BehavioralRow>
                <BehavioralLabel>Predictability</BehavioralLabel>
                <MiniProgressBarContainer>
                  <MiniProgressBarFill $percent={predictability} $color="purple" />
                </MiniProgressBarContainer>
                <BehavioralValue>{predictability}%</BehavioralValue>
              </BehavioralRow>
            )}
            {confidence && (
              <BehavioralRow>
                <BehavioralLabel>Confidence</BehavioralLabel>
                <ConfidenceBadge $confidence={confidence}>{confidence}</ConfidenceBadge>
              </BehavioralRow>
            )}
            {(failedChecks > 0 || warnings > 0) && (
              <BehavioralRow>
                {failedChecks > 0 && (
                  <WarningsText>{failedChecks} failed checks</WarningsText>
                )}
                {warnings > 0 && (
                  <WarningsText style={{ marginLeft: failedChecks > 0 ? '8px' : 0 }}>
                    {warnings} warnings
                  </WarningsText>
                )}
              </BehavioralRow>
            )}
          </BehavioralSection>
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
          {hasCriticalFinding ? 'Action required' : `Last seen: ${lastSeen}`}
        </LastSeen>
        <ViewButton>View →</ViewButton>
      </CardFooter>
    </CardContainer>
  );
};
