import styled, { css } from 'styled-components';
import type { GateStatus } from '@api/types/findings';

export const Container = styled.div<{ $blocked: boolean }>`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ $blocked, theme }) => 
    $blocked 
      ? `linear-gradient(135deg, ${theme.colors.redSoft}15, ${theme.colors.surface})`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}15, ${theme.colors.surface})`
  };
  border: 1px solid ${({ $blocked, theme }) => 
    $blocked ? `${theme.colors.red}20` : `${theme.colors.green}20`};
  border-radius: ${({ theme }) => theme.radii.xl};
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  letter-spacing: 0.02em;
`;

export const GateBadge = styled.span<{ $status: GateStatus }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 13px;
  font-weight: 600;
  
  ${({ $status, theme }) => 
    $status === 'BLOCKED'
      ? css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        `
      : css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `
  }
`;

export const Description = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white70};
  margin: ${({ theme }) => theme.spacing[4]} 0 0;
  line-height: 1.5;
`;

export const ProgressContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
`;

// New severity breakdown grid
export const SeverityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const SeverityCard = styled.div<{ $isBlocking: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ $isBlocking, theme }) => 
    $isBlocking ? `${theme.colors.red}20` : theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  text-align: center;
`;

export const SeverityCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const SeverityCardCount = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
`;

export const SeverityCardLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const SeverityCardResolved = styled.span<{ $allResolved: boolean }>`
  font-size: 12px;
  color: ${({ $allResolved, theme }) => 
    $allResolved ? theme.colors.green : theme.colors.white50};
`;

export const CallToAction = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.orange};
  margin: 0;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

// Legacy exports for backwards compatibility
export const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const StatValue = styled.span<{ $color?: 'red' | 'orange' | 'yellow' | 'green' | 'default' }>`
  font-size: 20px;
  font-weight: 600;
  color: ${({ $color, theme }) => {
    switch ($color) {
      case 'red': return theme.colors.red;
      case 'orange': return theme.colors.orange;
      case 'yellow': return theme.colors.yellow;
      case 'green': return theme.colors.green;
      default: return theme.colors.white;
    }
  }};
`;

export const StatLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
`;

export const SourceBreakdown = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[3]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const SourceItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

// Legacy progress bar styles (no longer used but kept for backwards compat)
export const ProgressBarContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const ProgressBarTrack = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ $percent: number; $blocked: boolean }>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: ${({ $blocked, theme }) => 
    $blocked 
      ? `linear-gradient(90deg, ${theme.colors.orange}, ${theme.colors.green})`
      : theme.colors.green
  };
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 0.5s ease-out;
`;
