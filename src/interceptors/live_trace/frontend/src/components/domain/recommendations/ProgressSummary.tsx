import type { FC } from 'react';
import { Lock, Unlock } from 'lucide-react';
import type { GateStatus, Recommendation } from '@api/types/findings';
import {
  Container,
  Header,
  Title,
  GateBadge,
  Description,
  ProgressBarContainer,
  ProgressBarTrack,
  ProgressBarFill,
  ProgressLabel,
  Stats,
  StatItem,
  StatValue,
  StatLabel,
  SourceBreakdown,
  SourceItem,
} from './ProgressSummary.styles';

export interface ProgressSummaryProps {
  gateStatus: GateStatus;
  recommendations: Recommendation[];
  blockingCritical: number;
  blockingHigh: number;
}

export const ProgressSummary: FC<ProgressSummaryProps> = ({
  gateStatus,
  recommendations,
  blockingCritical,
  blockingHigh,
}) => {
  const isBlocked = gateStatus === 'BLOCKED';
  const totalBlocking = blockingCritical + blockingHigh;
  
  // Count recommendations by status
  const pending = recommendations.filter(r => r.status === 'PENDING').length;
  const fixing = recommendations.filter(r => r.status === 'FIXING').length;
  const fixed = recommendations.filter(r => r.status === 'FIXED' || r.status === 'VERIFIED').length;
  const dismissed = recommendations.filter(r => r.status === 'DISMISSED' || r.status === 'IGNORED').length;
  
  // Count by source
  const staticCount = recommendations.filter(r => r.source_type === 'STATIC').length;
  const dynamicCount = recommendations.filter(r => r.source_type === 'DYNAMIC').length;
  
  // Calculate progress percentage (fixed + dismissed out of total)
  const total = recommendations.length;
  const resolved = fixed + dismissed;
  const progressPercent = total > 0 ? Math.round((resolved / total) * 100) : 100;

  return (
    <Container $blocked={isBlocked}>
      <Header>
        <Title>
          {isBlocked ? <Lock size={16} /> : <Unlock size={16} />}
          {isBlocked ? 'TO UNBLOCK PRODUCTION' : 'PRODUCTION READY'}
        </Title>
        <GateBadge $status={gateStatus}>
          {isBlocked ? '🔒 Blocked' : '✅ Open'}
        </GateBadge>
      </Header>

      {isBlocked ? (
        <Description>
          Fix {totalBlocking} blocking issue{totalBlocking !== 1 ? 's' : ''} to enable Production deployment
          {blockingCritical > 0 && ` (${blockingCritical} critical)`}
          {blockingHigh > 0 && ` (${blockingHigh} high)`}
        </Description>
      ) : (
        <Description>
          All critical and high severity issues have been addressed. Your agent is ready for production.
        </Description>
      )}

      <ProgressBarContainer>
        <ProgressBarTrack>
          <ProgressBarFill $percent={progressPercent} $blocked={isBlocked} />
        </ProgressBarTrack>
        <ProgressLabel>
          <span>Progress: {resolved} of {total} resolved</span>
          <span>{progressPercent}%</span>
        </ProgressLabel>
      </ProgressBarContainer>

      <Stats>
        <StatItem>
          <StatValue $color={pending > 0 ? 'orange' : 'default'}>{pending}</StatValue>
          <StatLabel>Pending</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue $color={fixing > 0 ? 'yellow' : 'default'}>{fixing}</StatValue>
          <StatLabel>Fixing</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue $color="green">{fixed}</StatValue>
          <StatLabel>Fixed</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{dismissed}</StatValue>
          <StatLabel>Dismissed</StatLabel>
        </StatItem>
      </Stats>

      {(staticCount > 0 || dynamicCount > 0) && (
        <SourceBreakdown>
          {staticCount > 0 && (
            <SourceItem>📝 Static: {staticCount}</SourceItem>
          )}
          {dynamicCount > 0 && (
            <SourceItem>🔄 Dynamic: {dynamicCount}</SourceItem>
          )}
        </SourceBreakdown>
      )}
    </Container>
  );
};
