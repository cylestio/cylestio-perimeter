import type { FC } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

import type { GateStatus, Recommendation, FindingSeverity } from '@api/types/findings';

import { SeverityDot } from '@ui/core/Badge';
import { ProgressBar } from '@ui/feedback/ProgressBar';

import {
  Container,
  Header,
  Title,
  GateBadge,
  Description,
  ProgressContainer,
  ProgressLabel,
  SeverityGrid,
  SeverityCard,
  SeverityCardHeader,
  SeverityCardCount,
  SeverityCardLabel,
  SeverityCardResolved,
  CallToAction,
} from './ProgressSummary.styles';

export interface ProgressSummaryProps {
  gateStatus: GateStatus;
  recommendations: Recommendation[];
  blockingCritical: number;
  blockingHigh: number;
}

interface SeverityStats {
  total: number;
  resolved: number;
  pending: number;
}

const SEVERITIES: FindingSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const ProgressSummary: FC<ProgressSummaryProps> = ({
  gateStatus,
  recommendations,
  blockingCritical,
  blockingHigh,
}) => {
  const isBlocked = gateStatus === 'BLOCKED';
  const totalBlocking = blockingCritical + blockingHigh;

  // Calculate stats by severity
  const severityStats: Record<FindingSeverity, SeverityStats> = {
    CRITICAL: { total: 0, resolved: 0, pending: 0 },
    HIGH: { total: 0, resolved: 0, pending: 0 },
    MEDIUM: { total: 0, resolved: 0, pending: 0 },
    LOW: { total: 0, resolved: 0, pending: 0 },
  };

  recommendations.forEach(rec => {
    const isResolved = ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(rec.status);
    severityStats[rec.severity].total += 1;
    if (isResolved) {
      severityStats[rec.severity].resolved += 1;
    } else {
      severityStats[rec.severity].pending += 1;
    }
  });

  // Calculate overall progress percentage
  const total = recommendations.length;
  const resolved = Object.values(severityStats).reduce((acc, s) => acc + s.resolved, 0);
  const progressPercent = total > 0 ? Math.round((resolved / total) * 100) : 100;

  return (
    <Container $blocked={isBlocked}>
      <Header>
        <Title>
          {isBlocked ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
          {isBlocked ? 'Attention Required' : 'Production Ready'}
        </Title>
        <GateBadge $status={gateStatus}>
          {isBlocked ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
          {isBlocked ? 'Action Needed' : 'Ready'}
        </GateBadge>
      </Header>

      <ProgressContainer>
        <ProgressBar
          value={progressPercent}
          variant={isBlocked ? 'warning' : 'success'}
          size="md"
        />
        <ProgressLabel>
          <span>{resolved} of {total} resolved</span>
          <span>{progressPercent}%</span>
        </ProgressLabel>
      </ProgressContainer>

      {isBlocked && (
        <SeverityGrid>
          {SEVERITIES.map(severity => {
            const stats = severityStats[severity];
            const isBlocking = severity === 'CRITICAL' || severity === 'HIGH';

            // Only show severities that have issues
            if (stats.total === 0) return null;

            return (
              <SeverityCard key={severity} $isBlocking={isBlocking}>
                <SeverityCardHeader>
                  <SeverityDot
                    severity={severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'}
                    glow={isBlocking && stats.pending > 0}
                    size="sm"
                  />
                  <SeverityCardCount>{stats.total}</SeverityCardCount>
                </SeverityCardHeader>
                <SeverityCardLabel>{severity}</SeverityCardLabel>
                <SeverityCardResolved $allResolved={stats.resolved === stats.total}>
                  {stats.resolved} resolved
                </SeverityCardResolved>
              </SeverityCard>
            );
          })}
        </SeverityGrid>
      )}

      {isBlocked ? (
        <CallToAction>
          Fix {totalBlocking} critical/high issue{totalBlocking !== 1 ? 's' : ''} to unblock production
        </CallToAction>
      ) : (
        <Description>
          All critical and high severity issues have been addressed. Your agent is ready for production.
        </Description>
      )}
    </Container>
  );
};
