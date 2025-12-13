import type { FC } from 'react';

import { Bot, AlertTriangle } from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { ProgressBar } from '@ui/feedback/ProgressBar';

import styled from 'styled-components';

export type SystemPromptRiskStatus = 'ok' | 'evaluating';

export interface SystemPromptCardProps {
  id: string;
  name: string;
  totalSessions: number;
  totalErrors: number;
  totalTools: number;
  lastSeen: string;
  riskStatus: SystemPromptRiskStatus;
  currentSessions: number;
  minSessionsRequired: number;
  hasCriticalFinding?: boolean;
  // Behavioral metrics (when evaluation complete)
  stability?: number;
  predictability?: number;
  confidence?: 'high' | 'medium' | 'low';
  failedChecks?: number;
  warnings?: number;
  onClick?: () => void;
}

// Styled components
const CardContainer = styled.div<{ $clickable: boolean }>`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ $clickable }) => $clickable && `
    cursor: pointer;
    &:hover {
      border-color: ${({ theme }: { theme: { colors: { cyan: string } } }) => theme.colors.cyan};
    }
  `}
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderLeft = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: flex-start;
`;

const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.cyan};
`;

const SystemPromptInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const SystemPromptName = styled.h3`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

const SystemPromptId = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
`;

const StatusBadge = styled(Badge)`
  flex-shrink: 0;
`;

const EvaluationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const EvaluationLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

const BehavioralMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  text-align: center;
`;

const MetricLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

const MetricValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.cyan};
`;

const StatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const StatValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[2]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const LastSeen = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

const ViewButton = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.cyan};
`;

const IssueIndicators = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const SystemPromptCard: FC<SystemPromptCardProps> = ({
  id,
  name,
  totalSessions,
  totalErrors,
  totalTools,
  lastSeen,
  riskStatus,
  currentSessions,
  minSessionsRequired,
  hasCriticalFinding,
  stability,
  predictability,
  confidence,
  failedChecks = 0,
  warnings = 0,
  onClick,
}) => {
  const isEvaluating = riskStatus === 'evaluating';
  const evaluationProgress = Math.min((currentSessions / minSessionsRequired) * 100, 100);
  
  return (
    <CardContainer $clickable={!!onClick} onClick={onClick} data-testid="system-prompt-card">
      <CardHeader>
        <HeaderLeft>
          <IconContainer>
            <Bot size={20} />
          </IconContainer>
          <SystemPromptInfo>
            <SystemPromptName>{name}</SystemPromptName>
            <SystemPromptId>{id}</SystemPromptId>
          </SystemPromptInfo>
        </HeaderLeft>
        
        {hasCriticalFinding ? (
          <StatusBadge variant="critical">CRITICAL</StatusBadge>
        ) : isEvaluating ? (
          <StatusBadge variant="medium">EVALUATING</StatusBadge>
        ) : (
          <StatusBadge variant="success">OK</StatusBadge>
        )}
      </CardHeader>

      {isEvaluating ? (
        <EvaluationSection>
          <EvaluationLabel>
            Gathering data... ({currentSessions}/{minSessionsRequired} sessions)
          </EvaluationLabel>
          <ProgressBar value={evaluationProgress / 100} variant="default" />
        </EvaluationSection>
      ) : (
        <>
          {(stability !== undefined || predictability !== undefined) && (
            <BehavioralMetrics>
              {stability !== undefined && (
                <MetricItem>
                  <MetricLabel>Stability</MetricLabel>
                  <MetricValue>{stability}%</MetricValue>
                </MetricItem>
              )}
              {predictability !== undefined && (
                <MetricItem>
                  <MetricLabel>Predictability</MetricLabel>
                  <MetricValue>{predictability}%</MetricValue>
                </MetricItem>
              )}
              {confidence && (
                <MetricItem>
                  <MetricLabel>Confidence</MetricLabel>
                  <MetricValue>{confidence}</MetricValue>
                </MetricItem>
              )}
            </BehavioralMetrics>
          )}
          
          {(failedChecks > 0 || warnings > 0) && (
            <IssueIndicators>
              {failedChecks > 0 && (
                <Badge variant="critical">
                  <AlertTriangle size={12} /> {failedChecks} failed
                </Badge>
              )}
              {warnings > 0 && (
                <Badge variant="medium">
                  {warnings} warning{warnings !== 1 ? 's' : ''}
                </Badge>
              )}
            </IssueIndicators>
          )}
        </>
      )}

      <StatsRow>
        <StatItem>
          <StatValue>{totalSessions}</StatValue>
          <StatLabel>sessions</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{totalTools}</StatValue>
          <StatLabel>tools</StatLabel>
        </StatItem>
        {totalErrors > 0 && (
          <StatItem>
            <StatValue style={{ color: 'var(--color-red)' }}>{totalErrors}</StatValue>
            <StatLabel>errors</StatLabel>
          </StatItem>
        )}
      </StatsRow>

      <CardFooter>
        <LastSeen>Last seen: {lastSeen}</LastSeen>
        <ViewButton>View details →</ViewButton>
      </CardFooter>
    </CardContainer>
  );
};
