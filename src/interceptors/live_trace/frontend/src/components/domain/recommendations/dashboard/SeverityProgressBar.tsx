import type { FC } from 'react';
import styled from 'styled-components';

import type { Recommendation, FindingSeverity } from '@api/types/findings';

// Styled Components
const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

const OverallText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

const ProgressTrack = styled.div`
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface3};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ProgressFill = styled.div`
  height: 100%;
  display: flex;
  transition: width ${({ theme }) => theme.transitions.base};
`;

const ProgressSegment = styled.div<{ $severity: FindingSeverity; $width: number }>`
  height: 100%;
  width: ${({ $width }) => `${$width}%`};
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.green;
    }
  }};
`;

const SeverityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SeverityItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const SeverityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SeverityDot = styled.span<{ $severity: FindingSeverity }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.green;
    }
  }};
`;

const SeverityLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white70};
  text-transform: uppercase;
`;

const SeverityCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
`;

const SeverityProgress = styled.span<{ $complete: boolean }>`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ $complete, theme }) => $complete ? theme.colors.green : theme.colors.white50};
`;

// Types
export interface SeverityProgressBarProps {
  recommendations: Recommendation[];
}

interface SeverityStats {
  severity: FindingSeverity;
  total: number;
  resolved: number;
}

// Component
export const SeverityProgressBar: FC<SeverityProgressBarProps> = ({
  recommendations,
}) => {
  // Calculate stats per severity
  const severities: FindingSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  
  const stats: SeverityStats[] = severities.map(severity => {
    const forSeverity = recommendations.filter(r => r.severity === severity);
    const resolved = forSeverity.filter(r => 
      ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
    ).length;
    return {
      severity,
      total: forSeverity.length,
      resolved,
    };
  });

  const totalAll = recommendations.length;
  const totalResolved = stats.reduce((acc, s) => acc + s.resolved, 0);
  const overallPercent = totalAll > 0 ? Math.round((totalResolved / totalAll) * 100) : 100;

  // Calculate progress fill width (resolved issues as percentage of total)
  const fillWidth = totalAll > 0 ? (totalResolved / totalAll) * 100 : 100;

  // Calculate segment widths within the filled portion
  const getSegmentWidth = (resolved: number) => {
    if (totalResolved === 0) return 0;
    return (resolved / totalResolved) * 100;
  };

  return (
    <Container>
      <Header>
        <Title>Resolution Progress</Title>
        <OverallText>{totalResolved} of {totalAll} resolved ({overallPercent}%)</OverallText>
      </Header>
      
      <ProgressTrack>
        <ProgressFill style={{ width: `${fillWidth}%` }}>
          {stats.filter(s => s.resolved > 0).map(s => (
            <ProgressSegment
              key={s.severity}
              $severity={s.severity}
              $width={getSegmentWidth(s.resolved)}
            />
          ))}
        </ProgressFill>
      </ProgressTrack>

      <SeverityGrid>
        {stats.map(s => (
          <SeverityItem key={s.severity}>
            <SeverityHeader>
              <SeverityDot $severity={s.severity} />
              <SeverityLabel>{s.severity}</SeverityLabel>
            </SeverityHeader>
            <SeverityCount>{s.resolved} / {s.total}</SeverityCount>
            <SeverityProgress $complete={s.resolved === s.total && s.total > 0}>
              {s.total > 0 
                ? s.resolved === s.total 
                  ? '✓ Complete' 
                  : `${s.total - s.resolved} remaining`
                : 'No issues'
              }
            </SeverityProgress>
          </SeverityItem>
        ))}
      </SeverityGrid>
    </Container>
  );
};
