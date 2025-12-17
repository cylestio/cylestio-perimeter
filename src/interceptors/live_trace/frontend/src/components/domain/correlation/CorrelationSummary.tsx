import type { FC } from 'react';
import { Link2, Lightbulb, AlertTriangle } from 'lucide-react';

import {
  SummaryCard,
  SummaryHeader,
  SummaryTitle,
  SummarySubtitle,
  MetricsRow,
  MetricBox,
  MetricValue,
  MetricLabel,
  Hint,
  HintIcon,
  HintText,
  CorrelateCommand,
  Insight,
} from './CorrelationSummary.styles';

export interface CorrelationSummaryProps {
  /** Number of validated findings (confirmed at runtime) */
  validated: number;
  /** Number of unexercised findings (never triggered) */
  unexercised: number;
  /** Number of theoretical findings (safe at runtime) */
  theoretical: number;
  /** Number of uncorrelated findings */
  uncorrelated: number;
  /** Number of runtime sessions used for correlation */
  sessionsCount: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * CorrelationSummary displays a summary card of correlation insights.
 * Shows counts by correlation state and hints for action.
 */
export const CorrelationSummary: FC<CorrelationSummaryProps> = ({
  validated,
  unexercised,
  theoretical,
  uncorrelated,
  sessionsCount,
  className,
}) => {
  const hasCorrelatedFindings = validated + unexercised + theoretical > 0;

  return (
    <SummaryCard className={className}>
      <SummaryHeader>
        <Link2 size={18} />
        <div>
          <SummaryTitle>Correlation Insights</SummaryTitle>
          <SummarySubtitle>
            Static findings cross-referenced with {sessionsCount} runtime session{sessionsCount !== 1 ? 's' : ''}
          </SummarySubtitle>
        </div>
      </SummaryHeader>

      {hasCorrelatedFindings && (
        <MetricsRow>
          <MetricBox $color="red">
            <MetricValue $color="red">{validated}</MetricValue>
            <MetricLabel>Validated</MetricLabel>
          </MetricBox>
          <MetricBox $color="gray">
            <MetricValue $color="gray">{unexercised}</MetricValue>
            <MetricLabel>Unexercised</MetricLabel>
          </MetricBox>
          <MetricBox $color="light">
            <MetricValue $color="light">{theoretical}</MetricValue>
            <MetricLabel>Theoretical</MetricLabel>
          </MetricBox>
        </MetricsRow>
      )}

      {uncorrelated > 0 && (
        <Hint>
          <HintIcon><Lightbulb size={16} /></HintIcon>
          <HintText>
            {uncorrelated} finding{uncorrelated !== 1 ? 's' : ''} not yet correlated.{' '}
            <CorrelateCommand>/correlate</CorrelateCommand>
          </HintText>
        </Hint>
      )}

      {validated > 0 && (
        <Insight>
          <AlertTriangle size={16} />
          {validated} finding{validated !== 1 ? 's are' : ' is'} validated by runtime -
          {validated === 1 ? ' this is an' : ' these are'} active risk{validated !== 1 ? 's' : ''}.
          Prioritize fixing {validated === 1 ? 'this' : 'these'} first.
        </Insight>
      )}
    </SummaryCard>
  );
};
