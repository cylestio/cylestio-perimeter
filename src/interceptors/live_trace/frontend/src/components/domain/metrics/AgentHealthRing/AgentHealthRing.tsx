import type { FC } from 'react';

import {
  Shield,
  RefreshCcw,
  CheckCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

import type { HealthDimensions, IssueCounts } from '@api/types/code';

import {
  Container,
  HeaderRow,
  HealthDisplay,
  RingContainer,
  RingSvg,
  RingBackground,
  RingProgress,
  RingCenter,
  HealthValue,
  HealthLabel,
  HealthInfo,
  HealthTitle,
  HealthTrend,
  HealthDescription,
  ActionsContainer,
  ActionButton,
  DimensionsGrid,
  DimensionCard,
  DimensionHeader,
  DimensionIcon,
  DimensionLabel,
  DimensionValue,
  DimensionIssues,
  SuggestionBanner,
  SuggestionIcon,
  SuggestionContent,
  SuggestionText,
  SuggestionGain,
} from './AgentHealthRing.styles';

export interface AgentHealthRingProps {
  /** Overall health score (0-100) */
  health: number;
  /** Individual dimension scores */
  dimensions: HealthDimensions;
  /** Issue counts per dimension */
  issueCounts: IssueCounts;
  /** Trend direction */
  trend?: 'improving' | 'declining' | 'stable';
  /** Trend delta percentage */
  trendDelta?: number;
  /** Suggested improvement */
  suggestion?: {
    dimension: keyof HealthDimensions;
    potentialGain: number;
    action: string;
  };
  /** Callback when "View Code Issues" is clicked */
  onViewCodeIssues?: () => void;
  /** Callback when "View Security Issues" is clicked */
  onViewSecurityIssues?: () => void;
  className?: string;
}

const getHealthColor = (score: number): 'green' | 'orange' | 'red' => {
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp size={14} />;
    case 'declining':
      return <TrendingDown size={14} />;
    default:
      return <Minus size={14} />;
  }
};

const getTrendText = (trend: string, delta: number): string => {
  if (trend === 'improving') return `+${delta.toFixed(0)}% from last scan`;
  if (trend === 'declining') return `${delta.toFixed(0)}% from last scan`;
  return 'Stable';
};

const getHealthDescription = (health: number, totalIssues: number): string => {
  if (health >= 90) {
    return 'Excellent! Your agent is well-configured with minimal issues.';
  }
  if (health >= 70) {
    return `Good health score. Address ${totalIssues} open issues to improve reliability.`;
  }
  if (health >= 50) {
    return `Moderate health. ${totalIssues} issues found that may affect agent reliability.`;
  }
  return `Critical issues detected. Review ${totalIssues} findings to improve agent health.`;
};

/**
 * AgentHealthRing displays the overall agent health score as a donut chart
 * with dimension breakdowns and actionable suggestions.
 */
export const AgentHealthRing: FC<AgentHealthRingProps> = ({
  health,
  dimensions,
  issueCounts,
  trend = 'stable',
  trendDelta = 0,
  suggestion,
  onViewCodeIssues,
  onViewSecurityIssues,
  className,
}) => {
  const healthColor = getHealthColor(health);
  const progress = health / 100;
  const totalIssues =
    issueCounts.security +
    issueCounts.availability +
    issueCounts.reliability +
    issueCounts.efficiency;

  return (
    <Container className={className} data-testid="agent-health-ring">
      <HeaderRow>
        <HealthDisplay>
          {/* Health Ring SVG */}
          <RingContainer>
            <RingSvg width="120" height="120" viewBox="0 0 120 120">
              <RingBackground cx="60" cy="60" r="50" />
              <RingProgress
                cx="60"
                cy="60"
                r="50"
                $color={healthColor}
                $progress={progress}
              />
            </RingSvg>
            <RingCenter>
              <HealthValue>{Math.round(health)}%</HealthValue>
              <HealthLabel>Health</HealthLabel>
            </RingCenter>
          </RingContainer>

          <HealthInfo>
            <HealthTitle>Agent Health Score</HealthTitle>
            <HealthTrend $trend={trend}>
              {getTrendIcon(trend)}
              {getTrendText(trend, trendDelta)}
            </HealthTrend>
            <HealthDescription>{getHealthDescription(health, totalIssues)}</HealthDescription>
          </HealthInfo>
        </HealthDisplay>

        <ActionsContainer>
          {onViewCodeIssues && (
            <ActionButton $primary onClick={onViewCodeIssues}>
              View Code Issues
              <ArrowRight size={14} />
            </ActionButton>
          )}
          {onViewSecurityIssues && (
            <ActionButton onClick={onViewSecurityIssues}>
              View Security Issues
              <ArrowRight size={14} />
            </ActionButton>
          )}
        </ActionsContainer>
      </HeaderRow>

      {/* Dimension Cards */}
      <DimensionsGrid>
        <DimensionCard $color="cyan">
          <DimensionHeader>
            <DimensionIcon $color="cyan">
              <Shield size={14} />
            </DimensionIcon>
            <DimensionLabel>Security</DimensionLabel>
          </DimensionHeader>
          <DimensionValue>{Math.round(dimensions.security)}%</DimensionValue>
          <DimensionIssues $hasIssues={issueCounts.security > 0}>
            {issueCounts.security > 0 ? `${issueCounts.security} issues` : 'No issues'}
          </DimensionIssues>
        </DimensionCard>

        <DimensionCard $color="green">
          <DimensionHeader>
            <DimensionIcon $color="green">
              <RefreshCcw size={14} />
            </DimensionIcon>
            <DimensionLabel>Availability</DimensionLabel>
          </DimensionHeader>
          <DimensionValue>{Math.round(dimensions.availability)}%</DimensionValue>
          <DimensionIssues $hasIssues={issueCounts.availability > 0}>
            {issueCounts.availability > 0 ? `${issueCounts.availability} issues` : 'No issues'}
          </DimensionIssues>
        </DimensionCard>

        <DimensionCard $color="orange">
          <DimensionHeader>
            <DimensionIcon $color="orange">
              <CheckCircle size={14} />
            </DimensionIcon>
            <DimensionLabel>Reliability</DimensionLabel>
          </DimensionHeader>
          <DimensionValue>{Math.round(dimensions.reliability)}%</DimensionValue>
          <DimensionIssues $hasIssues={issueCounts.reliability > 0}>
            {issueCounts.reliability > 0 ? `${issueCounts.reliability} issues` : 'No issues'}
          </DimensionIssues>
        </DimensionCard>

        <DimensionCard $color="purple">
          <DimensionHeader>
            <DimensionIcon $color="purple">
              <Zap size={14} />
            </DimensionIcon>
            <DimensionLabel>Efficiency</DimensionLabel>
          </DimensionHeader>
          <DimensionValue>{Math.round(dimensions.efficiency)}%</DimensionValue>
          <DimensionIssues $hasIssues={issueCounts.efficiency > 0}>
            {issueCounts.efficiency > 0 ? `${issueCounts.efficiency} issues` : 'No issues'}
          </DimensionIssues>
        </DimensionCard>
      </DimensionsGrid>

      {/* Suggestion Banner */}
      {suggestion && (
        <SuggestionBanner>
          <SuggestionIcon>
            <Lightbulb size={16} />
          </SuggestionIcon>
          <SuggestionContent>
            <SuggestionText>{suggestion.action}</SuggestionText>
            <SuggestionGain>
              +{suggestion.potentialGain}% health improvement
            </SuggestionGain>
          </SuggestionContent>
        </SuggestionBanner>
      )}
    </Container>
  );
};
