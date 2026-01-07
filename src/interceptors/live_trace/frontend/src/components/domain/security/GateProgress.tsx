import type { FC } from 'react';
import { ShieldAlert, ShieldCheck, Check, X, AlertTriangle } from 'lucide-react';

import type { CheckStatus, GateStatus } from '@api/types/findings';

import {
  ProgressContainer,
  ProgressRow,
  ProgressDots,
  ProgressDot,
  ProgressLabel,
  ProgressStats,
  StatItem,
  StatCount,
} from './GateProgress.styles';

export interface GateProgressProps {
  /** Array of check statuses for each of the 7 categories */
  checks: { status: CheckStatus }[];
  /** Overall gate status */
  gateStatus: GateStatus;
  /** Whether to show the stats row */
  showStats?: boolean;
  className?: string;
}

/**
 * GateProgress component displays a visual progress indicator showing
 * which security checks have passed/failed and the overall gate status.
 */
export const GateProgress: FC<GateProgressProps> = ({
  checks,
  gateStatus,
  showStats = true,
  className,
}) => {
  const passedCount = checks.filter(c => c.status === 'PASS').length;
  const failedCount = checks.filter(c => c.status === 'FAIL').length;
  const infoCount = checks.filter(c => c.status === 'INFO').length;
  const totalChecks = checks.length;
  const isBlocked = gateStatus === 'BLOCKED';

  return (
    <ProgressContainer className={className}>
      <ProgressRow>
        <ProgressDots>
          {checks.map((check, i) => (
            <ProgressDot key={i} $status={check.status} />
          ))}
        </ProgressDots>
        <ProgressLabel $blocked={isBlocked}>
          {isBlocked ? (
            <>
              <ShieldAlert size={14} />
              Attention Required
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              Production Ready
            </>
          )}
        </ProgressLabel>
      </ProgressRow>

      {showStats && (
        <ProgressStats>
          <StatItem>
            <Check size={12} />
            <StatCount $color="green">{passedCount}</StatCount> passed
          </StatItem>
          {failedCount > 0 && (
            <StatItem>
              <X size={12} />
              <StatCount $color="red">{failedCount}</StatCount> failed
            </StatItem>
          )}
          {infoCount > 0 && (
            <StatItem>
              <AlertTriangle size={12} />
              <StatCount $color="yellow">{infoCount}</StatCount> info
            </StatItem>
          )}
          <StatItem>
            {passedCount} of {totalChecks} checks passing
          </StatItem>
        </ProgressStats>
      )}
    </ProgressContainer>
  );
};
