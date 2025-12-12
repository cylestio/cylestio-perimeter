import type { FC } from 'react';

import { AlertTriangle, Check, ExternalLink, TrendingUp, X } from 'lucide-react';

import {
  InsightsCard,
  InsightsHeader,
  InsightsTitle,
  SuperpowerBadge,
  MetricsRow,
  MetricCard,
  MetricValue,
  MetricLabel,
  MetricIcon,
  Interpretation,
  OutlierActions,
  ActionButton,
} from './BehavioralInsights.styles';

export interface BehavioralInsightsProps {
  stability: number;
  predictability: number;
  outlierCount: number;
  totalSessions: number;
  outlierSessions?: string[];
  interpretation?: string;
  onViewOutlier?: (sessionId: string) => void;
  className?: string;
}

/**
 * Get status based on score threshold
 */
function getScoreStatus(score: number, threshold: number): 'good' | 'warning' | 'critical' {
  if (score >= threshold) return 'good';
  if (score >= threshold * 0.75) return 'warning';
  return 'critical';
}

/**
 * Get outlier status based on rate
 */
function getOutlierStatus(count: number, total: number): 'good' | 'warning' | 'critical' {
  if (total === 0) return 'good';
  const rate = count / total;
  if (rate <= 0.1) return 'good';
  if (rate <= 0.2) return 'warning';
  return 'critical';
}

/**
 * Get status icon based on status
 */
function StatusIcon({ status }: { status: 'good' | 'warning' | 'critical' }) {
  switch (status) {
    case 'good':
      return <Check size={14} />;
    case 'warning':
      return <AlertTriangle size={14} />;
    case 'critical':
      return <X size={14} />;
  }
}

/**
 * BehavioralInsights - Display behavioral analysis metrics and security interpretation
 * 
 * Shows:
 * - Stability score (largest cluster share)
 * - Predictability score (1 - outlier rate)
 * - Outlier count
 * - Security interpretation text
 * - Actions for investigating outliers
 */
export const BehavioralInsights: FC<BehavioralInsightsProps> = ({
  stability,
  predictability,
  outlierCount,
  totalSessions,
  outlierSessions,
  interpretation,
  onViewOutlier,
  className,
}) => {
  const stabilityStatus = getScoreStatus(stability, 0.8);
  const predictabilityStatus = getScoreStatus(predictability, 0.8);
  const outlierStatus = getOutlierStatus(outlierCount, totalSessions);

  const stabilityPercent = Math.round(stability * 100);
  const predictabilityPercent = Math.round(predictability * 100);

  return (
    <InsightsCard className={className} data-testid="behavioral-insights">
      <InsightsHeader>
        <InsightsTitle>
          <TrendingUp size={16} />
          Behavioral Security
        </InsightsTitle>
        <SuperpowerBadge>Agent Inspector Exclusive</SuperpowerBadge>
      </InsightsHeader>

      <MetricsRow>
        <MetricCard $status={stabilityStatus}>
          <MetricValue $status={stabilityStatus}>
            {stabilityPercent}%
            <MetricIcon $status={stabilityStatus}>
              <StatusIcon status={stabilityStatus} />
            </MetricIcon>
          </MetricValue>
          <MetricLabel>Stability</MetricLabel>
        </MetricCard>

        <MetricCard $status={predictabilityStatus}>
          <MetricValue $status={predictabilityStatus}>
            {predictabilityPercent}%
            <MetricIcon $status={predictabilityStatus}>
              <StatusIcon status={predictabilityStatus} />
            </MetricIcon>
          </MetricValue>
          <MetricLabel>Predictability</MetricLabel>
        </MetricCard>

        <MetricCard $status={outlierStatus}>
          <MetricValue $status={outlierStatus}>
            {outlierCount}/{totalSessions}
            <MetricIcon $status={outlierStatus}>
              <StatusIcon status={outlierStatus} />
            </MetricIcon>
          </MetricValue>
          <MetricLabel>Outliers</MetricLabel>
        </MetricCard>
      </MetricsRow>

      {interpretation && <Interpretation>{interpretation}</Interpretation>}

      {outlierCount > 0 && outlierSessions && outlierSessions.length > 0 && (
        <OutlierActions>
          <ActionButton
            onClick={() => onViewOutlier?.(outlierSessions[0])}
            title="View outlier session details"
          >
            <ExternalLink size={14} />
            View Outlier Session
          </ActionButton>
        </OutlierActions>
      )}
    </InsightsCard>
  );
};
