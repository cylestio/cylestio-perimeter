import styled, { css } from 'styled-components';
import type { GateStatus } from '@api/types/findings';

export const Container = styled.div<{ $blocked: boolean }>`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ $blocked, theme }) => 
    $blocked 
      ? `linear-gradient(135deg, ${theme.colors.redSoft}20, ${theme.colors.surface})`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}20, ${theme.colors.surface})`
  };
  border: 1px solid ${({ $blocked, theme }) => 
    $blocked ? `${theme.colors.red}30` : `${theme.colors.green}30`};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const GateBadge = styled.span<{ $status: GateStatus }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 12px;
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
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
`;

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

export const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

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
