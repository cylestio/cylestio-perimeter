import type { FC } from 'react';
import { Lock, Unlock, Terminal } from 'lucide-react';

import type { GateStatus } from '@api/types/findings';

import {
  SummaryWrapper,
  SummaryHeader,
  SummaryTitle,
  IdeStatus,
  IdeDot,
  SummaryContent,
  ProgressMessage,
  ProgressBarContainer,
  ProgressBar,
  ProgressFill,
  ProgressLabel,
  BlockingItems,
  BlockingLabel,
  BlockingItem,
  BlockingId,
  SeverityDot,
} from './ProgressSummary.styles';

export interface ProgressSummaryProps {
  gateStatus: GateStatus;
  totalRecommendations: number;
  resolvedCount: number;
  ideConnected?: boolean;
  ideType?: string;
  className?: string;
}

/**
 * ProgressSummary - Shows gate status and fix progress
 * 
 * Displays:
 * - Gate status (BLOCKED/UNBLOCKED for production)
 * - Progress bar showing fixes completed
 * - List of blocking issues
 * - IDE connection status
 */
export const ProgressSummary: FC<ProgressSummaryProps> = ({
  gateStatus,
  totalRecommendations,
  resolvedCount,
  ideConnected = false,
  ideType,
  className,
}) => {
  const isBlocked = gateStatus.gate_status === 'BLOCKED';
  const blockingCount = gateStatus.blocking_count;
  
  // Calculate progress percentage
  const pendingCount = totalRecommendations - resolvedCount;
  const progressPercent = totalRecommendations > 0 
    ? Math.round((resolvedCount / totalRecommendations) * 100) 
    : 100;

  return (
    <SummaryWrapper $status={gateStatus.gate_status} className={className}>
      <SummaryHeader>
        <SummaryTitle>
          {isBlocked ? (
            <>
              <Lock size={18} style={{ color: '#ef4444' }} />
              To Unblock Production
            </>
          ) : (
            <>
              <Unlock size={18} style={{ color: '#22c55e' }} />
              Production Ready
            </>
          )}
        </SummaryTitle>
        
        <IdeStatus>
          <Terminal size={14} />
          <IdeDot $connected={ideConnected} />
          {ideConnected ? `${ideType || 'IDE'} Connected` : 'No IDE Connected'}
        </IdeStatus>
      </SummaryHeader>

      <SummaryContent>
        <ProgressMessage>
          {isBlocked ? (
            <>
              Fix <strong>{blockingCount}</strong> blocking issue{blockingCount !== 1 ? 's' : ''} to enable Production deployment
            </>
          ) : (
            <>
              All critical and high severity issues have been resolved. 
              {pendingCount > 0 && (
                <> Consider fixing the remaining <strong>{pendingCount}</strong> issue{pendingCount !== 1 ? 's' : ''}.</>
              )}
            </>
          )}
        </ProgressMessage>

        <ProgressBarContainer>
          <ProgressBar>
            <ProgressFill 
              $percent={progressPercent} 
              $status={gateStatus.gate_status} 
            />
          </ProgressBar>
          <ProgressLabel>
            {resolvedCount} of {totalRecommendations} fixed
          </ProgressLabel>
        </ProgressBarContainer>

        {/* Blocking Items List */}
        {isBlocked && gateStatus.blocking_items.length > 0 && (
          <BlockingItems>
            <BlockingLabel>Blocking Issues</BlockingLabel>
            {gateStatus.blocking_items.slice(0, 5).map((item) => (
              <BlockingItem key={item.recommendation_id}>
                <SeverityDot $severity={item.severity} />
                <BlockingId>{item.recommendation_id}</BlockingId>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
              </BlockingItem>
            ))}
            {gateStatus.blocking_items.length > 5 && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                +{gateStatus.blocking_items.length - 5} more
              </span>
            )}
          </BlockingItems>
        )}
      </SummaryContent>
    </SummaryWrapper>
  );
};

