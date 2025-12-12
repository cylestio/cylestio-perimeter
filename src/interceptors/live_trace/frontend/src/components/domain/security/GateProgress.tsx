import type { FC } from 'react';

import { Lock, Unlock } from 'lucide-react';

import {
  ProgressContainer,
  ProgressDots,
  ProgressDot,
  ProgressLabel,
  ProgressStats,
} from './GateProgress.styles';

export type CheckStatus = 'PASS' | 'FAIL' | 'INFO';
export type GateStatus = 'BLOCKED' | 'UNBLOCKED';

export interface GateProgressProps {
  /** Array of check statuses to display as dots */
  checks: { status: CheckStatus }[];
  /** Overall gate status */
  gateStatus: GateStatus;
  /** Show stats (e.g., "2/5 checks passed") */
  showStats?: boolean;
  className?: string;
}

/**
 * GateProgress - Visual progress indicator showing security check completion
 * 
 * Displays:
 * - Colored dots for each check (green=pass, red=fail, yellow=info)
 * - Gate status (locked/unlocked with icon)
 * - Optional stats showing passed/total
 */
export const GateProgress: FC<GateProgressProps> = ({
  checks,
  gateStatus,
  showStats = true,
  className,
}) => {
  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const isBlocked = gateStatus === 'BLOCKED';

  return (
    <ProgressContainer className={className}>
      <ProgressDots>
        {checks.map((check, index) => (
          <ProgressDot key={index} $status={check.status} />
        ))}
      </ProgressDots>
      <ProgressLabel $blocked={isBlocked}>
        {isBlocked ? <Lock size={14} /> : <Unlock size={14} />}
        {isBlocked ? 'Gate Blocked' : 'Gate Open'}
      </ProgressLabel>
      {showStats && (
        <ProgressStats>
          {passedCount} of {checks.length} checks passed
        </ProgressStats>
      )}
    </ProgressContainer>
  );
};
