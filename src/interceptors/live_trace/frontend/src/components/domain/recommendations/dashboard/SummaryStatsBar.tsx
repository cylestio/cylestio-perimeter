import type { FC } from 'react';
import { ShieldAlert, ShieldCheck, FileCode, Activity } from 'lucide-react';
import styled from 'styled-components';

import type { Recommendation, GateStatus, FindingSeverity } from '@api/types/findings';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const GatesRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const GateCard = styled.div<{ $blocked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $blocked, theme }) =>
    $blocked ? theme.colors.severityCritical + '30' : theme.colors.green + '30'};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const GateIcon = styled.div<{ $blocked: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $blocked, theme }) =>
    $blocked ? theme.colors.redSoft : theme.colors.greenSoft};
  color: ${({ $blocked, theme }) =>
    $blocked ? theme.colors.severityCritical : theme.colors.green};
`;

const GateInfo = styled.div`
  flex: 1;
`;

const GateTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const GateStatus = styled.span<{ $blocked: boolean }>`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $blocked, theme }) =>
    $blocked ? theme.colors.severityCritical : theme.colors.green};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

const StatCard = styled.div<{ $severity?: FindingSeverity | 'total' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const StatNumber = styled.span<{ $severity?: FindingSeverity | 'total' }>`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.severityLow;
      default: return theme.colors.white;
    }
  }};
`;

const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const SeverityDot = styled.span<{ $severity: FindingSeverity }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: ${({ theme }) => theme.spacing[1]};
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.severityLow;
    }
  }};
`;

// Types
export interface SummaryStatsBarProps {
  recommendations: Recommendation[];
  gateStatus: GateStatus;
  blockingCritical: number;
  blockingHigh: number;
}

// Component
export const SummaryStatsBar: FC<SummaryStatsBarProps> = ({
  recommendations,
}) => {
  // Calculate gate statuses by source
  const staticRecs = recommendations.filter(r => r.source_type === 'STATIC');
  const dynamicRecs = recommendations.filter(r => r.source_type === 'DYNAMIC');

  const hasBlockingStatic = staticRecs.some(r =>
    (r.severity === 'CRITICAL' || r.severity === 'HIGH') &&
    !['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
  );

  const hasBlockingDynamic = dynamicRecs.some(r =>
    (r.severity === 'CRITICAL' || r.severity === 'HIGH') &&
    !['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
  );

  // Count by severity (pending only)
  const pending = recommendations.filter(r =>
    !['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
  );

  const counts = {
    total: pending.length,
    critical: pending.filter(r => r.severity === 'CRITICAL').length,
    high: pending.filter(r => r.severity === 'HIGH').length,
    medium: pending.filter(r => r.severity === 'MEDIUM').length,
    low: pending.filter(r => r.severity === 'LOW').length,
  };

  return (
    <Container>
      {/* Gates Status Row */}
      <GatesRow>
        <GateCard $blocked={hasBlockingStatic}>
          <GateIcon $blocked={hasBlockingStatic}>
            <FileCode size={20} />
          </GateIcon>
          <GateInfo>
            <GateTitle>
              Static Analysis Gate
            </GateTitle>
            <GateStatus $blocked={hasBlockingStatic}>
              {hasBlockingStatic ? (
                <>
                  <ShieldAlert size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Action Needed
                </>
              ) : (
                <>
                  <ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Passed
                </>
              )}
            </GateStatus>
          </GateInfo>
        </GateCard>

        <GateCard $blocked={hasBlockingDynamic}>
          <GateIcon $blocked={hasBlockingDynamic}>
            <Activity size={20} />
          </GateIcon>
          <GateInfo>
            <GateTitle>
              Dynamic Analysis Gate
            </GateTitle>
            <GateStatus $blocked={hasBlockingDynamic}>
              {hasBlockingDynamic ? (
                <>
                  <ShieldAlert size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Action Needed
                </>
              ) : (
                <>
                  <ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Passed
                </>
              )}
            </GateStatus>
          </GateInfo>
        </GateCard>
      </GatesRow>

      {/* Stats Grid */}
      <StatsGrid>
        <StatCard $severity="total">
          <StatNumber $severity="total">{counts.total}</StatNumber>
          <StatLabel>Open Issues</StatLabel>
        </StatCard>
        <StatCard $severity="CRITICAL">
          <StatNumber $severity="CRITICAL">
            <SeverityDot $severity="CRITICAL" />
            {counts.critical}
          </StatNumber>
          <StatLabel>Critical</StatLabel>
        </StatCard>
        <StatCard $severity="HIGH">
          <StatNumber $severity="HIGH">
            <SeverityDot $severity="HIGH" />
            {counts.high}
          </StatNumber>
          <StatLabel>High</StatLabel>
        </StatCard>
        <StatCard $severity="MEDIUM">
          <StatNumber $severity="MEDIUM">
            <SeverityDot $severity="MEDIUM" />
            {counts.medium}
          </StatNumber>
          <StatLabel>Medium</StatLabel>
        </StatCard>
        <StatCard $severity="LOW">
          <StatNumber $severity="LOW">
            <SeverityDot $severity="LOW" />
            {counts.low}
          </StatNumber>
          <StatLabel>Low</StatLabel>
        </StatCard>
      </StatsGrid>
    </Container>
  );
};
